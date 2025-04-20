import { Server } from './schema';
import { SubscriptionTier } from './schema';

// Discord IDs
export const DISCORD_GUILD_ID = '1233495879223345172'; // Support server ID
export const PREMIUM_SERVER_ID = '1233495879223345172'; // Server where users need to be to verify premium

// Premium role IDs to check for premium status
export const PREMIUM_ROLE_ID = '1361908871882608651'; // Premium role ID
export const PREMIUM_PLUS_ROLE_ID = '1361908963616227429'; // Premium Plus role ID
export const LIFETIME_ROLE_ID = '1375085778326884352'; // Lifetime Premium role ID
export const LIFETIME_PLUS_ROLE_ID = '1375085843322097735'; // Lifetime Premium Plus role ID

// Note: These IDs should match the ones in the Discord.js implementation
// in bot/utils/premiumCheckESM.js

// Premium features configuration
export const PREMIUM_FEATURES = {
  ANTI_ALT: 'anti-alt',
  CUSTOM_COMMANDS: 'custom-commands',
  ADVANCED_AUTOMOD: 'advanced-automod',
  RAID_PROTECTION_PLUS: 'raid-protection-plus',
  VERIFICATION_PLUS: 'verification-plus',
  FULL_LOGS: 'full-logs',
  MUSIC_PLAYER: 'music-player',
  WELCOME_IMAGES: 'welcome-images',
  CUSTOM_EMBEDS: 'custom-embeds',
} as const;

export type PremiumFeature = typeof PREMIUM_FEATURES[keyof typeof PREMIUM_FEATURES];

// Payment information
export const PAYMENT_INFO = {
  PAYPAL: 'paypal.me/ChristopherThomas429', // Official PayPal link
  CASHAPP: '$kingsweets2004', // Official CashApp tag
  PREMIUM_MONTHLY_PRICE: 4.99,
  PREMIUM_PLUS_MONTHLY_PRICE: 9.99,
  PREMIUM_YEARLY_PRICE: 49.99,
  PREMIUM_PLUS_YEARLY_PRICE: 99.99,
  LIFETIME_PREMIUM_PRICE: 149.99,      // Lifetime Premium one-time payment
  LIFETIME_PREMIUM_PLUS_PRICE: 249.99, // Lifetime Premium Plus one-time payment
  PAYMENT_INSTRUCTIONS: `
    1. Verify your Discord identity before purchasing
    2. Send payment via PayPal or CashApp with your Discord server ID in the notes
    3. Include your Discord username and ID for verification
    4. Specify which tier you're purchasing (Premium, Premium+, Lifetime Premium, or Lifetime Premium+)
    5. After payment verification, the premium role will be added within 24 hours
    6. For help with payments, contact support in our Discord server
  `
};

