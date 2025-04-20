/**
 * Test API Command Route
 * 
 * This script tests the prefix command debugging API endpoint.
 * It sends a sample prefix command to the server for testing.
 */

const fetch = require('node-fetch');

// Configuration
const API_URL = 'http://localhost:5000/api/discord/debug/command';
const AUTH_TOKEN = process.env.SESSION_TOKEN || ''; // Set this to your session token
const TEST_COMMAND = ';test';
const SERVER_ID = process.env.TEST_SERVER_ID || '1233495879223345172';

// Headers with authentication
const headers = {
  'Content-Type': 'application/json',
  'Cookie': `connect.sid=${AUTH_TOKEN}`,
};

// Command to test
const payload = {
  command: TEST_COMMAND,
  serverId: SERVER_ID,
  type: 'prefix'
};

async function testApiCommand() {
  console.log(`🔹 Testing API command endpoint with: ${TEST_COMMAND}`);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Command executed successfully:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Command execution failed:');
      console.error(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error sending request:', error.message);
  }
}

// Run the test
testApiCommand();