/**
 * Music Player Fallback Handler
 * 
 * This module manages the interaction between the JavaScript music player
 * and the JMusicBot fallback for handling YouTube rate limiting errors.
 */

import { handleYouTubeRateLimitError, getActiveMusicPlayer, isJMusicBotActive } from './musicPlayerSwitcher.js';

// Function to handle YouTube rate limit errors
async function handleRateLimitError(message, errorType) {
  console.log(`[MusicFallback] Handling ${errorType} error with fallback...`);
  
  // First, let's inform the user about the error
  await message.channel.send({
    content: `:warning: **YouTube ${errorType} error detected.**`
  });
  
  // Attempt to switch to JMusicBot if not already using it
  const switched = await handleYouTubeRateLimitError();
  
  if (switched) {
    // Successfully switched to JMusicBot
    await message.channel.send({
      content: `:white_check_mark: Switched to JMusicBot for more reliable music playback. Please try your command again.`
    });
    return true;
  } else if (isJMusicBotActive()) {
    // Already using JMusicBot but still got an error
    await message.channel.send({
      content: `:warning: YouTube is currently experiencing issues. Please try again later or use a different link.`
    });
    return false;
  } else {
    // Unable to switch to JMusicBot
    await message.channel.send({
      content: `:x: Unable to switch to JMusicBot fallback. YouTube is currently rate limiting our requests. Please try again later.`
    });
    return false;
  }
}

// Function to determine which music player command to use
function getAppropriateCommand(commandName, args, message) {
  const activePlayer = getActiveMusicPlayer();
  
  if (activePlayer === 'jmusicbot') {
    // For JMusicBot, we should use prefix commands
    // The prefix is configured in config.txt (default is ';')
    const prefix = ';'; // This should match the prefix in config.txt
    
    // Notify the user that we're using JMusicBot if this is the first command
    if (!message.channel.jmusicbotNotified) {
      message.channel.send({
        content: `:information_source: Using JMusicBot for music playback. Commands use the \`${prefix}\` prefix.`
      });
      message.channel.jmusicbotNotified = true;
    }
    
    // Return information about the JMusicBot command
    return {
      type: 'jmusicbot',
      prefix: prefix,
      command: `${prefix}${commandName} ${args.join(' ')}`.trim(),
      originalCommand: commandName,
      args: args
    };
  } else {
    // For JavaScript player, use the standard command structure
    return {
      type: 'javascript',
      command: commandName,
      args: args
    };
  }
}

// Function to execute music commands based on the active player
async function executeMusicCommand(message, commandName, args) {
  const commandInfo = getAppropriateCommand(commandName, args, message);
  
  if (commandInfo.type === 'jmusicbot') {
    // For JMusicBot, we just need to let the user know to use the prefix command
    if (!message.jmusicbotCommandSent) {
      await message.channel.send({
        content: `:arrow_right: Please use JMusicBot commands with the \`${commandInfo.prefix}\` prefix. Example: \`${commandInfo.command}\``
      });
      message.jmusicbotCommandSent = true;
    }
    return true;
  } else {
    // For JavaScript player, the command is executed by the caller
    return false; // Indicate that the caller should execute the command
  }
}

// Export functions for ES modules
export {
  handleRateLimitError,
  getAppropriateCommand,
  executeMusicCommand
};