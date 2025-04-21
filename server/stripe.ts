import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Stripe with the secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error("Error: STRIPE_SECRET_KEY is not set in the environment variables.");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16"
});

/**
 * Create a payment intent for one-time payments
 */
export async function createPaymentIntent(amount: number, metadata: Record<string, string> = {}) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata,
    });
    
    return {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id
    };
  } catch (error: any) {
    console.error('Error creating payment intent:', error.message);
    throw new Error(`Payment intent creation failed: ${error.message}`);
  }
}

/**
 * Create a subscription checkout session
 */
export async function createSubscriptionSession(priceId: string, metadata: Record<string, string> = {}) {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.PUBLIC_URL || 'http://localhost:5000'}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_URL || 'http://localhost:5000'}`,
      metadata,
    });
    
    return {
      sessionId: session.id,
      url: session.url
    };
  } catch (error: any) {
    console.error('Error creating subscription session:', error.message);
    throw new Error(`Subscription session creation failed: ${error.message}`);
  }
}

/**
 * Create a one-time payment checkout session
 */
export async function createCheckoutSession(amount: number, productName: string, metadata: Record<string, string> = {}) {
  try {
    // Round to 2 decimal places and convert to cents
    const unitAmount = Math.round(amount * 100);
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.PUBLIC_URL || 'http://localhost:5000'}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_URL || 'http://localhost:5000'}`,
      metadata,
    });
    
    return {
      sessionId: session.id,
      url: session.url
    };
  } catch (error: any) {
    console.error('Error creating checkout session:', error.message);
    throw new Error(`Checkout session creation failed: ${error.message}`);
  }
}

/**
 * Retrieve a checkout session
 */
export async function retrieveSession(sessionId: string) {
  try {
    return await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error: any) {
    console.error('Error retrieving session:', error.message);
    throw new Error(`Session retrieval failed: ${error.message}`);
  }
}

/**
 * Create or retrieve customer
 */
export async function getOrCreateCustomer(email: string, metadata: Record<string, string> = {}) {
  try {
    // Check if customer exists
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });
    
    if (customers.data.length > 0) {
      // Update existing customer with new metadata
      const customer = customers.data[0];
      
      // Only update if there's new metadata
      if (Object.keys(metadata).length > 0) {
        const updatedCustomer = await stripe.customers.update(customer.id, {
          metadata: { ...customer.metadata, ...metadata },
        });
        return updatedCustomer;
      }
      
      return customer;
    }
    
    // Create new customer
    return await stripe.customers.create({
      email,
      metadata,
    });
  } catch (error: any) {
    console.error('Error getting or creating customer:', error.message);
    throw new Error(`Customer operation failed: ${error.message}`);
  }
}

/**
 * Get or create a subscription for a customer
 */
export async function getOrCreateSubscription(customerId: string, priceId: string, metadata: Record<string, string> = {}) {
  try {
    // Check if the customer already has a subscription for this price
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      price: priceId,
      status: 'active',
      limit: 1,
    });
    
    if (subscriptions.data.length > 0) {
      // Customer already has an active subscription
      return {
        subscriptionId: subscriptions.data[0].id,
        clientSecret: null, // No client secret for existing subscription
      };
    }
    
    // Create a new subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
      metadata,
    });
    
    // @ts-ignore - The types don't include expanded fields
    const clientSecret = subscription.latest_invoice?.payment_intent?.client_secret;
    
    return {
      subscriptionId: subscription.id,
      clientSecret,
    };
  } catch (error: any) {
    console.error('Error getting or creating subscription:', error.message);
    throw new Error(`Subscription operation failed: ${error.message}`);
  }
}

export default stripe;