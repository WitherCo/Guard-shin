const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { Player, QueryType } = require('discord-player');
const playdl = require('play-dl');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');

// Initialize the player with options
let player = null;

// Set up custom stream strategy with play-dl
async function customPlayDlStreamProvider(query, options) {
  console.log(`[Music Player] Custom stream provider called with query: ${query}`);
  
  // Handle YouTube URLs
  if (ytdl.validateURL(query)) {
    console.log(`[Music Player] Valid YouTube URL detected: ${query}`);
    try {
      const stream = await playdl.stream(query, { quality: 2 });
      console.log(`[Music Player] Successfully created YouTube stream`);
      return { stream: stream.stream, type: stream.type };
    } catch (error) {
      console.error(`[Music Player] YouTube stream error: ${error.message}`);
      throw error;
    }
  }
  
  // Handle SoundCloud URLs
  if (query.includes('soundcloud.com')) {
    console.log(`[Music Player] SoundCloud URL detected: ${query}`);
    try {
      const soundcloudInfo = await playdl.soundcloud(query);
      const stream = await playdl.stream_from_info(soundcloudInfo);
      console.log(`[Music Player] Successfully created SoundCloud stream`);
      return { stream: stream.stream, type: stream.type };
    } catch (error) {
      console.error(`[Music Player] SoundCloud stream error: ${error.message}`);
      throw error;
    }
  }
  
  // Default search behavior
  console.log(`[Music Player] Using default search for: ${query}`);
  try {
    const searchResults = await playdl.search(query, {
      limit: 1,
      source: { youtube: "video" }
    });
    
    if (searchResults && searchResults.length > 0) {
      const videoUrl = searchResults[0].url;
      console.log(`[Music Player] Found video: ${videoUrl}`);
      const stream = await playdl.stream(videoUrl, { quality: 2 });
      console.log(`[Music Player] Successfully created stream from search result`);
      return { stream: stream.stream, type: stream.type };
    } else {
      throw new Error('No search results found');
    }
  } catch (error) {
    console.error(`[Music Player] Search stream error: ${error.message}`);
    throw error;
  }
}

function initializePlayer(client) {
  if (player) return player;
  
  console.log('[Music Player] Initializing music player...');
  
  // Set up play-dl for streaming
  playdl.setToken({
    soundcloud: {
      client_id: playdl.getFreeClientID()
    }
  });
  
  // Create a new Player instance with custom options
  player = new Player(client, {
    ytdlOptions: {
      quality: 'highestaudio',
      highWaterMark: 1 << 25
    },
    skipFFmpeg: false,  // Make sure FFmpeg is used
    connectionTimeout: 999999, // Longer timeout
    bufferingTimeout: 999999, // Longer buffering timeout
    smoothVolume: true,
    selfDeaf: true // Bot should deafen itself to save bandwidth
  });
  
  // Register a custom stream provider
  player.extractors.createExtractor(
    "custom-stream",
    {
      validate: () => true, // Handle all queries
      handle: customPlayDlStreamProvider
    },
    { overwrite: true }
  );
  
  // Add YouTube extractor and other extractors
  const { DefaultExtractors } = require('@discord-player/extractor');
  player.extractors.loadMulti(DefaultExtractors);
  
  // Configure player events
  setupPlayerEvents(player);
  
  console.log('[Music Player] Player initialized successfully');
  return player;
}

