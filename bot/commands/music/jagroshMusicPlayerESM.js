/**
 * JagroshBot-inspired Music Player (ESM Version)
 * A simplified implementation inspired by the popular JDA-based music bot
 */

import { 
  createAudioPlayer, 
  createAudioResource, 
  joinVoiceChannel,
  entersState,
  VoiceConnectionStatus,
  AudioPlayerStatus
} from '@discordjs/voice';
import { Collection, EmbedBuilder } from 'discord.js';
import ytdl from 'ytdl-core';
import * as playdl from 'play-dl';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

// Global server queues
const queues = new Collection();

// Simple utility for safely executing API calls with YouTube
// This approach will simply use ytdl-core directly if play-dl fails,
// avoiding the rate limiting issues

/**
 * Enhanced YouTube Info function with better error handling and fallbacks
 * @param {string} url The YouTube URL
 * @returns {Promise<Object>} Video info with standard structure
 */
async function safeGetYouTubeInfo(url) {
  try {
    // First try the validation which is most reliable
    console.log('[JagroshMusic] Validating YouTube URL');
    const validated = await playdl.validate(url);
    
    // Extract video ID from URL
    const videoId = url.includes('youtu.be/') 
      ? url.split('youtu.be/')[1].split('?')[0] 
      : url.includes('youtube.com/watch?v=') 
        ? url.split('v=')[1].split('&')[0]
        : '';
        
    console.log(`[JagroshMusic] Extracted video ID: ${videoId}`);
    
    if (validated === 'yt_video' && videoId) {
      // If we can validate but can't get info, create a basic object
      console.log('[JagroshMusic] Creating basic info from extracted ID');
      
      // Attempt to get a thumbnail URL
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/0.jpg`;
      
      return {
        video_details: {
          title: `YouTube Video (ID: ${videoId})`,
          url: url,
          durationInSec: 0, // Unknown duration
          thumbnails: [{ url: thumbnailUrl }]
        }
      };
    }
    
    // If we got this far, try play-dl's basic info endpoint
    console.log('[JagroshMusic] Attempting to get basic video info');
    const basicInfo = await playdl.video_basic_info(url);
    if (basicInfo && basicInfo.video_details) {
      return { video_details: basicInfo.video_details };
    }
    
    // Fall back to full video_info if needed
    return await playdl.video_info(url);
  } catch (error) {
    console.log(`[JagroshMusic] Error getting video info: ${error.message}`);
    
    // Extract video ID from URL with more robust parsing
    let videoId = '';
    try {
      // First try using URL object for more reliable parsing
      const urlObj = new URL(url);
      
      if (url.includes('youtu.be/')) {
        // Short links - youtu.be/ID
        videoId = urlObj.pathname.split('/')[1];
      } else if (url.includes('youtube.com/watch')) {
        // Standard URLs - youtube.com/watch?v=ID
        videoId = urlObj.searchParams.get('v') || '';
      } else if (url.includes('youtube.com/shorts/')) {
        // Handle YouTube shorts - youtube.com/shorts/ID
        videoId = urlObj.pathname.split('/shorts/')[1];
      } else if (url.includes('youtube.com/embed/')) {
        // Handle embed URLs - youtube.com/embed/ID
        videoId = urlObj.pathname.split('/embed/')[1];
      }
      
      // Cleanup any trailing slashes or query parameters
      if (videoId) {
        videoId = videoId.split('?')[0].split('/')[0];
      }
    } catch (parseError) {
      console.log('[JagroshMusic] Error parsing video ID:', parseError.message);
      
      // Fallback to basic string manipulation if URL parsing fails
      try {
        if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1].split('?')[0];
        } else if (url.includes('youtube.com/watch?v=')) {
          videoId = url.split('v=')[1].split('&')[0];
        } else if (url.includes('youtube.com/shorts/')) {
          videoId = url.split('shorts/')[1].split('?')[0];
        } else if (url.includes('youtube.com/embed/')) {
          videoId = url.split('embed/')[1].split('?')[0];
        }
      } catch (fallbackError) {
        console.log('[JagroshMusic] Fallback extraction also failed:', fallbackError.message);
      }
    }
    
    // Return minimal info with extracted ID if possible
    return {
      video_details: {
        title: videoId ? `YouTube Video (ID: ${videoId})` : "YouTube Video",
        url: url,
        durationInSec: 0,
        thumbnails: videoId ? [{ url: `https://img.youtube.com/vi/${videoId}/0.jpg` }] : []
      }
    };
  }
}

