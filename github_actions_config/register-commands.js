/**
 * Discord Slash Command Registration Script
 * 
 * This script registers all slash commands with Discord.
 * It should be run when commands are added or updated.
 */

const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');

// Load environment variables
const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

// Check if required environment variables are set
if (!token) {
  console.error('DISCORD_BOT_TOKEN is not set');
  process.exit(1);
}

if (!clientId) {
  console.error('DISCORD_CLIENT_ID is not set');
  process.exit(1);
}

// Initialize REST API client
const rest = new REST({ version: '9' }).setToken(token);

/**
 * Load all command files and register them with Discord
 */
async function registerCommands() {
  try {
    console.log('Started refreshing slash commands...');
    
    // Array to hold command data
    const commands = [];
    
    // Location of command files (adjust as needed)
    const commandsPath = path.join(__dirname, 'bot/commands');
    
    // Check if the directory exists
    if (fs.existsSync(commandsPath)) {
      // Read all command files
      const commandFiles = fs.readdirSync(commandsPath).filter(file => 
        file.endsWith('.js') || file.endsWith('.ts')
      );
      
      // Load each command
      for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        const command = require(filePath);
        
        // Add to commands array if it has a data property and an execute method
        if ('data' in command && 'execute' in command) {
          commands.push(command.data.toJSON());
        } else {
          console.warn(`The command at ${filePath} is missing required "data" or "execute" properties`);
        }
      }
    } else {
      console.warn(`Commands directory not found at ${commandsPath}`);
    }
    
    // Check if we have any commands to register
    if (commands.length === 0) {
      console.warn('No commands found to register');
      return;
    }
    
    // Register commands globally
    await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );
    
    console.log(`Successfully registered ${commands.length} application commands`);
    
    // Send notification to update webhook
    const updateWebhookUrl = process.env.UPDATE_WEBHOOK_URL;
    if (updateWebhookUrl) {
      const https = require('https');
      const data = JSON.stringify({
        content: `Lifeless rose updated: Registered ${commands.length} slash commands successfully!`
      });
      
      const url = new URL(updateWebhookUrl);
      const options = {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };
      
      const req = https.request(options, (res) => {
        console.log(`Webhook notification sent with status: ${res.statusCode}`);
      });
      
      req.on('error', (error) => {
        console.error('Error sending webhook notification:', error);
      });
      
      req.write(data);
      req.end();
    }
  } catch (error) {
    console.error('Error registering commands:', error);
  }
}

// Execute the registration function
registerCommands();