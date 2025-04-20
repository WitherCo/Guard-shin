/**
 * Prefix Commands for Discord Bot (Server Integration)
 * 
 * This file provides interfaces between the Express server and the ESM-based Discord bot commands.
 * It imports the ESM prefix command handlers and adapts them for use in the TypeScript server environment.
 */

// Import the ESM-based prefix command handler from the bot implementation
import { handlePrefixCommand as handleEsmPrefixCommand } from '../../bot/commands/prefixCommandsESM.js';

// Define the simplified type for Discord messages
// This doesn't need to match the full Discord.js Message type
// Just needs to have the properties we use in our command handlers
interface SimplifiedMessage {
  content: string;
  author: {
    id: string;
    bot: boolean;
    tag: string;
  };
  guild?: {
    id: string;
    name: string;
    ownerId: string;
    [key: string]: any;
  } | null;
  reply: (response: any) => any;
  channel?: {
    send: (response: any) => any;
  };
  [key: string]: any;
}

/**
 * Handle prefix commands
 * This is a wrapper around the ESM version to provide TypeScript compatibility
 * 
 * @param message Simplified Discord message object
 * @param prefix Command prefix (e.g., ';')
 * @returns Promise that resolves when command is processed
 */
async function handlePrefixCommand(message: SimplifiedMessage, prefix: string): Promise<void> {
  try {
    // Pass the message to the ESM handler
    return await handleEsmPrefixCommand(message, prefix);
  } catch (error: any) {
    console.error('[DISCORD_PREFIX] Error in prefix command handler:', error?.message || 'Unknown error');
    throw error;
  }
}

// Export the handler for use in Express routes
export { handlePrefixCommand };