/**
 * Music Player Switcher
 * 
 * This module provides a mechanism to switch between different music player implementations:
 * 1. JagroshBot-inspired JavaScript player
 * 2. JMusicBot (Java-based)
 * 
 * In production, the more stable JMusicBot should be preferred, but we fall back
 * to the JavaScript implementation if needed.
 * 
 * This module also ensures settings synchronization between both players.
 */

import fs from 'fs';
import { execSync } from 'child_process';
import { createRequire } from 'module';

// Use createRequire for CommonJS modules
const require = createRequire(import.meta.url);
const jmusicbotHandler = require('../../integrations/jmusicbot-handler');

// Import settings synchronization (will be imported as ESM)
import { syncSettings, getSettings, updateSetting, setJMusicBotActiveFunction } from './syncSettings.js';

// Configuration
let useJMusicBot = true;  // Default to JMusicBot
let jmusicbotFallbackAttempted = false;

// Check if JMusicBot is available
function isJMusicBotAvailable() {
  try {
    // Check if the JAR file exists
    const jarExists = fs.existsSync('attached_assets/JMusicBot-cd40e2e5-potoken-iprotation (1).jar');
    
    // Check if Java is installed
    let javaInstalled = false;
    try {
      execSync('java -version');
      javaInstalled = true;
    } catch (error) {
      javaInstalled = false;
    }
    
    return jarExists && javaInstalled;
  } catch (error) {
    console.error('Error checking JMusicBot availability:', error);
    return false;
  }
}

// Initialize the music player
async function initializeMusicPlayer() {
  // First, check if JMusicBot is available
  if (isJMusicBotAvailable() && useJMusicBot) {
    console.log('[MusicSwitcher] JMusicBot is available. Using Java-based music player.');
    
    // Check if JMusicBot is already running
    const status = await jmusicbotHandler.getMusicBotStatus()
      .catch(() => ({ running: false }));
    
    if (!status.running) {
      console.log('[MusicSwitcher] Starting JMusicBot...');
      try {
        await jmusicbotHandler.startMusicBot();
        console.log('[MusicSwitcher] JMusicBot started successfully.');
      } catch (error) {
        console.error('[MusicSwitcher] Failed to start JMusicBot:', error);
        console.log('[MusicSwitcher] Falling back to JavaScript music player...');
        useJMusicBot = false;
      }
    } else {
      console.log(`[MusicSwitcher] JMusicBot is already running (PID: ${status.pid}).`);
    }
  } else {
    console.log('[MusicSwitcher] JMusicBot is not available. Using JavaScript music player.');
    useJMusicBot = false;
  }
  
  // Return the active player type
  return {
    playerType: useJMusicBot ? 'jmusicbot' : 'javascript',
    isJMusicBotRunning: useJMusicBot
  };
}

// Handle a YouTube rate limiting error by switching to JMusicBot if not already using it
async function handleYouTubeRateLimitError() {
  if (!useJMusicBot && !jmusicbotFallbackAttempted && isJMusicBotAvailable()) {
    console.log('[MusicSwitcher] YouTube rate limit encountered. Attempting to switch to JMusicBot...');
    jmusicbotFallbackAttempted = true;
    
    try {
      await jmusicbotHandler.startMusicBot();
      useJMusicBot = true;
      console.log('[MusicSwitcher] Successfully switched to JMusicBot after rate limiting error.');
      return true;
    } catch (error) {
      console.error('[MusicSwitcher] Failed to start JMusicBot as a fallback:', error);
      return false;
    }
  }
  
  return false;  // No switch occurred
}

// Get the active music player type
function getActiveMusicPlayer() {
  return useJMusicBot ? 'jmusicbot' : 'javascript';
}

// Stop the active music player
async function stopMusicPlayer() {
  if (useJMusicBot) {
    try {
      await jmusicbotHandler.stopMusicBot();
      console.log('[MusicSwitcher] JMusicBot stopped.');
    } catch (error) {
      console.error('[MusicSwitcher] Error stopping JMusicBot:', error);
    }
  } else {
    // Nothing to do for the JavaScript player as it runs in the same process
    console.log('[MusicSwitcher] JavaScript music player is part of the main process - no need to stop separately.');
  }
}

// Get player settings
function getMusicPlayerSettings() {
  // Call syncSettings to ensure we have the latest settings
  return getSettings();
}

// Update a specific setting
async function updateMusicPlayerSetting(key, value) {
  // First update the setting in our settings system
  const updated = updateSetting(key, value);
  
  if (updated && key === 'volume' && useJMusicBot) {
    // If we're updating volume and JMusicBot is active, send the volume command
    try {
      // Convert 0-100 scale to 0-150 for JMusicBot (it supports higher volumes)
      const jmVolume = Math.min(Math.round(value * 1.5), 150);
      // Directly execute the volume command
      await jmusicbotHandler.executeCommand(`volume ${jmVolume}`);
    } catch (error) {
      console.error('[MusicSwitcher] Error updating JMusicBot volume:', error);
    }
  }
  
  return updated;
}

// Export the functions for use in other modules
export {
  initializeMusicPlayer,
  handleYouTubeRateLimitError,
  getActiveMusicPlayer,
  stopMusicPlayer,
  getMusicPlayerSettings,
  updateMusicPlayerSetting
};

// Additional exports
export const isJMusicBotActive = () => useJMusicBot;

// Initialize the settings synchronization
setJMusicBotActiveFunction(() => useJMusicBot);