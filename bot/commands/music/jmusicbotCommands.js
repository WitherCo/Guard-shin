/**
 * JMusicBot Commands
 * 
 * This module provides helper functions to interact with JMusicBot through commands.
 * It abstracts away the details of command execution to provide a simple interface
 * for other parts of the application to use.
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const jmusicbotHandler = require('../../integrations/jmusicbot-handler');

// Import the player switcher to check if JMusicBot is active
import { isJMusicBotActive } from './musicPlayerSwitcher.js';

/**
 * Execute a JMusicBot command if it's active
 * @param {string} command The command to execute (without prefix)
 * @returns {Promise<boolean>} Success status
 */
export async function executeJMusicBotCommand(command) {
  // Only execute if JMusicBot is active
  if (!isJMusicBotActive()) {
    console.log(`[JMusicBotCommands] JMusicBot is not active, not executing: ${command}`);
    return false;
  }
  
  try {
    console.log(`[JMusicBotCommands] Executing command: ${command}`);
    return await jmusicbotHandler.executeCommand(command);
  } catch (error) {
    console.error(`[JMusicBotCommands] Error executing command: ${command}`, error);
    return false;
  }
}

/**
 * Set the volume for JMusicBot
 * @param {number} volume The volume to set (0-100)
 * @returns {Promise<boolean>} Success status
 */
export async function setVolume(volume) {
  // Convert 0-100 scale to 0-150 for JMusicBot
  const jmVolume = Math.min(Math.round(volume * 1.5), 150);
  return executeJMusicBotCommand(`volume ${jmVolume}`);
}

/**
 * Set the loop mode for JMusicBot
 * @param {string} mode The loop mode ('off', 'song', 'queue')
 * @returns {Promise<boolean>} Success status
 */
export async function setLoopMode(mode) {
  let jmMode;
  switch (mode.toLowerCase()) {
    case 'song':
      jmMode = 'song';
      break;
    case 'queue':
      jmMode = 'queue';
      break;
    default:
      jmMode = 'off';
  }
  
  return executeJMusicBotCommand(`loop ${jmMode}`);
}

/**
 * Play a song with JMusicBot
 * @param {string} query The search query or URL
 * @returns {Promise<boolean>} Success status
 */
export async function playSong(query) {
  return executeJMusicBotCommand(`play ${query}`);
}

/**
 * Skip the current song
 * @returns {Promise<boolean>} Success status
 */
export async function skipSong() {
  return executeJMusicBotCommand('skip');
}

/**
 * Stop playback
 * @returns {Promise<boolean>} Success status
 */
export async function stopPlayback() {
  return executeJMusicBotCommand('stop');
}

/**
 * Pause playback
 * @returns {Promise<boolean>} Success status
 */
export async function pausePlayback() {
  return executeJMusicBotCommand('pause');
}

/**
 * Resume playback
 * @returns {Promise<boolean>} Success status
 */
export async function resumePlayback() {
  return executeJMusicBotCommand('resume');
}

/**
 * Shuffle the queue
 * @returns {Promise<boolean>} Success status
 */
export async function shuffleQueue() {
  return executeJMusicBotCommand('shuffle');
}

/**
 * Get the current status
 * @returns {Promise<boolean>} Success status
 */
export async function getStatus() {
  return executeJMusicBotCommand('status');
}

// Other functions can be added as needed