function setupPlayerEvents(player) {
  console.log('[Music Player] Setting up player events...');
  
  // Player started a new track
  player.events.on('playerStart', (queue, track) => {
    console.log(`[Music Player] Started playing track: ${track.title}`);
    
    // Send an embed when a track starts playing
    if (queue.metadata && queue.metadata.channel) {
      const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎵 Now Playing')
        .setDescription(`**[${track.title}](${track.url})**`)
        .addFields(
          { name: 'Duration', value: track.duration || 'Unknown', inline: true }
        );
      
      // Only add thumbnail if available
      if (track.thumbnail) {
        embed.setThumbnail(track.thumbnail);
      }
      
      // Safely add the requested by field if available
      if (track.requestedBy && track.requestedBy.id) {
        embed.addFields({ name: 'Requested by', value: `<@${track.requestedBy.id}>`, inline: true });
      } else if (queue.metadata && queue.metadata.requestedBy && queue.metadata.requestedBy.id) {
        embed.addFields({ name: 'Requested by', value: `<@${queue.metadata.requestedBy.id}>`, inline: true });
      }
        
      queue.metadata.channel.send({ embeds: [embed] })
        .catch(err => console.error('[Music Player] Could not send now playing message:', err));
    }
  });
  
  // Error event
  player.events.on('error', (queue, error) => {
    console.error(`[Music Player] Error in ${queue?.guild?.name || 'unknown guild'}:`, error);
    
    if (queue && queue.metadata && queue.metadata.channel) {
      queue.metadata.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Error Occurred')
            .setDescription(`An error occurred while playing music: ${error.message || 'Unknown error'}`)
            .setFooter({ text: 'The bot will try to continue playing if possible' })
        ]
      }).catch(err => console.error('[Music Player] Could not send error message:', err));
    }
  });
  
  // Track end event
  player.events.on('trackEnd', (queue, track) => {
    console.log(`[Music Player] Track ended: ${track.title}`);
  });
  
  // Connection error event  
  player.events.on('connectionError', (queue, error) => {
    console.error(`[Music Player] Connection error in ${queue?.guild?.name || 'unknown guild'}:`, error);
    
    if (queue && queue.metadata && queue.metadata.channel) {
      queue.metadata.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Connection Error')
            .setDescription(`A connection error occurred: ${error.message || 'Unknown error'}`)
            .setFooter({ text: 'Please try again in a moment' })
        ]
      }).catch(err => console.error('[Music Player] Could not send connection error message:', err));
    }
  });
  
  // Empty queue event
  player.events.on('emptyQueue', (queue) => {
    console.log(`[Music Player] Queue ended in ${queue?.guild?.name || 'unknown guild'}`);
    
    if (queue && queue.metadata && queue.metadata.channel) {
      queue.metadata.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎵 Queue Ended')
            .setDescription('The queue has ended. Add more songs to keep the party going!')
        ]
      }).catch(err => console.error('[Music Player] Could not send queue ended message:', err));
    }
  });
  
  // Debug event for troubleshooting
  player.events.on('debug', (queue, message) => {
    console.log(`[Music Player Debug] ${message}`);
  });
  
  console.log('[Music Player] Player events setup complete');
  return player;
}

// Command definitions
const playCommand = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song in your voice channel')
    .addStringOption(option => 
      option.setName('query')
        .setDescription('The song to play (URL or search term)')
        .setRequired(true)),
  async execute(interaction) {
    if (!player) {
      return interaction.reply({
        content: '❌ Music player has not been initialized.',
        ephemeral: true
      });
    }
    
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Check bot permissions
    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({
        content: '❌ I need permissions to join and speak in your voice channel!',
        ephemeral: true
      });
    }
    
    await interaction.deferReply();
    
    // Get the song query
    const query = interaction.options.getString('query');
    
    try {
      console.log(`[Music Player] Attempting to play: ${query}`);
      
      // Try to play the song with the custom extractor
      const result = await player.play(voiceChannel, query, {
        requestedBy: interaction.user,
        searchEngine: "custom-stream", // Use our custom stream provider
        nodeOptions: {
          metadata: {
            channel: interaction.channel,
            client: interaction.client,
            requestedBy: interaction.user
          },
          leaveOnEmpty: false, // Don't leave when empty
          leaveOnEmptyCooldown: 999999,
          leaveOnEnd: false, // Don't leave when queue ends
          leaveOnEndCooldown: 999999,
          bufferingTimeout: 999999,
          connectionTimeout: 999999,
          volume: 80 // Default volume
        }
      });
      
      const { track } = result;
      console.log(`[Music Player] Successfully added track: "${track.title}" from ${track.url}`);
      
      // Send confirmation
      const playEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎵 Added to Queue')
        .setDescription(`**[${track.title}](${track.url})**`)
        .addFields(
          { name: 'Duration', value: track.duration || 'Unknown', inline: true },
          { name: 'Requested by', value: `<@${interaction.user.id}>`, inline: true }
        );
      
      // Only add thumbnail if available
      if (track.thumbnail) {
        playEmbed.setThumbnail(track.thumbnail);
      }
        
      return interaction.followUp({ embeds: [playEmbed] });
      
    } catch (error) {
      console.error('[Music Player] Play command error:', error);
      
      let errorMessage = `Error playing track: ${error.message}`;
      
      // Add more helpful context based on common errors
      if (error.message.includes('sign in')) {
        errorMessage = "❌ This track requires a sign-in or is age-restricted. Try another track.";
      } else if (error.message.includes('COPYRIGHT')) {
        errorMessage = "❌ This track is blocked due to copyright restrictions. Try another track.";
      } else if (error.message.includes('available')) {
        errorMessage = "❌ This track is not available. It might be private, deleted, or region-locked.";
      } else if (error.message.includes('timed out') || error.message.includes('timeout')) {
        errorMessage = "❌ The request timed out. The server might be busy or the track is too large.";
      }
      
      return interaction.followUp({
        content: errorMessage,
        ephemeral: true
      });
    }
  },
  premiumRequired: false,
  adminOnly: false,
};

