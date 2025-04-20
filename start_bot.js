// Script to start the Discord bot
const { spawn } = require('child_process');
const path = require('path');
require('dotenv').config();

console.log("Starting Guard-shin Discord bot (Wick clone) with Lua and Python components...");

// Launch the Python bot
console.log("Launching Python bot component...");
const pythonProcess = spawn('python', ['bot/python/main.py'], {
  env: process.env,
  stdio: 'inherit'
});

pythonProcess.on('close', (code) => {
  console.log(`Python bot process exited with code ${code}`);
});

console.log("Bot startup initiated. Check console for status messages.");