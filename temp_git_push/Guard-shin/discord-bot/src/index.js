// Require the necessary discord.js classes
const { Client, GatewayIntentBits, Events, Collection } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config();

// Create a new client instance with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildModeration,
  ]
});

// Initialize collections for commands and cooldowns
client.commands = new Collection();
client.cooldowns = new Collection();

// Load command files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Load event files
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Initialize moderation systems
const { setupAutoMod } = require('./moderation/automod');
const { setupRaidProtection } = require('./moderation/raidProtection');
const { startInfractionExpiryChecker } = require('./moderation/infractions');

// Set up moderation systems
setupAutoMod(client);
setupRaidProtection(client);
startInfractionExpiryChecker();

// Log in to Discord with your client's token
const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('[ERROR] No Discord token provided. Please set the DISCORD_TOKEN environment variable.');
  process.exit(1);
}

client.login(token).catch(error => {
  console.error('[ERROR] Failed to log in to Discord:', error);
  process.exit(1);
});