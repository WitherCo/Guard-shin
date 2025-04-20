/**
 * Discord Bot Initialization
 * 
 * This module initializes the Discord bot and exports it for use in the main application.
 */

import { Client, GatewayIntentBits, Events } from 'discord.js';
import { log } from '../vite';

export async function initializeDiscordBot() {
  // Check if Guard-shin bot token exists
  if (!process.env.GUARD_SHIN_BOT_TOKEN) {
    log('No Guard-shin bot token found. Discord bot will not start.', 'discord');
    return null;
  }

  // Create Discord client with necessary intents
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildModeration
    ]
  });

  // Set up event handlers
  client.once(Events.ClientReady, (readyClient) => {
    log(`Guard-shin bot logged in as ${readyClient.user.tag}`, 'discord');
  });

  // Handle errors
  client.on(Events.Error, (error) => {
    log(`Guard-shin bot error: ${error.message}`, 'discord');
  });

  // Login to Discord
  try {
    await client.login(process.env.GUARD_SHIN_BOT_TOKEN);
    return client;
  } catch (error) {
    log(`Failed to initialize Guard-shin bot: ${error}`, 'discord');
    return null;
  }
}