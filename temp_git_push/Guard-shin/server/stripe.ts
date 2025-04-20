import { Request, Response } from "express";
import Stripe from "stripe";
import { storage } from "./storage";

// Initialize Stripe with the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Premium tier pricing - these will be used to determine which product to charge for
const PREMIUM_PRICES = {
  REGULAR: {
    MONTHLY: "price_monthly_regular", // Replace with actual price ID from Stripe dashboard
    YEARLY: "price_yearly_regular",   // Replace with actual price ID from Stripe dashboard
    LIFETIME: "price_lifetime_regular" // Replace with actual price ID from Stripe dashboard
  },
  PLUS: {
    MONTHLY: "price_monthly_plus",    // Replace with actual price ID from Stripe dashboard
    YEARLY: "price_yearly_plus",      // Replace with actual price ID from Stripe dashboard
    LIFETIME: "price_lifetime_plus"   // Replace with actual price ID from Stripe dashboard
  }
};

// Premium tiers
export enum PremiumTier {
  FREE = "free",
  REGULAR = "regular",
  PLUS = "plus",
  LIFETIME_REGULAR = "lifetime_regular",
  LIFETIME_PLUS = "lifetime_plus"
}

// Create a payment intent for one-time payments (like lifetime subscriptions)
export async function createPaymentIntent(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const { tier, paymentType } = req.body;
    
    if (!tier || !paymentType) {
      return res.status(400).json({ error: "Tier and payment type are required" });
    }
    
    // Validate the tier and payment type
    if (!Object.values(PremiumTier).includes(tier)) {
      return res.status(400).json({ error: "Invalid tier" });
    }
    
    if (paymentType !== "lifetime") {
      return res.status(400).json({ error: "Payment type must be 'lifetime' for payment intents" });
    }

    // Get the user
    const user = req.user;
    
    // Determine price based on tier and payment type
    let priceId: string;
    let amount: number;
    
    if (tier === PremiumTier.LIFETIME_REGULAR) {
      priceId = PREMIUM_PRICES.REGULAR.LIFETIME;
      amount = 14999; // $149.99
    } else if (tier === PremiumTier.LIFETIME_PLUS) {
      priceId = PREMIUM_PRICES.PLUS.LIFETIME;
      amount = 24999; // $249.99
    } else {
      return res.status(400).json({ error: "Invalid tier for lifetime subscription" });
    }

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      metadata: {
        userId: user.id.toString(),
        tier: tier,
        paymentType: paymentType
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      tier: tier,
      amount: amount
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: error.message || "Failed to create payment intent" });
  }
}

// Create or get a subscription
export async function getOrCreateSubscription(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = req.user;

    // Check if user already has a subscription
    if (user.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        
        // Return the subscription and client secret for the payment intent
        return res.json({
          subscriptionId: subscription.id,
          clientSecret: subscription.latest_invoice?.payment_intent?.client_secret || null,
          status: subscription.status
        });
      } catch (error) {
        // If the subscription doesn't exist anymore, continue to create a new one
        console.warn("Subscription not found, creating a new one:", error);
      }
    }
    
    const { tier, interval } = req.body;
    
    if (!tier || !interval) {
      return res.status(400).json({ error: "Tier and interval are required" });
    }
    
    // Validate the tier and interval
    if (![PremiumTier.REGULAR, PremiumTier.PLUS].includes(tier)) {
      return res.status(400).json({ error: "Invalid tier for subscription" });
    }
    
    if (!["monthly", "yearly"].includes(interval)) {
      return res.status(400).json({ error: "Interval must be 'monthly' or 'yearly'" });
    }

    // Make sure user has an email
    if (!user.email) {
      return res.status(400).json({ error: "User email is required for subscription" });
    }

    // Create or get customer
    let customer;
    if (user.stripeCustomerId) {
      customer = await stripe.customers.retrieve(user.stripeCustomerId);
      if (customer.deleted) {
        throw new Error("Customer has been deleted");
      }
    } else {
      customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          userId: user.id.toString()
        }
      });
      
      // Update user with the new customer ID
      await storage.updateStripeCustomerId(user.id, customer.id);
    }

    // Get the price ID based on the tier and interval
    let priceId: string;
    if (tier === PremiumTier.REGULAR) {
      priceId = interval === "monthly" ? PREMIUM_PRICES.REGULAR.MONTHLY : PREMIUM_PRICES.REGULAR.YEARLY;
    } else {
      priceId = interval === "monthly" ? PREMIUM_PRICES.PLUS.MONTHLY : PREMIUM_PRICES.PLUS.YEARLY;
    }

    // Create the subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{
        price: priceId,
      }],
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        userId: user.id.toString(),
        tier: tier,
        interval: interval
      }
    });

    // Update user with subscription ID
    await storage.updateUserStripeInfo(user.id, {
      stripeCustomerId: customer.id,
      stripeSubscriptionId: subscription.id
    });

    // Return the subscription and client secret
    res.json({
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
      status: subscription.status
    });
  } catch (error: any) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: error.message || "Failed to create subscription" });
  }
}

