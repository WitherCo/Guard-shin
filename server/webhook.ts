/**
 * Webhook Handler Module
 * 
 * Handles incoming webhook requests, particularly for payment providers
 * like Stripe, PayPal, or Discord interactions.
 */

import { Request, Response } from 'express';
import { log } from './vite';
import { storage } from './storage';
import { logUpdate } from './update-logger';
import Stripe from 'stripe';
import { SubscriptionTier } from '@shared/schema';

if (!process.env.STRIPE_SECRET_KEY) {
  log('No Stripe secret key provided, webhook functionality will be limited', 'warn');
}

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

/**
 * Handle incoming Stripe webhook events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  const sig = req.headers['stripe-signature'];
  
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ error: 'Stripe webhook signature or secret missing' });
  }

  let event;

  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    log(`Stripe webhook error: ${err.message}`, 'error');
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    // Handle specific event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      default:
        log(`Unhandled Stripe event type: ${event.type}`, 'warn');
    }

    // Return a success response
    res.json({ received: true });
  } catch (error) {
    log(`Error processing Stripe webhook: ${error}`, 'error');
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}

/**
 * Handle a successful checkout session
 */
async function handleCheckoutSessionCompleted(session: any) {
  try {
    // Get the user ID from metadata
    const userId = session.metadata?.userId;
    if (!userId) {
      log('No user ID in checkout session metadata', 'error');
      return;
    }

    // Get the user
    const user = await storage.getUser(parseInt(userId));
    if (!user) {
      log(`User not found for ID: ${userId}`, 'error');
      return;
    }

    // Record the payment transaction
    await storage.createPaymentTransaction({
      userId: user.id,
      amount: session.amount_total / 100, // Convert from cents
      currency: session.currency,
      status: 'completed',
      paymentMethod: 'stripe',
      paymentIntentId: session.payment_intent,
      paymentProviderId: 'stripe',
      transactionType: 'purchase',
      metadata: session,
      discordServerId: session.metadata?.serverId,
    });

    // Log the successful payment
    logUpdate(`User ${user.username} (${user.id}) completed checkout for ${session.amount_total / 100} ${session.currency}`, 'payment');
  } catch (error) {
    log(`Error handling checkout session: ${error}`, 'error');
  }
}

/**
 * Handle a paid invoice
 */
async function handleInvoicePaid(invoice: any) {
  try {
    // Get subscription ID
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) {
      log('No subscription ID in invoice', 'error');
      return;
    }

    // Get subscription from database
    const userSubscription = await storage.getUserSubscriptionByStripeId(subscriptionId);
    if (!userSubscription) {
      log(`Subscription not found for ID: ${subscriptionId}`, 'error');
      return;
    }

    // Get the user
    const user = await storage.getUser(userSubscription.userId);
    if (!user) {
      log(`User not found for ID: ${userSubscription.userId}`, 'error');
      return;
    }

    // Record the payment transaction
    await storage.createPaymentTransaction({
      userId: user.id,
      subscriptionId: userSubscription.id,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
      status: 'completed',
      paymentMethod: 'stripe',
      paymentIntentId: invoice.payment_intent,
      paymentProviderId: 'stripe',
      transactionType: 'renewal',
      metadata: invoice,
    });

    // Update subscription if needed
    if (userSubscription.status !== 'active') {
      await storage.updateUserSubscription(userSubscription.id, {
        status: 'active',
      });
    }

    // Log the successful payment
    logUpdate(`User ${user.username} (${user.id}) paid invoice for subscription ${userSubscription.tier} - Amount: ${invoice.amount_paid / 100} ${invoice.currency}`, 'payment');
  } catch (error) {
    log(`Error handling invoice paid: ${error}`, 'error');
  }
}

/**
 * Handle a failed invoice payment
 */
