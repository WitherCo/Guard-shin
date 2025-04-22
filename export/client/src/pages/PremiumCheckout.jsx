import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Checkout from '../components/Checkout';

const PremiumCheckout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentMethod, setPaymentMethod] = useState('stripe');
  
  // Get plan from query parameters or default to 'premium'
  const searchParams = new URLSearchParams(location.search);
  const plan = searchParams.get('plan') || 'premium';
  const planTitle = plan === 'premium' ? 'Premium' : 'Enterprise';
  const planAmount = plan === 'premium' ? 9.99 : 24.99;
  
  const handleSuccess = () => {
    // This won't actually be called directly since Stripe redirects
    // to the return_url specified in the Checkout component
    navigate('/payment-success');
  };
  
  const handleError = (error) => {
    console.error('Payment error:', error);
    // We could show a more detailed error message here
  };
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-8 text-white">
        Complete Your {planTitle} Subscription
      </h1>
      
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Plan summary */}
          <div className="md:w-1/3">
            <h2 className="text-xl font-semibold mb-4 text-white">{planTitle} Plan</h2>
            <div className="bg-gray-700 p-4 rounded mb-4">
              <div className="text-2xl font-bold text-white">${planAmount}<span className="text-sm text-gray-300">/month</span></div>
              <ul className="mt-4 space-y-2 text-sm text-gray-300">
                {plan === 'premium' ? (
                  <>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      All Free features
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Auto-role assignment
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Advanced logging
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Reaction roles
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Custom commands
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      All Premium features
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Customizable bot appearance
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Custom development hours
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      AI-powered moderation
                    </li>
                    <li className="flex items-start">
                      <svg className="h-5 w-5 text-green-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      VIP support 24/7
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
          
          {/* Payment options */}
          <div className="md:w-2/3">
            <h2 className="text-xl font-semibold mb-4 text-white">Select Payment Method</h2>
            
            <div className="flex flex-wrap gap-3 mb-6">
              <button 
                className={`flex items-center px-4 py-2 rounded ${paymentMethod === 'stripe' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => setPaymentMethod('stripe')}
              >
                <span className="mr-2">Credit Card</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </button>
              
              <button 
                className={`flex items-center px-4 py-2 rounded ${paymentMethod === 'paypal' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => setPaymentMethod('paypal')}
              >
                <span className="mr-2">PayPal</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 3.72a.641.641 0 0 1 .632-.544h4.605c.026 0 .077.154.077.154-.413.166-4.995 19.8-4.995 19.8-.103.412-.187.283-.187.208zm7.425 0h-4.607a.641.641 0 0 1-.631-.74L12.369 3.72A.641.641 0 0 1 13 3.175h4.607c.378 0 .548.311.47.74l-3.106 16.875a.641.641 0 0 1-.632.547h-.838zm7.029 0h-4.605a.641.641 0 0 1-.632-.74L19.4 3.72a.641.641 0 0 1 .631-.544h4.606c.378 0 .549.311.47.74l-3.106 16.875a.641.641 0 0 1-.631.547h-.84z"/>
                </svg>
              </button>
              
              <button 
                className={`flex items-center px-4 py-2 rounded ${paymentMethod === 'cashapp' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                onClick={() => setPaymentMethod('cashapp')}
              >
                <span className="mr-2">CashApp</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.59 3.475a5.294 5.294 0 0 0-3.039-1.962 5.307 5.307 0 0 0-1.554-.229c-1.423 0-2.587.476-3.48 1.422-.195.209-.378.43-.546.665-.365-.87-.9-1.554-1.604-2.033-.704-.475-1.517-.713-2.433-.713-.462 0-.914.063-1.352.194a5.29 5.29 0 0 0-3.621 3.351c-.118.355-.206.735-.26 1.132-.18 1.353.046 2.52.67 3.496.304.47.673.876 1.108 1.209-.462.511-.823 1.096-1.083 1.746-.355.89-.474 1.89-.355 2.999.119 1.112.476 2.048 1.065 2.798.705.875 1.649 1.422 2.817 1.613.445.075.9.115 1.353.115 1.125 0 2.14-.33 3.027-.989.304.165.624.304.965.422C15.1 19.42 16.177 19.745 17.34 19.745c.543 0 1.094-.059 1.645-.17a5.304 5.304 0 0 0 3.306-2.06 5.303 5.303 0 0 0 1.109-3.728 5.287 5.287 0 0 0-1.88-3.557 7.702 7.702 0 0 0 1.508-1.302c.89-1.021 1.339-2.283 1.339-3.775 0-.57-.091-1.126-.266-1.678h-.002z"/>
                </svg>
              </button>
            </div>
            
            {/* Conditional payment form based on selected method */}
            {paymentMethod === 'stripe' && (
              <Checkout 
                amount={planAmount} 
                mode="subscription"
                planType={plan}
                onSuccess={handleSuccess} 
                onError={handleError} 
              />
            )}
            
            {paymentMethod === 'paypal' && (
              <div className="bg-blue-900 p-6 rounded text-white text-center">
                <h3 className="text-lg font-semibold mb-4">PayPal Payment</h3>
                <p className="mb-4">You'll be redirected to PayPal to complete your payment.</p>
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors">
                  Pay with PayPal
                </button>
                <p className="text-sm mt-4 text-blue-300">
                  Note: This is a placeholder. PayPal integration requires additional setup.
                </p>
              </div>
            )}
            
            {paymentMethod === 'cashapp' && (
              <div className="bg-green-900 p-6 rounded text-white text-center">
                <h3 className="text-lg font-semibold mb-4">CashApp Payment</h3>
                <p className="mb-4">Scan this QR code or send payment to $GuardShin</p>
                <div className="bg-white p-4 w-48 h-48 mx-auto mb-4 flex items-center justify-center">
                  <p className="text-black font-bold">QR Placeholder</p>
                </div>
                <p className="text-sm text-green-300">
                  After payment, please enter your Discord username and transaction ID to activate your premium features.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-center mt-6">
        <Link to="/premium" className="text-blue-400 hover:text-blue-300">
          ← Return to Premium Page
        </Link>
      </div>
    </div>
  );
};

export default PremiumCheckout;