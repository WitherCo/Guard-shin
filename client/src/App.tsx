import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ToastProvider } from "@/components/ui/use-toast";
// Temporarily removing protected routes to fix React hook issues
// import { ProtectedRoute } from "@/lib/protected-route";

// Import our loading screen component
import { LoadingScreen } from "@/components/loading-screen";

// Import the pages we've created
import Commands from "@/pages/commands";
import Documentation from "@/pages/documentation";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import PremiumSubscription from "@/pages/premium-subscription";
import Checkout from "@/pages/checkout";
import PaymentSuccess from "@/pages/payment-success";

// Use NotFound for pages we haven't created yet
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={NotFound} />
      <Route path="/commands" component={Commands} />
      <Route path="/documentation" component={Documentation} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/premium" component={PremiumSubscription} />
      <Route path="/premium/:serverId" component={PremiumSubscription} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/terms-of-service" component={NotFound} />
      <Route path="/privacy-policy" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          {isLoading ? (
            <LoadingScreen onComplete={() => setIsLoading(false)} />
          ) : (
            <>
              <Router />
              <Toaster />
            </>
          )}
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;