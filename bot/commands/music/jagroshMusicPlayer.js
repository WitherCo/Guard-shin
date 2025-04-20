/**
 * JagroshBot-inspired Music Player
 * A simplified implementation inspired by the popular JDA-based music bot
 */

const { 
  createAudioPlayer, 
  createAudioResource, 
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus,
  AudioPlayerStatus
} = require('@discordjs/voice');
const { Collection, EmbedBuilder } = require('discord.js');
const ytdl = require('ytdl-core');
const playdl = require('play-dl');
const ffmpeg = require('ffmpeg-static');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

// Global server queues
const queues = new Collection();

// Class to manage music queues for each server
class MusicQueue {
  constructor(textChannel, voiceChannel) {
    this.textChannel = textChannel;
    this.voiceChannel = voiceChannel;
    this.connection = null;
    this.songs = [];
    this.volume = 80;
    this.playing = false;
    this.audioPlayer = createAudioPlayer();
    this.timeout = null;
    this.loop = false;
    this.currentSong = null;
    
    // Set up event listeners for the audio player
    this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
      // When the player finishes a song, play the next one or end
      if (this.timeout) {
        clearTimeout(this.timeout);
        this.timeout = null;
      }
      
      console.log('[JagroshMusic] Player is idle, checking for next song...');
      
      if (this.loop && this.currentSong) {
        console.log('[JagroshMusic] Loop enabled, replaying current song');
        this.songs.unshift(this.currentSong);
      }
      
      // Delay before playing the next song to prevent rapid cycling
      this.timeout = setTimeout(() => {
        this.playSong();
      }, 1000);
    });
    
    this.audioPlayer.on(AudioPlayerStatus.Playing, () => {
      console.log('[JagroshMusic] Now playing a song');
      this.playing = true;
    });
    
    this.audioPlayer.on(AudioPlayerStatus.Paused, () => {
      console.log('[JagroshMusic] Playback paused');
      this.playing = false;
    });
    
    this.audioPlayer.on('error', error => {
      console.error('[JagroshMusic] Error:', error);
      this.textChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Music Player Error')
            .setDescription(`An error occurred: ${error.message}`)
        ]
      }).catch(console.error);
      
      // Try to recover by playing the next song
      if (this.songs.length > 0) {
        console.log('[JagroshMusic] Attempting to recover by playing next song');
        this.playSong();
      }
    });
  }
  
  // Connect to a voice channel
  async connect() {
    try {
      if (this.connection) return;
      
      console.log(`[JagroshMusic] Joining voice channel: ${this.voiceChannel.name}`);
      
      this.connection = joinVoiceChannel({
        channelId: this.voiceChannel.id,
        guildId: this.voiceChannel.guild.id,
        adapterCreator: this.voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: true
      });
      
      this.connection.subscribe(this.audioPlayer);
      
      // Handle connection events
      this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
          console.log('[JagroshMusic] Disconnected from voice channel, attempting to reconnect');
          await Promise.race([
            entersState(this.connection, VoiceConnectionStatus.Signalling, 5_000),
            entersState(this.connection, VoiceConnectionStatus.Connecting, 5_000),
          ]);
          // Seems to be reconnecting
        } catch (error) {
          console.error('[JagroshMusic] Could not reconnect within 5 seconds, destroying connection');
          this.destroy();
        }
      });
      
      this.connection.on('error', error => {
        console.error('[JagroshMusic] Voice connection error:', error);
        this.textChannel.send({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF0000')
              .setTitle('❌ Voice Connection Error')
              .setDescription(`An error occurred with the voice connection: ${error.message}`)
          ]
        }).catch(console.error);
      });
      
      // Wait for the connection to be ready
      await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
      console.log('[JagroshMusic] Successfully connected to voice channel');
      
      return this.connection;
    } catch (error) {
      console.error('[JagroshMusic] Error connecting to voice channel:', error);
      this.textChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Connection Error')
            .setDescription(`Failed to join voice channel: ${error.message}`)
        ]
      }).catch(console.error);
      this.destroy();
      throw error;
    }
  }
  
  // Add a song to the queue
  async addSong(song) {
    this.songs.push(song);
    console.log(`[JagroshMusic] Added song to queue: ${song.title}`);
    
    if (!this.playing && this.songs.length === 1) {
      await this.connect();
      this.playSong();
    }
    
    return song;
  }
  
  // Play the next song in the queue
  async playSong() {
    if (this.songs.length === 0) {
      console.log('[JagroshMusic] Queue is empty, stopping playback');
      this.textChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎵 Queue Ended')
            .setDescription('The music queue has ended. Add more songs to keep the party going!')
        ]
      }).catch(console.error);
      
      this.playing = false;
      this.currentSong = null;
      
      // Set a timer to disconnect if no songs are added
      this.timeout = setTimeout(() => {
        console.log('[JagroshMusic] No activity, disconnecting from voice channel');
        this.destroy();
      }, 60000);
      
      return;
    }
    
    // Cancel any pending disconnect
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    try {
      // Get the next song
      const song = this.songs.shift();
      this.currentSong = song;
      console.log(`[JagroshMusic] Attempting to play: ${song.title}`);
      
      // Create audio resource based on the source type
      let resource;
      
      if (song.url.includes('youtube.com') || song.url.includes('youtu.be')) {
        console.log('[JagroshMusic] Using ytdl for YouTube URL');
        try {
          // Get video info to validate it
          const videoInfo = await ytdl.getInfo(song.url);
          const format = ytdl.chooseFormat(videoInfo.formats, { quality: 'highestaudio' });
          
          if (!format) {
            throw new Error('No suitable audio format found');
          }
          
          // Create stream with high quality audio and proper options
          const stream = ytdl.downloadFromInfo(videoInfo, { 
            format,
            highWaterMark: 1 << 25, // 32MB buffer
            filter: 'audioonly',
          });
          
          resource = createAudioResource(stream, {
            inlineVolume: true,
            metadata: {
              title: song.title,
              url: song.url
            }
          });
        } catch (error) {
          console.error('[JagroshMusic] Error with ytdl, falling back to play-dl:', error);
          // Fall back to play-dl if ytdl fails
          const stream = await playdl.stream(song.url, { discordPlayerCompatibility: true });
          resource = createAudioResource(stream.stream, {
            inputType: stream.type,
            inlineVolume: true,
            metadata: {
              title: song.title,
              url: song.url
            }
          });
        }
      } else if (song.url.includes('soundcloud.com')) {
        console.log('[JagroshMusic] Using play-dl for SoundCloud URL');
        const stream = await playdl.stream(song.url);
        resource = createAudioResource(stream.stream, {
          inputType: stream.type,
          inlineVolume: true,
          metadata: {
            title: song.title,
            url: song.url
          }
        });
      } else {
        // For other URLs, try play-dl as a fallback
        console.log('[JagroshMusic] Using play-dl for generic URL');
        const stream = await playdl.stream(song.url);
        resource = createAudioResource(stream.stream, {
          inputType: stream.type,
          inlineVolume: true,
          metadata: {
            title: song.title,
            url: song.url
          }
        });
      }
      
      // Set the volume
      if (resource.volume) {
        resource.volume.setVolume(this.volume / 100);
      }
      
      // Play the song
      this.audioPlayer.play(resource);
      this.playing = true;
      
      // Announce now playing
      this.textChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎵 Now Playing')
            .setDescription(`**[${song.title}](${song.url})**`)
            .addFields(
              { name: 'Duration', value: song.duration || 'Unknown', inline: true },
              { name: 'Requested by', value: `<@${song.requestedBy.id}>`, inline: true }
            )
            .setThumbnail(song.thumbnail || null)
        ]
      }).catch(console.error);
      
      console.log(`[JagroshMusic] Now playing: ${song.title}`);
      
    } catch (error) {
      console.error('[JagroshMusic] Error playing song:', error);
      this.textChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('❌ Error')
            .setDescription(`Could not play song: ${error.message}`)
        ]
      }).catch(console.error);
      
      // Try to play the next song
      this.playSong();
    }
  }
  
  // Skip the current song
  skip() {
    console.log('[JagroshMusic] Skipping current song');
    this.audioPlayer.stop();
    return true;
  }
  
  // Stop playback and clear the queue
  stop() {
    console.log('[JagroshMusic] Stopping playback and clearing queue');
    this.songs = [];
    this.audioPlayer.stop();
    this.playing = false;
    this.currentSong = null;
    return true;
  }
  
  // Pause the current song
  pause() {
    if (this.playing) {
      console.log('[JagroshMusic] Pausing playback');
      this.audioPlayer.pause();
      this.playing = false;
      return true;
    }
    return false;
  }
  
  // Resume playback
  resume() {
    if (!this.playing && this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
      console.log('[JagroshMusic] Resuming playback');
      this.audioPlayer.unpause();
      this.playing = true;
      return true;
    }
    return false;
  }
  
  // Set the volume of the player
  setVolume(volume) {
    console.log(`[JagroshMusic] Setting volume to ${volume}%`);
    this.volume = volume;
    
    // If a song is playing, update its volume
    if (this.audioPlayer.state.status === AudioPlayerStatus.Playing && 
        this.audioPlayer.state.resource.volume) {
      this.audioPlayer.state.resource.volume.setVolume(volume / 100);
    }
    
    return true;
  }
  
  // Toggle loop mode
  toggleLoop() {
    this.loop = !this.loop;
    console.log(`[JagroshMusic] Loop mode is now ${this.loop ? 'enabled' : 'disabled'}`);
    return this.loop;
  }
  
  // Clean up resources
  destroy() {
    console.log('[JagroshMusic] Destroying music player resources');
    
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    this.songs = [];
    this.playing = false;
    this.currentSong = null;
    
    if (this.connection) {
      this.connection.destroy();
      this.connection = null;
    }
    
    if (this.audioPlayer) {
      this.audioPlayer.stop();
    }
  }
}