// Webhook handler for Stripe events
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret) {
    return res.status(500).json({ error: "Stripe webhook secret is not configured" });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).json({ error: `Webhook signature verification failed: ${err.message}` });
  }

  try {
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
        
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.json({ received: true });
  } catch (error: any) {
    console.error(`Error handling webhook event: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
}

// Handle one-time payment (for lifetime subscriptions)
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { userId, tier } = paymentIntent.metadata;
  
  if (!userId || !tier) {
    console.error("Payment intent missing user ID or tier in metadata");
    return;
  }
  
  // Convert the user ID to a number
  const userIdNum = parseInt(userId);
  
  // Set premium status based on tier
  let status: string;
  let expiresAt: Date | null = null;
  
  if (tier === PremiumTier.LIFETIME_REGULAR) {
    status = "lifetime";
  } else if (tier === PremiumTier.LIFETIME_PLUS) {
    status = "lifetime_plus";
  } else {
    console.error(`Invalid tier for lifetime subscription: ${tier}`);
    return;
  }
  
  // Update user premium status
  await storage.updateUserPremiumStatus(userIdNum, status);
  
  console.log(`Lifetime premium (${status}) activated for user ${userId}`);
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const { userId, tier } = subscription.metadata;
  
  if (!userId) {
    console.error("Subscription missing user ID in metadata");
    return;
  }
  
  // Convert the user ID to a number
  const userIdNum = parseInt(userId);
  
  // Set premium status based on subscription status and tier
  let status = "none";
  let expiresAt: Date | null = null;
  
  if (subscription.status === "active" || subscription.status === "trialing") {
    if (tier === PremiumTier.REGULAR) {
      status = "regular";
    } else if (tier === PremiumTier.PLUS) {
      status = "plus";
    }
    
    // Set expiration date to the end of the current period
    if (subscription.current_period_end) {
      expiresAt = new Date(subscription.current_period_end * 1000);
    }
  }
  
  // Update user premium status
  await storage.updateUserPremiumStatus(userIdNum, status, expiresAt);
  
  console.log(`Premium status for user ${userId} updated to ${status}`);
}

// Handle subscription cancellations
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { userId } = subscription.metadata;
  
  if (!userId) {
    console.error("Subscription missing user ID in metadata");
    return;
  }
  
  // Convert the user ID to a number
  const userIdNum = parseInt(userId);
  
  // Set premium status to none
  await storage.updateUserPremiumStatus(userIdNum, "none", null);
  
  console.log(`Premium subscription for user ${userId} canceled`);
}

// Handle invoice payments
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  // If this is for a subscription, update the subscription
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    await handleSubscriptionUpdated(subscription);
  }
}