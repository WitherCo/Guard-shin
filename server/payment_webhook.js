import express from 'express';
import Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

// Initialize Stripe with the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("Error: STRIPE_SECRET_KEY is not set in the environment variables.");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
});

// Initialize webhook endpoint secret
const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || '';

// Setup premium updates file for Discord bot integration
const PREMIUM_UPDATES_FILE = 'premium_updates.json';

/**
 * Load premium updates from file
 */
function loadPremiumUpdates() {
  try {
    if (fs.existsSync(PREMIUM_UPDATES_FILE)) {
      const data = fs.readFileSync(PREMIUM_UPDATES_FILE, 'utf8');
      return data ? JSON.parse(data) : [];
    }
  } catch (error) {
    console.error(`Error loading premium updates: ${error.message}`);
  }
  return [];
}

/**
 * Save premium updates to file
 */
function savePremiumUpdates(updates) {
  try {
    fs.writeFileSync(PREMIUM_UPDATES_FILE, JSON.stringify(updates, null, 2));
    return true;
  } catch (error) {
    console.error(`Error saving premium updates: ${error.message}`);
    return false;
  }
}

/**
 * Add a premium update for a guild
 */
function addPremiumUpdate(guildId, tier, expires) {
  const updates = loadPremiumUpdates();
  
  updates.push({
    guild_id: guildId,
    tier: tier,
    expires: expires,
    timestamp: Math.floor(Date.now() / 1000),
    processed: false
  });
  
  return savePremiumUpdates(updates);
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhook(req, res) {
  const sig = req.headers['stripe-signature'];
  
  let event;
  
  try {
    // If webhook secret is provided, verify the signature
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } else {
      // For testing without verification
      event = req.body;
    }
  } catch (error) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
  
  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
      
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object);
      break;
      
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
  
  // Return success response
  res.status(200).json({ received: true });
}

/**
 * Handle checkout session completed event
 */
async function handleCheckoutCompleted(session) {
  try {
    console.log('Processing checkout session completed event:', session.id);
    
    // Check if the checkout was for a subscription
    if (session.mode === 'subscription') {
      // Subscription will be handled by the subscription events
      return;
    }
    
    // One-time payment
    if (session.metadata && session.metadata.guild_id) {
      const guildId = session.metadata.guild_id;
      const tier = session.metadata.tier || 'basic';
      
      // Calculate expiration (default to 30 days)
      const duration = session.metadata.duration ? parseInt(session.metadata.duration) : 30;
      const currentTime = Math.floor(Date.now() / 1000);
      const expires = currentTime + (duration * 24 * 60 * 60);
      
      // Add premium update
      addPremiumUpdate(guildId, tier, expires);
      
      console.log(`Added premium update for guild ${guildId} with tier ${tier}, expires in ${duration} days`);
    } else {
      console.warn('Checkout session completed but no guild_id found in metadata');
    }
  } catch (error) {
    console.error(`Error handling checkout completed: ${error.message}`);
  }
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(subscription) {
  try {
    console.log('Processing subscription update event:', subscription.id);
    
    // Only process active or trialing subscriptions
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      console.log(`Ignoring subscription with status: ${subscription.status}`);
      return;
    }
    
    // Get the customer
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    // Get metadata from either subscription or customer
    const metadata = subscription.metadata || customer.metadata || {};
    
    if (metadata.guild_id) {
      const guildId = metadata.guild_id;
      
      // Determine tier based on the price
      let tier = metadata.tier || 'basic';
      
      if (subscription.items && subscription.items.data && subscription.items.data.length > 0) {
        const priceId = subscription.items.data[0].price.id;
        
        // Map price IDs to tiers (customize these based on your actual price IDs)
        if (priceId.includes('basic')) {
          tier = 'basic';
        } else if (priceId.includes('standard')) {
          tier = 'standard';
        } else if (priceId.includes('professional')) {
          tier = 'professional';
        }
      }
      
      // Calculate expiration date from current period end
      const expires = subscription.current_period_end;
      
      // Add premium update
      addPremiumUpdate(guildId, tier, expires);
      
      console.log(`Added premium update for guild ${guildId} with tier ${tier}, expires at ${new Date(expires * 1000).toISOString()}`);
    } else {
      console.warn('Subscription updated but no guild_id found in metadata');
    }
  } catch (error) {
    console.error(`Error handling subscription update: ${error.message}`);
  }
}

/**
 * Handle subscription deleted event
 */
async function handleSubscriptionDeleted(subscription) {
  try {
    console.log('Processing subscription deleted event:', subscription.id);
    
    // Get the customer
    const customer = await stripe.customers.retrieve(subscription.customer);
    
    // Get metadata from either subscription or customer
    const metadata = subscription.metadata || customer.metadata || {};
    
    if (metadata.guild_id) {
      const guildId = metadata.guild_id;
      
      // Add premium update with null tier to signal removal
      addPremiumUpdate(guildId, null, 0);
      
      console.log(`Added premium removal for guild ${guildId}`);
    } else {
      console.warn('Subscription deleted but no guild_id found in metadata');
    }
  } catch (error) {
    console.error(`Error handling subscription deleted: ${error.message}`);
  }
}

/**
 * Register the webhook route
 */
export function registerWebhookRoute(app) {
  app.post('/api/payment-webhook', express.raw({type: 'application/json'}), handleWebhook);
  console.log('Registered payment webhook route');
}