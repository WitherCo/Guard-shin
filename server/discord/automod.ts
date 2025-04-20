<<<<<<< HEAD
import { Client, Message, GuildMember } from 'discord.js';
import { log } from '../vite';

// Demo automod settings - in a real implementation these would come from your database
const profanityList = ['badword1', 'badword2', 'badword3'];
const spamThreshold = { count: 5, timeframe: 10000 }; // 5 messages in 10 seconds

// Cache for tracking message rates for spam detection
const messageCache: Map<string, { messages: number, firstTimestamp: number }> = new Map();

/**
 * Set up auto-moderation features for the bot
 */
export function setupAutoMod(client: Client) {
  // Listen for message events
  client.on('messageCreate', async (message: Message) => {
    if (message.author.bot) return; // Ignore bot messages
    if (!message.guild) return; // Ignore DMs
    
    try {
      // In a real implementation, check if automod is enabled for this guild
      // and load settings from database
      
      // Check for profanity
      const hasProfanity = checkProfanity(message.content);
      if (hasProfanity) {
        handleProfanity(message);
        return;
      }
      
      // Check for spam
      const isSpamming = await checkSpam(message);
      if (isSpamming) {
        handleSpam(message);
        return;
      }
      
      // Check for excessive mentions
      const hasMentionSpam = checkMentionSpam(message);
      if (hasMentionSpam) {
        handleMentionSpam(message);
        return;
      }
      
      // Add other automod features here: link checking, invite detection, etc.
      
    } catch (error) {
      log(`Error in automod: ${error}`, 'discord');
    }
  });
  
  // Listen for new members to check for raid patterns
  client.on('guildMemberAdd', (member: GuildMember) => {
    try {
      // DEMO: This is just a mock function for demonstration purposes
      // For a real implementation, you would:
      // 1. Track join rates and patterns
      // 2. Apply verification requirements or restrictions when suspicious activity is detected
      // 3. Notify moderators of potential raid activity
      
      // We'll simulate a raid at random times for demo purposes
      if (Math.random() < 0.01) { // 1% chance
        mockRaidSimulation(member.guild.id, member.guild.name);
      }
    } catch (error) {
      log(`Error in member join handler: ${error}`, 'discord');
    }
  });
}

/**
 * Check if a message contains profanity
 */
function checkProfanity(content: string): boolean {
  const normalized = content.toLowerCase();
  return profanityList.some(word => normalized.includes(word));
}

/**
 * Handle profanity violations
 */
async function handleProfanity(message: Message): Promise<void> {
  try {
    // In a real implementation, you would:
    // 1. Check the server's settings for how to handle profanity
    // 2. Apply appropriate actions (delete, warn, timeout, etc.)
    // 3. Log the violation to your database
    
    // For demo, we'll just delete the message and log
    await message.delete();
    log(`[AutoMod] Deleted message with profanity from ${message.author.tag} in ${message.guild?.name}`, 'discord');
  } catch (error) {
    log(`Error handling profanity: ${error}`, 'discord');
  }
}

/**
 * Check if a user is spamming
 */
async function checkSpam(message: Message): Promise<boolean> {
  const key = `${message.guild!.id}-${message.author.id}`;
  const now = Date.now();
  
  // Get or create user's spam data
  const userData = messageCache.get(key) || { messages: 0, firstTimestamp: now };
  
  // Check if we should reset the counter (if outside the timeframe)
  if (now - userData.firstTimestamp > spamThreshold.timeframe) {
    userData.messages = 1;
    userData.firstTimestamp = now;
  } else {
    userData.messages++;
  }
  
  // Update the cache
  messageCache.set(key, userData);
  
  // Check if threshold exceeded
  return userData.messages > spamThreshold.count;
}

/**
 * Handle spam violations
 */
async function handleSpam(message: Message): Promise<void> {
  try {
    // In a real implementation, you would:
    // 1. Check the server's settings for how to handle spam
    // 2. Apply appropriate actions (delete, timeout, etc.)
    // 3. Log the violation
    
    // For demo, we'll timeout the user
    const member = message.member;
    if (member && member.moderatable) {
      await member.timeout(5 * 60 * 1000, 'Spam detection'); // 5 minute timeout
      await message.reply({ content: `${message.author}, you have been timed out for spamming.` });
      log(`[AutoMod] Applied timeout to ${message.author.tag} in ${message.guild?.name} for spam`, 'discord');
    }
  } catch (error) {
    log(`Error handling spam: ${error}`, 'discord');
  }
}

/**
 * Check for excessive mentions in a message
 */
function checkMentionSpam(message: Message): boolean {
  const mentionCount = message.mentions.users.size + message.mentions.roles.size;
  return mentionCount > 5; // Threshold of 5 mentions
}

/**
 * Handle mention spam violations
 */
async function handleMentionSpam(message: Message): Promise<void> {
  try {
    // Delete message with excessive mentions
    await message.delete();
    
    // Warn the user
    const warningMessage = await message.channel.send(
      `${message.author}, please do not mass mention users or roles.`
    );
    
    // Auto-delete the warning after 10 seconds
    setTimeout(() => {
      warningMessage.delete().catch(e => log(`Error deleting warning message: ${e}`, 'discord'));
    }, 10000);
    
    log(`[AutoMod] Deleted message with mention spam from ${message.author.tag} in ${message.guild?.name}`, 'discord');
  } catch (error) {
    log(`Error handling mention spam: ${error}`, 'discord');
  }
}

/**
 * Simulate a raid for demonstration purposes
 */
