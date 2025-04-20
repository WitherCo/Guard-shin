import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  useEffect(() => {
    // Get payment_intent from URL
    const url = new URL(window.location.href);
    const paymentIntentId = url.searchParams.get('payment_intent');
    
    if (!paymentIntentId) {
      toast({
        title: "Error",
        description: "Payment verification failed. Missing payment information.",
        variant: "destructive",
      });
      setIsVerifying(false);
      return;
    }

    // Verify the payment with the server
    apiRequest('POST', '/api/verify-payment', { paymentIntentId })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          setVerificationSuccess(true);
          toast({
            title: "Payment Verified",
            description: "Your payment has been verified and your premium features are now active!",
          });
        } else {
          toast({
            title: "Verification Failed",
            description: data.message || "Could not verify your payment. Please contact support.",
            variant: "destructive",
          });
        }
      })
      .catch(error => {
        toast({
          title: "Verification Error",
          description: "An error occurred while verifying your payment. Please contact support.",
          variant: "destructive",
        });
        console.error("Payment verification error:", error);
      })
      .finally(() => {
        setIsVerifying(false);
      });
  }, [toast]);

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-card rounded-lg shadow-lg">
      <div className="text-center space-y-6">
        {isVerifying ? (
          <>
            <h1 className="text-2xl font-bold">Verifying Your Payment</h1>
            <div className="flex justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
            <p>Please wait while we verify your payment...</p>
          </>
        ) : verificationSuccess ? (
          <>
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Payment Successful!</h1>
            <p>
              Thank you for subscribing to Guard-shin Premium. Your account has been upgraded and all premium features are now available.
            </p>
            <div className="flex flex-col gap-4">
              <Button 
                onClick={() => setLocation('/dashboard')}
                className="w-full"
              >
                Go to Dashboard
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/support')}
                className="w-full"
              >
                Need Help?
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">Payment Verification Failed</h1>
            <p>
              We couldn't verify your payment. If you believe this is an error, please contact our support team.
            </p>
            <div className="flex flex-col gap-4">
              <Button 
                onClick={() => setLocation('/premium-subscription')}
                className="w-full"
              >
                Try Again
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setLocation('/support')}
                className="w-full"
              >
                Contact Support
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}