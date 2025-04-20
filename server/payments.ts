/**
 * Payment processing module for Stripe integration
 */
import { Request, Response } from 'express';
import Stripe from 'stripe';
import { storage } from './storage';
import { SubscriptionTier, PaymentStatus, PaymentMethod } from '@shared/schema';
import { logUpdate } from './update-logger';

// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('STRIPE_SECRET_KEY is not set. Stripe payments will not work.');
}

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

// Pricing constants
const PRICES = {
  [SubscriptionTier.PREMIUM]: 999, // $9.99 monthly
  [SubscriptionTier.PREMIUM_PLUS]: 1999, // $19.99 monthly
  [SubscriptionTier.LIFETIME_PREMIUM]: 14999, // $149.99 one-time
  [SubscriptionTier.LIFETIME_PREMIUM_PLUS]: 24999, // $249.99 one-time
};

/**
 * Create a payment intent for one-time payments
 */
export async function createPaymentIntent(req: Request, res: Response) {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  try {
    const { tier } = req.body;
    const user = req.user as any;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate the tier
    if (!Object.values(SubscriptionTier).includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    // Check if the tier should be processed as a one-time payment
    const isLifetime = tier === SubscriptionTier.LIFETIME_PREMIUM || tier === SubscriptionTier.LIFETIME_PREMIUM_PLUS;
    
    if (!isLifetime) {
      return res.status(400).json({ error: 'Please use create-subscription for monthly subscriptions' });
    }

    // Get the amount for the selected tier
    const amount = PRICES[tier as SubscriptionTier] || 999;

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      metadata: {
        userId: user.id.toString(),
        tier,
        isLifetime: 'true',
      },
    });

    // Record the payment attempt
    await storage.createPaymentTransaction({
      userId: user.id,
      amount: amount / 100, // Convert from cents to dollars for display
      status: PaymentStatus.PENDING,
      method: PaymentMethod.STRIPE,
      tier: tier as SubscriptionTier,
      transactionId: paymentIntent.id,
      metadata: {
        isLifetime: true,
      },
    });

    await logUpdate(`User ${user.username} initiated a lifetime premium payment: ${tier}`, 'payment');

    // Return the client secret for the payment intent
    res.json({
      clientSecret: paymentIntent.client_secret,
      amount,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
}

/**
 * Create a subscription for recurring payments
 */
export async function createSubscription(req: Request, res: Response) {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  try {
    const { tier } = req.body;
    const user = req.user as any;

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate the tier
    if (![SubscriptionTier.PREMIUM, SubscriptionTier.PREMIUM_PLUS].includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    // Check if user already has a subscription
    const existingSubscription = await storage.getUserSubscription(user.id);
    
    if (existingSubscription && existingSubscription.active) {
      return res.status(400).json({ error: 'User already has an active subscription' });
    }

    // Get or create a customer
    let customerId = user.stripeCustomerId;
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          userId: user.id.toString(),
        },
      });
      
      customerId = customer.id;
      // Update user with Stripe customer ID
      await storage.updateUser(user.id, { stripeCustomerId: customerId });
    }

    // Get price ID for the selected tier
    // In a real implementation, these would be stored in a database or configuration
    const priceId = tier === SubscriptionTier.PREMIUM 
      ? process.env.STRIPE_PREMIUM_PRICE_ID
      : process.env.STRIPE_PREMIUM_PLUS_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({ error: 'Subscription price not configured' });
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    // Get the client secret for the initial payment
    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent;
    const clientSecret = paymentIntent.client_secret;

    // Record the subscription
    await storage.createUserSubscription({
      userId: user.id,
      tier: tier as SubscriptionTier,
      active: false, // Will be set to true when payment is confirmed
      startDate: new Date(),
      endDate: null, // Will be set when canceled
      stripeSubscriptionId: subscription.id,
      metadata: {
        priceId,
        isLifetime: false,
      },
    });

    // Record the payment attempt
    await storage.createPaymentTransaction({
      userId: user.id,
      amount: PRICES[tier as SubscriptionTier] / 100, // Convert from cents to dollars
      status: PaymentStatus.PENDING,
      method: PaymentMethod.STRIPE,
      tier: tier as SubscriptionTier,
      transactionId: paymentIntent.id,
      metadata: {
        subscriptionId: subscription.id,
        isLifetime: false,
      },
    });

    await logUpdate(`User ${user.username} initiated a subscription: ${tier}`, 'payment');

    res.json({
      subscriptionId: subscription.id,
      clientSecret,
      status: subscription.status,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  const sig = req.headers['stripe-signature'] as string;
  
  if (!sig) {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!endpointSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET is not set. Stripe webhooks will not be verified.');
  }

  let event;

  try {
    // Verify the event
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // For development, parse the event without verification
      event = JSON.parse(req.body);
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Handle the event based on its type
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(event.data.object);
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
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
}

/**
 * Handle payment succeeded event
 */
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { userId, tier, isLifetime } = paymentIntent.metadata;

  if (!userId || !tier) {
    console.error('Missing metadata in payment intent:', paymentIntent.id);
    return;
  }

  // Update payment transaction
  await storage.updatePaymentTransactionByTransactionId(
    paymentIntent.id,
    {
      status: PaymentStatus.COMPLETED,
    }
  );

  // If this is a lifetime subscription, activate it immediately
  if (isLifetime === 'true') {
    await storage.createUserSubscription({
      userId: parseInt(userId),
      tier: tier as SubscriptionTier,
      active: true,
      startDate: new Date(),
      endDate: null, // Lifetime has no end date
      stripeSubscriptionId: null, // No recurring subscription
      metadata: {
        isLifetime: true,
        paymentIntentId: paymentIntent.id,
      },
    });

    const user = await storage.getUser(parseInt(userId));
    if (user) {
      await logUpdate(`User ${user.username} completed a lifetime premium payment: ${tier}`, 'payment');
    }
  }
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Update payment transaction
  await storage.updatePaymentTransactionByTransactionId(
    paymentIntent.id,
    {
      status: PaymentStatus.FAILED,
    }
  );

  const { userId, tier } = paymentIntent.metadata;
  
  if (userId && tier) {
    const user = await storage.getUser(parseInt(userId));
    if (user) {
      await logUpdate(`Payment failed for user ${user.username}, tier: ${tier}`, 'payment');
    }
  }
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // This is already handled in createSubscription function
  console.log('Subscription created:', subscription.id);
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Find the user subscription by Stripe subscription ID
  const userSubscription = await storage.getUserSubscriptionByStripeId(subscription.id);
  
  if (!userSubscription) {
    console.error('Subscription not found:', subscription.id);
    return;
  }

  // Update the subscription based on its status
  switch (subscription.status) {
    case 'active':
      await storage.updateUserSubscription(userSubscription.id, {
        active: true,
      });
      break;
    case 'canceled':
    case 'unpaid':
    case 'past_due':
      await storage.updateUserSubscription(userSubscription.id, {
        active: false,
        endDate: new Date(),
      });
      break;
  }

  const user = await storage.getUser(userSubscription.userId);
  if (user) {
    await logUpdate(`Subscription updated for user ${user.username}: status=${subscription.status}`, 'payment');
  }
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  // Find the user subscription by Stripe subscription ID
  const userSubscription = await storage.getUserSubscriptionByStripeId(subscription.id);
  
  if (!userSubscription) {
    console.error('Subscription not found:', subscription.id);
    return;
  }

  // Mark the subscription as inactive
  await storage.updateUserSubscription(userSubscription.id, {
    active: false,
    endDate: new Date(),
  });

  const user = await storage.getUser(userSubscription.userId);
  if (user) {
    await logUpdate(`Subscription canceled for user ${user.username}`, 'payment');
  }
}

/**
 * Get user's subscription
 */
export async function getUserSubscription(req: Request, res: Response) {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await storage.getUserSubscription(user.id);
    res.json({ subscription });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
}

/**
 * Get user's payment history
 */
export async function getPaymentHistory(req: Request, res: Response) {
  try {
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const payments = await storage.getPaymentTransactionsByUserId(user.id);
    res.json({ payments });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ error: 'Failed to fetch payment history' });
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(req: Request, res: Response) {
  if (!stripe) {
    return res.status(500).json({ error: 'Stripe is not configured' });
  }

  try {
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const subscription = await storage.getUserSubscription(user.id);
    
    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    if (!subscription.active) {
      return res.status(400).json({ error: 'Subscription is already inactive' });
    }

    // Check if it's a lifetime subscription
    const isLifetime = subscription.tier === SubscriptionTier.LIFETIME_PREMIUM || 
                       subscription.tier === SubscriptionTier.LIFETIME_PREMIUM_PLUS;
    
    if (isLifetime) {
      return res.status(400).json({ error: 'Cannot cancel a lifetime subscription' });
    }

    // Cancel with Stripe if it's a Stripe subscription
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    }

    // Update the subscription in the database
    await storage.updateUserSubscription(subscription.id, {
      active: false,
      endDate: new Date(),
    });

    await logUpdate(`User ${user.username} canceled their subscription`, 'payment');

    res.json({ message: 'Subscription canceled successfully' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
}

/**
 * For manually verifying payments from alternative payment methods (PayPal, CashApp)
 * This would be an admin-only endpoint in production
 */
export async function manualPaymentVerification(req: Request, res: Response) {
  try {
    const { userId, tier, paymentMethod, transactionId } = req.body;
    const admin = req.user as any;
    
    // Check if the user is an admin
    if (!admin || admin.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Validate inputs
    if (!userId || !tier || !paymentMethod || !transactionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify the tier
    if (!Object.values(SubscriptionTier).includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    // Verify the payment method
    if (![PaymentMethod.PAYPAL, PaymentMethod.CASHAPP, PaymentMethod.MANUAL].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }

    // Get the user
    const user = await storage.getUser(parseInt(userId));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Determine if it's a lifetime subscription
    const isLifetime = tier === SubscriptionTier.LIFETIME_PREMIUM || tier === SubscriptionTier.LIFETIME_PREMIUM_PLUS;

    // Create a payment transaction
    const amount = PRICES[tier as SubscriptionTier] / 100;
    await storage.createPaymentTransaction({
      userId: parseInt(userId),
      amount,
      status: PaymentStatus.COMPLETED,
      method: paymentMethod as PaymentMethod,
      tier: tier as SubscriptionTier,
      transactionId,
      metadata: {
        isLifetime,
        verifiedBy: admin.id,
      },
    });

    // Create or update the subscription
    const existingSubscription = await storage.getUserSubscription(parseInt(userId));
    
    if (existingSubscription) {
      await storage.updateUserSubscription(existingSubscription.id, {
        tier: tier as SubscriptionTier,
        active: true,
        endDate: isLifetime ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for monthly
      });
    } else {
      await storage.createUserSubscription({
        userId: parseInt(userId),
        tier: tier as SubscriptionTier,
        active: true,
        startDate: new Date(),
        endDate: isLifetime ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days for monthly
        stripeSubscriptionId: null, // Manual subscription
        metadata: {
          isLifetime,
          paymentMethod,
          transactionId,
        },
      });
    }

    await logUpdate(`Admin ${admin.username} manually verified payment for user ${user.username}: ${tier} (${paymentMethod})`, 'payment');

    res.json({ message: 'Payment verified successfully' });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
}

/**
 * For schema migrations and database fixes
 */
export async function pushPaymentSchemaChanges() {
  // This function would apply any schema migrations related to payments
  // In a production environment, this would use a proper migration system
  console.log('Pushing payment schema changes...');
}