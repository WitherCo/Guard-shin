/**
 * Music Commands Adapter for ESM
 * 
 * This file adapts the CommonJS music commands to ESM format
 */
import { SlashCommandBuilder } from 'discord.js';
import { createRequire } from 'module';
import { logUpdate } from '../../../server/update-logger.js';

// Create a require function for loading CJS modules
const require = createRequire(import.meta.url);

// Load the music commands module
const musicCommandsModule = require('./musicCommands.js');
const { initializePlayer, commands: musicCommands } = musicCommandsModule;

// Function to initialize the music player
export function setupMusicPlayer(client) {
  try {
    const player = initializePlayer(client);
    console.log('[Music] Music player initialized successfully');
    
    // Log update
    logUpdate('Music player feature added to the bot', 'bot')
      .catch(err => console.error('[Music] Error logging update:', err));
      
    return player;
  } catch (error) {
    console.error('[Music] Failed to initialize music player:', error);
    return null;
  }
}

// Map over each command to make it compatible with ESM
export const musicCommandsESM = musicCommands.map(command => {
  return {
    ...command,
    data: command.data,
    async execute(interaction) {
      return await command.execute(interaction);
    },
    premiumRequired: command.premiumRequired || false,
    adminOnly: command.adminOnly || false
  };
});

export default musicCommandsESM;