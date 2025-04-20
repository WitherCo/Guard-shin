import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

// Mock subscription plans - in a real app, fetch these from the server
const subscriptionPlans = [
  {
    id: "premium_monthly",
    name: "Premium",
    price: 4.99,
    period: "month",
    description: "Access to all premium features",
    features: [
      "Custom Welcome Images",
      "Advanced Verification",
      "Auto-Response System",
      "Advanced Raid Protection",
      "Custom Commands",
      "Premium Support"
    ]
  },
  {
    id: "premium_plus_monthly",
    name: "Premium Plus",
    price: 9.99,
    period: "month",
    description: "Ultimate protection and customization",
    features: [
      "All Premium Features",
      "Advanced Analytics",
      "Multi-Server Management",
      "Priority Support",
      "Custom Bot Branding",
      "Exclusive Discord Role"
    ]
  },
  {
    id: "lifetime_premium",
    name: "Lifetime Premium",
    price: 149.99,
    period: "one-time",
    description: "Premium forever with one payment",
    features: [
      "All Premium Features",
      "Never Pay Again",
      "Free Updates",
      "Premium Support"
    ]
  },
  {
    id: "lifetime_premium_plus",
    name: "Lifetime Premium Plus",
    price: 249.99,
    period: "one-time",
    description: "All Premium Plus features forever",
    features: [
      "All Premium Plus Features",
      "Never Pay Again",
      "Free Updates",
      "Priority Support",
      "Early Access to New Features"
    ]
  }
];

