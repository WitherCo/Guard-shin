/**
 * JMusicBot Slash Commands
 * 
 * Implementation of slash commands that interface with JMusicBot
 * These commands will send messages with the appropriate prefix commands
 * for JMusicBot to execute
 * 
 * Note: After registering new slash commands, it can take up to an hour for Discord
 * to fully propagate the commands to all servers. They will appear faster in the
 * support server (https://discord.gg/g3rFbaW6gw) since we register them there first.
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { getActiveMusicPlayer, isJMusicBotActive } from './musicPlayerSwitcher.js';
import * as jmCommands from './jmusicbotCommands.js';
import * as playdl from 'play-dl';

// JMusicBot uses ';' as its default prefix
const JMUSICBOT_PREFIX = ';';

/**
 * Helper function to execute a JMusicBot command
 * @param {Interaction} interaction - Discord.js interaction object
 * @param {string} command - The JMusicBot command to execute (without prefix)
 * @param {boolean} ephemeral - Whether the response should be ephemeral
 */
const executeJMusicBotCommand = async (interaction, command, ephemeral = false) => {
  try {
    // First, check if JMusicBot is active
    if (!isJMusicBotActive()) {
      return interaction.reply({
        content: "❌ JMusicBot is not currently active. Please try again later or use the regular music commands.",
        ephemeral: true
      });
    }

    // The full command with prefix
    const fullCommand = `${JMUSICBOT_PREFIX}${command}`;
    
    // Send a message in the same channel that JMusicBot can read
    await interaction.channel.send(fullCommand);
    
    // Also execute the command via our helper function for direct communication
    await jmCommands.executeJMusicBotCommand(command);
    
    // Reply to the interaction
    return interaction.reply({
      content: `✅ Sent command to JMusicBot: \`${fullCommand}\``,
      ephemeral: ephemeral
    });
  } catch (error) {
    console.error('[JMusicBot] Command execution error:', error);
    return interaction.reply({
      content: `❌ Error executing JMusicBot command: ${error.message}`,
      ephemeral: true
    });
  }
};

// Play command
const jmPlayCommand = {
  data: new SlashCommandBuilder()
    .setName('jmplay')
    .setDescription('Play a song using JMusicBot')
    .addStringOption(option => 
      option.setName('query')
        .setDescription('The song to play (URL or search term)')
        .setRequired(true)),
  async execute(interaction) {
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Get the song query
    const query = interaction.options.getString('query');
    
    // Execute the JMusicBot play command
    return executeJMusicBotCommand(interaction, `play ${query}`, false);
  },
  premiumRequired: false,
  adminOnly: false,
};

// Skip command
const jmSkipCommand = {
  data: new SlashCommandBuilder()
    .setName('jmskip')
    .setDescription('Skip the current song using JMusicBot'),
  async execute(interaction) {
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Execute the JMusicBot skip command
    return executeJMusicBotCommand(interaction, 'skip', false);
  },
  premiumRequired: false,
  adminOnly: false,
};

// Stop command
const jmStopCommand = {
  data: new SlashCommandBuilder()
    .setName('jmstop')
    .setDescription('Stop the music and clear the queue using JMusicBot'),
  async execute(interaction) {
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Execute the JMusicBot stop command
    return executeJMusicBotCommand(interaction, 'stop', false);
  },
  premiumRequired: false,
  adminOnly: false,
};

// Queue command
const jmQueueCommand = {
  data: new SlashCommandBuilder()
    .setName('jmqueue')
    .setDescription('Display the current music queue from JMusicBot'),
  async execute(interaction) {
    // Execute the JMusicBot queue command
    return executeJMusicBotCommand(interaction, 'queue', false);
  },
  premiumRequired: false,
  adminOnly: false,
};

// Pause command
const jmPauseCommand = {
  data: new SlashCommandBuilder()
    .setName('jmpause')
    .setDescription('Pause the current song using JMusicBot'),
  async execute(interaction) {
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Execute the JMusicBot pause command
    return executeJMusicBotCommand(interaction, 'pause', false);
  },
  premiumRequired: false,
  adminOnly: false,
};

// Resume command
const jmResumeCommand = {
  data: new SlashCommandBuilder()
    .setName('jmresume')
    .setDescription('Resume paused music using JMusicBot'),
  async execute(interaction) {
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Execute the JMusicBot resume command
    return executeJMusicBotCommand(interaction, 'resume', false);
  },
  premiumRequired: false,
  adminOnly: false,
};

// Volume command
const jmVolumeCommand = {
  data: new SlashCommandBuilder()
    .setName('jmvolume')
    .setDescription('Change the music volume using JMusicBot')
    .addIntegerOption(option => 
      option.setName('level')
        .setDescription('Volume level (0-100)')
        .setMinValue(0)
        .setMaxValue(100)
        .setRequired(true)),
  async execute(interaction) {
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Get the volume level
    const volumeLevel = interaction.options.getInteger('level');
    
    // Execute the JMusicBot volume command
    return executeJMusicBotCommand(interaction, `volume ${volumeLevel}`, false);
  },
  premiumRequired: true, // Premium required
  adminOnly: false,
};

// Loop command
const jmLoopCommand = {
  data: new SlashCommandBuilder()
    .setName('jmloop')
    .setDescription('Toggle loop mode using JMusicBot')
    .addStringOption(option =>
      option.setName('mode')
        .setDescription('Loop mode to set')
        .setRequired(true)
        .addChoices(
          { name: 'Off', value: 'off' },
          { name: 'Song', value: 'song' },
          { name: 'Queue', value: 'queue' },
        )),
  async execute(interaction) {
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Get the loop mode
    const mode = interaction.options.getString('mode');
    
    // Execute the JMusicBot loop command
    return executeJMusicBotCommand(interaction, `loop ${mode}`, false);
  },
  premiumRequired: true, // Premium required
  adminOnly: false,
};

