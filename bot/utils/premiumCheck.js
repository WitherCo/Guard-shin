/**
 * Utility for checking premium status of guilds and users
 */

// Premium role IDs (from your Discord server)
const PREMIUM_ROLE_ID = '1361908871882608651';
const PREMIUM_PLUS_ROLE_ID = '1361908963616227429';
const LIFETIME_ROLE_ID = '1375085778326884352';
const LIFETIME_PLUS_ROLE_ID = '1375085843322097735';

// Support server ID (automatically has premium)
const SUPPORT_SERVER_ID = '1233495879223345172';

// Cache for premium status (to reduce API calls)
const premiumCache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Temporary premium server list (this will be lost on bot restart)
// In a real implementation, this would be stored in a database
const temporaryPremiumServers = new Map();

/**
 * Check if a guild has premium status
 * @param {string} guildId - Discord guild ID to check
 * @returns {Promise<boolean>} - Whether the guild has premium status
 */
async function checkPremium(guildId) {
  // Check if it's the support server (always premium)
  if (guildId === SUPPORT_SERVER_ID) {
    return true;
  }

  // Check if the server is in the temporary premium list
  if (temporaryPremiumServers.has(guildId)) {
    const premiumData = temporaryPremiumServers.get(guildId);
    if (Date.now() < premiumData.expiresAt) {
      return true;
    } else {
      // Premium expired, remove it from the list
      temporaryPremiumServers.delete(guildId);
    }
  }
  
  // If not in premium list, only the support server should have premium status
  return guildId === SUPPORT_SERVER_ID;
  
  // The code below is for future implementation with payment verification
  /*
  // Check cache first
  if (premiumCache.has(guildId)) {
    const cachedValue = premiumCache.get(guildId);
    if (Date.now() < cachedValue.expires) {
      return cachedValue.isPremium;
    }
    // Cache expired, remove it
    premiumCache.delete(guildId);
  }
  
  try {
    // In a real implementation, you would:
    // 1. Check if the guild owner has a premium role in your support server
    // 2. Check a database of premium subscribers
    // 3. Verify payment status
    
    // For demonstration, check if guild ID ends with an even number (just for testing)
    const isPremium = guildId.endsWith('0') || guildId.endsWith('2') || 
                     guildId.endsWith('4') || guildId.endsWith('6') || 
                     guildId.endsWith('8');
    
    // Cache the result
    premiumCache.set(guildId, {
      isPremium,
      expires: Date.now() + CACHE_TTL
    });
    
    return isPremium;
  } catch (error) {
    console.error('Error checking premium status:', error);
    return false;
  }
  */
}

/**
 * Check if a user has premium status
 * @param {string} userId - Discord user ID to check
 * @returns {Promise<boolean>} - Whether the user has premium status
 */
async function checkUserPremium(userId, guildId = null) {
  // Check if the user is in the support server
  if (guildId && guildId === SUPPORT_SERVER_ID) {
    return true;
  }
  // Default to not premium
  return false;
  
  /*
  // If user is in the support server, they have premium status
  if (guildId && guildId === SUPPORT_SERVER_ID) {
    return true;
  }
  
  // Similar caching as guild premium
  const cacheKey = `user:${userId}`;
  
  if (premiumCache.has(cacheKey)) {
    const cachedValue = premiumCache.get(cacheKey);
    if (Date.now() < cachedValue.expires) {
      return cachedValue.isPremium;
    }
    premiumCache.delete(cacheKey);
  }
  
  try {
    // In a real implementation, check if the user has a premium role in your support server
    // For demonstration, check if user ID ends with an even number (just for testing)
    const isPremium = userId.endsWith('0') || userId.endsWith('2') || 
                     userId.endsWith('4') || userId.endsWith('6') || 
                     userId.endsWith('8');
    
    // Cache the result
    premiumCache.set(cacheKey, {
      isPremium,
      expires: Date.now() + CACHE_TTL
    });
    
    return isPremium;
  } catch (error) {
    console.error('Error checking user premium status:', error);
    return false;
  }
  */
}

/**
 * Add a server to the temporary premium list
 * @param {string} guildId - Discord guild ID to add premium to
 * @param {string} tier - Premium tier to assign ('premium', 'premium_plus', 'lifetime', 'lifetime_plus')
 * @param {number} days - Number of days to grant premium for (or 0 for lifetime)
 * @returns {boolean} - Whether the operation was successful
 */
function addServerPremium(guildId, tier = 'premium', days = 30) {
  try {
    let expiresAt;
    let isPermanent = false;
    
    // Check if it's a lifetime tier
    if (tier === 'lifetime' || tier === 'lifetime_plus' || days >= 36500) { // 100 years or more = permanent
      expiresAt = Date.now() + (36500 * 24 * 60 * 60 * 1000); // Set to roughly 100 years
      isPermanent = true;
    } else {
      // Regular premium with expiration
      expiresAt = Date.now() + (days * 24 * 60 * 60 * 1000);
    }
    
    // Add to temporary premium list
    temporaryPremiumServers.set(guildId, {
      tier,
      expiresAt,
      addedAt: Date.now(),
      isPermanent
    });
    
    if (isPermanent) {
      console.log(`[PREMIUM] Added ${tier} status to server ${guildId} permanently.`);
    } else {
      console.log(`[PREMIUM] Added ${tier} status to server ${guildId} for ${days} days (expires: ${new Date(expiresAt).toISOString()})`);
    }
    
    return true;
  } catch (error) {
    console.error('Error adding server premium:', error);
    return false;
  }
}

/**
 * Get a list of all premium servers
 * @returns {Array<Object>} - Array of premium server data
 */
function getPremiumServers() {
  const servers = [];
  
  // Add support server which is always premium
  servers.push({
    guildId: SUPPORT_SERVER_ID,
    tier: 'premium_plus',
    expiresAt: null,
    isPermanent: true
  });
  
  // Add all temporary premium servers
  temporaryPremiumServers.forEach((data, guildId) => {
    if (Date.now() < data.expiresAt) {
      servers.push({
        guildId,
        tier: data.tier,
        expiresAt: data.expiresAt,
        isPermanent: data.isPermanent || false
      });
    }
  });
  
  return servers;
}

/**
 * Generate premium upsell embed
 * @returns {Object} - Discord embed object for premium upsell
 */
function premiumUpsellEmbed() {
  return {
    color: 0xFFD700, // Gold
    title: '⭐ Premium Feature',
    description: 'This command requires a Premium subscription.',
    fields: [
      {
        name: 'Upgrade Now',
        value: 'Visit [witherco.org/premium](https://witherco.org/premium) to view Premium plans.',
        inline: false
      },
      {
        name: 'Available Plans',
        value: '💎 **Monthly/Yearly Plans:**\n• Premium: $4.99/month\n• Premium+: $9.99/month\n\n🏆 **Lifetime Plans:**\n• Lifetime: $149.99 (one-time)\n• Lifetime+: $249.99 (one-time)',
        inline: false
      },
      {
        name: 'Benefits',
        value: '✅ Advanced automation\n✅ Custom welcome messages\n✅ Auto-response system\n✅ Server management tools\n✅ Raid protection\n✅ Priority support',
        inline: false
      }
    ],
    footer: {
      text: 'Visit https://witherco.org/premium to upgrade'
    },
    timestamp: new Date()
  };
}

module.exports = {
  checkPremium,
  checkUserPremium,
  premiumUpsellEmbed,
  addServerPremium,
  getPremiumServers,
  PREMIUM_ROLE_ID,
  PREMIUM_PLUS_ROLE_ID,
  LIFETIME_ROLE_ID,
  LIFETIME_PLUS_ROLE_ID,
  SUPPORT_SERVER_ID
};