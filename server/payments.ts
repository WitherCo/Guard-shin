import { Request, Response } from "express";
import Stripe from "stripe";
import { db } from "./db";
import { logUpdate } from "./update-logger";
import { 
  users, 
  userSubscriptions, 
  paymentTransactions, 
  SubscriptionTier, 
  PaymentStatus, 
  PaymentMethod 
} from "@shared/schema";
import { and, eq } from "drizzle-orm";

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

// Pricing for premium tiers (in cents)
const PRICES = {
  PREMIUM_MONTHLY: 499, // $4.99
  PREMIUM_PLUS_MONTHLY: 999, // $9.99
  PREMIUM_YEARLY: 4999, // $49.99
  PREMIUM_PLUS_YEARLY: 9999, // $99.99
  LIFETIME_PREMIUM: 14999, // $149.99
  LIFETIME_PREMIUM_PLUS: 24999, // $249.99
};

// Create a payment intent for one-time payments (lifetime premium)
export async function createPaymentIntent(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'You must be logged in to make a payment' });
  }

  try {
    const { subscriptionTier, paymentMethod = PaymentMethod.STRIPE } = req.body;
    
    if (!subscriptionTier) {
      return res.status(400).json({ error: 'Subscription tier is required' });
    }

    const user = req.user as any;
    
    // Determine price based on subscription tier
    let amount: number;
    let description: string;
    
    if (subscriptionTier === SubscriptionTier.LIFETIME_PREMIUM) {
      amount = PRICES.LIFETIME_PREMIUM;
      description = "Guard-shin Lifetime Premium";
    } else if (subscriptionTier === SubscriptionTier.LIFETIME_PREMIUM_PLUS) {
      amount = PRICES.LIFETIME_PREMIUM_PLUS;
      description = "Guard-shin Lifetime Premium+";
    } else {
      return res.status(400).json({ error: 'Invalid subscription tier for one-time payment' });
    }

    // Create a Stripe customer if they don't have one
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.username,
        metadata: {
          userId: user.id,
          discordId: user.discordId || '',
        },
      });
      
      stripeCustomerId = customer.id;
      
      // Update user with Stripe customer ID
      await db.update(users)
        .set({ stripeCustomerId })
        .where(eq(users.id, user.id));
    }
    
    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: stripeCustomerId,
      description,
      metadata: {
        userId: user.id,
        tier: subscriptionTier,
        paymentType: 'lifetime',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });
    
    // Record the payment transaction in our database
    await db.insert(paymentTransactions).values({
      userId: user.id,
      amount: amount / 100, // Convert from cents to dollars
      currency: 'usd',
      status: PaymentStatus.PENDING,
      paymentMethod,
      paymentIntentId: paymentIntent.id,
      paymentProviderId: 'stripe',
      transactionType: 'purchase',
      metadata: {
        tier: subscriptionTier,
        paymentType: 'lifetime',
      },
    });
    
    // Return the client secret to the client
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
    
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
}

