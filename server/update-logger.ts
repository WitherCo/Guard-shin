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

/**
 * Log an update to Discord webhook
 * 
 * @param message The message to log
 * @param category Optional category for the message
 * @returns Promise that resolves when the message is sent
 */
export async function logUpdate(message: string, category?: string): Promise<void> {
  try {
    // Get webhook URL from environment variable
    const webhookUrl = process.env.UPDATE_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;
    
    if (!webhookUrl) {
      log('No webhook URL configured for update logging', 'warn');
      return;
    }
    
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
    log(`Error logging update: ${error}`, 'error');
  }
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