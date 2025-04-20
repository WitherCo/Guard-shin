import { Client, Guild, GuildMember, Role } from 'discord.js';
import { log } from '../vite';
import { SubscriptionTier, PREMIUM_ROLE_ID, getTierFromRole } from '@shared/premium';

// Map to cache premium status for guilds
const premiumStatusCache: Map<string, { tier: SubscriptionTier, expiresAt: number }> = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Check if a guild has premium status
 */
export async function checkGuildPremium(client: Client, guildId: string): Promise<SubscriptionTier> {
  try {
    // Check cache first
    const cached = premiumStatusCache.get(guildId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.tier;
    }
    
    // Fetch the guild
    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
      return SubscriptionTier.FREE;
    }
    
    // Get the bot as a member
    const botMember = guild.members.me;
    if (!botMember) {
      return SubscriptionTier.FREE;
    }
    
    // Get all roles the bot can see
    const roles = Array.from(guild.roles.cache.values());
    
    // Check for premium roles
    const premiumRoles = roles.filter(role => role.id === PREMIUM_ROLE_ID);
    
    // Determine tier based on roles
    const tier = premiumRoles.length > 0 ? SubscriptionTier.PREMIUM : SubscriptionTier.FREE;
    
    // Cache the result
    premiumStatusCache.set(guildId, {
      tier,
      expiresAt: Date.now() + CACHE_TTL
    });
    
    return tier;
  } catch (error) {
    log(`Error checking premium status for guild ${guildId}: ${error}`, 'discord');
    return SubscriptionTier.FREE;
  }
}

/**
 * Check if a specific member has premium role
 */
export async function checkMemberPremium(client: Client, guildId: string, userId: string): Promise<boolean> {
  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) return false;
    
    const member = await guild.members.fetch(userId);
    if (!member) return false;
    
    return member.roles.cache.has(PREMIUM_ROLE_ID);
  } catch (error) {
    log(`Error checking premium status for member ${userId} in guild ${guildId}: ${error}`, 'discord');
    return false;
  }
}

/**
 * Assign premium role to a guild owner based on transaction
 */
export async function assignPremiumRole(
  client: Client, 
  guildId: string, 
  transactionId: string,
  tier: SubscriptionTier
): Promise<boolean> {
  try {
    // In a real implementation, verify the transaction with PayPal/CashApp
    
    // Get the guild
    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
      log(`Guild not found: ${guildId}`, 'discord');
      return false;
    }
    
    // Get the guild owner
    const owner = await guild.fetchOwner();
    if (!owner) {
      log(`Owner not found for guild: ${guildId}`, 'discord');
      return false;
    }
    
    // Check if premium role exists
    let premiumRole = guild.roles.cache.get(PREMIUM_ROLE_ID);
    
    // Create premium role if it doesn't exist
    if (!premiumRole) {
      premiumRole = await guild.roles.create({
        name: 'Premium',
        color: 0xFFD700, // Gold color
        reason: 'Premium subscription role',
        permissions: [],
      });
    }
    
    // Assign premium role to owner
    await owner.roles.add(premiumRole);
    
    // Update cache
    premiumStatusCache.set(guildId, {
      tier,
      expiresAt: Date.now() + CACHE_TTL
    });
    
    log(`Premium role assigned to owner of guild ${guildId} with transaction ${transactionId}`, 'discord');
    return true;
  } catch (error) {
    log(`Error assigning premium role for guild ${guildId}: ${error}`, 'discord');
    return false;
  }
}

/**
 * Revoke premium status from a guild
 */
export async function revokePremium(client: Client, guildId: string): Promise<boolean> {
  try {
    // Get the guild
    const guild = await client.guilds.fetch(guildId);
    if (!guild) return false;
    
    // Get premium role
    const premiumRole = guild.roles.cache.get(PREMIUM_ROLE_ID);
    if (!premiumRole) return true; // No premium role to remove
    
    // Remove role from all members
    const membersWithRole = guild.members.cache.filter(member => member.roles.cache.has(PREMIUM_ROLE_ID));
    
    for (const [, member] of membersWithRole) {
      await member.roles.remove(premiumRole);
    }
    
    // Update cache
    premiumStatusCache.set(guildId, {
      tier: SubscriptionTier.FREE,
      expiresAt: Date.now() + CACHE_TTL
    });
    
    log(`Premium status revoked for guild ${guildId}`, 'discord');
    return true;
  } catch (error) {
    log(`Error revoking premium for guild ${guildId}: ${error}`, 'discord');
    return false;
  }
}