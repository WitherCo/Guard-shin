/**
 * Test script for AutoMod rules functionality
 * This will create 100 AutoMod rules to earn the Discord AutoMod badge
 */

import { Client, GatewayIntentBits } from 'discord.js';
import autoModRules from './bot/commands/automod/discordAutoModRules.js';
const { initializeAutoModRulesForAllGuilds } = autoModRules;

async function testAutoModRules() {
  console.log('Starting AutoMod rules test...');
  
  // Create Discord client with necessary intents
  const client = new Client({ 
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildModeration,
    ]
  });
  
  // Login with token
  try {
    console.log('Attempting to login with GUARD_SHIN_BOT_TOKEN');
    await client.login(process.env.GUARD_SHIN_BOT_TOKEN);
  } catch (error) {
    console.error('Failed to login with Guard-shin token:', error);
    
    try {
      console.log('Attempting to login with DISCORD_BOT_TOKEN');
      await client.login(process.env.DISCORD_BOT_TOKEN);
    } catch (error) {
      console.error('Failed to login with Discord token:', error);
      return;
    }
  }
  
  // Once ready, create AutoMod rules
  client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    try {
      console.log('Initializing AutoMod rules to earn the AutoMod badge...');
      await initializeAutoModRulesForAllGuilds(client);
      console.log('AutoMod rules creation complete!');
    } catch (error) {
      console.error('Error initializing AutoMod rules:', error);
    }
    
    // Wait a bit before disconnecting
    setTimeout(() => {
      client.destroy();
      console.log('Test completed and client disconnected');
    }, 5000);
  });
}

// Run the test
testAutoModRules().catch(error => {
  console.error('Unhandled error in test:', error);
});