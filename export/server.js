/**
 * Guard-shin Server
 * 
 * This script serves the static dashboard files and
 * manages the Discord bot process, providing health checks for hosting platforms.
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Get directory name (ES modules equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    invite: 'https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot%20applications.commands&permissions=8',
    support: 'https://discord.gg/g3rFbaW6gw'
  });
});

// API routes for server data
app.get('/api/servers', (req, res) => {
  try {
    // First try to read from bot_guilds.json
    if (fs.existsSync('bot_guilds.json')) {
      const data = fs.readFileSync('bot_guilds.json', 'utf8');
      return res.json(JSON.parse(data));
    }
    
    // Fallback to server_data.json
    if (fs.existsSync('server_data.json')) {
      const data = fs.readFileSync('server_data.json', 'utf8');
      const parsed = JSON.parse(data);
      return res.json(parsed.servers || []);
    }
    
    // Return empty array if no files exist
    res.json([]);
  } catch (error) {
    console.error('Error serving server data:', error);
    res.status(500).json({ error: 'Error retrieving server data' });
  }
});

// Premium status endpoint
app.get('/api/premium', (req, res) => {
  try {
    const guildId = req.query.guild_id;
    if (!guildId) {
      return res.status(400).json({ error: 'Missing guild_id parameter' });
    }
    
    // Check premium_guilds.json
    if (fs.existsSync('premium_guilds.json')) {
      const data = fs.readFileSync('premium_guilds.json', 'utf8');
      const premiumGuilds = JSON.parse(data);
      const isPremium = premiumGuilds.includes(guildId);
      return res.json({ premium: isPremium });
    }
    
    // Default to not premium if file doesn't exist
    res.json({ premium: false });
  } catch (error) {
    console.error('Error checking premium status:', error);
    res.status(500).json({ error: 'Error checking premium status' });
  }
});

// Handle payment webhooks
app.post('/api/webhook/payment', async (req, res) => {
  try {
    const event = req.body;
    console.log('Received payment webhook event:', event.type || 'unknown type');
    
    // Import webhook handler if it exists
    if (fs.existsSync('./webhook_handler.js')) {
      // Dynamic import for ES modules
      const webhookHandlerModule = await import('./webhook_handler.js');
      const webhookHandler = webhookHandlerModule.default;
      
      // Determine the provider from the event
      if (event.type && event.type.startsWith('stripe.')) {
        // It's a Stripe event
        const result = await webhookHandler.handleStripeWebhook(event);
        return res.json(result);
      } else if (event.event_type && event.event_type.includes('PAYMENT')) {
        // It's a PayPal event
        const result = webhookHandler.handlePayPalWebhook(event);
        return res.json(result);
      } else if (event.type && event.type.includes('PAYMENT')) {
        // It's a CashApp event
        const result = webhookHandler.handleCashAppWebhook(event);
        return res.json(result);
      }
    }
    
    // If we get here, either webhook_handler.js doesn't exist or the event type was unknown
    res.status(400).json({ error: 'Unknown payment provider or event type' });
  } catch (error) {
    console.error('Error processing payment webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
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