// Functions for interacting with the music player

/**
 * Get or create a server queue
 */
function getServerQueue(message, create = false) {
  const guildId = message.guild.id;
  const queue = queues.get(guildId);
  
  if (queue) return queue;
  if (!create) return null;
  
  // Create a new queue
  const voiceChannel = message.member.voice.channel;
  if (!voiceChannel) return null;
  
  const textChannel = message.channel;
  const newQueue = new MusicQueue(textChannel, voiceChannel);
  queues.set(guildId, newQueue);
  
  return newQueue;
}

/**
 * Play a song - extract info and add to queue
 */
async function playSong(message, query, isSlashCommand = false) {
  try {
    console.log(`[JagroshMusic] Searching for: ${query}`);
    
    // Get or create the server queue
    const queue = getServerQueue(message, true);
    if (!queue) {
      const errorMessage = '❌ You need to be in a voice channel to play music!';
      return isSlashCommand 
        ? message.reply({ content: errorMessage, ephemeral: true })
        : message.reply(errorMessage);
    }
    
    let songInfo;
    let songData;
    
    // Handle different URL types
    if (ytdl.validateURL(query)) {
      console.log('[JagroshMusic] Valid YouTube URL detected');
      try {
        songInfo = await ytdl.getInfo(query);
        songData = {
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          duration: formatDuration(parseInt(songInfo.videoDetails.lengthSeconds)),
          thumbnail: songInfo.videoDetails.thumbnails[0]?.url,
          requestedBy: isSlashCommand ? message.user : message.author
        };
      } catch (error) {
        console.error('[JagroshMusic] Error getting YouTube info:', error);
        throw new Error(`Could not extract YouTube video info: ${error.message}`);
      }
    } else if (query.includes('soundcloud.com')) {
      console.log('[JagroshMusic] SoundCloud URL detected');
      try {
        // Use play-dl for SoundCloud
        const songInfo = await playdl.soundcloud(query);
        songData = {
          title: songInfo.name,
          url: songInfo.url,
          duration: formatDuration(Math.floor(songInfo.durationInSec)),
          thumbnail: songInfo.thumbnail,
          requestedBy: isSlashCommand ? message.user : message.author
        };
      } catch (error) {
        console.error('[JagroshMusic] Error getting SoundCloud info:', error);
        throw new Error(`Could not extract SoundCloud track info: ${error.message}`);
      }
    } else {
      console.log('[JagroshMusic] Search query detected, searching YouTube');
      try {
        // Search YouTube for the query
        const searchResults = await playdl.search(query, { limit: 1 });
        if (!searchResults || searchResults.length === 0) {
          throw new Error('No search results found');
        }
        
        const videoResult = searchResults[0];
        songData = {
          title: videoResult.title,
          url: videoResult.url,
          duration: formatDuration(videoResult.durationInSec),
          thumbnail: videoResult.thumbnails[0].url,
          requestedBy: isSlashCommand ? message.user : message.author
        };
      } catch (error) {
        console.error('[JagroshMusic] Error searching YouTube:', error);
        throw new Error(`Could not search for video: ${error.message}`);
      }
    }
    
    // Add the song to the queue
    const song = await queue.addSong(songData);
    
    // Create response embed
    const addedEmbed = new EmbedBuilder()
      .setColor('#5865F2')
      .setTitle(queue.playing ? '🎵 Added to Queue' : '🎵 Now Playing')
      .setDescription(`**[${song.title}](${song.url})**`)
      .addFields(
        { name: 'Duration', value: song.duration || 'Unknown', inline: true },
        { name: 'Requested by', value: `<@${song.requestedBy.id}>`, inline: true }
      );
    
    if (song.thumbnail) {
      addedEmbed.setThumbnail(song.thumbnail);
    }
    
    // Reply with the embed
    return isSlashCommand
      ? message.reply({ embeds: [addedEmbed] })
      : message.reply({ embeds: [addedEmbed] });
    
  } catch (error) {
    console.error('[JagroshMusic] Error in playSong function:', error);
    const errorMessage = `❌ Error: ${error.message}`;
    return isSlashCommand
      ? message.reply({ content: errorMessage, ephemeral: true })
      : message.reply(errorMessage);
  }
}

// Utility functions

/**
 * Format duration in seconds to MM:SS or HH:MM:SS
 */
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return 'Unknown';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

module.exports = {
  getServerQueue,
  playSong,
  MusicQueue
};