/**
 * Guard-shin Payment Webhook Handler
 * 
 * This file contains handler functions for payment webhooks from Stripe, PayPal, and CashApp
 * It processes payment events and adds/removes premium status to guilds
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';

// Initialize environment variables
dotenv.config();

// Get dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Stripe API client
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Premium guild tracking
const PREMIUM_GUILDS_FILE = path.join(__dirname, 'premium_guilds.json');

// Load premium guilds from file
function loadPremiumGuilds() {
  try {
    if (fs.existsSync(PREMIUM_GUILDS_FILE)) {
      const data = fs.readFileSync(PREMIUM_GUILDS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      
      // Handle different formats
      if (Array.isArray(parsed)) {
        return parsed;  // Array of guild IDs
      } else if (parsed && parsed.guild_ids && Array.isArray(parsed.guild_ids)) {
        return parsed.guild_ids;  // Object with guild_ids array
      }
      
      return [];
    }
  } catch (error) {
    console.error('Error loading premium guilds:', error);
  }
  return [];
}

// Save premium guilds to file
function savePremiumGuilds(guildIds) {
  try {
    fs.writeFileSync(PREMIUM_GUILDS_FILE, JSON.stringify(guildIds), 'utf8');
    console.log('Premium guilds saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving premium guilds:', error);
    return false;
  }
}

// Add a guild to premium list
function addGuildToPremium(guildId) {
  const guildIds = loadPremiumGuilds();
  if (!guildIds.includes(guildId)) {
    guildIds.push(guildId);
    savePremiumGuilds(guildIds);
    console.log(`Added guild ${guildId} to premium list`);
    return true;
  }
  return false;
}

// Remove a guild from premium list
function removeGuildFromPremium(guildId) {
  const guildIds = loadPremiumGuilds();
  const index = guildIds.indexOf(guildId);
  if (index !== -1) {
    guildIds.splice(index, 1);
    savePremiumGuilds(guildIds);
    console.log(`Removed guild ${guildId} from premium list`);
    return true;
  }
  return false;
}

/**
 * Handle Stripe webhook events
 * @param {Object} event - Stripe event object
 * @returns {Object} Response object with status and message
 */
