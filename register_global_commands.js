/**
 * Guard-shin Global Command Registration for Team-Owned Bot
 * 
 * This script registers commands globally for a team-owned bot.
 * It must be run by someone with the proper permissions in the Discord Developer Portal.
 * 
 * Usage:
 *   node register_global_commands.js
 */

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const fs = require('fs');
require('dotenv').config();

// Load the commands to register
let commands = [];

try {
  // Try to load from our comprehensive json file first
  const jsonCommands = require('./complete_commands_for_registration.json');
  
  // If we have a commands property, use that. Otherwise, assume the whole file is commands
  commands = Array.isArray(jsonCommands.commands) ? jsonCommands.commands : jsonCommands;
  
  console.log(`Loaded ${commands.length} commands from complete_commands_for_registration.json`);
} catch (error) {
  console.error('Failed to load commands from complete_commands_for_registration.json:', error.message);
  console.log('Trying to load commands from fixed_commands.json...');
  
  try {
    // Fallback to fixed_commands.json
    const jsonCommands = require('./fixed_commands.json');
    commands = Array.isArray(jsonCommands.commands) ? jsonCommands.commands : jsonCommands;
    console.log(`Loaded ${commands.length} commands from fixed_commands.json`);
  } catch (err) {
    console.error('Failed to load commands from fixed_commands.json:', err.message);
    console.log('Failed to load commands from any source. Make sure one of the command JSON files exists.');
    process.exit(1);
  }
}

// Make sure we have Discord bot credentials
const token = process.env.DISCORD_BOT_TOKEN || process.env.GUARD_SHIN_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID || '1361873604882731008'; // Default to known client ID

if (!token) {
  console.error('No Discord bot token found. Please set the DISCORD_BOT_TOKEN or GUARD_SHIN_BOT_TOKEN environment variable.');
  process.exit(1);
}

if (!clientId) {
  console.error('No client ID found. Please set the DISCORD_CLIENT_ID environment variable.');
  process.exit(1);
}

// Create REST instance
const rest = new REST({ version: '10' }).setToken(token);

async function registerCommands() {
  try {
    console.log('Started refreshing application (/) commands globally...');
    
    // Log first few commands for verification
    console.log('First 3 commands being registered:');
    commands.slice(0, 3).forEach(cmd => {
      console.log(`- ${cmd.name}: ${cmd.description}`);
    });
    
    // Register commands globally
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );
    
    console.log('Successfully registered application commands globally.');
    // Save the registered commands to a file for reference
    fs.writeFileSync('registered_commands.json', JSON.stringify(commands, null, 2));
    console.log('Saved registered commands to registered_commands.json');
  } catch (error) {
    console.error('Error registering commands:', error);
    // If it's a 403 error with code 20012, provide specific guidance
    if (error.code === 20012 || (error.status === 403 && error.message.includes('20012'))) {
      console.error(`
======================================================================
ERROR 20012: Not authorized to register commands for this application.
----------------------------------------------------------------------
This error occurs because the bot is owned by a team, and you are not
authorized to register commands for it. 

To fix this, you need:

1. The team owner or an admin with the proper permissions must run this
   script with their token, or
   
2. Add your user as a team member with Admin or Developer permissions
   in the Discord Developer Portal:
   https://discord.com/developers/applications/1361873604882731008/team
   
3. Make sure the token you're using is for the correct application ID
   (${clientId})
======================================================================
`);
    }
  }
}

registerCommands();