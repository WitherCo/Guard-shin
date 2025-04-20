/**
 * Premium Check ESM Module
 * 
 * This module is responsible for checking if a server or user has premium status.
 * It is used by the ESM-compatible version of the bot.
 */

// Premium role IDs from the support server
const PREMIUM_ROLE_ID = '1361908871882608651'; // Premium role ID
const PREMIUM_PLUS_ROLE_ID = '1361908963616227429'; // Premium Plus role ID 
const LIFETIME_ROLE_ID = '1375085778326884352'; // Lifetime Premium role ID
const LIFETIME_PLUS_ROLE_ID = '1375085843322097735'; // Lifetime Premium Plus role ID

// Support server ID
const SUPPORT_SERVER_ID = '1233495879223345172';

// Developer user ID (owner)
const DEVELOPER_ID = '1259367203346841725';

// Runtime premium cache to keep track of manually added premium servers
let premiumServers = new Map();
let lifetimePremiumServers = new Map();

/**
 * Checks if a server has premium status
 * @param {string} guildId The guild ID to check
 * @param {object} client The Discord client instance
 * @returns {boolean} Whether the server has premium
 */
async function checkServerPremium(guildId, client) {
  // The support server always has premium
  if (guildId === SUPPORT_SERVER_ID) {
    console.log(`[PREMIUM] Support server ${guildId} always has premium status`);
    return true;
  }
  
  // Check if the server has been manually granted premium
  if (premiumServers.has(guildId)) {
    if (premiumServers.get(guildId) > Date.now()) {
      console.log(`[PREMIUM] Server ${guildId} has temporary premium status`);
      return true;
    } else {
      // Premium has expired, remove it from the map
      premiumServers.delete(guildId);
    }
  }
  
  // Check if the server has been granted lifetime premium
  if (lifetimePremiumServers.has(guildId)) {
    console.log(`[PREMIUM] Server ${guildId} has lifetime premium status (${lifetimePremiumServers.get(guildId)})`);
    return true;
  }
  
  try {
    // Get the support server guild object
    const supportGuild = client.guilds.cache.get(SUPPORT_SERVER_ID);
    if (!supportGuild) {
      console.log(`[PREMIUM] Support guild not found in cache, premium check failed for ${guildId}`);
      return false;
    }
    
    // Check if the server owner has the premium role in the support server
    const targetGuild = client.guilds.cache.get(guildId);
    if (!targetGuild) {
      console.log(`[PREMIUM] Target guild not found in cache, premium check failed for ${guildId}`);
      return false;
    }
    
    // Get the owner of the target guild
    const ownerId = targetGuild.ownerId;
    try {
      // Check if the owner is in the support server
      const member = await supportGuild.members.fetch(ownerId);
      
      // Check if the member has any premium role
      const hasPremium = member.roles.cache.has(PREMIUM_ROLE_ID) || 
                        member.roles.cache.has(PREMIUM_PLUS_ROLE_ID) ||
                        member.roles.cache.has(LIFETIME_ROLE_ID) ||
                        member.roles.cache.has(LIFETIME_PLUS_ROLE_ID);
      
      if (hasPremium) {
        console.log(`[PREMIUM] Server ${guildId} has premium status via owner ${ownerId}`);
      } else {
        console.log(`[PREMIUM] Server ${guildId} does not have premium status`);
      }
      
      return hasPremium;
    } catch (error) {
      // Owner is not in support server
      console.log(`[PREMIUM] Owner ${ownerId} not found in support server, premium check failed for ${guildId}`);
      return false;
    }
  } catch (error) {
    console.error(`[PREMIUM] Error checking premium status for guild ${guildId}:`, error);
    return false;
  }
}

/**
 * Checks the premium tier of a server
 * @param {string} guildId The guild ID to check
 * @param {object} client The Discord client instance
 * @returns {string} The premium tier (free, premium, premium_plus, lifetime, lifetime_plus)
 */
async function checkPremiumTier(guildId, client) {
  // The support server always has premium plus
  if (guildId === SUPPORT_SERVER_ID) {
    return 'premium_plus';
  }
  
  // Check if the server has been manually granted lifetime premium
  if (lifetimePremiumServers.has(guildId)) {
    return lifetimePremiumServers.get(guildId); // 'lifetime' or 'lifetime_plus'
  }
  
  try {
    // Get the support server guild object
    const supportGuild = client.guilds.cache.get(SUPPORT_SERVER_ID);
    if (!supportGuild) {
      return 'free';
    }
    
    // Check if the server owner has the premium role in the support server
    const targetGuild = client.guilds.cache.get(guildId);
    if (!targetGuild) {
      return 'free';
    }
    
    // Get the owner of the target guild
    const ownerId = targetGuild.ownerId;
    try {
      // Check if the owner is in the support server
      const member = await supportGuild.members.fetch(ownerId);
      
      // Check premium tier based on roles (check highest tier first)
      if (member.roles.cache.has(LIFETIME_PLUS_ROLE_ID)) {
        return 'lifetime_plus';
      } else if (member.roles.cache.has(LIFETIME_ROLE_ID)) {
        return 'lifetime';
      } else if (member.roles.cache.has(PREMIUM_PLUS_ROLE_ID)) {
        return 'premium_plus';
      } else if (member.roles.cache.has(PREMIUM_ROLE_ID)) {
        return 'premium';
      } else {
        return 'free';
      }
    } catch (error) {
      // Owner is not in support server
      return 'free';
    }
  } catch (error) {
    console.error(`[PREMIUM] Error checking premium tier for guild ${guildId}:`, error);
    return 'free';
  }
}