export default function PremiumSubscription() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>("premium_monthly");
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("stripe");
  
  // Handle subscription purchase
  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase a subscription",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }
    
    setIsLoading(true);
    
    // In a real implementation, this would redirect to Stripe checkout or handle the payment
    setTimeout(() => {
      toast({
        title: "Redirecting to payment",
        description: "You will be redirected to complete your payment",
      });
      
      // Simulate different payment providers
      if (paymentMethod === "stripe") {
        window.location.href = "/api/create-checkout-session";
      } else if (paymentMethod === "paypal") {
        window.location.href = "/api/paypal/create-order";
      } else if (paymentMethod === "cashapp") {
        // Show CashApp payment info
        toast({
          title: "CashApp Payment",
          description: "Please send payment to $kingsweets2004 with your Discord ID in the notes",
        });
      }
      
      setIsLoading(false);
    }, 1500);
  };
  
  const selectedPlanData = subscriptionPlans.find(plan => plan.id === selectedPlan);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Upgrade to Premium</h1>
          <p className="text-muted-foreground mt-2">
            Select a plan to unlock advanced features for your Discord server.
          </p>
        </div>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Plan</CardTitle>
              <CardDescription>
                Select the plan that best fits your server's needs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={selectedPlan} 
                onValueChange={setSelectedPlan}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {subscriptionPlans.map((plan) => (
                  <div key={plan.id} className="relative">
                    <RadioGroupItem
                      value={plan.id}
                      id={plan.id}
                      className="sr-only"
                    />
                    <Label
                      htmlFor={plan.id}
                      className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer ${
                        selectedPlan === plan.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-lg">{plan.name}</div>
                          <div className="text-muted-foreground text-sm">{plan.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">${plan.price}</div>
                          <div className="text-xs text-muted-foreground">{plan.period === 'month' ? 'per month' : 'one time'}</div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="text-sm font-medium mb-2">Features:</div>
                        <ul className="text-sm space-y-1 text-muted-foreground">
                          {plan.features.map((feature, index) => (
                            <li key={index} className="flex items-center">
                              <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className="h-4 w-4 text-primary mr-2" 
                                viewBox="0 0 20 20" 
                                fill="currentColor"
                              >
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
              <CardDescription>
                Select how you would like to pay
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                <div className="relative">
                  <RadioGroupItem
                    value="stripe"
                    id="stripe"
                    className="sr-only"
                  />
                  <Label
                    htmlFor="stripe"
                    className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer ${
                      paymentMethod === 'stripe' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                    }`}
                  >
                    <div className="flex items-center justify-center h-10">
                      <svg viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg" width="60" height="25" className="UserLogo variant-- "><title>Stripe logo</title><path fill="#635BFF" d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.3-7.52 6.3-7.52 3.7 0 5.88 2.93 5.88 7.5 0 .4-.04 1.26-.04 1.48zm-8.06-2.94h4.82c0-1.67-.77-2.9-2.3-2.9-1.4 0-2.33 1.06-2.52 2.9zm-9.18 8.9h-4.8V9.66h4.8v10.59zm-2.4-14.53a2.35 2.35 0 0 1-2.38-2.35c0-1.29 1.1-2.35 2.38-2.35a2.35 2.35 0 0 1 0 4.7zM33.88 20.25h-4.78V.80h4.78v19.45zM22.95 20.25h-4.75l-3.5-10.59h4.81l1.67 6.03 1.7-6.03h4.74l-4.67 10.59zm-12.1-4.55a2.24 2.24 0 0 0 1.98 1.23c.87 0 1.37-.43 1.37-1.1 0-.75-.62-1.23-1.68-1.52-2.23-.64-4.3-1.5-4.3-4.45 0-2.95 2.37-4.51 5.16-4.51 2.05 0 3.77.89 4.75 2.63l-2.87 1.7c-.44-.8-.98-1.23-1.88-1.23-.76 0-1.3.39-1.3.98 0 .72.65 1.21 1.76 1.5 2.57.71 4.25 1.77 4.25 4.4 0 2.48-1.89 4.68-5.35 4.68-2.54 0-4.4-.94-5.48-2.83l2.59-1.48z"></path></svg>
                    </div>
                    <div className="text-center mt-2 text-xs">Credit/Debit Card</div>
                  </Label>
                </div>
                
                <div className="relative">
                  <RadioGroupItem
                    value="paypal"
                    id="paypal"
                    className="sr-only"
                  />
                  <Label
                    htmlFor="paypal"
                    className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer ${
                      paymentMethod === 'paypal' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                    }`}
                  >
                    <div className="flex items-center justify-center h-10">
                      <svg xmlns="http://www.w3.org/2000/svg" width="60" height="18" viewBox="0 0 124 33"><path fill="#253B80" d="M46.211 6.749h-6.839a.95.95 0 0 0-.939.802l-2.766 17.537a.57.57 0 0 0 .564.658h3.265a.95.95 0 0 0 .939-.803l.746-4.73a.95.95 0 0 1 .938-.803h2.165c4.505 0 7.105-2.18 7.784-6.5.306-1.89.013-3.375-.872-4.415-.97-1.142-2.694-1.746-4.985-1.746zM47 13.154c-.374 2.454-2.249 2.454-4.062 2.454h-1.032l.724-4.583a.57.57 0 0 1 .563-.481h.473c1.235 0 2.4 0 3.002.704.359.42.469 1.044.332 1.906zM66.654 13.075h-3.275a.57.57 0 0 0-.563.481l-.145.916-.229-.332c-.709-1.029-2.29-1.373-3.868-1.373-3.619 0-6.71 2.741-7.312 6.586-.313 1.918.132 3.752 1.22 5.031.998 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .562.66h2.95a.95.95 0 0 0 .939-.803l1.77-11.209a.568.568 0 0 0-.561-.658zm-4.565 6.374c-.316 1.871-1.801 3.127-3.695 3.127-.951 0-1.711-.305-2.199-.883-.484-.574-.668-1.391-.514-2.301.295-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.499.589.697 1.411.554 2.317zM84.096 13.075h-3.291a.954.954 0 0 0-.787.417l-4.539 6.686-1.924-6.425a.953.953 0 0 0-.912-.678h-3.234a.57.57 0 0 0-.541.754l3.625 10.638-3.408 4.811a.57.57 0 0 0 .465.9h3.287a.949.949 0 0 0 .781-.408l10.946-15.8a.57.57 0 0 0-.468-.895z"/><path fill="#179BD7" d="M94.992 6.749h-6.84a.95.95 0 0 0-.938.802l-2.766 17.537a.569.569 0 0 0 .562.658h3.51a.665.665 0 0 0 .656-.562l.785-4.971a.95.95 0 0 1 .938-.803h2.164c4.506 0 7.105-2.18 7.785-6.5.307-1.89.012-3.375-.873-4.415-.971-1.142-2.694-1.746-4.983-1.746zm.789 6.405c-.373 2.454-2.248 2.454-4.062 2.454h-1.031l.725-4.583a.568.568 0 0 1 .562-.481h.473c1.234 0 2.4 0 3.002.704.359.42.468 1.044.331 1.906zM115.434 13.075h-3.273a.567.567 0 0 0-.562.481l-.145.916-.23-.332c-.709-1.029-2.289-1.373-3.867-1.373-3.619 0-6.709 2.741-7.311 6.586-.312 1.918.131 3.752 1.219 5.031 1 1.176 2.426 1.666 4.125 1.666 2.916 0 4.533-1.875 4.533-1.875l-.146.91a.57.57 0 0 0 .564.66h2.949a.95.95 0 0 0 .938-.803l1.771-11.209a.571.571 0 0 0-.565-.658zm-4.565 6.374c-.314 1.871-1.801 3.127-3.695 3.127-.949 0-1.711-.305-2.199-.883-.484-.574-.666-1.391-.514-2.301.297-1.855 1.805-3.152 3.67-3.152.93 0 1.686.309 2.184.892.501.589.699 1.411.554 2.317zM119.295 7.23l-2.807 17.858a.569.569 0 0 0 .562.658h2.822c.469 0 .867-.34.939-.803l2.768-17.536a.57.57 0 0 0-.562-.659h-3.16a.571.571 0 0 0-.562.482z"/><path fill="#253B80" d="M7.266 29.154l.523-3.322-1.165-.027H1.061L4.927 1.292a.316.316 0 0 1 .314-.268h9.38c3.114 0 5.263.648 6.385 1.927.526.6.861 1.227 1.023 1.917.17.724.173 1.589.007 2.644l-.012.077v.676l.526.298a3.69 3.69 0 0 1 1.065.812c.45.513.741 1.165.864 1.938.127.795.085 1.741-.123 2.812-.24 1.232-.628 2.305-1.152 3.183a6.547 6.547 0 0 1-1.825 2c-.696.494-1.523.869-2.458 1.109-.906.236-1.939.355-3.072.355h-.73c-.522 0-1.029.188-1.427.525a2.21 2.21 0 0 0-.744 1.328l-.055.299-.924 5.855-.042.215c-.011.068-.03.102-.058.125a.155.155 0 0 1-.096.035H7.266z"/><path fill="#179BD7" d="M23.048 7.667c-.028.179-.06.362-.096.55-1.237 6.351-5.469 8.545-10.874 8.545H9.326c-.661 0-1.218.48-1.321 1.132L6.596 26.83l-.399 2.533a.704.704 0 0 0 .695.814h4.881c.578 0 1.069-.42 1.16-.99l.048-.248.919-5.832.059-.32c.09-.572.582-.992 1.16-.992h.73c4.729 0 8.431-1.92 9.513-7.476.452-2.321.218-4.259-.978-5.622a4.667 4.667 0 0 0-1.336-1.03z"/><path fill="#222D65" d="M21.754 7.151a9.757 9.757 0 0 0-1.203-.267 15.284 15.284 0 0 0-2.426-.177h-7.352a1.172 1.172 0 0 0-1.159.992L8.05 17.605l-.045.289a1.336 1.336 0 0 1 1.321-1.132h2.752c5.405 0 9.637-2.195 10.874-8.545.037-.188.068-.371.096-.55a6.594 6.594 0 0 0-1.017-.429 9.045 9.045 0 0 0-.277-.087z"/><path fill="#253B80" d="M9.614 7.699a1.169 1.169 0 0 1 1.159-.991h7.352c.871 0 1.684.057 2.426.177a9.757 9.757 0 0 1 1.481.353c.365.121.704.264 1.017.429.368-2.347-.003-3.945-1.272-5.392C20.378.682 17.853 0 14.622 0h-9.38c-.66 0-1.223.48-1.325 1.133L.01 25.898a.806.806 0 0 0 .795.932h5.791l1.454-9.225 1.564-9.906z"/></svg>
                    </div>
                    <div className="text-center mt-2 text-xs">PayPal</div>
                  </Label>
                </div>
                
                <div className="relative">
                  <RadioGroupItem
                    value="cashapp"
                    id="cashapp"
                    className="sr-only"
                  />
                  <Label
                    htmlFor="cashapp"
                    className={`flex flex-col p-4 rounded-lg border-2 cursor-pointer ${
                      paymentMethod === 'cashapp' 
                        ? 'border-primary bg-primary/5' 
                        : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                    }`}
                  >
                    <div className="flex items-center justify-center h-10">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="60"><path d="M52.6 16.35c.7.65.7 1.75 0 2.45l-7.1 7.05c-.65.7-1.8.7-2.45 0l-7.1-7.05c-.7-.7-.7-1.8 0-2.45l7.1-7.1c.65-.65 1.75-.65 2.45 0zm-3.1 33.4c-4.7-4.7-12.25-4.65-16.9 0-4.65 4.7-4.7 12.25 0 16.95 1.4 1.35 2.95 2.3 4.7 2.8.4.15.8.25 1.25.35.45.1.9.25 1.35.35.15 0 .3.05.45.05.25 0 .5.05.8.05l1.2-.05c.3 0 .55-.05.85-.1l.75-.1c.15 0 .3-.05.45-.1.25-.05.45-.1.7-.2.2-.05.45-.15.65-.2.75-.3 1.45-.65 2.15-1.05l10.45 10.45c.95.95 2.45.95 3.35 0 .95-.9.95-2.4 0-3.35l-7.35-7.35-7.6-7.6c-.85-.85-.85-2.25 0-3.1.85-.85 2.25-.85 3.1 0l14.1 14.1c.95.95 2.45.95 3.35 0 .95-.9.95-2.4 0-3.35zM96 48c0 26.5-21.5 48-48 48S0 74.5 0 48 21.5 0 48 0s48 21.5 48 48z" fill="#00d632"/></svg>
                    </div>
                    <div className="text-center mt-2 text-xs">CashApp</div>
                  </Label>
                </div>
              </RadioGroup>
              
              {paymentMethod === 'cashapp' && (
                <div className="mt-4 p-4 border rounded-lg bg-muted">
                  <p className="text-sm font-medium">CashApp Payment Instructions:</p>
                  <ol className="text-sm mt-2 space-y-2 text-muted-foreground">
                    <li>1. Send payment to <span className="font-medium">$kingsweets2004</span></li>
                    <li>2. Include your Discord ID in the payment notes</li>
                    <li>3. Complete payment for the selected plan ({selectedPlanData?.name}: ${selectedPlanData?.price})</li>
                    <li>4. Once payment is verified, premium will be activated on your account</li>
                  </ol>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="font-medium">{selectedPlanData?.name}</span>
                  <span>${selectedPlanData?.price}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Payment method</span>
                  <span className="capitalize">{paymentMethod}</span>
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>${selectedPlanData?.price}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {selectedPlanData?.period === 'month' ? 'Recurring monthly payment' : 'One-time payment'}
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg" 
                onClick={handleSubscribe}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : `Subscribe for $${selectedPlanData?.price}`}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}