// Create a subscription (monthly/yearly premium)
export async function createSubscription(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'You must be logged in to subscribe' });
  }

  try {
    const { subscriptionTier, interval = 'month', paymentMethod = PaymentMethod.STRIPE } = req.body;
    
    if (!subscriptionTier) {
      return res.status(400).json({ error: 'Subscription tier is required' });
    }

    const user = req.user as any;
    
    // Determine price ID based on subscription tier and interval
    let priceId: string;
    let description: string;
    
    if (subscriptionTier === SubscriptionTier.PREMIUM) {
      if (interval === 'year') {
        priceId = process.env.STRIPE_PREMIUM_YEARLY_PRICE_ID || '';
        description = "Guard-shin Premium (Yearly)";
      } else {
        priceId = process.env.STRIPE_PREMIUM_MONTHLY_PRICE_ID || '';
        description = "Guard-shin Premium (Monthly)";
      }
    } else if (subscriptionTier === SubscriptionTier.PREMIUM_PLUS) {
      if (interval === 'year') {
        priceId = process.env.STRIPE_PREMIUM_PLUS_YEARLY_PRICE_ID || '';
        description = "Guard-shin Premium+ (Yearly)";
      } else {
        priceId = process.env.STRIPE_PREMIUM_PLUS_MONTHLY_PRICE_ID || '';
        description = "Guard-shin Premium+ (Monthly)";
      }
    } else {
      return res.status(400).json({ error: 'Invalid subscription tier for recurring payment' });
    }
    
    if (!priceId) {
      // If price IDs aren't configured yet, fall back to creating a payment intent
      const amount = interval === 'year' 
        ? (subscriptionTier === SubscriptionTier.PREMIUM ? PRICES.PREMIUM_YEARLY : PRICES.PREMIUM_PLUS_YEARLY)
        : (subscriptionTier === SubscriptionTier.PREMIUM ? PRICES.PREMIUM_MONTHLY : PRICES.PREMIUM_PLUS_MONTHLY);
        
      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: 'usd',
        metadata: {
          userId: user.id,
          tier: subscriptionTier,
          interval,
          paymentType: 'subscription_manual',
        },
        description,
      });
      
      return res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        manual: true,
      });
    }

    // Create a Stripe customer if they don't have one
    let stripeCustomerId = user.stripeCustomerId;
    
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        name: user.username,
        metadata: {
          userId: user.id,
          discordId: user.discordId || '',
        },
      });
      
      stripeCustomerId = customer.id;
      
      // Update user with Stripe customer ID
      await db.update(users)
        .set({ stripeCustomerId })
        .where(eq(users.id, user.id));
    }
    
    // Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: user.id,
        tier: subscriptionTier,
        interval,
      },
    });
    
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
    
    // Record the subscription in our database
    const [userSubscription] = await db.insert(userSubscriptions).values({
      userId: user.id,
      tier: subscriptionTier,
      status: 'pending',
      autoRenew: true,
      stripeCustomerId,
      stripeSubscriptionId: subscription.id,
      paymentMethod,
      endDate: interval === 'year' 
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    }).returning();
    
    // Record the initial payment transaction
    await db.insert(paymentTransactions).values({
      userId: user.id,
      subscriptionId: userSubscription.id,
      amount: interval === 'year' 
        ? (subscriptionTier === SubscriptionTier.PREMIUM ? PRICES.PREMIUM_YEARLY / 100 : PRICES.PREMIUM_PLUS_YEARLY / 100)
        : (subscriptionTier === SubscriptionTier.PREMIUM ? PRICES.PREMIUM_MONTHLY / 100 : PRICES.PREMIUM_PLUS_MONTHLY / 100),
      currency: 'usd',
      status: PaymentStatus.PENDING,
      paymentMethod,
      paymentIntentId: paymentIntent.id,
      paymentProviderId: 'stripe',
      transactionType: 'subscription_start',
      metadata: {
        stripeSubscriptionId: subscription.id,
        stripeInvoiceId: invoice.id,
        tier: subscriptionTier,
        interval,
      },
    });
    
    // Return client secret for completing payment
    res.json({
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
    
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
}

// Handle Stripe webhook events
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ error: 'Missing stripe signature or webhook secret' });
  }
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }
  
  try {
    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
}

