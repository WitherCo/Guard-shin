import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const PaymentSuccess = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paymentInfo, setPaymentInfo] = useState(null);
  
  // Get query parameters
  const params = new URLSearchParams(window.location.search);
  const paymentIntent = params.get('payment_intent');
  const paymentType = params.get('type') || 'payment';
  const planType = params.get('plan') || 'premium';
  
  useEffect(() => {
    const verifyPayment = async () => {
      if (!paymentIntent) {
        setError('No payment information found');
        setLoading(false);
        return;
      }
      
      try {
        const endpoint = paymentType === 'subscription'
          ? '/api/verify-subscription'
          : '/api/verify-payment';
          
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            paymentIntent,
            planType: paymentType === 'subscription' ? planType : undefined
          }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to verify payment');
        }
        
        const data = await response.json();
        setPaymentInfo(data);
      } catch (err) {
        console.error('Error verifying payment:', err);
        setError('There was an issue confirming your payment. Please contact support.');
      } finally {
        setLoading(false);
      }
    };
    
    verifyPayment();
  }, [paymentIntent, paymentType, planType]);
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded mb-4 max-w-lg mx-auto mt-10">
        <h2 className="text-xl font-bold mb-2">Payment Error</h2>
        <p>{error}</p>
        <div className="mt-4">
          <Link to="/premium" className="text-blue-600 hover:text-blue-800">
            ← Return to Premium Page
          </Link>
        </div>
      </div>
    );
  }
  
  const isSubscription = paymentType === 'subscription';
  
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-w-lg mx-auto mt-10 p-8 text-white">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">Payment Successful!</h2>
      </div>
      
      <div className="space-y-4 mb-8">
        {isSubscription ? (
          <>
            <p className="text-center">
              Thank you for subscribing to Guard-shin {planType === 'premium' ? 'Premium' : 'Enterprise'}!
            </p>
            <p className="text-center">
              Your subscription is now active and all premium features are available for your Discord server.
            </p>
          </>
        ) : (
          <>
            <p className="text-center">
              Thank you for your payment! 
            </p>
            <p className="text-center">
              Your premium features have been activated.
            </p>
          </>
        )}
        
        {paymentInfo && paymentInfo.transactionId && (
          <div className="bg-gray-700 p-4 rounded text-sm">
            <p><span className="text-gray-400">Transaction ID:</span> {paymentInfo.transactionId}</p>
            {paymentInfo.date && (
              <p><span className="text-gray-400">Date:</span> {new Date(paymentInfo.date).toLocaleString()}</p>
            )}
          </div>
        )}
      </div>
      
      <div className="flex flex-col space-y-3">
        <Link to="/dashboard" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-center transition-colors">
          Go to Dashboard
        </Link>
        <Link to="/support" className="text-blue-400 hover:text-blue-300 text-center">
          Need help? Contact support
        </Link>
      </div>
    </div>
  );
};

export default PaymentSuccess;