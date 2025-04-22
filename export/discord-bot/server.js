/**
 * Guard-shin Bot Service Manager
 * 
 * This script serves as a wrapper around the Python Discord bot, 
 * providing a web server for health checks on Render/Heroku
 * to keep the service running and prevent idle spin-down.
 */

const express = require('express');
const { spawn } = require('child_process');
const app = express();

// Environment variables
const PORT = process.env.PORT || 3000;

// Bot process
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
  
  // Start new process
  botProcess = spawn('python', ['run.py']);
  
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
}

// Start the bot immediately
startBot();

// API routes
app.get('/', (req, res) => {
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
  res.redirect('/');
});

// Start the web server
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Health check available at http://localhost:${PORT}/health`);
});