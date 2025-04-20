const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
// Import our command handlers
const { prefixCommands, handlePrefixCommand } = require('./commands/prefixCommands');
const { slashCommands, deploySlashCommands, handleSlashCommand } = require('./commands/slashCommands');

// Premium role IDs - moved to utils/premiumCheck.js
const { PREMIUM_ROLE_ID, PREMIUM_PLUS_ROLE_ID } = require('./utils/premiumCheck');

// Initialize Discord client with all intents and partials
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

// Collections for commands and events
client.commands = new Collection();
client.events = new Collection();
client.cooldowns = new Collection();
client.premiumCommands = new Collection();

// Premium commands list
const premiumCommands = [
  'antialt',
  'customcmd',
  'advancedautomod',
  'raidplus',
  'verifyplus',
  'fulllogs'
];

// Python bot process
let pythonProcess = null;
let luaProcess = null;

// Start Python bot
function startPythonBot() {
  console.log('Starting Python bot...');
  const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
  pythonProcess = spawn(pythonPath, [path.join(__dirname, '../bot/python/main.py')]);
  
  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Python] ${data.toString().trim()}`);
  });
  
  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python Error] ${data.toString().trim()}`);
  });
  
  pythonProcess.on('close', (code) => {
    console.log(`Python bot exited with code ${code}`);
    if (code !== 0) {
      // Restart Python bot if it crashes
      setTimeout(startPythonBot, 5000);
    }
  });
}

// Start Lua components
function startLuaComponents() {
  console.log('Starting Lua components...');
  const luaPath = process.platform === 'win32' ? 'lua' : 'lua5.4';
  luaProcess = spawn(luaPath, [path.join(__dirname, '../bot/lua/main.lua')]);
  
  luaProcess.stdout.on('data', (data) => {
    console.log(`[Lua] ${data.toString().trim()}`);
  });
  
  luaProcess.stderr.on('data', (data) => {
    console.error(`[Lua Error] ${data.toString().trim()}`);
  });
  
  luaProcess.on('close', (code) => {
    console.log(`Lua components exited with code ${code}`);
    if (code !== 0) {
      // Restart Lua components if they crash
      setTimeout(startLuaComponents, 5000);
    }
  });
}

// Initialize the bot
function initBot() {
  // Load commands
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      
      // Check if this is a premium command
      if (premiumCommands.includes(command.data.name)) {
        client.premiumCommands.set(command.data.name, command);
      }
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing required "data" or "execute" property.`);
    }
  }
  
  // Load events
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
  
  // Setup message handler for prefix commands
  client.on('messageCreate', async message => {
    // Default prefix is ';' but can be customized per server
    const prefix = process.env.PREFIX || ';';
    
    // Create a special channel for command debugging
    const DEBUG_CHANNEL_ID = '1233495879223345172'; // Support server ID for testing
    
    // Special test command that doesn't rely on the handler
    if (message.content === ';directtest' && message.guild && message.guild.id === DEBUG_CHANNEL_ID) {
      console.log('[PREFIX DEBUG] Direct test command received');
      return message.reply('✅ Direct test command successful! This bypasses the handler.');
    }
    
    // Log incoming messages for debugging prefix commands
    if (message.content.startsWith(prefix)) {
      console.log(`[PREFIX DEBUG] Received command: ${message.content}`);
      
      // Special debug output for test commands in the debug channel
      if (message.guild && message.guild.id === DEBUG_CHANNEL_ID) {
        console.log('[PREFIX DEBUG] Command received in debug guild');
        console.log('[PREFIX DEBUG] Available commands:', Array.from(prefixCommands.keys()));
      }
    }
    
    // Handle prefix commands with our handler
    try {
      await handlePrefixCommand(message, prefix);
      if (message.content.startsWith(prefix)) {
        console.log(`[PREFIX DEBUG] Successfully processed command: ${message.content}`);
      }
    } catch (error) {
      console.error(`[PREFIX DEBUG] Error processing command: ${error.message}`);
      console.error(error);
    }
  });
  
  // Setup interaction create handler for slash commands
  client.on('interactionCreate', async interaction => {
    // Handle slash commands with our handler
    if (interaction.isCommand()) {
      await handleSlashCommand(interaction);
    }
  });
  
  // Deploy slash commands when the bot is ready
  client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Deploy our slash commands to Discord
    await deploySlashCommands(client);
  });
  
  // Bot login
  client.login(process.env.DISCORD_BOT_TOKEN);
}

// Start the bot and its components
initBot();
startPythonBot();
startLuaComponents();

// Export both the client and commands for other modules to use
module.exports = {
  client,
  prefixCommands,
  slashCommands
};