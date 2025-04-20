import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
// Temporarily removing protected routes to fix React hook issues
// import { ProtectedRoute } from "@/lib/protected-route";

// Import our new loading screen components
import { LoadingScreen } from "@/components/loading-screen";

import Dashboard from "@/pages/dashboard";
import AutoModeration from "@/pages/auto-moderation";
import RaidProtection from "@/pages/raid-protection";
import Infractions from "@/pages/infractions";
import Verification from "@/pages/verification";
import PrefixSettings from "@/pages/prefix-settings";
import WelcomeMessages from "@/pages/welcome-messages";
import PremiumSubscription from "@/pages/premium-subscription";
import AdvancedSettings from "@/pages/advanced-settings";
import Analytics from "@/pages/analytics";
import Logs from "@/pages/logs";
import Commands from "@/pages/commands";
import Documentation from "@/pages/documentation";
import ComingSoon from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import LoginPage from "@/pages/login";
import RegisterPage from "@/pages/register";
import TermsOfServicePage from "@/pages/terms-of-service";
import PrivacyPolicyPage from "@/pages/privacy-policy";
import RefundPolicyPage from "@/pages/refund-policy";
import GuidelinesPage from "@/pages/guidelines";
import ServerDashboard from "@/pages/server-dashboard";
import ContactPage from "@/pages/contact";
import ContactPublicPage from "@/pages/contact-public";
import AboutPage from "@/pages/about";
import ProfilePage from "@/pages/profile";
import ForgotPasswordPage from "@/pages/forgot-password";
import ResetPasswordPage from "@/pages/reset-password";
import WebhookPage from "@/pages/webhook";
import SupportPage from "@/pages/support";
import SlashCommandsPage from "@/pages/slash-commands";
import PremiumPage from "@/pages/premium";
import DiscordLoginPage from "@/pages/discord-login";
import DiscordSignupPage from "@/pages/discord-signup";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={AuthPage} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/dashboard/:serverId" component={ServerDashboard} />
      <Route path="/auto-moderation" component={AutoModeration} />
      <Route path="/raid-protection" component={RaidProtection} />
      <Route path="/infractions" component={Infractions} />
      <Route path="/verification" component={Verification} />
      <Route path="/welcome-messages" component={WelcomeMessages} />
      <Route path="/prefix-settings" component={PrefixSettings} />
      <Route path="/advanced-settings" component={AdvancedSettings} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/logs" component={Logs} />
      <Route path="/commands" component={Commands} />
      <Route path="/documentation" component={Documentation} />
      <Route path="/premium/:serverId" component={PremiumSubscription} />
      <Route path="/premium" component={PremiumPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/discord-login" component={DiscordLoginPage} />
      <Route path="/discord-signup" component={DiscordSignupPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/terms-of-service" component={TermsOfServicePage} />
      <Route path="/privacy-policy" component={PrivacyPolicyPage} />
      <Route path="/refund-policy" component={RefundPolicyPage} />
      <Route path="/guidelines" component={GuidelinesPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/contact-public" component={ContactPublicPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/webhook" component={WebhookPage} />
      <Route path="/support" component={SupportPage} />
      <Route path="/slash-commands" component={SlashCommandsPage} />
      <Route component={ComingSoon} />
    </Switch>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulate initial loading for the app
  useEffect(() => {
    // Show loading screen for at least 2.5 seconds for a better UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {isLoading ? (
          <LoadingScreen 
            onComplete={() => setIsLoading(false)}
          />
        ) : (
          <>
            <Router />
            <Toaster />
          </>
        )}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;