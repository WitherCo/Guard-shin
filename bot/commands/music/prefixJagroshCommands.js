/**
 * Prefix Music Commands using JagroshBot-inspired Player
 * Implementation of prefix commands for the custom music player
 */

const { Collection, EmbedBuilder } = require('discord.js');
const { getServerQueue, playSong } = require('./jagroshMusicPlayer.js');

// Collection to store music-related prefix commands
const musicPrefixCommands = new Collection();

// Play command
musicPrefixCommands.set('play', {
  name: 'play',
  description: 'Play a song or add it to the queue',
  isPremium: false,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    // Check if the user is in a voice channel
    const memberVoiceChannel = message.member?.voice?.channel;
    if (!memberVoiceChannel) {
      return message.reply('❌ You need to be in a voice channel to use this command!');
    }
    
    // Check if we have a query
    if (!args.length) {
      return message.reply('❌ Please provide a song name or URL to play.');
    }
    
    // Get the query
    const query = args.join(' ');
    
    try {
      // Send waiting message
      const waitMsg = await message.reply('🔍 Searching and loading your song...');
      
      // Use the playSong function from our JagroshBot-inspired player
      await playSong(message, query, false);
      
      // Delete the waiting message now that playSong has sent its own response
      waitMsg.delete().catch(() => {});
    } catch (error) {
      console.error('[Music] Play command error:', error);
      return message.reply(`❌ Error playing track: ${error.message}`);
    }
  }
});

// Skip command
musicPrefixCommands.set('skip', {
  name: 'skip',
  description: 'Skip the current song',
  isPremium: false,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    // Check if the user is in a voice channel
    const memberVoiceChannel = message.member?.voice?.channel;
    if (!memberVoiceChannel) {
      return message.reply('❌ You need to be in a voice channel to use this command!');
    }
    
    // Get the queue for the guild
    const queue = getServerQueue(message);
    if (!queue || !queue.playing) {
      return message.reply('❌ There is no music currently playing!');
    }
    
    try {
      // Get current song before skipping
      const currentSong = queue.currentSong;
      if (!currentSong) {
        return message.reply('❌ Cannot identify the current song!');
      }
      
      // Skip the song
      const success = queue.skip();
      
      if (success) {
        const skipEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('⏭️ Skipped')
          .setDescription(`Skipped **[${currentSong.title}](${currentSong.url})**`);
          
        return message.reply({ embeds: [skipEmbed] });
      } else {
        return message.reply('❌ Unable to skip the current track!');
      }
    } catch (error) {
      console.error('[Music] Skip command error:', error);
      return message.reply(`❌ Error skipping track: ${error.message}`);
    }
  }
});

// Stop command
musicPrefixCommands.set('stop', {
  name: 'stop',
  description: 'Stop the music and clear the queue',
  isPremium: false,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    // Check if the user is in a voice channel
    const memberVoiceChannel = message.member?.voice?.channel;
    if (!memberVoiceChannel) {
      return message.reply('❌ You need to be in a voice channel to use this command!');
    }
    
    // Get the queue for the guild
    const queue = getServerQueue(message);
    if (!queue || !queue.playing) {
      return message.reply('❌ There is no music currently playing!');
    }
    
    try {
      queue.stop();
      
      const stopEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('⏹️ Stopped')
        .setDescription('Music playback has been stopped and the queue has been cleared.');
        
      return message.reply({ embeds: [stopEmbed] });
    } catch (error) {
      console.error('[Music] Stop command error:', error);
      return message.reply(`❌ Error stopping playback: ${error.message}`);
    }
  }
});

// Queue command
musicPrefixCommands.set('queue', {
  name: 'queue',
  description: 'Display the current music queue',
  isPremium: false,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    // Get the queue for the guild
    const queue = getServerQueue(message);
    if (!queue || !queue.playing) {
      return message.reply('❌ There is no music currently playing!');
    }
    
    try {
      // Get current track and upcoming tracks
      const currentSong = queue.currentSong;
      if (!currentSong) {
        return message.reply('❌ Cannot identify the current song!');
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
        
      return message.reply({ embeds: [queueEmbed] });
    } catch (error) {
      console.error('[Music] Queue command error:', error);
      return message.reply(`❌ Error displaying queue: ${error.message}`);
    }
  }
});

// Pause command
musicPrefixCommands.set('pause', {
  name: 'pause',
  description: 'Pause the current song',
  isPremium: false,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    // Check if the user is in a voice channel
    const memberVoiceChannel = message.member?.voice?.channel;
    if (!memberVoiceChannel) {
      return message.reply('❌ You need to be in a voice channel to use this command!');
    }
    
    // Get the queue for the guild
    const queue = getServerQueue(message);
    if (!queue || !queue.playing) {
      return message.reply('❌ There is no music currently playing!');
    }
    
    try {
      const success = queue.pause();
      
      if (success) {
        const pauseEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('⏸️ Paused')
          .setDescription('Music playback has been paused. Use `;resume` to continue playback.');
          
        return message.reply({ embeds: [pauseEmbed] });
      } else {
        return message.reply('❌ The music is already paused!');
      }
    } catch (error) {
      console.error('[Music] Pause command error:', error);
      return message.reply(`❌ Error pausing playback: ${error.message}`);
    }
  }
});

