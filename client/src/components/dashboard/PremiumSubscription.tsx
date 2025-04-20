import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, CreditCard, Shield, Award, Zap, Lock, User, AlertCircle } from 'lucide-react';
import { PAYMENT_INFO } from '@shared/premium';
import { SubscriptionTier } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import { usePremiumStatus } from '@/hooks/use-discord';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PremiumFeature {
  name: string;
  description: string;
  free: boolean;
  premium: boolean;
  premiumPlus: boolean;
  lifetimePremium: boolean;
  lifetimePremiumPlus: boolean;
}

interface PlanProps {
  name: string;
  price: string;
  description: string;
  features: PremiumFeature[];
  popular?: boolean;
  serverId: string;
  tier: SubscriptionTier;
}

const features: PremiumFeature[] = [
  {
    name: 'Basic Commands',
    description: 'Moderation, utility, and help commands',
    free: true,
    premium: true,
    premiumPlus: true,
    lifetimePremium: true,
    lifetimePremiumPlus: true,
  },
  {
    name: 'Auto-Mod',
    description: 'Basic auto-moderation capabilities',
    free: true,
    premium: true,
    premiumPlus: true,
    lifetimePremium: true,
    lifetimePremiumPlus: true,
  },
  {
    name: 'Anti-Alt',
    description: 'Detect and take action on alternate accounts',
    free: false,
    premium: true,
    premiumPlus: true,
    lifetimePremium: true,
    lifetimePremiumPlus: true,
  },
  {
    name: 'Custom Commands',
    description: 'Create custom commands for your server',
    free: false,
    premium: true,
    premiumPlus: true,
    lifetimePremium: true,
    lifetimePremiumPlus: true,
  },
  {
    name: 'Advanced Auto-Mod',
    description: 'AI-powered content scanning and filtering',
    free: false,
    premium: false,
    premiumPlus: true,
    lifetimePremium: false,
    lifetimePremiumPlus: true,
  },
  {
    name: 'Raid Protection+',
    description: 'Enhanced raid detection and prevention',
    free: false,
    premium: false,
    premiumPlus: true,
    lifetimePremium: false,
    lifetimePremiumPlus: true,
  },
  {
    name: 'Verification+',
    description: 'Advanced CAPTCHA and verification methods',
    free: false,
    premium: false,
    premiumPlus: true,
    lifetimePremium: false,
    lifetimePremiumPlus: true,
  },
  {
    name: 'Full Logs',
    description: 'Complete server activity logs and analytics',
    free: false,
    premium: false,
    premiumPlus: true,
    lifetimePremium: false,
    lifetimePremiumPlus: true,
  },
];