async function handleInvoicePaymentFailed(invoice: any) {
  try {
    // Get subscription ID
    const subscriptionId = invoice.subscription;
    if (!subscriptionId) {
      log('No subscription ID in invoice', 'error');
      return;
    }

    // Get subscription from database
    const userSubscription = await storage.getUserSubscriptionByStripeId(subscriptionId);
    if (!userSubscription) {
      log(`Subscription not found for ID: ${subscriptionId}`, 'error');
      return;
    }

    // Get the user
    const user = await storage.getUser(userSubscription.userId);
    if (!user) {
      log(`User not found for ID: ${userSubscription.userId}`, 'error');
      return;
    }

    // Record the failed payment transaction
    await storage.createPaymentTransaction({
      userId: user.id,
      subscriptionId: userSubscription.id,
      amount: invoice.amount_due / 100, // Convert from cents
      currency: invoice.currency,
      status: 'failed',
      paymentMethod: 'stripe',
      paymentIntentId: invoice.payment_intent,
      paymentProviderId: 'stripe',
      transactionType: 'renewal',
      metadata: invoice,
    });

    // Update subscription status
    await storage.updateUserSubscription(userSubscription.id, {
      status: 'past_due',
    });

    // Log the failed payment
    logUpdate(`User ${user.username} (${user.id}) failed payment for subscription ${userSubscription.tier} - Amount: ${invoice.amount_due / 100} ${invoice.currency}`, 'payment');
  } catch (error) {
    log(`Error handling invoice payment failed: ${error}`, 'error');
  }
}

/**
 * Handle a subscription creation
 */
async function handleSubscriptionCreated(subscription: any) {
  try {
    // Get customer ID
    const customerId = subscription.customer;
    if (!customerId) {
      log('No customer ID in subscription', 'error');
      return;
    }

    // Find user by Stripe customer ID
    // Note: This is a simplified approach and may need to be adapted
    const users = await storage.getUsers();
    const user = users.find(u => u.stripeCustomerId === customerId);
    
    if (!user) {
      log(`User not found for Stripe customer ID: ${customerId}`, 'error');
      return;
    }

    // Determine subscription tier
    let tier = SubscriptionTier.PREMIUM;
    const priceId = subscription.items.data[0]?.price.id;
    
    // This would be expanded based on your price IDs
    if (priceId === process.env.STRIPE_PREMIUM_PLUS_PRICE_ID) {
      tier = SubscriptionTier.PREMIUM_PLUS;
    } else if (priceId === process.env.STRIPE_LIFETIME_PREMIUM_PRICE_ID) {
      tier = SubscriptionTier.LIFETIME_PREMIUM;
    } else if (priceId === process.env.STRIPE_LIFETIME_PREMIUM_PLUS_PRICE_ID) {
      tier = SubscriptionTier.LIFETIME_PREMIUM_PLUS;
    }

    // Calculate end date if applicable
    let endDate = null;
    if (subscription.current_period_end) {
      endDate = new Date(subscription.current_period_end * 1000);
    }

    // Create user subscription
    await storage.createUserSubscription({
      userId: user.id,
      tier,
      status: subscription.status,
      startDate: new Date(subscription.current_period_start * 1000),
      endDate,
      autoRenew: subscription.cancel_at_period_end === false,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      paymentMethod: 'stripe',
    });

    // Log the subscription creation
    logUpdate(`User ${user.username} (${user.id}) created subscription: ${tier}`, 'subscription');
  } catch (error) {
    log(`Error handling subscription created: ${error}`, 'error');
  }
}

/**
 * Handle a subscription update
 */
async function handleSubscriptionUpdated(subscription: any) {
  try {
    // Get subscription from database
    const userSubscription = await storage.getUserSubscriptionByStripeId(subscription.id);
    if (!userSubscription) {
      log(`Subscription not found for ID: ${subscription.id}`, 'error');
      return;
    }

    // Get the user
    const user = await storage.getUser(userSubscription.userId);
    if (!user) {
      log(`User not found for ID: ${userSubscription.userId}`, 'error');
      return;
    }

    // Update endDate if applicable
    let endDate = userSubscription.endDate;
    if (subscription.current_period_end) {
      endDate = new Date(subscription.current_period_end * 1000);
    }

    // Update user subscription
    await storage.updateUserSubscription(userSubscription.id, {
      status: subscription.status,
      endDate,
      autoRenew: subscription.cancel_at_period_end === false,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    });

    // Log the subscription update
    logUpdate(`User ${user.username} (${user.id}) updated subscription: ${userSubscription.tier} - Status: ${subscription.status}`, 'subscription');
  } catch (error) {
    log(`Error handling subscription updated: ${error}`, 'error');
  }
}

/**
 * Handle a subscription deletion
 */
async function handleSubscriptionDeleted(subscription: any) {
  try {
    // Get subscription from database
    const userSubscription = await storage.getUserSubscriptionByStripeId(subscription.id);
    if (!userSubscription) {
      log(`Subscription not found for ID: ${subscription.id}`, 'error');
      return;
    }

    // Get the user
    const user = await storage.getUser(userSubscription.userId);
    if (!user) {
      log(`User not found for ID: ${userSubscription.userId}`, 'error');
      return;
    }

    // Update user subscription
    await storage.updateUserSubscription(userSubscription.id, {
      status: 'canceled',
      canceledAt: new Date(),
      autoRenew: false,
    });

    // If this was a lifetime subscription, we don't want to remove premium benefits
    if (
      userSubscription.tier !== SubscriptionTier.LIFETIME_PREMIUM &&
      userSubscription.tier !== SubscriptionTier.LIFETIME_PREMIUM_PLUS
    ) {
      // For other subscription types, we downgrade at the end of the billing period
      // If past the end date, update tier to free
      if (!userSubscription.endDate || new Date() > userSubscription.endDate) {
        await storage.updateUserSubscription(userSubscription.id, {
          tier: SubscriptionTier.FREE,
        });
      }
    }

    // Log the subscription deletion
    logUpdate(`User ${user.username} (${user.id}) deleted subscription: ${userSubscription.tier}`, 'subscription');
  } catch (error) {
    log(`Error handling subscription deleted: ${error}`, 'error');
  }
}

/**
 * Handle incoming PayPal IPN (Instant Payment Notification) webhooks
 * This is a simplified placeholder - PayPal IPN requires specific validation
 */
export async function handlePayPalWebhook(req: Request, res: Response) {
  try {
    // PayPal IPN verification would go here
    // See PayPal documentation for proper implementation
    
    const body = req.body;
    log(`Received PayPal webhook: ${JSON.stringify(body)}`, 'info');
    
    // For this example, we just log the webhook and return success
    res.status(200).send('OK');
  } catch (error) {
    log(`Error processing PayPal webhook: ${error}`, 'error');
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}

/**
 * Handle CashApp webhook (placeholder - CashApp doesn't have official webhooks yet)
 * This would be implemented when/if CashApp provides webhook functionality
 */
export async function handleCashAppWebhook(req: Request, res: Response) {
  try {
    // This is just a placeholder, as CashApp doesn't currently offer webhooks
    const body = req.body;
    log(`Received CashApp webhook: ${JSON.stringify(body)}`, 'info');
    
    res.status(200).send('OK');
  } catch (error) {
    log(`Error processing CashApp webhook: ${error}`, 'error');
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}

/**
 * Handle Discord interaction webhooks
 */
export async function handleDiscordInteraction(req: Request, res: Response) {
  try {
    // Discord interaction verification would go here
    // See Discord API documentation for proper implementation
    
    const interaction = req.body;
    log(`Received Discord interaction: ${JSON.stringify(interaction)}`, 'info');
    
    // Respond to the interaction
    // This is a simplified example - actual implementation would depend on the interaction type
    res.json({
      type: 4, // Message response type
      data: {
        content: "I've received your command and am processing it!",
      }
    });
  } catch (error) {
    log(`Error processing Discord interaction: ${error}`, 'error');
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}