const skipCommand = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),
  async execute(interaction) {
    if (!player) {
      return interaction.reply({
        content: '❌ Music player has not been initialized.',
        ephemeral: true
      });
    }
    
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Get the queue for the guild
    const queue = player.getQueue(interaction.guildId);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: '❌ There is no music currently playing!',
        ephemeral: true
      });
    }
    
    try {
      const currentTrack = queue.current;
      const success = queue.skip();
      
      if (success) {
        const skipEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('⏭️ Skipped')
          .setDescription(`Skipped **[${currentTrack.title}](${currentTrack.url})**`);
          
        return interaction.reply({ embeds: [skipEmbed] });
      } else {
        return interaction.reply({
          content: '❌ Unable to skip the current track!',
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('[Music Player] Skip command error:', error);
      return interaction.reply({
        content: `❌ Error skipping track: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: false,
  adminOnly: false,
};

const stopCommand = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),
  async execute(interaction) {
    if (!player) {
      return interaction.reply({
        content: '❌ Music player has not been initialized.',
        ephemeral: true
      });
    }
    
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Get the queue for the guild
    const queue = player.getQueue(interaction.guildId);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: '❌ There is no music currently playing!',
        ephemeral: true
      });
    }
    
    try {
      queue.stop();
      
      const stopEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('⏹️ Stopped')
        .setDescription('Music playback has been stopped and the queue has been cleared.');
        
      return interaction.reply({ embeds: [stopEmbed] });
    } catch (error) {
      console.error('[Music Player] Stop command error:', error);
      return interaction.reply({
        content: `❌ Error stopping playback: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: false,
  adminOnly: false,
};

const queueCommand = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Display the current music queue'),
  async execute(interaction) {
    if (!player) {
      return interaction.reply({
        content: '❌ Music player has not been initialized.',
        ephemeral: true
      });
    }
    
    // Get the queue for the guild
    const queue = player.getQueue(interaction.guildId);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: '❌ There is no music currently playing!',
        ephemeral: true
      });
    }
    
    try {
      // Get current track and upcoming tracks
      const currentTrack = queue.current;
      const tracks = queue.tracks.slice(0, 10); // Display up to 10 upcoming tracks
      
      // Create the queue embed
      const queueEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎵 Music Queue')
        .setDescription(`**Currently Playing:** [${currentTrack.title}](${currentTrack.url}) | ${currentTrack.duration}\n\n${
          tracks.length ? `**Upcoming Tracks:**\n${tracks.map((track, i) => 
            `**${i + 1}.** [${track.title}](${track.url}) | ${track.duration}`
          ).join('\n')}` : '**No upcoming tracks**'
        }`)
        .setFooter({ text: `Queue length: ${queue.tracks.length} tracks` });
        
      return interaction.reply({ embeds: [queueEmbed] });
    } catch (error) {
      console.error('[Music Player] Queue command error:', error);
      return interaction.reply({
        content: `❌ Error displaying queue: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: false,
  adminOnly: false,
};

const pauseCommand = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current song'),
  async execute(interaction) {
    if (!player) {
      return interaction.reply({
        content: '❌ Music player has not been initialized.',
        ephemeral: true
      });
    }
    
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Get the queue for the guild
    const queue = player.getQueue(interaction.guildId);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: '❌ There is no music currently playing!',
        ephemeral: true
      });
    }
    
    try {
      const paused = queue.setPaused(true);
      
      if (paused) {
        const pauseEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('⏸️ Paused')
          .setDescription('Music playback has been paused. Use `/resume` to continue playing.');
          
        return interaction.reply({ embeds: [pauseEmbed] });
      } else {
        return interaction.reply({
          content: '❌ Unable to pause the music!',
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('[Music Player] Pause command error:', error);
      return interaction.reply({
        content: `❌ Error pausing playback: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: false,
  adminOnly: false,
};

const resumeCommand = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume the paused song'),
  async execute(interaction) {
    if (!player) {
      return interaction.reply({
        content: '❌ Music player has not been initialized.',
        ephemeral: true
      });
    }
    
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Get the queue for the guild
    const queue = player.getQueue(interaction.guildId);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: '❌ There is no music currently playing!',
        ephemeral: true
      });
    }
    
    try {
      const resumed = queue.setPaused(false);
      
      if (resumed) {
        const resumeEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('▶️ Resumed')
          .setDescription('Music playback has been resumed.');
          
        return interaction.reply({ embeds: [resumeEmbed] });
      } else {
        return interaction.reply({
          content: '❌ Unable to resume the music!',
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('[Music Player] Resume command error:', error);
      return interaction.reply({
        content: `❌ Error resuming playback: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: false,
  adminOnly: false,
};

const volumeCommand = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Change the music volume')
    .addIntegerOption(option => 
      option.setName('level')
        .setDescription('Volume level (0-100)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(100)),
  async execute(interaction) {
    if (!player) {
      return interaction.reply({
        content: '❌ Music player has not been initialized.',
        ephemeral: true
      });
    }
    
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Get the queue for the guild
    const queue = player.getQueue(interaction.guildId);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: '❌ There is no music currently playing!',
        ephemeral: true
      });
    }
    
    try {
      const volumeLevel = interaction.options.getInteger('level');
      queue.setVolume(volumeLevel);
      
      const volumeEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🔊 Volume Changed')
        .setDescription(`Volume has been set to **${volumeLevel}%**`);
        
      return interaction.reply({ embeds: [volumeEmbed] });
    } catch (error) {
      console.error('[Music Player] Volume command error:', error);
      return interaction.reply({
        content: `❌ Error changing volume: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: true, // Making volume control a premium feature
  adminOnly: false,
};

const loopCommand = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggle loop mode')
    .addStringOption(option => 
      option.setName('mode')
        .setDescription('Loop mode')
        .setRequired(true)
        .addChoices(
          { name: 'Off', value: 'off' },
          { name: 'Track', value: 'track' },
          { name: 'Queue', value: 'queue' }
        )),
  async execute(interaction) {
    if (!player) {
      return interaction.reply({
        content: '❌ Music player has not been initialized.',
        ephemeral: true
      });
    }
    
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Get the queue for the guild
    const queue = player.getQueue(interaction.guildId);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: '❌ There is no music currently playing!',
        ephemeral: true
      });
    }
    
    try {
      const loopMode = interaction.options.getString('mode');
      let modeText = '';
      let icon = '';
      
      switch (loopMode) {
        case 'off':
          queue.setRepeatMode(0); // 0 is off
          modeText = 'turned off';
          icon = '▶️';
          break;
        case 'track':
          queue.setRepeatMode(1); // 1 is track
          modeText = 'set to current track';
          icon = '🔂';
          break;
        case 'queue':
          queue.setRepeatMode(2); // 2 is queue
          modeText = 'set to entire queue';
          icon = '🔁';
          break;
      }
      
      const loopEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(`${icon} Loop Mode`)
        .setDescription(`Loop mode has been ${modeText}.`);
        
      return interaction.reply({ embeds: [loopEmbed] });
    } catch (error) {
      console.error('[Music Player] Loop command error:', error);
      return interaction.reply({
        content: `❌ Error changing loop mode: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: true, // Making loop mode a premium feature
  adminOnly: false,
};

const musicInfoCommand = {
  data: new SlashCommandBuilder()
    .setName('musicinfo')
    .setDescription('Display information about the current song'),
  async execute(interaction) {
    if (!player) {
      return interaction.reply({
        content: '❌ Music player has not been initialized.',
        ephemeral: true
      });
    }
    
    // Get the queue for the guild
    const queue = player.getQueue(interaction.guildId);
    if (!queue || !queue.isPlaying()) {
      return interaction.reply({
        content: '❌ There is no music currently playing!',
        ephemeral: true
      });
    }
    
    try {
      const currentTrack = queue.current;
      const progress = queue.createProgressBar();
      
      const infoEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎵 Now Playing')
        .setDescription(`**[${currentTrack.title}](${currentTrack.url})**`)
        .addFields(
          { name: 'Duration', value: currentTrack.duration, inline: true },
          { name: 'Requested by', value: `<@${currentTrack.requestedBy.id}>`, inline: true },
          { name: 'Progress', value: progress, inline: false }
        )
        .setThumbnail(currentTrack.thumbnail)
        .setFooter({ text: `Volume: ${queue.volume}%` });
        
      return interaction.reply({ embeds: [infoEmbed] });
    } catch (error) {
      console.error('[Music Player] Music info command error:', error);
      return interaction.reply({
        content: `❌ Error displaying track info: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: false,
  adminOnly: false,
};

const playlistCommand = {
  data: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Play a YouTube playlist in your voice channel')
    .addStringOption(option => 
      option.setName('url')
        .setDescription('The YouTube playlist URL')
        .setRequired(true)),
  async execute(interaction) {
    if (!player) {
      return interaction.reply({
        content: '❌ Music player has not been initialized.',
        ephemeral: true
      });
    }
    
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Check bot permissions
    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
      return interaction.reply({
        content: '❌ I need permissions to join and speak in your voice channel!',
        ephemeral: true
      });
    }
    
    await interaction.deferReply();
    
    // Get the playlist URL
    const url = interaction.options.getString('url');
    
    // Validate that it's a YouTube playlist URL
    if (!url.includes('youtube.com/playlist') && !url.includes('youtube.com/watch?v=') && !url.includes('&list=')) {
      return interaction.followUp({
        content: '❌ Please provide a valid YouTube playlist URL.',
        ephemeral: true
      });
    }
    
    try {
      // Try to play the playlist
      const { track, queue } = await player.play(voiceChannel, url, {
        nodeOptions: {
          metadata: {
            channel: interaction.channel,
            requestedBy: interaction.user
          },
          leaveOnEmpty: true,
          leaveOnEmptyCooldown: 300000, // 5 minutes
          leaveOnEnd: true,
          leaveOnEndCooldown: 300000, // 5 minutes
          volume: 80 // Default volume
        }
      });
      
      // Send confirmation
      const playlistEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎵 Playlist Added')
        .setDescription(`**Added playlist to queue**\nNow playing: **[${track.title}](${track.url})**`)
        .addFields(
          { name: 'Tracks in queue', value: `${queue.tracks.length + 1}`, inline: true },
          { name: 'Requested by', value: `<@${interaction.user.id}>`, inline: true }
        );
        
      return interaction.followUp({ embeds: [playlistEmbed] });
      
    } catch (error) {
      console.error('[Music Player] Playlist command error:', error);
      return interaction.followUp({
        content: `❌ Error playing playlist: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: true, // Making playlist playback a premium feature
  adminOnly: false,
};

// Export all music commands
module.exports = {
  initializePlayer,
  commands: [
    playCommand,
    skipCommand,
    stopCommand,
    queueCommand,
    pauseCommand,
    resumeCommand,
    volumeCommand,
    loopCommand,
    musicInfoCommand,
    playlistCommand
  ]
};