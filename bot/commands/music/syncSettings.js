/**
 * Music Player Settings Synchronization
 * 
 * This module provides functionality to synchronize settings between
 * the JavaScript music player and JMusicBot, ensuring a consistent
 * experience regardless of which player is active.
 */

// Import from a function to avoid circular dependency
let jmusicbotActiveFn = () => false; 
export function setJMusicBotActiveFunction(fn) {
  jmusicbotActiveFn = fn;
}
import fs from 'fs';
import path from 'path';

// Default settings
const defaultSettings = {
  volume: 50,            // Default volume (0-100)
  bassBoost: false,      // Bass boost enabled
  loopMode: 'off',       // Loop mode (off, song, queue)
  autoplay: false,       // Autoplay related songs
  leaveTimeout: 60,      // Leave channel after X seconds of inactivity
  maxQueueLength: 500,   // Maximum queue size
  defaultSearch: 'yt',   // Default search platform (yt, sc, etc.)
  announceSongs: true,   // Announce songs when they start playing
  lastSyncDate: null     // When settings were last synced
};

// Current settings (initialized with defaults)
let currentSettings = { ...defaultSettings };

// Path to JMusicBot config file
const JMUSICBOT_CONFIG_PATH = path.resolve(process.cwd(), 'config.txt');
// Path to JavaScript player settings file
const JS_PLAYER_SETTINGS_PATH = path.resolve(process.cwd(), 'musicPlayerSettings.json');

/**
 * Save the JavaScript player settings to a JSON file
 */
const saveJSPlayerSettings = () => {
  try {
    currentSettings.lastSyncDate = new Date().toISOString();
    fs.writeFileSync(
      JS_PLAYER_SETTINGS_PATH, 
      JSON.stringify(currentSettings, null, 2)
    );
    console.log('[Music] Settings saved to JavaScript player settings file');
  } catch (error) {
    console.error('[Music] Error saving JS player settings:', error);
  }
};

/**
 * Load the JavaScript player settings from a JSON file
 */
const loadJSPlayerSettings = () => {
  try {
    if (fs.existsSync(JS_PLAYER_SETTINGS_PATH)) {
      const settings = JSON.parse(fs.readFileSync(JS_PLAYER_SETTINGS_PATH, 'utf8'));
      currentSettings = { ...defaultSettings, ...settings };
      console.log('[Music] Settings loaded from JavaScript player settings file');
    } else {
      saveJSPlayerSettings();
    }
  } catch (error) {
    console.error('[Music] Error loading JS player settings:', error);
    saveJSPlayerSettings();
  }
};

/**
 * Parse JMusicBot config file to extract settings
 */
const parseJMusicBotConfig = () => {
  try {
    if (!fs.existsSync(JMUSICBOT_CONFIG_PATH)) {
      console.log('[Music] JMusicBot config not found, skipping sync');
      return null;
    }

    const configContent = fs.readFileSync(JMUSICBOT_CONFIG_PATH, 'utf8');
    const lines = configContent.split('\n');
    const jmSettings = {};

    for (const line of lines) {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || line.trim() === '') continue;
      
      // Extract key-value pairs
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        jmSettings[key.trim()] = value.trim();
      }
    }

    return jmSettings;
  } catch (error) {
    console.error('[Music] Error parsing JMusicBot config:', error);
    return null;
  }
};

/**
 * Update JMusicBot config file with current settings
 */
const updateJMusicBotConfig = () => {
  try {
    if (!fs.existsSync(JMUSICBOT_CONFIG_PATH)) {
      console.log('[Music] JMusicBot config not found, skipping update');
      return false;
    }

    let configContent = fs.readFileSync(JMUSICBOT_CONFIG_PATH, 'utf8');
    const lines = configContent.split('\n');
    let updatedContent = '';

    // Convert our volume scale (0-100) to JMusicBot scale (0.0-1.0)
    const jmVolume = (currentSettings.volume / 100).toFixed(2);

    for (const line of lines) {
      if (line.trim().startsWith('volume=')) {
        updatedContent += `volume=${jmVolume}\n`;
      } else if (line.trim().startsWith('loop_mode=')) {
        // Convert our loop mode format to JMusicBot format
        let loopMode = 'OFF';
        if (currentSettings.loopMode === 'song') loopMode = 'SONG';
        else if (currentSettings.loopMode === 'queue') loopMode = 'QUEUE';
        updatedContent += `loop_mode=${loopMode}\n`;
      } else {
        updatedContent += line + '\n';
      }
    }

    fs.writeFileSync(JMUSICBOT_CONFIG_PATH, updatedContent);
    console.log('[Music] Updated JMusicBot config with current settings');
    return true;
  } catch (error) {
    console.error('[Music] Error updating JMusicBot config:', error);
    return false;
  }
};

/**
 * Synchronize settings between JavaScript player and JMusicBot
 */
export const syncSettings = () => {
  try {
    // First load our current JS player settings
    loadJSPlayerSettings();

    // If JMusicBot is active, parse its config
    if (jmusicbotActiveFn()) {
      const jmSettings = parseJMusicBotConfig();
      
      if (jmSettings) {
        // Update our settings from JMusicBot if they exist
        if (jmSettings.volume !== undefined) {
          // Convert JMusicBot volume (0.0-1.0) to our scale (0-100)
          currentSettings.volume = Math.round(parseFloat(jmSettings.volume) * 100);
        }
        
        if (jmSettings.loop_mode !== undefined) {
          // Convert JMusicBot loop mode to our format
          if (jmSettings.loop_mode === 'OFF') currentSettings.loopMode = 'off';
          else if (jmSettings.loop_mode === 'SONG') currentSettings.loopMode = 'song';
          else if (jmSettings.loop_mode === 'QUEUE') currentSettings.loopMode = 'queue';
        }
        
        // Save the updated settings to our JS player settings file
        saveJSPlayerSettings();
      }
    } else {
      // If JMusicBot is not active, sync our settings to the JMusicBot config
      updateJMusicBotConfig();
    }

    return currentSettings;
  } catch (error) {
    console.error('[Music] Error synchronizing settings:', error);
    return currentSettings;
  }
};

/**
 * Get the current music player settings
 */
export const getSettings = () => {
  loadJSPlayerSettings();
  return currentSettings;
};

/**
 * Update a specific setting
 * @param {string} key - The setting key to update
 * @param {any} value - The new value for the setting
 */
export const updateSetting = (key, value) => {
  if (currentSettings[key] !== undefined) {
    currentSettings[key] = value;
    saveJSPlayerSettings();
    
    // Also update JMusicBot config if it's active
    if (jmusicbotActiveFn()) {
      updateJMusicBotConfig();
    }
    
    return true;
  }
  return false;
};

// Initialize settings on module load
syncSettings();