import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Load Stripe outside of component so it's only created once
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Payment processing component
const CheckoutForm = ({ onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      if (onError) onError(error);
    } else {
      if (onSuccess) onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="mb-4">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={!stripe || loading}
        className={`w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
};

// Subscription payment form
const SubscriptionForm = ({ onSuccess, onError, planType }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubscribe = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setErrorMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment-success?type=subscription&plan=${planType}`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      if (onError) onError(error);
    } else {
      if (onSuccess) onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubscribe} className="payment-form">
      <div className="mb-4">
        <PaymentElement />
      </div>
      
      {errorMessage && (
        <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}
      
      <button 
        type="submit" 
        disabled={!stripe || loading}
        className={`w-full py-2 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {loading ? 'Processing...' : 'Subscribe Now'}
      </button>
    </form>
  );
};

// Main checkout wrapper
const Checkout = ({ 
  amount, 
  onSuccess, 
  onError, 
  mode = 'payment', 
  planType = 'premium' 
}) => {
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPaymentIntent = async () => {
      try {
        setLoading(true);
        
        const endpoint = mode === 'subscription'
          ? '/api/create-subscription'
          : '/api/create-payment-intent';
        
        const requestBody = mode === 'subscription'
          ? { priceId: planType === 'premium' ? 'price_premium' : 'price_enterprise' }
          : { amount };
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        
        if (!response.ok) {
          throw new Error('Failed to create payment intent');
        }
        
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error('Error creating payment intent:', err);
        setError('Failed to initialize payment. Please try again.');
        if (onError) onError(err);
      } finally {
        setLoading(false);
      }
    };

    if (mode === 'payment' && !amount) {
      setError('Payment amount is required');
      setLoading(false);
      return;
    }

    fetchPaymentIntent();
  }, [amount, mode, planType, onError]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="checkout-container">
      {clientSecret && (
        <Elements 
          stripe={stripePromise} 
          options={{ clientSecret, appearance: { theme: 'night' } }}
        >
          {mode === 'subscription' ? (
            <SubscriptionForm 
              onSuccess={onSuccess} 
              onError={onError} 
              planType={planType}
            />
          ) : (
            <CheckoutForm 
              onSuccess={onSuccess} 
              onError={onError}
            />
          )}
        </Elements>
      )}
    </div>
  );
};

export default Checkout;