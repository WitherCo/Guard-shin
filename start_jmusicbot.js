/**
 * JMusicBot Setup and Launcher
 * 
 * This script will set up JMusicBot, creating necessary configuration files
 * and launching the bot using the child_process module to run Java.
 */
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

// Configuration
const JMUSICBOT_JAR = 'attached_assets/JMusicBot-cd40e2e5-potoken-iprotation (1).jar';
const CONFIG_FILE = 'config.txt';

// Check if Java is installed
function checkJava() {
  return new Promise((resolve, reject) => {
    const java = spawn('java', ['-version']);
    
    java.on('error', (error) => {
      console.error('❌ Java is not installed or not found in PATH.');
      console.error('Please install Java to run JMusicBot.');
      reject(error);
    });
    
    java.stderr.on('data', (data) => {
      console.log(`✅ Java detected: ${data.toString().trim()}`);
      resolve(true);
    });
    
    java.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`Java check exited with code ${code}`));
      }
    });
  });
}

// Check if the JAR file exists
function checkJMusicBotJar() {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(JMUSICBOT_JAR)) {
      console.log(`✅ JMusicBot JAR found at ${JMUSICBOT_JAR}`);
      return resolve(true);
    } else {
      reject(new Error(`JMusicBot JAR not found at ${JMUSICBOT_JAR}. Please make sure the JAR file exists.`));
    }
  });
}

// Create a config file if it doesn't exist
function createConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    console.log(`✅ Configuration file found at ${CONFIG_FILE}`);
    return;
  }
  
  console.log(`⏳ Creating default configuration file...`);
  
  // Default configuration
  const config = `# JMusicBot Configuration File
# ================================

# This file contains the core settings for JMusicBot. 
# You need to edit this file when you first set up your bot.

# The bot token from Discord
# If using JDA, keep this private!
token=${process.env.DISCORD_BOT_TOKEN || 'YOUR_TOKEN_HERE'}

# The bot's owner ID
# This is your Discord user ID (NOT your bot ID)
owner=${process.env.DISCORD_OWNER_ID || '0'}

# This sets the prefix for the bot
# The prefix is used to control the commands
# If you use an @mention, you can escape your own mentions using \\
prefix=;

# Music settings
# Your bot will stay in the voice channel even when alone
stayinchannel=true

# Show the current song in the bot's status
songinstatus=true

# Show embedded artwork in nowplaying messages
npimages=true

# Use YTSEARCH for YouTube by default
ytformat=251,140

# Maximum allowed song length (in seconds)
# Note: This can be overridden using the DJ role
maxseconds=7200

# The path to the playlists folder
# Absolute paths work as well
playlistfolder=playlists
`;
  
  fs.writeFileSync(CONFIG_FILE, config);
  console.log(`✅ Default configuration created at ${CONFIG_FILE}`);
  console.log(`⚠️ Please review and adjust settings in ${CONFIG_FILE} as needed.`);
}

// Run the JMusicBot
function startJMusicBot() {
  console.log(`🎵 Starting JMusicBot...`);
  
  const jmusicbot = spawn('java', ['-Dnogui=true', '-jar', JMUSICBOT_JAR]);
  
  jmusicbot.stdout.on('data', (data) => {
    console.log(`[JMusicBot] ${data.toString().trim()}`);
  });
  
  jmusicbot.stderr.on('data', (data) => {
    console.error(`[JMusicBot Error] ${data.toString().trim()}`);
  });
  
  jmusicbot.on('close', (code) => {
    console.log(`[JMusicBot] Process exited with code ${code}`);
    
    if (code !== 0) {
      console.error('❌ JMusicBot encountered an error and stopped.');
    }
  });
  
  // Create an interface to handle user input for stopping the bot
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('🎮 JMusicBot is now running. Press Ctrl+C or type "exit" to stop.');
  
  rl.on('line', (input) => {
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'stop' || input.toLowerCase() === 'quit') {
      console.log('🛑 Stopping JMusicBot...');
      jmusicbot.kill();
      rl.close();
      process.exit(0);
    }
  });
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('🛑 Stopping JMusicBot...');
    jmusicbot.kill();
    rl.close();
    process.exit(0);
  });
}

// Main execution
async function main() {
  console.log('🤖 JMusicBot Setup and Launcher');
  console.log('===============================');
  
  try {
    // Step 1: Check for Java
    await checkJava();
    
    // Step 2: Check if JMusicBot JAR exists
    await checkJMusicBotJar();
    
    // Step 3: Create config if needed
    createConfig();
    
    // Step 4: Start JMusicBot
    startJMusicBot();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();