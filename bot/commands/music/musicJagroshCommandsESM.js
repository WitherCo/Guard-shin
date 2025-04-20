/**
 * Music Commands using JagroshBot-inspired Player (ESM Version)
 * Implementation of slash commands for the custom music player
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { getServerQueue, playSong } from './jagroshMusicPlayerESM.js';
import * as playdl from 'play-dl';

// Play command
const playCommand = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song in your voice channel')
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
      // Use the playSong function from our JagroshBot-inspired player
      return await playSong(interaction, query, true);
    } catch (error) {
      console.error('[Music] Play command error:', error);
      return interaction.followUp({
        content: `❌ Error: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: false,
  adminOnly: false,
};

// Skip command
const skipCommand = {
  data: new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip the current song'),
  async execute(interaction) {
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Get the queue for the guild
    const queue = getServerQueue(interaction);
    if (!queue || !queue.playing) {
      return interaction.reply({
        content: '❌ There is no music currently playing!',
        ephemeral: true
      });
    }
    
    try {
      // Get current song before skipping
      const currentSong = queue.currentSong;
      if (!currentSong) {
        return interaction.reply({
          content: '❌ Cannot identify the current song!',
          ephemeral: true
        });
      }
      
      // Skip the song
      const success = queue.skip();
      
      if (success) {
        const skipEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('⏭️ Skipped')
          .setDescription(`Skipped **[${currentSong.title}](${currentSong.url})**`);
          
        return interaction.reply({ embeds: [skipEmbed] });
      } else {
        return interaction.reply({
          content: '❌ Unable to skip the current track!',
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('[Music] Skip command error:', error);
      return interaction.reply({
        content: `❌ Error skipping track: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: false,
  adminOnly: false,
};

// Stop command
const stopCommand = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop the music and clear the queue'),
  async execute(interaction) {
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Get the queue for the guild
    const queue = getServerQueue(interaction);
    if (!queue || !queue.playing) {
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
      console.error('[Music] Stop command error:', error);
      return interaction.reply({
        content: `❌ Error stopping playback: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: false,
  adminOnly: false,
};

// Queue command
const queueCommand = {
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Display the current music queue'),
  async execute(interaction) {
    // Get the queue for the guild
    const queue = getServerQueue(interaction);
    if (!queue || !queue.playing) {
      return interaction.reply({
        content: '❌ There is no music currently playing!',
        ephemeral: true
      });
    }
    
    try {
      // Get current track and upcoming tracks
      const currentSong = queue.currentSong;
      if (!currentSong) {
        return interaction.reply({
          content: '❌ Cannot identify the current song!',
          ephemeral: true
        });
      }
      
      // Create the queue embed
      const queueEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎵 Music Queue')
        .setDescription(`**Currently Playing:** [${currentSong.title}](${currentSong.url}) | ${currentSong.duration}\n\n${
          queue.songs.length ? `**Upcoming Tracks:**\n${queue.songs.map((song, i) => 
            `**${i + 1}.** [${song.title}](${song.url}) | ${song.duration}`
          ).join('\n')}` : '**No upcoming tracks**'
        }`)
        .setFooter({ text: `Queue length: ${queue.songs.length} tracks` });
        
      return interaction.reply({ embeds: [queueEmbed] });
    } catch (error) {
      console.error('[Music] Queue command error:', error);
      return interaction.reply({
        content: `❌ Error displaying queue: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: false,
  adminOnly: false,
};

// Pause command
const pauseCommand = {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause the current song'),
  async execute(interaction) {
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Get the queue for the guild
    const queue = getServerQueue(interaction);
    if (!queue || !queue.playing) {
      return interaction.reply({
        content: '❌ There is no music currently playing!',
        ephemeral: true
      });
    }
    
    try {
      const success = queue.pause();
      
      if (success) {
        const pauseEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('⏸️ Paused')
          .setDescription('Music playback has been paused. Use `/resume` to continue playback.');
          
        return interaction.reply({ embeds: [pauseEmbed] });
      } else {
        return interaction.reply({
          content: '❌ The music is already paused!',
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('[Music] Pause command error:', error);
      return interaction.reply({
        content: `❌ Error pausing playback: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: false,
  adminOnly: false,
};

// Resume command
const resumeCommand = {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Resume paused music'),
  async execute(interaction) {
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Get the queue for the guild
    const queue = getServerQueue(interaction);
    if (!queue) {
      return interaction.reply({
        content: '❌ There is no music in the queue!',
        ephemeral: true
      });
    }
    
    try {
      const success = queue.resume();
      
      if (success) {
        const resumeEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('▶️ Resumed')
          .setDescription('Music playback has been resumed.');
          
        return interaction.reply({ embeds: [resumeEmbed] });
      } else {
        return interaction.reply({
          content: '❌ The music is not paused!',
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('[Music] Resume command error:', error);
      return interaction.reply({
        content: `❌ Error resuming playback: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: false,
  adminOnly: false,
};

// Volume command
const volumeCommand = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Change the music volume')
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
    
    // Get the queue for the guild
    const queue = getServerQueue(interaction);
    if (!queue) {
      return interaction.reply({
        content: '❌ There is no music in the queue!',
        ephemeral: true
      });
    }
    
    // Get the volume level
    const volumeLevel = interaction.options.getInteger('level');
    
    try {
      queue.setVolume(volumeLevel);
      
      const volumeEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🔊 Volume Changed')
        .setDescription(`Volume has been set to **${volumeLevel}%**`);
        
      return interaction.reply({ embeds: [volumeEmbed] });
    } catch (error) {
      console.error('[Music] Volume command error:', error);
      return interaction.reply({
        content: `❌ Error changing volume: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: true, // Premium required
  adminOnly: false,
};

// Loop command
const loopCommand = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Toggle loop mode for the current song'),
  async execute(interaction) {
    // Check if the user is in a voice channel
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        content: '❌ You need to be in a voice channel to use this command!',
        ephemeral: true
      });
    }
    
    // Get the queue for the guild
    const queue = getServerQueue(interaction);
    if (!queue) {
      return interaction.reply({
        content: '❌ There is no music in the queue!',
        ephemeral: true
      });
    }
    
    try {
      const loopEnabled = queue.toggleLoop();
      
      const loopEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(loopEnabled ? '🔄 Loop Enabled' : '➡️ Loop Disabled')
        .setDescription(loopEnabled 
          ? 'Current song will repeat after it ends.'
          : 'Songs will now play in sequence without repeating.');
        
      return interaction.reply({ embeds: [loopEmbed] });
    } catch (error) {
      console.error('[Music] Loop command error:', error);
      return interaction.reply({
        content: `❌ Error toggling loop mode: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: true, // Premium required
  adminOnly: false,
};

// Music info command
const musicInfoCommand = {
  data: new SlashCommandBuilder()
    .setName('musicinfo')
    .setDescription('Display information about the current song'),
  async execute(interaction) {
    // Get the queue for the guild
    const queue = getServerQueue(interaction);
    if (!queue || !queue.playing) {
      return interaction.reply({
        content: '❌ There is no music currently playing!',
        ephemeral: true
      });
    }
    
    try {
      // Get current song
      const currentSong = queue.currentSong;
      if (!currentSong) {
        return interaction.reply({
          content: '❌ Cannot identify the current song!',
          ephemeral: true
        });
      }
      
      // Create info embed
      const infoEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎵 Now Playing')
        .setDescription(`**[${currentSong.title}](${currentSong.url})**`)
        .addFields(
          { name: 'Duration', value: currentSong.duration || 'Unknown', inline: true },
          { name: 'Requested by', value: `<@${currentSong.requestedBy.id}>`, inline: true },
          { name: 'Volume', value: `${queue.volume}%`, inline: true },
          { name: 'Loop', value: queue.loop ? 'Enabled' : 'Disabled', inline: true },
          { name: 'Queue Size', value: `${queue.songs.length} songs`, inline: true }
        );
      
      if (currentSong.thumbnail) {
        infoEmbed.setThumbnail(currentSong.thumbnail);
      }
        
      return interaction.reply({ embeds: [infoEmbed] });
    } catch (error) {
      console.error('[Music] MusicInfo command error:', error);
      return interaction.reply({
        content: `❌ Error getting music info: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: false,
  adminOnly: false,
};

// Playlist command (premium)
const playlistCommand = {
  data: new SlashCommandBuilder()
    .setName('playlist')
    .setDescription('Play a YouTube or SoundCloud playlist')
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
    
    try {
      // Get or create the server queue
      const queue = getServerQueue(interaction, true);
      if (!queue) {
        return interaction.followUp({
          content: '❌ You need to be in a voice channel to use this command!',
          ephemeral: true
        });
      }
      
      // Display a loading message
      await interaction.followUp('🔍 Loading playlist... This may take a moment.');
      
      let tracks = [];
      let playlistName = 'Playlist';
      
      // Parse playlist based on URL type
      if (url.includes('youtube.com') && url.includes('list=')) {
        // YouTube playlist
        const playlist = await playdl.playlist_info(url, { incomplete: true });
        playlistName = playlist.title;
        
        // Get all videos (up to 50 to avoid rate limits)
        const videos = await playlist.all_videos().slice(0, 50);
        
        // Format tracks
        tracks = videos.map(video => ({
          title: video.title,
          url: video.url,
          duration: `${Math.floor(video.durationInSec / 60)}:${(video.durationInSec % 60).toString().padStart(2, '0')}`,
          thumbnail: video.thumbnails[0].url,
          requestedBy: interaction.user
        }));
      } else if (url.includes('soundcloud.com') && url.includes('/sets/')) {
        // SoundCloud playlist
        const playlist = await playdl.soundcloud(url);
        playlistName = playlist.name;
        
        if (!playlist.tracks) {
          throw new Error('Could not fetch tracks from SoundCloud playlist');
        }
        
        // Format tracks
        tracks = await Promise.all(playlist.tracks.slice(0, 50).map(async track => ({
          title: track.name,
          url: track.url,
          duration: `${Math.floor(track.durationInSec / 60)}:${(track.durationInSec % 60).toString().padStart(2, '0')}`,
          thumbnail: track.thumbnail || playlist.thumbnail,
          requestedBy: interaction.user
        })));
      } else {
        throw new Error('Invalid playlist URL. Please provide a valid YouTube or SoundCloud playlist URL');
      }
      
      if (tracks.length === 0) {
        throw new Error('No tracks found in playlist or playlist is private');
      }
      
      // Add tracks to queue
      let addedCount = 0;
      for (const track of tracks) {
        await queue.addSong(track);
        addedCount++;
      }
      
      // Create playlist added embed
      const playlistEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📜 Playlist Added')
        .setDescription(`Added **${addedCount} songs** from playlist [${playlistName}](${url})`)
        .setFooter({ text: `Requested by ${interaction.user.tag}` });
      
      return interaction.followUp({ embeds: [playlistEmbed] });
    } catch (error) {
      console.error('[Music] Playlist command error:', error);
      return interaction.followUp({
        content: `❌ Error loading playlist: ${error.message}`,
        ephemeral: true
      });
    }
  },
  premiumRequired: true, // Premium required
  adminOnly: false,
};

// Export all commands
export const musicCommandsESM = [
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
];