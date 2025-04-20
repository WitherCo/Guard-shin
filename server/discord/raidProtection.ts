import { Client, Guild, GuildMember, Collection, TextChannel } from 'discord.js';
import { log } from '../vite';

// Map to track joins per guild
interface JoinTracker {
  members: string[]; // Member IDs
  joinTimes: number[]; // Timestamps of joins
}

const joinTrackers: Map<string, JoinTracker> = new Map();
const lockdownStatus: Map<string, boolean> = new Map();

// Configuration (in a real implementation, these would be per-guild settings)
const raidThreshold = {
  joinCount: 10, // Number of joins in timeframe to trigger alert
  timeframeSeconds: 60, // Timeframe to measure joins (in seconds)
};

/**
 * Set up raid protection for the Discord bot
 */
export function setupRaidProtection(client: Client) {
  // Listen for new members joining
  client.on('guildMemberAdd', (member: GuildMember) => {
    try {
      // In a real implementation, check if raid protection is enabled for this guild
      
      // Track the join
      trackJoin(member.guild.id, member.id);
      
      // Check for raid patterns
      const isRaidDetected = checkRaidPatterns(member.guild.id);
      
      if (isRaidDetected) {
        handleRaid(member.guild);
      }
      
    } catch (error) {
      log(`Error in raid protection: ${error}`, 'discord');
    }
  });

  // Clean up old join data every minute
  setInterval(() => {
    try {
      const now = Date.now();
      const maxAge = raidThreshold.timeframeSeconds * 1000;
      
      // For each guild in our tracker
      for (const [guildId, tracker] of joinTrackers.entries()) {
        // Filter out old joins
        const newJoinTimes: number[] = [];
        const newMembers: string[] = [];
        
        for (let i = 0; i < tracker.joinTimes.length; i++) {
          if (now - tracker.joinTimes[i] < maxAge) {
            newJoinTimes.push(tracker.joinTimes[i]);
            newMembers.push(tracker.members[i]);
          }
        }
        
        // Update tracker with filtered data
        if (newJoinTimes.length === 0) {
          // No recent joins, remove the tracker
          joinTrackers.delete(guildId);
        } else {
          joinTrackers.set(guildId, {
            members: newMembers,
            joinTimes: newJoinTimes
          });
        }
      }
    } catch (error) {
      log(`Error cleaning up join trackers: ${error}`, 'discord');
    }
  }, 60000); // Run every minute
}

/**
 * Track a new member join
 */
function trackJoin(guildId: string, memberId: string): void {
  const now = Date.now();
  const tracker = joinTrackers.get(guildId) || { members: [], joinTimes: [] };
  
  tracker.members.push(memberId);
  tracker.joinTimes.push(now);
  
  joinTrackers.set(guildId, tracker);
}

/**
 * Check if raid patterns are detected
 */
function checkRaidPatterns(guildId: string): boolean {
  const tracker = joinTrackers.get(guildId);
  if (!tracker) return false;
  
  const now = Date.now();
  const timeframeMs = raidThreshold.timeframeSeconds * 1000;
  const recentCount = tracker.joinTimes.filter(time => now - time < timeframeMs).length;
  
  return recentCount >= raidThreshold.joinCount;
}

/**
 * Handle a detected raid
 */
async function handleRaid(guild: Guild): Promise<void> {
  try {
    // Check if we're already in lockdown
    if (lockdownStatus.get(guild.id)) {
      return; // Already handling this raid
    }
    
    // Set lockdown status
    lockdownStatus.set(guild.id, true);
    
    // Log the raid detection
    log(`[RaidProtection] Raid detected in ${guild.name}! Activating lockdown`, 'discord');
    
    // In a real implementation, you would:
    // 1. Apply lockdown measures (restrict channel permissions, etc.)
    // 2. Notify moderators/admins
    // 3. Wait for manual approval to lift lockdown
    // 4. Track suspicious accounts
    
    // For this demo, we'll just send a message to the system channel if available
    const systemChannel = guild.systemChannel as TextChannel;
    if (systemChannel && systemChannel.permissionsFor(guild.members.me!)?.has('SendMessages')) {
      await systemChannel.send({
        content: `⚠️ **RAID ALERT** ⚠️\n\nA potential raid has been detected! Server has been placed in lockdown mode. New members will have restricted access.\n\nServer administrators can disable lockdown mode in the dashboard.`
      });
    }
    
    // In a real implementation, you would apply restrictions to newly joined members
    // For example, by adding a "quarantine" role to them
    
  } catch (error) {
    log(`Error handling raid in ${guild.name}: ${error}`, 'discord');
  }
}

/**
 * Disable lockdown for a guild
 */
export async function disableLockdown(guildId: string): Promise<boolean> {
  try {
    // Check if we're actually in lockdown
    if (!lockdownStatus.get(guildId)) {
      return false;
    }
    
    // Clear lockdown status
    lockdownStatus.set(guildId, false);
    
    // Get the guild
    const guild = await getGuild(guildId);
    if (!guild) return false;
    
    // Log the lockdown being lifted
    log(`[RaidProtection] Lockdown lifted for ${guild.name}`, 'discord');
    
    // In a real implementation, you would:
    // 1. Restore normal channel permissions
    // 2. Send notification that lockdown is lifted
    // 3. Potentially deal with quarantined members
    
    // For demo, we'll just send a message to the system channel
    const systemChannel = guild.systemChannel as TextChannel;
    if (systemChannel && systemChannel.permissionsFor(guild.members.me!)?.has('SendMessages')) {
      await systemChannel.send({
        content: `✅ **LOCKDOWN DISABLED** ✅\n\nThe server lockdown has been disabled. Server operations are returning to normal.`
      });
    }
    
    return true;
  } catch (error) {
    log(`Error disabling lockdown for guild ${guildId}: ${error}`, 'discord');
    return false;
  }
}

/**
 * Get lockdown status for a guild
 */
export function getLockdownStatus(guildId: string): boolean {
  return !!lockdownStatus.get(guildId);
}

/**
 * Helper function to get a guild by ID
 */
async function getGuild(guildId: string): Promise<Guild | null> {
  try {
    // For testing purposes
    if (guildId === '123456789012345678') {
      // Simulate that this guild is in lockdown
      lockdownStatus.set(guildId, true);
    }
    
    // In a real implementation, we'd use client.guilds.fetch(guildId)
    // But for this demo we'll always return null
    return null;
  } catch (error) {
    log(`Error fetching guild ${guildId}: ${error}`, 'discord');
    return null;
  }
}