// Helper functions for webhook handling
async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  // Find the transaction
  const [transaction] = await db
    .select()
    .from(paymentTransactions)
    .where(eq(paymentTransactions.paymentIntentId, paymentIntent.id));
  
  if (!transaction) {
    console.error('Transaction not found for payment intent:', paymentIntent.id);
    return;
  }
  
  // Update transaction status
  await db.update(paymentTransactions)
    .set({ 
      status: PaymentStatus.COMPLETED,
      updatedAt: new Date(),
    })
    .where(eq(paymentTransactions.id, transaction.id));
  
  // If this is a one-time payment for lifetime premium
  if (transaction.transactionType === 'purchase' && 
      transaction.metadata && 
      transaction.metadata.paymentType === 'lifetime') {
    
    // Create a lifetime subscription record
    const tier = transaction.metadata.tier as SubscriptionTier;
    
    // If there's already a subscription, update it
    const existingSubscription = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, transaction.userId))
      .limit(1);
    
    if (existingSubscription.length > 0) {
      await db.update(userSubscriptions)
        .set({
          tier,
          status: 'active',
          autoRenew: false, // Lifetime doesn't renew
          endDate: null, // Lifetime doesn't expire
          updatedAt: new Date(),
        })
        .where(eq(userSubscriptions.id, existingSubscription[0].id));
    } else {
      // Create new subscription
      await db.insert(userSubscriptions).values({
        userId: transaction.userId,
        tier,
        status: 'active',
        autoRenew: false,
        endDate: null, // Lifetime doesn't expire
        paymentMethod: transaction.paymentMethod,
      });
    }
    
    // Log the upgrade
    logUpdate(`User ID ${transaction.userId} upgraded to ${tier}`, 'system')
      .catch(err => console.error('Error logging update:', err));
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Find and update the transaction
  await db.update(paymentTransactions)
    .set({ 
      status: PaymentStatus.FAILED,
      updatedAt: new Date(),
      metadata: {
        ...db.fn('JSON_MERGE_PATCH', paymentTransactions.metadata, JSON.stringify({
          errorMessage: paymentIntent.last_payment_error?.message,
        })),
      },
    })
    .where(eq(paymentTransactions.paymentIntentId, paymentIntent.id));
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;
  
  // Find the subscription
  const subscriptions = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeSubscriptionId, invoice.subscription as string));
  
  if (!subscriptions.length) {
    console.error('Subscription not found for invoice:', invoice.id);
    return;
  }
  
  const subscription = subscriptions[0];
  
  // Update subscription status
  await db.update(userSubscriptions)
    .set({ 
      status: 'active',
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.id, subscription.id));
  
  // Find or create a transaction record for this invoice
  const existingTransactions = await db
    .select()
    .from(paymentTransactions)
    .where(
      and(
        eq(paymentTransactions.subscriptionId, subscription.id),
        eq(paymentTransactions.paymentProviderId, invoice.id)
      )
    );
  
  if (!existingTransactions.length) {
    // Create a new transaction record
    await db.insert(paymentTransactions).values({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency,
      status: PaymentStatus.COMPLETED,
      paymentMethod: subscription.paymentMethod,
      paymentIntentId: invoice.payment_intent as string,
      paymentProviderId: invoice.id,
      transactionType: 'renewal',
      metadata: {
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        tier: subscription.tier,
      },
    });
  } else {
    // Update existing transaction
    await db.update(paymentTransactions)
      .set({ 
        status: PaymentStatus.COMPLETED,
        updatedAt: new Date(),
      })
      .where(eq(paymentTransactions.id, existingTransactions[0].id));
  }
  
  // Log the renewal
  logUpdate(`User ID ${subscription.userId} renewed their ${subscription.tier} subscription`, 'system')
    .catch(err => console.error('Error logging update:', err));
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;
  
  // Find the subscription
  const subscriptions = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeSubscriptionId, invoice.subscription as string));
  
  if (!subscriptions.length) return;
  
  const subscription = subscriptions[0];
  
  // Update subscription status
  await db.update(userSubscriptions)
    .set({ 
      status: 'past_due',
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.id, subscription.id));
  
  // Find or create a transaction record for this invoice
  const existingTransactions = await db
    .select()
    .from(paymentTransactions)
    .where(
      and(
        eq(paymentTransactions.subscriptionId, subscription.id),
        eq(paymentTransactions.paymentProviderId, invoice.id)
      )
    );
  
  if (!existingTransactions.length) {
    // Create a new failed transaction record
    await db.insert(paymentTransactions).values({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      amount: invoice.amount_due / 100,
      currency: invoice.currency,
      status: PaymentStatus.FAILED,
      paymentMethod: subscription.paymentMethod,
      paymentIntentId: invoice.payment_intent as string,
      paymentProviderId: invoice.id,
      transactionType: 'renewal_failed',
      metadata: {
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        tier: subscription.tier,
        errorMessage: invoice.last_payment_error?.message,
      },
    });
  } else {
    // Update existing transaction
    await db.update(paymentTransactions)
      .set({ 
        status: PaymentStatus.FAILED,
        updatedAt: new Date(),
        metadata: {
          ...db.fn('JSON_MERGE_PATCH', paymentTransactions.metadata, JSON.stringify({
            errorMessage: invoice.last_payment_error?.message,
          })),
        },
      })
      .where(eq(paymentTransactions.id, existingTransactions[0].id));
  }
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  // Find and update the subscription
  await db.update(userSubscriptions)
    .set({ 
      status: 'canceled',
      canceledAt: new Date(),
      autoRenew: false,
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Determine the status
  let status: string;
  
  switch (subscription.status) {
    case 'active':
      status = 'active';
      break;
    case 'canceled':
      status = 'canceled';
      break;
    case 'unpaid':
    case 'past_due':
      status = 'past_due';
      break;
    case 'trialing':
      status = 'trial';
      break;
    case 'incomplete':
    case 'incomplete_expired':
      status = 'pending';
      break;
    default:
      status = subscription.status;
  }
  
  // Find and update the subscription
  await db.update(userSubscriptions)
    .set({ 
      status,
      autoRenew: subscription.cancel_at_period_end ? false : true,
      updatedAt: new Date(),
    })
    .where(eq(userSubscriptions.stripeSubscriptionId, subscription.id));
}

// Get a user's active subscription
export async function getUserSubscription(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const user = req.user as any;
  
  try {
    // Check for active subscription in database
    const subscriptions = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, user.id),
          eq(userSubscriptions.status, 'active')
        )
      )
      .orderBy(userSubscriptions.createdAt, 'desc')
      .limit(1);
    
    if (subscriptions.length > 0) {
      return res.json(subscriptions[0]);
    }
    
    // Check for Discord roles-based premium through the API
    if (user.discordId && user.accessToken) {
      const response = await fetch(`/api/discord/user/roles`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.premium) {
          return res.json({
            tier: data.premiumTier,
            status: 'active',
            source: 'discord_role',
          });
        }
      }
    }
    
    // No active subscription found
    res.json({ 
      tier: SubscriptionTier.FREE,
      status: 'none',
    });
    
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ message: 'Failed to fetch subscription' });
  }
}