/**
 * Grant temporary premium status to a server
 * @param {string} guildId The guild ID to grant premium to
 * @param {number} duration Duration in milliseconds
 * @returns {boolean} Whether the operation was successful
 */
function grantTempPremium(guildId, duration = 2592000000) { // Default 30 days
  // Calculate expiration time
  const expirationTime = Date.now() + duration;
  
  // Add to premium servers map
  premiumServers.set(guildId, expirationTime);
  
  console.log(`[PREMIUM] Granted temporary premium to server ${guildId} until ${new Date(expirationTime).toISOString()}`);
  return true;
}

/**
 * Grant lifetime premium status to a server
 * @param {string} guildId The guild ID to grant premium to
 * @param {string} tier The premium tier ('lifetime' or 'lifetime_plus')
 * @returns {boolean} Whether the operation was successful
 */
function grantLifetimePremium(guildId, tier = 'lifetime') {
  // Validate tier
  if (tier !== 'lifetime' && tier !== 'lifetime_plus') {
    tier = 'lifetime'; // Default to regular lifetime tier
  }
  
  // Add to lifetime premium servers map
  lifetimePremiumServers.set(guildId, tier);
  
  console.log(`[PREMIUM] Granted ${tier} premium to server ${guildId}`);
  return true;
}

/**
 * Remove premium status from a server
 * @param {string} guildId The guild ID to remove premium from
 * @returns {boolean} Whether the operation was successful
 */
function removePremium(guildId) {
  let removed = false;
  
  // Remove from premium servers map
  if (premiumServers.has(guildId)) {
    premiumServers.delete(guildId);
    removed = true;
  }
  
  // Remove from lifetime premium servers map
  if (lifetimePremiumServers.has(guildId)) {
    lifetimePremiumServers.delete(guildId);
    removed = true;
  }
  
  if (removed) {
    console.log(`[PREMIUM] Removed premium from server ${guildId}`);
  }
  
  return removed;
}

/**
 * Check if a user is a developer/owner
 * @param {string} userId The user ID to check
 * @returns {boolean} Whether the user is a developer
 */
function isDeveloper(userId) {
  return userId === DEVELOPER_ID;
}

// Aliases for backward compatibility with existing code
const checkPremium = checkServerPremium;
const getPremiumServers = () => {
  // Combine both premium maps for compatibility
  const combinedMap = new Map();
  
  // Add temporary premium servers
  for (const [guildId, expirationTime] of premiumServers.entries()) {
    combinedMap.set(guildId, {
      expiresAt: expirationTime,
      tier: 'regular',
      isLifetime: false
    });
  }
  
  // Add lifetime premium servers
  for (const [guildId, tier] of lifetimePremiumServers.entries()) {
    combinedMap.set(guildId, {
      expiresAt: Infinity,
      tier: tier === 'lifetime_plus' ? 'plus' : 'regular',
      isLifetime: true
    });
  }
  
  return combinedMap;
};

// Premium upsell embed for non-premium servers
const premiumUpsellEmbed = {
  title: '✨ Premium Feature',
  description: 'This command requires Guard-shin Premium to use.',
  color: 0x5865F2,
  fields: [
    {
      name: '💎 Get Premium',
      value: 'Join our [support server](https://discord.gg/g3rFbaW6gw) to purchase premium and unlock this feature!'
    },
    {
      name: '🔍 Premium Plans',
      value: [
        '**Premium**: $9.99/month or $49.99/6 months',
        '**Premium+**: $19.99/month or $99.99/6 months',
        '**Lifetime**: $149.99 (one-time payment)',
        '**Lifetime+**: $249.99 (one-time payment)'
      ].join('\n')
    }
  ],
  footer: {
    text: 'Upgrade today to access all premium features!'
  }
};

export {
  checkServerPremium,
  checkPremiumTier,
  grantTempPremium,
  grantLifetimePremium,
  removePremium,
  isDeveloper,
  SUPPORT_SERVER_ID,
  DEVELOPER_ID,
  // Aliases for backward compatibility
  checkPremium,
  getPremiumServers,
  premiumUpsellEmbed
};