// Subscription features by tier
export const TIER_FEATURES: Record<SubscriptionTier, PremiumFeature[]> = {
  [SubscriptionTier.FREE]: [],
  [SubscriptionTier.PREMIUM]: [
    PREMIUM_FEATURES.ANTI_ALT,
    PREMIUM_FEATURES.CUSTOM_COMMANDS,
    PREMIUM_FEATURES.MUSIC_PLAYER,
    PREMIUM_FEATURES.WELCOME_IMAGES,
  ],
  [SubscriptionTier.PREMIUM_PLUS]: [
    PREMIUM_FEATURES.ANTI_ALT,
    PREMIUM_FEATURES.CUSTOM_COMMANDS,
    PREMIUM_FEATURES.MUSIC_PLAYER,
    PREMIUM_FEATURES.WELCOME_IMAGES,
    PREMIUM_FEATURES.ADVANCED_AUTOMOD,
    PREMIUM_FEATURES.RAID_PROTECTION_PLUS,
    PREMIUM_FEATURES.VERIFICATION_PLUS,
    PREMIUM_FEATURES.FULL_LOGS,
    PREMIUM_FEATURES.CUSTOM_EMBEDS,
  ],
  // Lifetime tiers have the same features as regular premium tiers,
  // but never expire and have a one-time payment
  [SubscriptionTier.LIFETIME_PREMIUM]: [
    PREMIUM_FEATURES.ANTI_ALT,
    PREMIUM_FEATURES.CUSTOM_COMMANDS,
    PREMIUM_FEATURES.MUSIC_PLAYER,
    PREMIUM_FEATURES.WELCOME_IMAGES,
  ],
  [SubscriptionTier.LIFETIME_PREMIUM_PLUS]: [
    PREMIUM_FEATURES.ANTI_ALT,
    PREMIUM_FEATURES.CUSTOM_COMMANDS,
    PREMIUM_FEATURES.MUSIC_PLAYER,
    PREMIUM_FEATURES.WELCOME_IMAGES,
    PREMIUM_FEATURES.ADVANCED_AUTOMOD,
    PREMIUM_FEATURES.RAID_PROTECTION_PLUS,
    PREMIUM_FEATURES.VERIFICATION_PLUS,
    PREMIUM_FEATURES.FULL_LOGS,
    PREMIUM_FEATURES.CUSTOM_EMBEDS,
  ],
};

// Function to check if a server has premium status
export function hasServerPremium(server: Server): boolean {
  return !!server.premium;
}

// Function to check if a server has access to a specific premium feature
export function hasFeatureAccess(server: Server, feature: PremiumFeature): boolean {
  if (!hasServerPremium(server)) {
    return false;
  }
  
  const serverTier = server.premiumTier as SubscriptionTier || SubscriptionTier.FREE;
  
  // Check if the server's tier includes the feature
  return TIER_FEATURES[serverTier]?.includes(feature) || false;
}

// Function to get subscription tier from Discord role
export function getTierFromRole(roles: string[]): SubscriptionTier {
  // Check for lifetime plus role first (highest tier)
  if (roles.includes(LIFETIME_PLUS_ROLE_ID)) {
    return SubscriptionTier.LIFETIME_PREMIUM_PLUS;
  }
  
  // Check for lifetime role
  if (roles.includes(LIFETIME_ROLE_ID)) {
    return SubscriptionTier.LIFETIME_PREMIUM;
  }
  
  // Check for premium plus role
  if (roles.includes(PREMIUM_PLUS_ROLE_ID)) {
    return SubscriptionTier.PREMIUM_PLUS;
  }
  
  // Check for regular premium role
  if (roles.includes(PREMIUM_ROLE_ID)) {
    return SubscriptionTier.PREMIUM;
  }
  
  // Default to free tier
  return SubscriptionTier.FREE;
}

// Function to get payment URL with custom parameters
export function getPaymentUrl(tier: SubscriptionTier, serverId: string, isYearly: boolean = false): string {
  let price: number;
  
  // Handle lifetime tiers
  if (tier === SubscriptionTier.LIFETIME_PREMIUM) {
    price = PAYMENT_INFO.LIFETIME_PREMIUM_PRICE;
  } else if (tier === SubscriptionTier.LIFETIME_PREMIUM_PLUS) {
    price = PAYMENT_INFO.LIFETIME_PREMIUM_PLUS_PRICE;
  }
  // Handle regular premium tiers
  else if (tier === SubscriptionTier.PREMIUM_PLUS) {
    price = isYearly ? PAYMENT_INFO.PREMIUM_PLUS_YEARLY_PRICE : PAYMENT_INFO.PREMIUM_PLUS_MONTHLY_PRICE;
  } else {
    price = isYearly ? PAYMENT_INFO.PREMIUM_YEARLY_PRICE : PAYMENT_INFO.PREMIUM_MONTHLY_PRICE;
  }
  
  // For PayPal and CashApp we just return the price for reference
  return `${price.toFixed(2)}`;
}