// Get payment history for the user
export async function getPaymentHistory(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const user = req.user as any;
  
  try {
    const transactions = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.userId, user.id))
      .orderBy(paymentTransactions.createdAt, 'desc');
    
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Failed to fetch payment history' });
  }
}

// Cancel a subscription
export async function cancelSubscription(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  const user = req.user as any;
  const { subscriptionId } = req.params;
  
  try {
    // Find the subscription
    const subscriptions = await db
      .select()
      .from(userSubscriptions)
      .where(
        and(
          eq(userSubscriptions.userId, user.id),
          eq(userSubscriptions.id, parseInt(subscriptionId))
        )
      );
    
    if (!subscriptions.length) {
      return res.status(404).json({ message: 'Subscription not found' });
    }
    
    const subscription = subscriptions[0];
    
    // If it's a Stripe subscription, cancel it on Stripe
    if (subscription.stripeSubscriptionId) {
      await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }
    
    // Update our database
    await db.update(userSubscriptions)
      .set({ 
        autoRenew: false,
        updatedAt: new Date(),
      })
      .where(eq(userSubscriptions.id, subscription.id));
    
    res.json({ message: 'Subscription canceled' });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ message: 'Failed to cancel subscription' });
  }
}

// For PayPal and CashApp manual verification
export async function manualPaymentVerification(req: Request, res: Response) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'You must be logged in to verify payment' });
  }
  
  const { paymentMethod, tier, transactionId, amount } = req.body;
  
  if (!paymentMethod || !tier || !transactionId || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  try {
    const user = req.user as any;
    
    // Record the payment verification request
    await db.insert(paymentTransactions).values({
      userId: user.id,
      amount: parseFloat(amount),
      currency: 'usd',
      status: PaymentStatus.PENDING, // Admin will verify manually
      paymentMethod,
      paymentProviderId: transactionId,
      transactionType: 'manual_verification',
      metadata: {
        tier,
        discordId: user.discordId || '',
        discordUsername: user.discordUsername || user.username,
        verificationStatus: 'pending',
      },
    });
    
    // Send notification to admins
    logUpdate(`Manual payment verification request from ${user.username} for ${tier} tier`, 'system')
      .catch(err => console.error('Error logging update:', err));
    
    res.json({ 
      message: 'Payment verification request submitted. An admin will verify your payment within 24 hours.',
      status: 'pending',
    });
  } catch (error) {
    console.error('Error processing manual payment verification:', error);
    res.status(500).json({ error: 'Failed to process verification request' });
  }
}

// Push schema changes
export async function pushPaymentSchemaChanges() {
  try {
    // Update users table to add Stripe customer ID
    await db.execute(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT
    `);
    
    // Make sure the subscription tables exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        tier TEXT NOT NULL DEFAULT 'free',
        status TEXT NOT NULL DEFAULT 'active',
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP,
        auto_renew BOOLEAN DEFAULT FALSE,
        canceled_at TIMESTAMP,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        payment_method TEXT DEFAULT 'stripe',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        subscription_id INTEGER,
        amount NUMERIC NOT NULL,
        currency TEXT DEFAULT 'usd',
        status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT NOT NULL,
        payment_intent_id TEXT,
        payment_provider_id TEXT,
        transaction_type TEXT NOT NULL,
        metadata JSONB,
        discord_server_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (subscription_id) REFERENCES user_subscriptions(id)
      )
    `);
    
    console.log('Payment schema changes pushed successfully');
  } catch (error) {
    console.error('Error pushing payment schema changes:', error);
    throw error;
  }
}