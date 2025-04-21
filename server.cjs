/**
 * Guard-shin Server
 * 
 * This script serves the static dashboard files and
 * manages the Discord bot process, providing health checks for hosting platforms.
 */

require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const PORT = process.env.PORT || 3000;

// Bot process reference
let botProcess = null;
let botLogs = [];
let restartHistory = [];

// Max logs to keep
const MAX_LOGS = 100;
const MAX_HISTORY = 10;

// MIME types for file extensions
const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.pdf': 'application/pdf',
    '.ttf': 'font/ttf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2'
};

// Start the bot
function startBot() {
  if (botProcess) {
    console.log('Bot is already running. Killing the current process...');
    botProcess.kill();
  }

  console.log('Starting Discord bot...');
  
  // Record restart
  const now = new Date();
  restartHistory.unshift({
    time: now.toISOString(),
    event: 'Manual Restart'
  });
  
  // Limit history length
  if (restartHistory.length > MAX_HISTORY) {
    restartHistory = restartHistory.slice(0, MAX_HISTORY);
  }

  // Use Python to run the bot
  botProcess = spawn('python', ['run_bot.py']);

  botProcess.stdout.on('data', (data) => {
    const logMessage = data.toString();
    console.log(`Bot stdout: ${logMessage}`);
    botLogs.unshift({ time: new Date().toISOString(), message: logMessage, type: 'info' });
    
    // Limit logs length
    if (botLogs.length > MAX_LOGS) {
      botLogs = botLogs.slice(0, MAX_LOGS);
    }
  });

  botProcess.stderr.on('data', (data) => {
    const errorMessage = data.toString();
    console.error(`Bot stderr: ${errorMessage}`);
    botLogs.unshift({ time: new Date().toISOString(), message: errorMessage, type: 'error' });
    
    // Limit logs length
    if (botLogs.length > MAX_LOGS) {
      botLogs = botLogs.slice(0, MAX_LOGS);
    }
  });

  botProcess.on('close', (code) => {
    console.log(`Bot process exited with code ${code}`);
    botLogs.unshift({ time: new Date().toISOString(), message: `Process exited with code ${code}`, type: 'system' });
    botProcess = null;

    // Add to restart history
    restartHistory.unshift({
      time: new Date().toISOString(),
      event: `Bot Crashed (Exit code: ${code})`
    });
    
    // Auto-restart if crashed
    if (code !== 0) {
      console.log('Bot crashed. Restarting in 5 seconds...');
      setTimeout(startBot, 5000);
    }
  });

  return botProcess;
}

// Simple HTTP server
const server = http.createServer((req, res) => {
    // Parse the URL to get the pathname
    const urlPath = req.url === '/' ? '/index.html' : req.url;
    const parsedUrl = new URL(urlPath, 'http://localhost');
    let pathname = parsedUrl.pathname;
    
    // API Routes
    if (pathname === '/api/bot-status' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: botProcess ? 'online' : 'offline',
            uptime: botProcess ? process.uptime() : 0,
            logs: botLogs,
            restartHistory: restartHistory
        }));
        return;
    }
    
    if (pathname === '/api/restart-bot' && req.method === 'POST') {
        try {
            startBot();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, message: 'Bot restarted successfully' }));
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: error.message }));
        }
        return;
    }
    
    if (pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', botRunning: !!botProcess }));
        return;
    }
    
    // Serve static files
    // Get the file extension
    const ext = path.extname(pathname);
    
    // Map the path to an actual file
    let filePath = path.join(__dirname, pathname);
    
    // Check if the file exists
    fs.access(filePath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end('<h1>404 Not Found</h1>');
            return;
        }
        
        // Get the file's MIME type
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        // Read and serve the file
        fs.readFile(filePath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 Internal Server Error</h1>');
                return;
            }
            
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(data);
        });
    });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    // Start the bot
    startBot();
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    if (botProcess) {
        botProcess.kill();
    }
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    if (botProcess) {
        botProcess.kill();
    }
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
});