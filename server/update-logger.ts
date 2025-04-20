/**
 * Update Logger
 * 
 * This module handles logging updates to a Discord webhook.
 * It can be used to monitor changes and activities in the application.
 */

import fetch from 'node-fetch';
import { log } from './vite';

// Default webhook URL (will be overridden by environment variable if available)
const DEFAULT_WEBHOOK_URL = '';

// Queue for batching updates
const updateQueue: { message: string; category?: string }[] = [];
let flushTimeout: NodeJS.Timeout | null = null;
const FLUSH_INTERVAL = 5000; // 5 seconds

/**
 * Log an update to Discord webhook
 * 
 * @param message The message to log
 * @param category Optional category for the message
 * @returns Promise that resolves when the message is sent
 */
export async function logUpdate(message: string, category?: string): Promise<void> {
  // Add to queue
  updateQueue.push({ message, category });
  
  // Schedule flush if not already scheduled
  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushUpdates();
    }, FLUSH_INTERVAL);
  }
}

/**
 * Force flush all pending updates
 * 
 * @returns Promise that resolves when all updates are sent
 */
export async function forceFlushUpdates(): Promise<void> {
  if (flushTimeout) {
    clearTimeout(flushTimeout);
    flushTimeout = null;
  }
  
  return flushUpdates();
}

/**
 * Flush the update queue
 * 
 * @returns Promise that resolves when all updates are sent
 */
async function flushUpdates(): Promise<void> {
  // Reset the flush timeout
  flushTimeout = null;
  
  // If queue is empty, do nothing
  if (updateQueue.length === 0) {
    return;
  }
  
  try {
    // Get webhook URL from environment variable
    const webhookUrl = process.env.UPDATE_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
    
    if (!webhookUrl) {
      log('No webhook URL configured for update logging', 'warn');
      // Clear the queue even if we can't send
      updateQueue.length = 0;
      return;
    }
    
    // If only one update, send it as normal
    if (updateQueue.length === 1) {
      const { message, category } = updateQueue[0];
      await sendSingleUpdate(message, category, webhookUrl);
    } else {
      // If multiple updates, batch them
      await sendBatchUpdates(webhookUrl);
    }
    
    // Clear the queue
    updateQueue.length = 0;
  } catch (error) {
    log(`Error flushing updates: ${error}`, 'error');
  }
}

/**
 * Send a single update to Discord webhook
 * 
 * @param message The message to log
 * @param category Optional category for the message
 * @param webhookUrl The webhook URL
 * @returns Promise that resolves when the message is sent
 */
async function sendSingleUpdate(message: string, category: string | undefined, webhookUrl: string): Promise<void> {
  try {
    // Format message with category if provided
    const formattedMessage = category ? `[${category.toUpperCase()}] ${message}` : message;
    
    // Create embed for Discord webhook
    const embed = {
      title: "Lifeless rose updated:",
      description: formattedMessage,
      color: 0x7289DA, // Discord blurple color
      timestamp: new Date().toISOString(),
    };
    
    // Send to webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      log(`Failed to send update to webhook: ${response.status} ${errorText}`, 'error');
    }
  } catch (error) {
    log(`Error sending single update: ${error}`, 'error');
  }
}

/**
 * Send batch updates to Discord webhook
 * 
 * @param webhookUrl The webhook URL
 * @returns Promise that resolves when all updates are sent
 */
async function sendBatchUpdates(webhookUrl: string): Promise<void> {
  try {
    // Group updates by category
    const categoryMap = new Map<string, string[]>();
    
    // Add all updates to their respective categories
    for (const { message, category } of updateQueue) {
      const cat = category || 'general';
      if (!categoryMap.has(cat)) {
        categoryMap.set(cat, []);
      }
      categoryMap.get(cat)!.push(message);
    }
    
    // Create embed fields for each category
    const fields = Array.from(categoryMap.entries()).map(([category, messages]) => ({
      name: category.toUpperCase(),
      value: messages.join('\n'),
    }));
    
    // Create embed for Discord webhook
    const embed = {
      title: "Lifeless rose updated:",
      fields,
      color: 0x7289DA, // Discord blurple color
      timestamp: new Date().toISOString(),
    };
    
    // Send to webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embed],
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      log(`Failed to send batch updates to webhook: ${response.status} ${errorText}`, 'error');
    }
  } catch (error) {
    log(`Error sending batch updates: ${error}`, 'error');
  }
}

/**
 * Log a feature update to Discord webhook
 * 
 * @param feature The feature that was updated
 * @param description What was updated
 * @returns Promise that resolves when the message is sent
 */
export async function logFeatureUpdate(feature: string, description: string): Promise<void> {
  const message = `Feature update: ${feature} - ${description}`;
  return logUpdate(message, 'feature');
}

/**
 * Log a bug fix to Discord webhook
 * 
 * @param bug The bug that was fixed
 * @param description How it was fixed
 * @returns Promise that resolves when the message is sent
 */
export async function logBugFix(bug: string, description: string): Promise<void> {
  const message = `Bug fix: ${bug} - ${description}`;
  return logUpdate(message, 'bugfix');
}

/**
 * Log a server action to Discord webhook
 * 
 * @param action The action performed
 * @param serverId The server ID
 * @param serverName The server name
 * @param performedBy Who performed the action (username or Discord ID)
 * @returns Promise that resolves when the message is sent
 */
export async function logServerAction(
  action: string,
  serverId: string,
  serverName: string,
  performedBy: string
): Promise<void> {
  const message = `${action} for server "${serverName}" (${serverId}) by ${performedBy}`;
  return logUpdate(message, 'server');
}

/**
 * Log a premium subscription action to Discord webhook
 * 
 * @param action The action performed (subscribe, upgrade, cancel, etc.)
 * @param userId The user ID
 * @param username The username
 * @param tier The subscription tier
 * @returns Promise that resolves when the message is sent
 */
export async function logSubscriptionAction(
  action: string,
  userId: number,
  username: string,
  tier: string
): Promise<void> {
  const message = `${action} subscription (tier: ${tier}) for user "${username}" (ID: ${userId})`;
  return logUpdate(message, 'subscription');
}

/**
 * Log an authentication action to Discord webhook
 * 
 * @param action The action performed (login, register, logout, etc.)
 * @param userId The user ID
 * @param username The username
 * @param method The authentication method (local, discord, etc.)
 * @returns Promise that resolves when the message is sent
 */
export async function logAuthAction(
  action: string,
  userId: number | string,
  username: string,
  method: string
): Promise<void> {
  const message = `${action} (method: ${method}) for user "${username}" (ID: ${userId})`;
  return logUpdate(message, 'auth');
}

/**
 * Log a moderation action to Discord webhook
 * 
 * @param action The action performed (ban, kick, mute, etc.)
 * @param targetId The target user ID
 * @param targetName The target username
 * @param serverId The server ID
 * @param serverName The server name
 * @param moderatorId The moderator ID
 * @param moderatorName The moderator name
 * @returns Promise that resolves when the message is sent
 */
export async function logModerationAction(
  action: string,
  targetId: string,
  targetName: string,
  serverId: string,
  serverName: string,
  moderatorId: string,
  moderatorName: string
): Promise<void> {
  const message = `${action} user "${targetName}" (${targetId}) in server "${serverName}" (${serverId}) by moderator "${moderatorName}" (${moderatorId})`;
  return logUpdate(message, 'moderation');
}