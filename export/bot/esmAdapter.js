/**
 * ESM Adapter for Discord Bot
 * 
 * This file acts as a bridge between ESM and CommonJS modules,
 * allowing the project to use the bot functionality without
 * needing to convert all files at once.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Import Discord.js ESM version
import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';

// Local test implementation of prefix commands
const prefixCommands = new Collection();
const testCommands = [
  { 
    name: 'test', 
    description: 'Test command to verify prefix commands work',
    execute: async (message, args) => {
      console.log('[PREFIX] Test command executed!');
      return message.reply('✅ Test command successful! Prefix commands are working correctly.');
    }
  },
  {
    name: 'ping',
    description: 'Simple ping command to test latency',
    execute: async (message, args) => {
      const sent = await message.reply('Pinging...');
      const timeDiff = sent.createdTimestamp - message.createdTimestamp;
      return sent.edit(`Pong! 🏓 Round-trip latency: ${timeDiff}ms`);
    }
  }
];

// Add test commands to the collection
testCommands.forEach(cmd => {
  prefixCommands.set(cmd.name, cmd);
});

// Handle prefix commands
async function handlePrefixCommand(message, prefix) {
  // Ignore messages from bots or messages that don't start with the prefix
  if (message.author.bot || !message.content.startsWith(prefix)) return;
  
  console.log(`[PREFIX] Processing command: ${message.content}`);
  
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  console.log(`[PREFIX] Command name: "${commandName}", Available commands:`, Array.from(prefixCommands.keys()));
  
  const command = prefixCommands.get(commandName);
  
  if (!command) {
    console.log(`[PREFIX] Command not found: ${commandName}`);
    return;
  }
  
  try {
    console.log(`[PREFIX] Executing command: ${command.name}`);
    await command.execute(message, args);
    console.log(`[PREFIX] Command executed successfully: ${command.name}`);
  } catch (error) {
    console.error(`[PREFIX] Error executing command ${commandName}:`, error);
    message.reply('There was an error executing that command!');
  }
}

// Initialize the client with necessary intents
function createDiscordClient() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions,
    ],
    partials: [
      Partials.Channel,
      Partials.Message,
      Partials.Reaction,
      Partials.User,
      Partials.GuildMember,
    ],
  });
  
  // Setup message handler for prefix commands
  client.on('messageCreate', async message => {
    const prefix = process.env.PREFIX || ';';
    
    // Special test command that doesn't rely on the handler
    if (message.content === ';directtest' && message.guild) {
      console.log('[PREFIX DEBUG] Direct test command received');
      return message.reply('✅ Direct test command successful! This bypasses the handler.');
    }
    
    // Handle prefix commands with our handler
    try {
      await handlePrefixCommand(message, prefix);
    } catch (error) {
      console.error(`[PREFIX DEBUG] Error processing command: ${error.message}`);
      console.error(error);
    }
  });
  
  // Setup for when the bot is ready
  client.once('ready', () => {
    console.log(`[ESM Adapter] Bot is ready! Logged in as ${client.user.tag}`);
  });
  
  return client;
}

// Export everything needed for the bot
export {
  createDiscordClient,
  prefixCommands,
  handlePrefixCommand
};