// Resume command
musicPrefixCommands.set('resume', {
  name: 'resume',
  description: 'Resume paused music',
  isPremium: false,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    // Check if the user is in a voice channel
    const memberVoiceChannel = message.member?.voice?.channel;
    if (!memberVoiceChannel) {
      return message.reply('❌ You need to be in a voice channel to use this command!');
    }
    
    // Get the queue for the guild
    const queue = getServerQueue(message);
    if (!queue) {
      return message.reply('❌ There is no music in the queue!');
    }
    
    try {
      const success = queue.resume();
      
      if (success) {
        const resumeEmbed = new EmbedBuilder()
          .setColor('#5865F2')
          .setTitle('▶️ Resumed')
          .setDescription('Music playback has been resumed.');
          
        return message.reply({ embeds: [resumeEmbed] });
      } else {
        return message.reply('❌ The music is not paused!');
      }
    } catch (error) {
      console.error('[Music] Resume command error:', error);
      return message.reply(`❌ Error resuming playback: ${error.message}`);
    }
  }
});

// Volume command
musicPrefixCommands.set('volume', {
  name: 'volume',
  description: 'Change the music volume',
  isPremium: true, // Premium required
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    // Check if the user is in a voice channel
    const memberVoiceChannel = message.member?.voice?.channel;
    if (!memberVoiceChannel) {
      return message.reply('❌ You need to be in a voice channel to use this command!');
    }
    
    // Get the queue for the guild
    const queue = getServerQueue(message);
    if (!queue) {
      return message.reply('❌ There is no music in the queue!');
    }
    
    // Check if we have a volume level
    if (!args.length) {
      return message.reply(`🔊 Current volume: **${queue.volume}%**`);
    }
    
    // Parse volume level
    const volumeLevel = parseInt(args[0]);
    if (isNaN(volumeLevel) || volumeLevel < 0 || volumeLevel > 100) {
      return message.reply('❌ Please provide a valid volume level between 0 and 100.');
    }
    
    try {
      queue.setVolume(volumeLevel);
      
      const volumeEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🔊 Volume Changed')
        .setDescription(`Volume has been set to **${volumeLevel}%**`);
        
      return message.reply({ embeds: [volumeEmbed] });
    } catch (error) {
      console.error('[Music] Volume command error:', error);
      return message.reply(`❌ Error changing volume: ${error.message}`);
    }
  }
});

// Loop command
musicPrefixCommands.set('loop', {
  name: 'loop',
  description: 'Toggle loop mode for the current song',
  isPremium: true, // Premium required
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    // Check if the user is in a voice channel
    const memberVoiceChannel = message.member?.voice?.channel;
    if (!memberVoiceChannel) {
      return message.reply('❌ You need to be in a voice channel to use this command!');
    }
    
    // Get the queue for the guild
    const queue = getServerQueue(message);
    if (!queue) {
      return message.reply('❌ There is no music in the queue!');
    }
    
    try {
      const loopEnabled = queue.toggleLoop();
      
      const loopEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle(loopEnabled ? '🔄 Loop Enabled' : '➡️ Loop Disabled')
        .setDescription(loopEnabled 
          ? 'Current song will repeat after it ends.'
          : 'Songs will now play in sequence without repeating.');
        
      return message.reply({ embeds: [loopEmbed] });
    } catch (error) {
      console.error('[Music] Loop command error:', error);
      return message.reply(`❌ Error toggling loop mode: ${error.message}`);
    }
  }
});

// Music info command
musicPrefixCommands.set('musicinfo', {
  name: 'musicinfo',
  description: 'Display information about the current song',
  isPremium: false,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    // Get the queue for the guild
    const queue = getServerQueue(message);
    if (!queue || !queue.playing) {
      return message.reply('❌ There is no music currently playing!');
    }
    
    try {
      // Get current song
      const currentSong = queue.currentSong;
      if (!currentSong) {
        return message.reply('❌ Cannot identify the current song!');
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
        
      return message.reply({ embeds: [infoEmbed] });
    } catch (error) {
      console.error('[Music] MusicInfo command error:', error);
      return message.reply(`❌ Error getting music info: ${error.message}`);
    }
  }
});

// Playlist command (premium)
musicPrefixCommands.set('playlist', {
  name: 'playlist',
  description: 'Play a YouTube or SoundCloud playlist',
  isPremium: true, // Premium required
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    // Check if the user is in a voice channel
    const memberVoiceChannel = message.member?.voice?.channel;
    if (!memberVoiceChannel) {
      return message.reply('❌ You need to be in a voice channel to use this command!');
    }
    
    // Check if we have a URL
    if (!args.length) {
      return message.reply('❌ Please provide a YouTube or SoundCloud playlist URL.');
    }
    
    // Get the playlist URL
    const url = args[0];
    
    try {
      // Get or create the server queue
      const queue = getServerQueue(message, true);
      if (!queue) {
        return message.reply('❌ Failed to create music queue.');
      }
      
      // Display a loading message
      const waitMsg = await message.reply('🔍 Loading playlist... This may take a moment.');
      
      const playdl = require('play-dl');
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
          requestedBy: message.author
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
          requestedBy: message.author
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
        .setFooter({ text: `Requested by ${message.author.tag}` });
      
      // Edit the waiting message with our embed
      return waitMsg.edit({ content: null, embeds: [playlistEmbed] });
    } catch (error) {
      console.error('[Music] Playlist command error:', error);
      return message.reply(`❌ Error loading playlist: ${error.message}`);
    }
  }
});

// Export all commands
module.exports = {
  musicPrefixCommands
};