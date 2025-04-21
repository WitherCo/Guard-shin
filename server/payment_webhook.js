import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const PREMIUM_UPDATES_FILE = 'premium_updates.json';
const UPDATE_WEBHOOK_URL = process.env.UPDATE_WEBHOOK_URL;

// Calculate premium expiration date (1 month from now)
const calculateExpiryTime = () => {
  const now = new Date();
  const expiryDate = new Date(now);
  expiryDate.setMonth(now.getMonth() + 1);
  return Math.floor(expiryDate.getTime() / 1000); // Convert to Unix timestamp
};

// Add a new premium update
export const addPremiumUpdate = async (serverId, tier, expiryTime = null) => {
  try {
    if (!serverId) {
      throw new Error('Server ID is required');
    }
    
    const timestamp = Math.floor(Date.now() / 1000);
    const expires = expiryTime || calculateExpiryTime();
    
    let updates = [];
    
    // Load existing updates if file exists
    if (fs.existsSync(PREMIUM_UPDATES_FILE)) {
      const fileContent = fs.readFileSync(PREMIUM_UPDATES_FILE, 'utf-8');
      if (fileContent.trim()) {
        updates = JSON.parse(fileContent);
      }
    }
    
    // Add new update
    updates.push({
      guild_id: serverId,
      tier: tier,
      expires: expires,
      timestamp: timestamp,
      processed: false
    });
    
    // Save updates
    fs.writeFileSync(PREMIUM_UPDATES_FILE, JSON.stringify(updates, null, 2));
    
    console.log(`Added premium update for server ${serverId} (tier: ${tier || 'none'}, expires: ${expires})`);
    
    return true;
  } catch (error) {
    console.error('Error adding premium update:', error);
    return false;
  }
};

// Send webhook notification to Discord
export const sendWebhookNotification = async (message, embeds = [], username = 'Premium System') => {
  if (!UPDATE_WEBHOOK_URL) {
    console.warn('UPDATE_WEBHOOK_URL not set, skipping webhook notification');
    return false;
  }
  
  try {
    const response = await fetch(UPDATE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        content: message,
        embeds
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error sending webhook notification:', error);
    return false;
  }
};

// Handle Stripe webhook 
export const handleStripeWebhook = async (req, res) => {
  // Get the event
  let event;
  
  try {
    // Verify the signature if possible
    if (process.env.STRIPE_WEBHOOK_SECRET && req.headers['stripe-signature']) {
      const stripe = await import('stripe');
      const Stripe = stripe.default;
      const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
      
      try {
        event = stripeClient.webhooks.constructEvent(
          req.body, 
          req.headers['stripe-signature'], 
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
    } else {
      // If no signature verification is possible, just use the body
      event = req.body;
    }
    
    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Extract server ID and plan from metadata
        const serverId = paymentIntent.metadata?.guild_id || paymentIntent.metadata?.server_id;
        const plan = paymentIntent.metadata?.plan || 'basic';
        
        if (serverId) {
          // Add premium update
          await addPremiumUpdate(serverId, plan);
          
          // Send webhook notification
          const embedColor = plan === 'professional' ? 0xAA00FF : plan === 'standard' ? 0x5865F2 : 0x43B581;
          
          await sendWebhookNotification(
            `💰 New payment received for server ${serverId}!`,
            [{
              title: 'Premium Purchase',
              color: embedColor,
              fields: [
                { name: 'Server ID', value: serverId, inline: true },
                { name: 'Plan', value: plan.charAt(0).toUpperCase() + plan.slice(1), inline: true },
                { name: 'Amount', value: `$${(paymentIntent.amount / 100).toFixed(2)} USD`, inline: true }
              ],
              timestamp: new Date().toISOString()
            }]
          );
          
          console.log(`Payment successful for server ${serverId} (plan: ${plan})`);
        } else {
          console.warn('Payment succeeded but no server ID in metadata:', paymentIntent.id);
        }
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        break;
        
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
    
    // Return success
    res.status(200).json({received: true});
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).send('Webhook handler failed');
  }
};

// Handle payment success from frontend
export const handlePaymentSuccess = async (serverId, plan) => {
  try {
    if (!serverId) {
      throw new Error('Server ID is required');
    }
    
    // Add premium update
    const success = await addPremiumUpdate(serverId, plan || 'basic');
    
    if (success) {
      // Send webhook notification
      const embedColor = plan === 'professional' ? 0xAA00FF : plan === 'standard' ? 0x5865F2 : 0x43B581;
      
      await sendWebhookNotification(
        `💰 New premium activation for server ${serverId}!`,
        [{
          title: 'Premium Activated',
          color: embedColor,
          fields: [
            { name: 'Server ID', value: serverId, inline: true },
            { name: 'Plan', value: (plan || 'Basic').charAt(0).toUpperCase() + (plan || 'basic').slice(1), inline: true }
          ],
          timestamp: new Date().toISOString()
        }]
      );
      
      console.log(`Premium activated for server ${serverId} (plan: ${plan || 'basic'})`);
      
      return { success: true };
    } else {
      return { success: false, error: 'Failed to add premium update' };
    }
  } catch (error) {
    console.error('Error handling payment success:', error);
    return { success: false, error: error.message };
  }
};

// Handle payment cancellation
export const handlePaymentCancellation = async (serverId) => {
  try {
    if (!serverId) {
      throw new Error('Server ID is required');
    }
    
    // Add premium update with null tier to remove premium
    const success = await addPremiumUpdate(serverId, null, 0);
    
    if (success) {
      // Send webhook notification
      await sendWebhookNotification(
        `⚠️ Premium cancelled for server ${serverId}`,
        [{
          title: 'Premium Cancelled',
          color: 0xF04747,
          fields: [
            { name: 'Server ID', value: serverId, inline: true }
          ],
          timestamp: new Date().toISOString()
        }]
      );
      
      console.log(`Premium cancelled for server ${serverId}`);
      
      return { success: true };
    } else {
      return { success: false, error: 'Failed to cancel premium' };
    }
  } catch (error) {
    console.error('Error handling payment cancellation:', error);
    return { success: false, error: error.message };
  }
};