// Now Playing command
const jmNowPlayingCommand = {
  data: new SlashCommandBuilder()
    .setName('jmnp')
    .setDescription('Display the current playing song information from JMusicBot'),
  async execute(interaction) {
    // Execute the JMusicBot np command
    return executeJMusicBotCommand(interaction, 'np', false);
  },
  premiumRequired: false,
  adminOnly: false,
};

// Playlist command
const jmPlaylistCommand = {
  data: new SlashCommandBuilder()
    .setName('jmplaylist')
    .setDescription('Play a playlist using JMusicBot')
    .addStringOption(option => 
      option.setName('url')
        .setDescription('The playlist URL')
        .setRequired(true)),
  async execute(interaction) {
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Get the playlist URL
    const url = interaction.options.getString('url');
    
    // Execute the JMusicBot play command with the playlist
    return executeJMusicBotCommand(interaction, `play ${url}`, false);
  },
  premiumRequired: true, // Premium required
  adminOnly: false,
};

// Lyrics command
const jmLyricsCommand = {
  data: new SlashCommandBuilder()
    .setName('jmlyrics')
    .setDescription('Get lyrics for the current song or a specific song')
    .addStringOption(option => 
      option.setName('song')
        .setDescription('Song to get lyrics for (leave empty for current song)')
        .setRequired(false)),
  async execute(interaction) {
    // Get the song query
    const song = interaction.options.getString('song');
    
    // Execute the JMusicBot lyrics command
    if (song) {
      return executeJMusicBotCommand(interaction, `lyrics ${song}`, false);
    } else {
      return executeJMusicBotCommand(interaction, 'lyrics', false);
    }
  },
  premiumRequired: true, // Premium required
  adminOnly: false,
};

// JMusicBot status command
const jmStatusCommand = {
  data: new SlashCommandBuilder()
    .setName('jmstatus')
    .setDescription('Check if JMusicBot is active and working'),
  async execute(interaction) {
    const isActive = isJMusicBotActive();
    const activePlayer = getActiveMusicPlayer();
    
    const statusEmbed = new EmbedBuilder()
      .setColor(isActive ? '#00FF00' : '#FF0000')
      .setTitle('🤖 JMusicBot Status')
      .addFields(
        { name: 'Status', value: isActive ? '✅ Online' : '❌ Offline', inline: true },
        { name: 'Active Player', value: activePlayer, inline: true },
        { name: 'Command Prefix', value: `\`${JMUSICBOT_PREFIX}\``, inline: true },
      )
      .setDescription(isActive 
        ? 'JMusicBot is running and ready to receive commands.'
        : 'JMusicBot is not currently running. Music will be played using the JavaScript music player instead.')
      .setFooter({ text: 'Use /jmhelp to see available JMusicBot commands.' });
    
    return interaction.reply({ embeds: [statusEmbed] });
  },
  premiumRequired: false,
  adminOnly: false,
};

// JMusicBot help command
const jmHelpCommand = {
  data: new SlashCommandBuilder()
    .setName('jmhelp')
    .setDescription('Show help information for JMusicBot commands'),
  async execute(interaction) {
    const helpEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle('🎵 JMusicBot Commands')
      .setDescription(`JMusicBot is a powerful music bot for Discord with high-quality playback. Use the prefix \`${JMUSICBOT_PREFIX}\` directly in chat or use these slash commands.\n\n**Note:** New slash commands may take up to an hour to appear in all servers. They will appear faster in our [support server](https://discord.gg/g3rFbaW6gw).`)
      .addFields(
        { name: '/jmplay', value: 'Play a song or add it to the queue', inline: true },
        { name: '/jmskip', value: 'Skip to the next song', inline: true },
        { name: '/jmstop', value: 'Stop playback and clear the queue', inline: true },
        { name: '/jmqueue', value: 'Display the current queue', inline: true },
        { name: '/jmpause', value: 'Pause the current song', inline: true },
        { name: '/jmresume', value: 'Resume paused music', inline: true },
        { name: '/jmvolume', value: 'Change the playback volume ✨', inline: true },
        { name: '/jmloop', value: 'Toggle loop mode for song/queue ✨', inline: true },
        { name: '/jmnp', value: 'Show the current playing song', inline: true },
        { name: '/jmplaylist', value: 'Play a playlist from URL ✨', inline: true },
        { name: '/jmlyrics', value: 'Get lyrics for the current song ✨', inline: true },
        { name: '/jmstatus', value: 'Check if JMusicBot is online', inline: true }
      )
      .setFooter({ text: '✨ = Premium features | See JMusicBot_GUIDE.md for full documentation' });
    
    return interaction.reply({ embeds: [helpEmbed] });
  },
  premiumRequired: false,
  adminOnly: false,
};

// Export the JMusicBot commands
export const jmusicbotSlashCommands = [
  jmPlayCommand,
  jmSkipCommand,
  jmStopCommand,
  jmQueueCommand,
  jmPauseCommand,
  jmResumeCommand,
  jmVolumeCommand,
  jmLoopCommand,
  jmNowPlayingCommand,
  jmPlaylistCommand,
  jmLyricsCommand,
  jmStatusCommand,
  jmHelpCommand
];