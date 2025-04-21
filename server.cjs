/**
 * Guard-shin Server (CommonJS version)
 * 
 * This script serves the static dashboard files and
 * manages the Discord bot process, providing health checks for hosting platforms.
 */

const express = require('express');
const dotenv = require('dotenv');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Bot process management
let botProcess = null;
let botStatus = 'initializing';
let botStartTime = null;
let lastRestartTime = null;
let restartCount = 0;

// Start the bot
function startBot() {
  console.log('Starting Discord bot...');
  botStatus = 'starting';
  lastRestartTime = new Date().toISOString();
  
  // Kill existing process if it exists
  if (botProcess) {
    try {
      botProcess.kill();
    } catch (err) {
      console.error('Error killing existing bot process:', err);
    }
  }
  
  // Start new process - check for both possible locations
  let botFile = 'run_bot.py';
  
  // Check multiple possible locations
  if (!fs.existsSync(botFile)) {
    const possibilities = [
      'discord-bot/run.py',
      'discord-bot/bot.py',
      'discord_bot/run.py',
      'discord_bot/bot.py',
      'bot/run.py',
      'bot/bot.py',
      'run.py',
      'bot.py'
    ];
    
    for (const file of possibilities) {
      if (fs.existsSync(file)) {
        botFile = file;
        break;
      }
    }
  }
  
  console.log(`Using bot file: ${botFile}`);
  
  try {
    botProcess = spawn('python', [botFile]);
    
    botProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`Bot: ${output}`);
      
      // Check for ready message
      if (output.includes('logged in as') || output.includes('on_ready')) {
        botStatus = 'online';
        botStartTime = new Date().toISOString();
        console.log('Bot is ready and online!');
      }
    });
    
    botProcess.stderr.on('data', (data) => {
      console.error(`Bot Error: ${data.toString()}`);
    });
    
    botProcess.on('close', (code) => {
      console.log(`Bot process exited with code ${code}`);
      botStatus = 'offline';
      
      // Auto-restart on unexpected exit
      if (code !== 0) {
        restartCount++;
        console.log(`Restarting bot (attempt #${restartCount})...`);
        setTimeout(startBot, 5000);
      }
    });
  } catch (err) {
    console.error(`Failed to start bot: ${err.message}`);
    botStatus = 'error';
  }
}

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'client')));
app.use(express.json());

// Dashboard routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/info', (req, res) => {
  res.json({
    name: 'Guard-shin',
    description: 'Advanced Discord moderation and security bot',
    invite: 'https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8',
    support: 'https://discord.gg/g3rFbaW6gw'
  });
});

// Bot status dashboard
app.get('/bot-status', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Guard-shin Bot Status</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #8249F0; }
          .status { display: inline-block; padding: 5px 10px; border-radius: 4px; color: white; }
          .online { background-color: #4CAF50; }
          .offline { background-color: #F44336; }
          .starting { background-color: #2196F3; }
          .initializing { background-color: #FF9800; }
          .error { background-color: #9C27B0; }
          .info { margin: 20px 0; }
        </style>
      </head>
      <body>
        <h1>Guard-shin Discord Bot</h1>
        <div class="info">
          <p>Status: <span class="status ${botStatus}">${botStatus}</span></p>
          ${botStartTime ? `<p>Online since: ${botStartTime}</p>` : ''}
          ${lastRestartTime ? `<p>Last restart attempt: ${lastRestartTime}</p>` : ''}
          <p>Restart count: ${restartCount}</p>
        </div>
        <p>This page provides the status of the Guard-shin Discord bot.</p>
        <p>The health check endpoint at <code>/health</code> keeps the bot active on Render.</p>
        <a href="/restart" style="display: inline-block; padding: 10px 15px; background-color: #8249F0; color: white; text-decoration: none; border-radius: 4px;">Restart Bot</a>
        <p><a href="/" style="color: #8249F0;">Return to Dashboard</a></p>
      </body>
    </html>
  `);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: botStatus,
    uptime: botStartTime ? new Date() - new Date(botStartTime) : null,
    lastRestart: lastRestartTime,
    restartCount: restartCount
  });
});

// Restart endpoint
app.get('/restart', (req, res) => {
  console.log('Manual restart requested');
  startBot();
  res.redirect('/bot-status');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
  console.log(`Bot status available at http://localhost:${PORT}/bot-status`);
  
  // Start the bot after the server is running
  startBot();
});
