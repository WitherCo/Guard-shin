import { Request, Response, Express } from 'express';
import Stripe from 'stripe';

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Helper function to create a payment intent
export async function createPaymentIntent(amount: number, metadata: Record<string, string>) {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'usd',
    metadata
  });
}

// Helper function to handle subscription management
export async function getOrCreateSubscription(customerId: string, priceId: string) {
  try {
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{
        price: priceId,
      }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    return {
      subscriptionId: subscription.id,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

// Register Stripe routes
export function registerStripeRoutes(app: Express) {
  // Create payment intent endpoint
  app.post('/api/create-payment-intent', async (req: Request, res: Response) => {
    try {
      const { amount, metadata = {} } = req.body;
      
      // Validate amount
      if (!amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: { message: 'Valid amount is required' } });
      }
      
      // Create a PaymentIntent
      const paymentIntent = await createPaymentIntent(amount, metadata);
      
      // Return the client secret
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: { message: error.message } });
    }
  });
  
  // Get or create subscription endpoint
  app.post('/api/get-or-create-subscription', async (req: Request, res: Response) => {
    try {
      // This would check if the user is authenticated in a real app
      if (!req.body.customerId) {
        return res.status(401).json({ error: { message: 'User not authenticated' } });
      }
      
      const { customerId, priceId } = req.body;
      
      if (!customerId || !priceId) {
        return res.status(400).json({ error: { message: 'customerId and priceId are required' } });
      }
      
      const result = await getOrCreateSubscription(customerId, priceId);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ error: { message: error.message } });
    }
  });
  
  // Create customer and setup intent for future payments
  app.post('/api/create-customer', async (req: Request, res: Response) => {
    try {
      const { email, name } = req.body;
      
      if (!email) {
        return res.status(400).json({ error: { message: 'Email is required' } });
      }
      
      // Create a customer
      const customer = await stripe.customers.create({
        email,
        name: name || email,
      });
      
      // Create a SetupIntent
      const setupIntent = await stripe.setupIntents.create({
        customer: customer.id,
      });
      
      res.json({
        customerId: customer.id,
        clientSecret: setupIntent.client_secret,
      });
    } catch (error: any) {
      console.error('Error creating customer:', error);
      res.status(500).json({ error: { message: error.message } });
    }
  });
  
  // Setup webhook endpoint (This should use raw body parser middleware)
  app.post('/api/webhook', async (req: Request, res: Response) => {
    let event;
    
    try {
      const sig = req.headers['stripe-signature'];
      
      try {
        // This assumes you have the raw body available
        // You'll need to use express.raw({ type: 'application/json' }) for this route
        event = stripe.webhooks.constructEvent(
          req.body, 
          sig as string, 
          process.env.STRIPE_WEBHOOK_SECRET as string
        );
      } catch (err: any) {
        console.error('⚠️ Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      
      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
          // Handle successful payment
          break;
        case 'payment_method.attached':
          const paymentMethod = event.data.object;
          console.log('PaymentMethod was attached to a Customer!');
          // Handle payment method attachment
          break;
        // Handle other event types as needed
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      // Return a 200 response to acknowledge receipt of the event
      res.json({ received: true });
    } catch (error: any) {
      console.error('Error handling webhook:', error);
      res.status(500).json({ error: { message: error.message } });
    }
  });
}