async function handleStripeWebhook(event) {
  try {
    console.log(`Processing Stripe event: ${event.type}`);
    
    // Handle checkout.session.completed event (successful payment)
    if (event.type === 'checkout.session.completed') {
      return await handleStripeCheckoutCompleted(event);
    } 
    // Handle subscription canceled event
    else if (event.type === 'customer.subscription.deleted') {
      return await handleStripeSubscriptionDeleted(event);
    }
    // Handle other events
    else {
      return {
        status: 'ignored',
        message: `Event type ${event.type} was ignored`
      };
    }
  } catch (error) {
    console.error('Error handling Stripe webhook:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Handle Stripe checkout.session.completed event
 * @param {Object} event - Stripe event object
 * @returns {Object} Response object with status and message
 */
async function handleStripeCheckoutCompleted(event) {
  const session = event.data.object;
  
  // Extract the guild ID from metadata, client_reference_id, or custom_fields
  let guildId = session.metadata && session.metadata.guild_id;
  
  // If not in metadata, try client_reference_id
  if (!guildId && session.client_reference_id) {
    guildId = session.client_reference_id;
  }
  
  // If still not found and custom fields is available, try custom fields
  if (!guildId && session.custom_fields && Array.isArray(session.custom_fields)) {
    const guildField = session.custom_fields.find(field => 
      field.key === 'guild_id' || field.key === 'server_id');
    
    if (guildField) {
      guildId = guildField.value;
    }
  }
  
  // Get the customer ID for logging
  const customerId = session.customer;
  
  // Try to get customer email for logging
  let customerEmail = session.customer_email || 'unknown';
  if (!customerEmail && customerId && stripe) {
    try {
      const customer = await stripe.customers.retrieve(customerId);
      customerEmail = customer.email || 'unknown';
    } catch (e) {
      console.error('Error retrieving customer details:', e);
    }
  }
  
  if (!guildId) {
    console.error(`Payment received but no guild ID found. Customer: ${customerEmail}, Session: ${session.id}`);
    return {
      status: 'error',
      message: 'No guild ID found in session data. The payment was received, but premium could not be activated.'
    };
  }
  
  // Check if this is a subscription or one-time payment
  if (session.subscription) {
    try {
      // It's a subscription payment
      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      
      // Add the guild to premium
      addGuildToPremium(guildId);
      
      return {
        status: 'success',
        message: `Added guild ${guildId} to premium (subscription: ${subscription.id})`,
        guildId: guildId,
        subscription: subscription.id
      };
    } catch (error) {
      console.error('Error retrieving subscription:', error);
      return {
        status: 'error',
        message: `Error retrieving subscription: ${error.message}`
      };
    }
  } else if (session.payment_intent) {
    try {
      // It's a one-time payment
      const paymentIntent = await stripe.paymentIntents.retrieve(session.payment_intent);
      
      // Add the guild to premium
      addGuildToPremium(guildId);
      
      return {
        status: 'success',
        message: `Added guild ${guildId} to premium (payment: ${paymentIntent.id})`,
        guildId: guildId,
        payment: paymentIntent.id
      };
    } catch (error) {
      console.error('Error retrieving payment intent:', error);
      return {
        status: 'error',
        message: `Error retrieving payment intent: ${error.message}`
      };
    }
  } else {
    return {
      status: 'error',
      message: 'Session has neither subscription nor payment_intent'
    };
  }
}

/**
 * Handle Stripe customer.subscription.deleted event
 * @param {Object} event - Stripe event object
 * @returns {Object} Response object with status and message
 */
async function handleStripeSubscriptionDeleted(event) {
  const subscription = event.data.object;
  
  // Try to find guild ID from various sources
  const metadata = subscription.metadata || {};
  let guildId = metadata.guild_id;
  
  // If no guild ID in metadata, try to get it from the customer
  if (!guildId && subscription.customer && stripe) {
    try {
      // Get customer
      const customer = await stripe.customers.retrieve(subscription.customer);
      
      // Check customer metadata
      if (customer.metadata && customer.metadata.guild_id) {
        guildId = customer.metadata.guild_id;
      }
      
      // Log for debugging
      console.log(`Subscription ${subscription.id} canceled for customer ${customer.email || customer.id}`);
    } catch (e) {
      console.error('Error retrieving customer for subscription cancellation:', e);
    }
  }
  
  if (!guildId) {
    return {
      status: 'error',
      message: 'Could not determine guild ID for canceled subscription'
    };
  }
  
  // Remove the guild from premium
  removeGuildFromPremium(guildId);
  
  return {
    status: 'success',
    message: `Removed guild ${guildId} from premium (subscription ended)`,
    guildId: guildId
  };
}

/**
 * Handle PayPal webhook events
 * Note: This is a placeholder. You need to implement the actual PayPal webhook handling
 * @param {Object} event - PayPal event object
 * @returns {Object} Response object with status and message
 */
function handlePayPalWebhook(event) {
  try {
    console.log(`Processing PayPal event: ${event.event_type}`);
    
    // Extract guild ID from metadata (custom field in PayPal)
    const guildId = event.resource && event.resource.custom_id;
    
    if (!guildId) {
      return {
        status: 'error',
        message: 'No guild ID in PayPal webhook data'
      };
    }
    
    // Handle PAYMENT.CAPTURE.COMPLETED event (successful payment)
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      // Add the guild to premium
      addGuildToPremium(guildId);
      
      return {
        status: 'success',
        message: `Added guild ${guildId} to premium (PayPal payment)`,
        guildId: guildId
      };
    } 
    // Handle BILLING.SUBSCRIPTION.CANCELLED event
    else if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
      // Remove the guild from premium
      removeGuildFromPremium(guildId);
      
      return {
        status: 'success',
        message: `Removed guild ${guildId} from premium (PayPal subscription cancelled)`,
        guildId: guildId
      };
    }
    // Handle other events
    else {
      return {
        status: 'ignored',
        message: `PayPal event type ${event.event_type} was ignored`
      };
    }
  } catch (error) {
    console.error('Error handling PayPal webhook:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

/**
 * Handle CashApp webhook events
 * Note: This is a placeholder. You need to implement the actual CashApp webhook handling
 * @param {Object} event - CashApp event object
 * @returns {Object} Response object with status and message
 */
function handleCashAppWebhook(event) {
  try {
    console.log(`Processing CashApp event: ${event.type}`);
    
    // Extract guild ID from metadata (note field or similar in CashApp)
    const guildId = event.data && event.data.note;
    
    if (!guildId) {
      return {
        status: 'error',
        message: 'No guild ID in CashApp webhook data'
      };
    }
    
    // Handle PAYMENT_COMPLETED event (successful payment)
    if (event.type === 'PAYMENT_COMPLETED') {
      // Add the guild to premium
      addGuildToPremium(guildId);
      
      return {
        status: 'success',
        message: `Added guild ${guildId} to premium (CashApp payment)`,
        guildId: guildId
      };
    } 
    // Handle other events
    else {
      return {
        status: 'ignored',
        message: `CashApp event type ${event.type} was ignored`
      };
    }
  } catch (error) {
    console.error('Error handling CashApp webhook:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

// Export the handler functions as default export
export default {
  handleStripeWebhook,
  handlePayPalWebhook,
  handleCashAppWebhook,
  addGuildToPremium,
  removeGuildFromPremium,
  loadPremiumGuilds
};

// Also export individual functions for direct imports
export {
  handleStripeWebhook,
  handlePayPalWebhook,
  handleCashAppWebhook,
  addGuildToPremium,
  removeGuildFromPremium,
  loadPremiumGuilds
};