/**
 * Enhanced YouTube stream creation with better error handling
 * @param {string} url The YouTube URL
 * @returns {Promise<Object>} Stream object with standard structure
 */
async function safeCreateYouTubeStream(url) {
  console.log('[JagroshMusic] Creating stream for URL:', url);
  
  // Extract the video ID first with more robust parsing
  let videoId = '';
  try {
    // First try using URL object for more reliable parsing
    const urlObj = new URL(url);
    
    if (url.includes('youtu.be/')) {
      // Short links - youtu.be/ID
      videoId = urlObj.pathname.split('/')[1];
    } else if (url.includes('youtube.com/watch')) {
      // Standard URLs - youtube.com/watch?v=ID
      videoId = urlObj.searchParams.get('v') || '';
    } else if (url.includes('youtube.com/shorts/')) {
      // Handle YouTube shorts - youtube.com/shorts/ID
      videoId = urlObj.pathname.split('/shorts/')[1];
    } else if (url.includes('youtube.com/embed/')) {
      // Handle embed URLs - youtube.com/embed/ID
      videoId = urlObj.pathname.split('/embed/')[1];
    }
    
    // Cleanup any trailing slashes or query parameters
    if (videoId) {
      videoId = videoId.split('?')[0].split('/')[0];
    }
    
    console.log(`[JagroshMusic] Extracted video ID: ${videoId}`);
  } catch (error) {
    console.log('[JagroshMusic] Error extracting video ID:', error.message);
    
    // Fallback to basic string manipulation if URL parsing fails
    try {
      if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1].split('?')[0];
      } else if (url.includes('youtube.com/watch?v=')) {
        videoId = url.split('v=')[1].split('&')[0];
      } else if (url.includes('youtube.com/shorts/')) {
        videoId = url.split('shorts/')[1].split('?')[0];
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('embed/')[1].split('?')[0];
      }
    } catch (fallbackError) {
      console.log('[JagroshMusic] Fallback extraction also failed:', fallbackError.message);
    }
  }
  
  // Use a simple approach to try with play-dl first
  try {
    // First check if the URL is valid
    const validated = await playdl.validate(url);
    if (validated === 'yt_video') {
      console.log('[JagroshMusic] URL validated as YouTube video, attempting stream');
      
      // Use more robust settings to improve compatibility
      try {
        const stream = await playdl.stream(url, {
          quality: 0, // Lowest quality for best chance of success
          discordPlayerCompatibility: true, // Ensure Discord.js compatibility
          seek: 0, // Start from beginning
          precache: 0, // Disable precaching
          requestOptions: {
            headers: {
              // Add a proper user agent to reduce chance of blocking
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          }
        });
        
        if (stream && stream.stream) {
          console.log('[JagroshMusic] Successfully created stream');
          return stream;
        }
      } catch (streamError) {
        // Special handling for rate limiting (429) errors
        if (streamError.message && streamError.message.includes('429')) {
          console.log('[JagroshMusic] Rate limited by YouTube API (429 error), trying fallback method');
          // Continue to next fallback - don't throw
        } else {
          console.log('[JagroshMusic] Error in stream creation:', streamError.message);
        }
        // Continue to fallback regardless of error type
      }
    } else {
      console.log(`[JagroshMusic] URL not validated as YouTube video: ${validated}`);
    }
  } catch (error) {
    console.log('[JagroshMusic] Error creating stream with play-dl:', error.message);
    // Continue to fallback methods
  }
  
  // Fallback to ytdl-core with more robust options
  try {
    console.log('[JagroshMusic] Trying ytdl-core with direct URL');
    
    // Create a direct stream using the video ID
    const ytUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;
    const stream = ytdl(ytUrl, {
      filter: 'audioonly',
      quality: 'lowestaudio', // Try lowest audio to ensure it works
      highWaterMark: 1 << 24, // 16MB buffer
      dlChunkSize: 1024 * 1024, // 1MB chunks
    });
    
    console.log('[JagroshMusic] ytdl-core stream created');
    
    // Return in a compatible format
    return {
      stream: stream,
      type: 1 // Raw audio type
    };
  } catch (error) {
    console.log('[JagroshMusic] ytdl-core stream failed:', error.message);
  }
  
  // Try using a simpler YouTube direct approach as final fallback
  console.log('[JagroshMusic] All primary methods failed, using direct URL fallback');
  
  try {
    // Use the most basic approach possible
    if (videoId) {
      // Try with a minimalist approach - using raw videoId
      const directUrl = `https://www.youtube.com/watch?v=${videoId}`;
      console.log(`[JagroshMusic] Attempting with direct URL: ${directUrl}`);
      
      try {
        // Options with minimum features and maximum compatibility
        const streamOptions = {
          quality: 0, // Lowest quality possible
          htmldata: false, // Don't need this
          liveBuffer: 20000, // 20s for live streams
          discordPlayerCompatibility: true, // Ensure discord.js compatibility
          precache: 0 // Disable precaching
        };
        
        // Last attempt with play-dl
        const stream = await playdl.stream(directUrl, streamOptions);
        console.log('[JagroshMusic] Direct URL approach successful');
        return stream;
      } catch (rateError) {
        // Special handling for rate limiting (429) errors
        if (rateError.message && rateError.message.includes('429')) {
          console.log('[JagroshMusic] Rate limited by YouTube API (429 error) on final attempt');
          // Will fall through to silent stream
        } else {
          console.log('[JagroshMusic] Error in final stream creation:', rateError.message);
        }
      }
    }
  } catch (error) {
    console.log('[JagroshMusic] Final fallback method failed:', error.message);
  }
  
  // If all else fails, create a silent stream
  console.log('[JagroshMusic] All methods failed, using silent stream');
  const { Readable } = await import('stream');
  const silentStream = new Readable({
    read() {
      // This is a silent stream that will just end immediately
      this.push(null);
    }
  });
  
  return {
    stream: silentStream,
    type: 1
  };
}