const PlanCard: React.FC<PlanProps> = ({ 
  name, 
  price, 
  description, 
  features, 
  popular, 
  serverId,
  tier
}) => {
  const { user } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [currentPrice, setCurrentPrice] = useState(price);
  
  // Update displayed price when billing cycle changes
  useEffect(() => {
    if (price === 'Free') return;
    
    // Skip billing cycle updates for lifetime plans
    if (tier === SubscriptionTier.LIFETIME_PREMIUM || tier === SubscriptionTier.LIFETIME_PREMIUM_PLUS) {
      return;
    }
    
    if (billingCycle === 'yearly') {
      const yearlyPrice = tier === SubscriptionTier.PREMIUM 
        ? `$${PAYMENT_INFO.PREMIUM_YEARLY_PRICE.toFixed(2)}`
        : `$${PAYMENT_INFO.PREMIUM_PLUS_YEARLY_PRICE.toFixed(2)}`;
      setCurrentPrice(yearlyPrice);
    } else {
      setCurrentPrice(price); // Original monthly price
    }
  }, [billingCycle, tier, price]);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [discordUsername, setDiscordUsername] = useState('');
  const [discordId, setDiscordId] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  
  // Get price based on tier and billing cycle
  let finalPrice: number;
  
  // Handle lifetime plans
  if (tier === SubscriptionTier.LIFETIME_PREMIUM) {
    finalPrice = PAYMENT_INFO.LIFETIME_PREMIUM_PRICE;
  } else if (tier === SubscriptionTier.LIFETIME_PREMIUM_PLUS) {
    finalPrice = PAYMENT_INFO.LIFETIME_PREMIUM_PLUS_PRICE;
  }
  // Handle regular premium plans
  else {
    finalPrice = billingCycle === 'yearly' 
      ? (tier === SubscriptionTier.PREMIUM 
          ? PAYMENT_INFO.PREMIUM_YEARLY_PRICE 
          : PAYMENT_INFO.PREMIUM_PLUS_YEARLY_PRICE)
      : (tier === SubscriptionTier.PREMIUM 
          ? PAYMENT_INFO.PREMIUM_MONTHLY_PRICE 
          : PAYMENT_INFO.PREMIUM_PLUS_MONTHLY_PRICE);
  }
  
  const handlePaymentClick = () => {
    // Open Discord verification modal first
    setIsVerificationOpen(true);
  };
  
  const handleVerification = () => {
    // Validate Discord information
    if (!discordUsername || !discordId) {
      alert("Please enter both your Discord username and ID for verification");
      return;
    }
    
    // Simple validation for Discord ID format (must be numbers only)
    if (!/^\d+$/.test(discordId)) {
      alert("Discord ID should contain only numbers");
      return;
    }
    
    // Mark as verified and close the modal
    setIsVerified(true);
    setIsVerificationOpen(false);
    
    // Get tier name and billing info for confirmation
    let tierName = '';
    let billingInfo = '';
    
    if (tier === SubscriptionTier.PREMIUM) {
      tierName = 'Premium';
      billingInfo = `Billing: ${billingCycle === 'yearly' ? 'Yearly (2 months free)' : 'Monthly'}`;
    } else if (tier === SubscriptionTier.PREMIUM_PLUS) {
      tierName = 'Premium Plus';
      billingInfo = `Billing: ${billingCycle === 'yearly' ? 'Yearly (2 months free)' : 'Monthly'}`;
    } else if (tier === SubscriptionTier.LIFETIME_PREMIUM) {
      tierName = 'Lifetime Premium';
      billingInfo = 'Payment Type: One-time (lifetime access)';
    } else if (tier === SubscriptionTier.LIFETIME_PREMIUM_PLUS) {
      tierName = 'Lifetime Premium Plus';
      billingInfo = 'Payment Type: One-time (lifetime access)';
    }
    
    // Now show payment confirmation
    const verificationConfirmed = window.confirm(
      `Payment Verification\n\n` +
      `Discord Username: ${discordUsername}\n` +
      `Discord ID: ${discordId}\n` +
      `Amount: $${finalPrice.toFixed(2)}\n` +
      `Tier: ${tierName}\n` + 
      `Server ID: ${serverId}\n` +
      `${billingInfo}\n\n` +
      `After payment, we'll verify and activate your premium features within 24 hours.\n\n` +
      `Important: Please include your Discord information and Server ID in payment notes!`
    );
    
    if (!verificationConfirmed) return;
    
    // Let user choose payment method
    const paymentMethod = window.confirm(
      "Choose your payment method:\n\n" +
      "• Click OK to pay with PayPal\n" +
      "• Click Cancel to pay with CashApp"
    );
    
    if (paymentMethod) {
      // PayPal - Direct redirect
      window.open(`https://${PAYMENT_INFO.PAYPAL}`, '_blank');
      
      // Follow-up verification message
      setTimeout(() => {
        alert(
          "Payment Confirmation:\n\n" +
          "1. Please complete your payment on PayPal\n" +
          "2. Include your Discord username, ID, and Server ID in the notes\n" +
          "3. After verification, premium features will be activated"
        );
      }, 1000);
    } else {
      // CashApp - Direct to app if possible with URL scheme
      const cashAppUrl = `https://cash.app/$${PAYMENT_INFO.CASHAPP.replace('$', '')}`;
      window.open(cashAppUrl, '_blank');
      
      // Follow-up verification message
      setTimeout(() => {
        alert(
          "Payment Confirmation:\n\n" +
          `1. Please send $${finalPrice.toFixed(2)} to ${PAYMENT_INFO.CASHAPP}\n` +
          "2. Include your Discord username, ID, and Server ID in the notes\n" +
          "3. After verification, premium features will be activated"
        );
      }, 1000);
    }
  };
  
  return (
    <>
      <Dialog open={isVerificationOpen} onOpenChange={setIsVerificationOpen}>
        <DialogContent className="sm:max-w-md bg-black/90 border border-gray-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Discord Verification
            </DialogTitle>
            <DialogDescription>
              Please verify your Discord identity before proceeding with the payment.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="discord-username">Discord Username</Label>
              <Input
                id="discord-username"
                placeholder="e.g. username#1234 or username"
                value={discordUsername}
                onChange={(e) => setDiscordUsername(e.target.value)}
                className="bg-gray-900"
              />
              <p className="text-xs text-gray-500">Your full Discord username</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="discord-id">Discord User ID</Label>
              <Input
                id="discord-id"
                placeholder="e.g. 123456789012345678"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value)}
                className="bg-gray-900"
              />
              <p className="text-xs text-gray-500">
                <a 
                  href="https://support.discord.com/hc/en-us/articles/206346498-Where-can-I-find-my-User-Server-Message-ID-" 
                  target="_blank" 
                  className="text-primary hover:underline"
                >
                  How to find your Discord ID
                </a>
              </p>
            </div>
            
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-md p-3 mt-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-400">
                  Your Discord information will be used to verify your payment and assign the premium role.
                  We'll never share this information with third parties.
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsVerificationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerification} className="bg-primary hover:bg-primary/90">
              Verify & Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Card className={`relative ${popular ? 'border-2 border-primary shadow-lg shadow-primary/20' : 'border border-gray-800'} bg-black/50 backdrop-blur-sm`}>
        {popular && (
          <div className="absolute -top-3 right-4">
            <Badge className="bg-primary px-3 py-1 font-medium">
              MOST POPULAR
            </Badge>
          </div>
        )}
        <CardHeader>
          <CardTitle className="flex items-center">
            {name === 'Free' ? null : name === 'Premium' ? (
              <Shield className="h-5 w-5 mr-2 text-primary" />
            ) : (
              <Award className="h-5 w-5 mr-2 text-yellow-400" />
            )}
            {name}
          </CardTitle>
          <div className="mt-1">
            <span className="text-3xl font-bold">{currentPrice}</span>
            {price !== 'Free' && tier !== SubscriptionTier.LIFETIME_PREMIUM && tier !== SubscriptionTier.LIFETIME_PREMIUM_PLUS && (
              <span className="text-sm text-gray-400">/{billingCycle === 'monthly' ? 'month' : 'year'}</span>
            )}
            {(tier === SubscriptionTier.LIFETIME_PREMIUM || tier === SubscriptionTier.LIFETIME_PREMIUM_PLUS) && (
              <span className="text-sm text-gray-400"> one-time</span>
            )}
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2.5">
            {features.map((feature, index) => {
              // Check if the feature is included in this tier
              let isIncluded = false;
              
              if (name === 'Free') {
                isIncluded = feature.free;
              } else if (name === 'Premium') {
                isIncluded = feature.premium;
              } else if (name === 'Premium Plus') {
                isIncluded = feature.premiumPlus;
              } else if (name === 'Lifetime Premium') {
                isIncluded = feature.lifetimePremium || false;
              } else if (name === 'Lifetime Premium+') {
                isIncluded = feature.lifetimePremiumPlus || false;
              }
              
              return (
                <li key={index} className="flex items-start">
                  <div className="mt-0.5">
                    {isIncluded ? (
                      <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-gray-600 mr-2 flex-shrink-0" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-white">{feature.name}</p>
                    <p className="text-xs text-gray-400">{feature.description}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
        <CardFooter>
          {name !== 'Free' && (
            <div className="w-full space-y-4">
              {/* Only show billing cycle options for regular premium plans */}
              {tier !== SubscriptionTier.LIFETIME_PREMIUM && tier !== SubscriptionTier.LIFETIME_PREMIUM_PLUS && (
                <div className="grid grid-cols-2 bg-gray-900 rounded-md overflow-hidden p-1">
                  <button
                    className={`py-1.5 text-sm font-medium ${billingCycle === 'monthly' ? 'bg-primary text-white rounded-md' : 'text-gray-400'}`}
                    onClick={() => setBillingCycle('monthly')}
                  >
                    Monthly
                  </button>
                  <button
                    className={`py-1.5 text-sm font-medium ${billingCycle === 'yearly' ? 'bg-primary text-white rounded-md' : 'text-gray-400'}`}
                    onClick={() => setBillingCycle('yearly')}
                  >
                    Yearly
                    <span className="ml-1 text-xs bg-green-500/20 text-green-400 rounded-full px-1.5 py-0.5">
                      2 months free
                    </span>
                  </button>
                </div>
              )}
              
              {/* For lifetime plans, show a badge indicating it's one-time */}
              {(tier === SubscriptionTier.LIFETIME_PREMIUM || tier === SubscriptionTier.LIFETIME_PREMIUM_PLUS) && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-md p-2 text-center mb-2">
                  <span className="text-green-400 text-sm font-medium">One-time payment, lifetime access</span>
                </div>
              )}
              
              <Button 
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handlePaymentClick}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Upgrade Now
              </Button>
              <div className="text-center text-xs text-gray-500">
                <p>Pay with PayPal ({PAYMENT_INFO.PAYPAL})</p>
                <p>or CashApp ({PAYMENT_INFO.CASHAPP})</p>
              </div>
            </div>
          )}
          {name === 'Free' && (
            <Button variant="outline" className="w-full">
              Current Plan
            </Button>
          )}
        </CardFooter>
      </Card>
    </>
  );
};

interface PremiumSubscriptionProps {
  serverId: string;
  currentTier?: SubscriptionTier;
}

const PremiumSubscription: React.FC<PremiumSubscriptionProps> = ({ 
  serverId,
  currentTier = SubscriptionTier.FREE
}) => {
  // Get user's premium status from Discord roles
  const { isPremium, premiumTier, isLoading } = usePremiumStatus();

  // Use the user's actual premium tier if available, otherwise use the prop
  const actualTier = isPremium ? premiumTier : currentTier;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Upgrade Your Server</h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Take your Discord server to the next level with premium features designed to enhance moderation,
          security, and user experience.
        </p>
      </div>
      
      <div className="mb-12">
        <h3 className="text-xl font-bold text-white mb-6 text-center">Monthly/Yearly Subscriptions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PlanCard
            name="Free"
            price="Free"
            description="Basic moderation tools for smaller communities"
            features={features}
            serverId={serverId}
            tier={SubscriptionTier.FREE}
          />
          
          <PlanCard
            name="Premium"
            price="$4.99"
            description="Enhanced moderation for growing communities"
            features={features}
            popular={true}
            serverId={serverId}
            tier={SubscriptionTier.PREMIUM}
          />
          
          <PlanCard
            name="Premium Plus"
            price="$9.99"
            description="Ultimate protection for large communities"
            features={features}
            serverId={serverId}
            tier={SubscriptionTier.PREMIUM_PLUS}
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-bold text-white mb-6 text-center">Lifetime Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <PlanCard
            name="Lifetime Premium"
            price={`$${PAYMENT_INFO.LIFETIME_PREMIUM_PRICE.toFixed(2)}`}
            description="One-time payment for lifetime premium access"
            features={features}
            serverId={serverId}
            tier={SubscriptionTier.LIFETIME_PREMIUM}
          />
          
          <PlanCard
            name="Lifetime Premium+"
            price={`$${PAYMENT_INFO.LIFETIME_PREMIUM_PLUS_PRICE.toFixed(2)}`}
            description="One-time payment for lifetime premium+ access"
            features={features}
            popular={true}
            serverId={serverId}
            tier={SubscriptionTier.LIFETIME_PREMIUM_PLUS}
          />
        </div>
      </div>
      
      <div className="bg-black/50 backdrop-blur-sm border border-gray-800 rounded-lg p-6 mt-8">
        <div className="flex items-center mb-4">
          <Lock className="h-5 w-5 text-yellow-500 mr-2" />
          <h3 className="text-lg font-bold text-white">How to activate premium features</h3>
        </div>
        <ol className="space-y-3 ml-6 list-decimal">
          <li className="text-gray-300">Select a premium plan above that fits your server's needs.</li>
          <li className="text-gray-300">
            Send payment via:
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li className="text-gray-400">PayPal: <span className="text-primary">{PAYMENT_INFO.PAYPAL}</span></li>
              <li className="text-gray-400">CashApp: <span className="text-primary">{PAYMENT_INFO.CASHAPP}</span></li>
            </ul>
          </li>
          <li className="text-gray-300">
            <span className="text-yellow-400 font-medium">IMPORTANT:</span> Include the following in payment notes:
            <ul className="ml-4 mt-1 space-y-1 list-disc">
              <li className="text-gray-400">Your Discord server ID: <span className="text-primary">{serverId}</span></li>
              <li className="text-gray-400">Your Discord username and ID (for verification)</li>
              <li className="text-gray-400">Subscription tier (Premium or Premium+)</li>
              <li className="text-gray-400">Billing cycle (Monthly or Yearly)</li>
            </ul>
          </li>
          <li className="text-gray-300">After our team verifies your payment and Discord identity (usually within 24 hours), we'll add the premium role to your server.</li>
          <li className="text-gray-300">Premium features will be instantly activated once the role is assigned to your server.</li>
          <li className="text-gray-300">For payment verification status or assistance, join our <a href="https://discord.gg/g3rFbaW6gw" className="text-primary hover:underline">support server</a>.</li>
        </ol>
        
        <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-md">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-0.5">
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-yellow-500">Verification Process</h4>
              <p className="mt-1 text-xs text-gray-400">
                Our team manually verifies each payment and Discord identity to ensure proper activation of premium features. 
                After payment, please allow up to 24 hours for verification and role assignment. 
                You'll receive a confirmation message in your server once premium is activated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumSubscription;