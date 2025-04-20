import { Client, GatewayIntentBits, Guild } from 'discord.js';
import { Server } from '@shared/schema';
import { log } from '../vite';
import { setupCommands } from './commands';
import { setupAutoMod } from './automod';
import { setupRaidProtection } from './raidProtection';
import { handlePrefixCommand } from './prefixCommands';
// No need to import music player setup as JagroshBot implementation is self-initializing
// Simple wrapper function for TypeScript compatibility
function setupMusicPlayer(client: any) {
  log('Using JagroshBot-inspired music player which is self-initializing', 'express');
  return true;
}
import { logUpdate, forceFlushUpdates } from '../update-logger';

// Create Discord client with necessary intents
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
    // Music-related intents
    GatewayIntentBits.GuildVoiceStates,
  ]
});

let isInitialized = false;

/**
 * Initialize the Discord bot
 */
export async function initializeDiscordBot() {
  // Try Guard-shin token first, fall back to original token
  const guardShinToken = process.env.GUARD_SHIN_BOT_TOKEN;
  const originalToken = process.env.DISCORD_BOT_TOKEN;
  
  // Set the correct client ID for the Guard-shin bot
  process.env.DISCORD_CLIENT_ID = '1361873604882731008';
  
  if (!guardShinToken && !originalToken) {
    log('Initializing Discord bot (mock implementation - no bot tokens available)', 'express');
    // Return mock implementation when no tokens are available
    return {
      isInitialized: true,
      getGuilds: async () => [],
      getGuild: async () => null,
      getMemberCount: async () => 0,
      sendGuildMessage: async () => false,
    };
  }
  
  log('Initializing Discord bot with real implementation', 'express');
  
  client.once('ready', async () => {
    log(`Logged in as ${client.user?.tag}!`, 'discord');
    isInitialized = true;
    
    // JagroshBot-inspired music player is self-initializing
    log('JagroshBot-inspired music player active', 'express');
    log('Music player ready', 'express');
    
    // Initialize AutoMod rules for all guilds to earn the AutoMod badge
    try {
      log('Initializing AutoMod rules to earn the AutoMod badge...', 'discord');
      
      // Import using dynamic import for ESM compatibility
      const autoModRules = await import('../../bot/commands/automod/discordAutoModRules.js');
      
      if (autoModRules && autoModRules.default && typeof autoModRules.default.initializeAutoModRulesForAllGuilds === 'function') {
        await autoModRules.default.initializeAutoModRulesForAllGuilds(client);
        
        // Log successful automod setup
        logUpdate("Added 100 AutoMod rules to qualify for the Discord AutoMod badge", "features")
          .catch(err => console.error('[AutoMod] Error logging update:', err));
      } else {
        log('AutoMod rules initialization function not found', 'discord');
      }
    } catch (error) {
      log(`Error initializing AutoMod rules: ${error}`, 'discord');
    }
    
    // Log successful music feature setup
    logUpdate("Added music player functionality with play, skip, stop, and more commands!", "features")
      .catch(err => console.error('[Music] Error logging update:', err));
      
    // Log bot start with combined updates
    logUpdate("Bot and dashboard started successfully", "system")
      .then(() => forceFlushUpdates())
      .catch(err => console.error('[Bot] Error logging updates:', err));
  });
  
  // Setup Discord modules
  log('Setting up Discord bot commands', 'express');
  setupCommands(client);
  log('Discord commands setup complete', 'express');
  
  log('Setting up auto-moderation', 'express');
  setupAutoMod(client);
  log('Auto-moderation setup complete', 'express');
  
  log('Setting up raid protection', 'express');
  setupRaidProtection(client);
  log('Raid protection setup complete', 'express');
  
  // Setup prefix command handler
  log('Setting up prefix commands', 'express');
  client.on('messageCreate', async (message) => {
    const prefix = process.env.PREFIX || ';';
    
    // Special test command that doesn't rely on the handler
    if (message.content === ';directtest' && message.guild) {
      log('[PREFIX DEBUG] Direct test command received', 'discord');
      message.reply('✅ Direct test command successful! This bypasses the handler.');
      return;
    }
    
    // Process prefix commands through our handler
    try {
      await handlePrefixCommand(message, prefix);
    } catch (error) {
      log(`Error processing prefix command: ${error}`, 'discord');
    }
  });
  log('Prefix commands setup complete', 'express');
  
  // Try to login with Guard-shin token first
  if (guardShinToken) {
    try {
      log('Attempting to login with GUARD_SHIN_BOT_TOKEN', 'express');
      await client.login(guardShinToken);
      log('Discord bot initialization complete using Guard-shin token', 'express');
    } catch (error) {
      log(`Failed to login with Guard-shin token: ${error}`, 'express');
      
      // If Guard-shin token fails and we have the original token, try that instead
      if (originalToken) {
        try {
          log('Attempting to login with DISCORD_BOT_TOKEN', 'express');
          await client.login(originalToken);
          log('Discord bot initialization complete using original token', 'express');
        } catch (error) {
          log(`Failed to login with original token: ${error}`, 'express');
          throw error;
        }
      } else {
        throw error;
      }
    }
  } else if (originalToken) {
    // If no Guard-shin token, try the original token
    try {
      log('Attempting to login with DISCORD_BOT_TOKEN', 'express');
      await client.login(originalToken);
      log('Discord bot initialization complete using original token', 'express');
    } catch (error) {
      log(`Failed to login with original token: ${error}`, 'express');
      throw error;
    }
  }
  
  return {
    isInitialized: true,
    /**
     * Get all guilds the bot is a member of
     */
    getGuilds: async (): Promise<Partial<Server>[]> => {
      const guilds = Array.from(client.guilds.cache.values());
      
      return Promise.all(
        guilds.map(async (guild) => {
          const memberCount = await getMemberCount(guild);
          
          return {
            id: guild.id,
            name: guild.name,
            icon: guild.icon,
            memberCount,
            ownerId: guild.ownerId,
            joinedAt: guild.joinedAt,
            // Add premium status based on your criteria
            premium: guild.premiumSubscriptionCount ? guild.premiumSubscriptionCount > 0 : false,
          };
        })
      );
    },
    
    /**
     * Get a specific guild by ID
     */
    getGuild: async (guildId: string): Promise<Partial<Server> | null> => {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return null;
      
      const memberCount = await getMemberCount(guild);
      
      return {
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        memberCount,
        ownerId: guild.ownerId,
        joinedAt: guild.joinedAt,
        // Add premium status based on your criteria
        premium: guild.premiumSubscriptionCount ? guild.premiumSubscriptionCount > 0 : false,
      };
    },
    
    /**
     * Get member count for a guild
     */
    getMemberCount: async (guildId: string): Promise<number> => {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return 0;
      
      return getMemberCount(guild);
    },
    
    /**
     * Send a message to a channel in a guild
     */
    sendGuildMessage: async (guildId: string, channelId: string, message: string): Promise<boolean> => {
      try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return false;
        
        const channel = guild.channels.cache.get(channelId);
        if (!channel || !channel.isTextBased()) return false;
        
        await channel.send(message);
        return true;
      } catch (error) {
        log(`Error sending message: ${error}`, 'discord');
        return false;
      }
    }
  };
}

/**
 * Get member count for a guild
 */
async function getMemberCount(guild: Guild): Promise<number> {
  try {
    // Try to get approximate member count first
    if (guild.approximateMemberCount) {
      return guild.approximateMemberCount;
    }
    
    // Fetch all members if not available (this can be slow for large guilds)
    await guild.members.fetch();
    return guild.members.cache.size;
  } catch (error) {
    log(`Error fetching member count: ${error}`, 'discord');
    // Return the cached count as fallback
    return guild.memberCount;
  }
}

export default initializeDiscordBot;