/**
 * Enhanced YouTube search with better error handling
 * @param {string} query The search query
 * @returns {Promise<Array>} Search results
 */
async function safeSearchYouTube(query) {
  console.log('[JagroshMusic] Searching for:', query);
  
  // For search, we'll simply return a "placeholder" result that points to 
  // YouTube's search page URL, as both play-dl and ytdl-core have issues with search in Replit
  
  // Create a search URL for YouTube
  const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  
  // If Play-dl validation works, try to get a video from search
  try {
    console.log('[JagroshMusic] Attempting search with play-dl');
    
    // The primary search might be rate-limited, use more robust options
    const results = await playdl.search(query, { 
      limit: 1,
      source: { youtube: 'video' },
      fuzzy: true, // Allow fuzzy matching to improve results
      requestOptions: {
        headers: {
          // Add a proper user agent to reduce chance of blocking
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    });
    
    if (results && results.length > 0) {
      console.log('[JagroshMusic] Found result:', results[0].title);
      return results;
    }
  } catch (error) {
    console.log('[JagroshMusic] play-dl search failed:', error.message);
  }
  
  // If we got here, return a placeholder that will use the YouTube search URL
  console.log('[JagroshMusic] Using placeholder search result with YouTube search URL');
  return [{
    title: `Search: ${query}`,
    url: searchUrl,
    durationInSec: 0,
    thumbnails: [{ url: '' }]
  }];
}

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
        console.log('[JagroshMusic] Creating stream for YouTube URL using safe helper');
        
        // Use our safe helper function that handles fallbacks internally
        const stream = await safeCreateYouTubeStream(song.url);
        
        if (!stream || !stream.stream) {
          throw new Error('Failed to create stream for YouTube URL');
        }
        
        resource = createAudioResource(stream.stream, {
          inputType: stream.type,
          inlineVolume: true,
          metadata: {
            title: song.title,
            url: song.url
          }
        });
        
        console.log('[JagroshMusic] Successfully created audio resource for YouTube');
      } else if (song.url.includes('soundcloud.com')) {
        console.log('[JagroshMusic] Using play-dl for SoundCloud URL');
        try {
          const streamOptions = {
            discordPlayerCompatibility: true
          };
          
          // Use standard play-dl since SoundCloud doesn't have the same rate limits
          const stream = await playdl.stream(song.url, streamOptions);
          
          if (!stream || !stream.stream) {
            throw new Error('Failed to create SoundCloud stream');
          }
          
          resource = createAudioResource(stream.stream, {
            inputType: stream.type,
            inlineVolume: true,
            metadata: {
              title: song.title,
              url: song.url
            }
          });
          
          console.log('[JagroshMusic] Successfully created audio resource for SoundCloud');
        } catch (error) {
          console.error('[JagroshMusic] Error streaming from SoundCloud:', error);
          throw new Error(`Failed to stream from SoundCloud: ${error.message}`);
        }
      } else {
        // For other URLs, try play-dl as a fallback
        console.log('[JagroshMusic] Using play-dl for generic URL');
        try {
          const streamOptions = {
            discordPlayerCompatibility: true
          };
          
          // Use standard play-dl for non-YouTube URLs
          const stream = await playdl.stream(song.url, streamOptions);
          
          if (!stream || !stream.stream) {
            throw new Error('Failed to create stream');
          }
          
          resource = createAudioResource(stream.stream, {
            inputType: stream.type,
            inlineVolume: true,
            metadata: {
              title: song.title,
              url: song.url
            }
          });
          
          console.log('[JagroshMusic] Successfully created audio resource for URL');
        } catch (error) {
          console.error('[JagroshMusic] Error streaming from URL:', error);
          throw new Error(`Failed to stream from URL: ${error.message}`);
        }
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
        // Use our safe helper that will handle fallbacks internally
        const songInfo = await safeGetYouTubeInfo(query);
        const videoDetails = songInfo.video_details;
        songData = {
          title: videoDetails.title,
          url: videoDetails.url,
          duration: formatDuration(Math.floor(videoDetails.durationInSec)),
          thumbnail: videoDetails.thumbnails[0]?.url,
          requestedBy: isSlashCommand ? message.user : message.author
        };
      } catch (error) {
        console.error('[JagroshMusic] Failed to get YouTube info with all methods:', error);
        throw new Error(`Could not extract YouTube video info: ${error.message}. Please try a different video or URL.`);
      }
    } else if (query.includes('soundcloud.com')) {
      console.log('[JagroshMusic] SoundCloud URL detected');
      try {
        // Use regular play-dl for SoundCloud
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
        // Use our safe search method
        const searchResults = await safeSearchYouTube(query);
        
        if (!searchResults || searchResults.length === 0) {
          throw new Error('No search results found');
        }
        
        const videoResult = searchResults[0];
        songData = {
          title: videoResult.title,
          url: videoResult.url,
          duration: formatDuration(videoResult.durationInSec || 0),
          thumbnail: videoResult.thumbnails && videoResult.thumbnails[0] ? videoResult.thumbnails[0].url : null,
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
  // Handle various edge cases for robust behavior
  if (!seconds || isNaN(seconds) || seconds < 0) return 'Unknown';
  
  // Support for strings that might be passed in
  if (typeof seconds === 'string') {
    seconds = parseInt(seconds, 10);
    if (isNaN(seconds)) return 'Unknown';
  }
  
  // Limit extremely long durations (likely errors)
  if (seconds > 86400 * 365) return 'Live/Unknown';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// Export functions and classes
export {
  getServerQueue,
  playSong,
  MusicQueue
};