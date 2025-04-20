/**
 * Test script for the music player functionality
 * Using a different video than Rick Roll since it seems to have issues (410 Gone)
 */
import ytdl from 'ytdl-core';
import playdl from 'play-dl';
import { createAudioResource } from '@discordjs/voice';

console.log('Testing YouTube API interactions with a different video');

// Sleep function to help with rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Direct test of ytdl-core
async function testYtdlCore() {
  try {
    console.log('\n\nTesting ytdl-core directly:');
    // Using a different popular video
    const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // "Me at the zoo" - first YouTube video
    
    console.log('1. Getting info with ytdl-core');
    const info = await ytdl.getInfo(url);
    console.log(`Video title: ${info.videoDetails.title}`);
    console.log(`Duration: ${info.videoDetails.lengthSeconds} seconds`);
    
    console.log('2. Getting audio format');
    const format = ytdl.chooseFormat(info.formats, { 
      quality: 'highestaudio',
      filter: 'audioonly'
    });
    
    if (format) {
      console.log(`Selected format: ${format.mimeType}`);
      console.log('ytdl-core test succeeded');
    } else {
      console.log('No suitable audio format found');
    }
  } catch (error) {
    console.error('ytdl-core test failed:', error.message);
  }
}

// Test audio resource creation from ytdl
async function testAudioResource() {
  try {
    console.log('\n\nTesting audio resource creation:');
    const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
    
    console.log('Getting video info...');
    const info = await ytdl.getInfo(url);
    
    console.log('Creating stream...');
    const stream = ytdl.downloadFromInfo(info, { 
      filter: 'audioonly',
      highWaterMark: 1 << 25 // 32MB buffer
    });
    
    console.log('Creating audio resource...');
    const resource = createAudioResource(stream);
    
    if (resource) {
      console.log('Audio resource created successfully');
      // Clean up to avoid hanging
      stream.destroy();
    }
  } catch (error) {
    console.error('Audio resource test failed:', error.message);
  }
}

// Directly test with play-dl
async function testPlaydl() {
  try {
    console.log('\n\nTesting play-dl directly:');
    
    // Wait before making the request to avoid rate limits
    console.log('Waiting 3 seconds before making request...');
    await sleep(3000);
    
    const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';
    console.log('Getting video info with play-dl');
    
    // Try with the YouTube validate flag which has less rate limits
    const validated = await playdl.validate(url);
    console.log('URL Validated as:', validated);
    
    if (validated === 'youtube') {
      try {
        const videoInfo = await playdl.video_basic_info(url);
        console.log('Got basic info:', videoInfo.video_details.title);
      } catch (error) {
        console.error('Basic info failed:', error.message);
      }
    }
  } catch (error) {
    console.error('play-dl test failed:', error.message);
  }
}

// Run tests in sequence with delays
async function runTests() {
  try {
    // Test ytdl-core first
    await testYtdlCore();
    
    // Wait a moment before next test
    console.log('\nWaiting 2 seconds before next test...');
    await sleep(2000);
    
    await testAudioResource();
    
    // Wait before testing play-dl
    console.log('\nWaiting 2 seconds before testing play-dl...');
    await sleep(2000);
    
    await testPlaydl();
    
    console.log('\n\nAll tests completed');
  } catch (error) {
    console.error('Test suite failed:', error);
  }
}

runTests();