function mockRaidSimulation(guildId: string, guildName: string): void {
  const joinCount = 20; // Simulate 20 members joining
  
  log(`[DEMO] Simulating a raid on server ${guildName}`, 'express');
  
  // In a real implementation, this would be actual joins being detected
  // For demo purposes, we're just logging and triggering raid detection
  log(`[DEMO] Simulated ${joinCount} joins on server ${guildName}`, 'express');
  
  // Notify about raid detection
  log(`[RaidProtection] Potential raid detected in server ${guildName} (${joinCount} joins in 60s)`, 'express');
}
=======
import { IStorage } from "../storage";
import { log } from "../vite";
import { Events } from "discord.js";

export function setupAutoMod(client: any, storage: IStorage) {
  log("Setting up auto-moderation");
  
  // In a real implementation, this would listen to Discord message events
  // and apply the auto-moderation rules
  
  client.on(Events.MessageCreate, async (message: any) => {
    if (message.author.bot) return;
    
    const serverId = message.guildId;
    if (!serverId) return;
    
    // Get auto-mod settings for this server
    const settings = await storage.getAutoModSettings(serverId);
    if (!settings) return;
    
    // Check if the message violates any auto-mod rules
    if (settings.profanityFilterEnabled) {
      await checkProfanity(message, settings, storage);
    }
    
    if (settings.linkFilterEnabled) {
      await checkLinks(message, settings, storage);
    }
    
    if (settings.spamDetectionEnabled) {
      await checkSpam(message, settings, storage);
    }
  });
  
  log("Auto-moderation setup complete");
}

// Mock implementation of the profanity filter
async function checkProfanity(message: any, settings: any, storage: IStorage) {
  // In a real implementation, this would check the message content against a list of profanity words
  const profanityWords = settings.profanityWords || [];
  
  const messageContent = message.content.toLowerCase();
  const containsProfanity = profanityWords.some(word => 
    messageContent.includes(word.toLowerCase())
  );
  
  if (containsProfanity) {
    // Create an infraction
    await storage.createInfraction({
      serverId: message.guildId,
      userId: message.author.id,
      username: message.author.username,
      moderatorId: "000000000000000000", // Bot ID
      moderatorName: "WickBot",
      type: "WARNING",
      reason: "Profanity detected in message",
      active: true,
      metadata: { 
        automated: true, 
        trigger: "profanity_filter",
        content: message.content
      }
    });
    
    // In a real implementation, this would delete the message
    // message.delete();
    log(`[AutoMod] Deleted message from ${message.author.username} for profanity`);
  }
}

// Mock implementation of the link filter
async function checkLinks(message: any, settings: any, storage: IStorage) {
  // In a real implementation, this would extract URLs from the message and check them
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const urls = message.content.match(urlRegex);
  
  if (!urls) return;
  
  const allowedLinks = settings.allowedLinks || [];
  const hasDisallowedLink = urls.some(url => {
    try {
      const domain = new URL(url).hostname;
      return !allowedLinks.some(allowed => domain.includes(allowed));
    } catch {
      return false;
    }
  });
  
  if (hasDisallowedLink) {
    // Create an infraction
    await storage.createInfraction({
      serverId: message.guildId,
      userId: message.author.id,
      username: message.author.username,
      moderatorId: "000000000000000000", // Bot ID
      moderatorName: "WickBot",
      type: "WARNING",
      reason: "Disallowed link posted",
      active: true,
      metadata: { 
        automated: true, 
        trigger: "link_filter",
        content: message.content
      }
    });
    
    // In a real implementation, this would delete the message
    // message.delete();
    log(`[AutoMod] Deleted message from ${message.author.username} for disallowed link`);
  }
}

// Mock implementation of spam detection
// In a real implementation, we would keep track of recent messages per user
const userMessageCounts = new Map<string, { count: number, lastMessage: Date }>();

async function checkSpam(message: any, settings: any, storage: IStorage) {
  const userId = message.author.id;
  const serverId = message.guildId;
  const key = `${serverId}-${userId}`;
  
  const now = new Date();
  const userMessages = userMessageCounts.get(key) || { count: 0, lastMessage: now };
  
  // Reset counter if it's been longer than the time window
  const timeWindowMs = (settings.spamTimeWindow || 5) * 1000;
  if (now.getTime() - userMessages.lastMessage.getTime() > timeWindowMs) {
    userMessages.count = 0;
  }
  
  // Increment message count
  userMessages.count++;
  userMessages.lastMessage = now;
  userMessageCounts.set(key, userMessages);
  
  // Check if user has exceeded threshold
  if (userMessages.count > (settings.spamThreshold || 5)) {
    // Create an infraction for timeout
    await storage.createInfraction({
      serverId,
      userId,
      username: message.author.username,
      moderatorId: "000000000000000000", // Bot ID
      moderatorName: "WickBot",
      type: "TIMEOUT",
      reason: "Spam detection triggered",
      duration: 300, // 5 minutes
      active: true,
      expiresAt: new Date(now.getTime() + 300 * 1000),
      metadata: { 
        automated: true, 
        trigger: "spam_detection",
        messageCount: userMessages.count,
        timeWindow: settings.spamTimeWindow
      }
    });
    
    // Reset counter after taking action
    userMessageCounts.delete(key);
    
    // In a real implementation, this would timeout the user
    log(`[AutoMod] Timed out ${message.author.username} for spamming (${userMessages.count} messages in ${settings.spamTimeWindow}s)`);
  }
}
>>>>>>> ae9502e (Add basic UI components and routing for Discord bot.)
