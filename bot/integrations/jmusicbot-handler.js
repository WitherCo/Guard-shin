/**
 * JMusicBot Handler
 * 
 * This module provides functionality to interact with the JMusicBot process.
 * It handles starting, stopping, and checking the status of the JMusicBot.
 */

const { exec, execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const JAR_PATH = path.resolve('./attached_assets/JMusicBot-cd40e2e5-potoken-iprotation (1).jar');
const CONFIG_PATH = path.resolve('./config.txt');
const PID_FILE = path.resolve('./jmusicbot.pid');
const LOG_FILE = path.resolve('./jmusicbot.log');

/**
 * Check if JMusicBot is already running
 * @returns {Promise<{running: boolean, pid: number|null}>} Status object
 */
async function getMusicBotStatus() {
  return new Promise((resolve) => {
    // First check if we have a PID file
    if (fs.existsSync(PID_FILE)) {
      try {
        const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim());
        
        // Check if the process is actually running
        try {
          execSync(`ps -p ${pid}`);
          resolve({ running: true, pid });
          return;
        } catch (e) {
          // Process doesn't exist, clean up the PID file
          fs.unlinkSync(PID_FILE);
        }
      } catch (err) {
        console.error('Error reading PID file:', err);
      }
    }
    
    // If we get here, either no PID file or it contained an invalid/stale PID
    // Try to find a running JMusicBot process
    exec('pgrep -f "JMusicBot.*jar"', (error, stdout, stderr) => {
      if (!error && stdout) {
        const pid = parseInt(stdout.trim());
        resolve({ running: true, pid });
      } else {
        resolve({ running: false, pid: null });
      }
    });
  });
}

/**
 * Start the JMusicBot process
 * @returns {Promise<boolean>} Success status
 */
async function startMusicBot() {
  return new Promise(async (resolve, reject) => {
    const status = await getMusicBotStatus();
    
    if (status.running) {
      console.log(`JMusicBot is already running with PID: ${status.pid}`);
      resolve(true);
      return;
    }
    
    // Check if files exist
    if (!fs.existsSync(JAR_PATH)) {
      reject(new Error(`JMusicBot JAR file not found at: ${JAR_PATH}`));
      return;
    }
    
    if (!fs.existsSync(CONFIG_PATH)) {
      console.warn(`Config file not found at: ${CONFIG_PATH}, JMusicBot will create a default one`);
    }
    
    console.log('Starting JMusicBot...');
    
    try {
      // Use spawn to start the process in background
      const jmusicProcess = spawn('java', ['-Dnogui=true', '-jar', JAR_PATH], {
        detached: true,
        stdio: ['ignore', 
                fs.openSync(LOG_FILE, 'a'), 
                fs.openSync(LOG_FILE, 'a')]
      });
      
      // Detach the process
      jmusicProcess.unref();
      
      // Save the PID
      fs.writeFileSync(PID_FILE, `${jmusicProcess.pid}`);
      
      console.log(`JMusicBot started with PID: ${jmusicProcess.pid}`);
      
      // Give it a moment to actually start up
      setTimeout(() => {
        getMusicBotStatus().then(newStatus => {
          if (newStatus.running) {
            resolve(true);
          } else {
            reject(new Error('JMusicBot failed to start'));
          }
        });
      }, 2000);
    } catch (error) {
      console.error('Error starting JMusicBot:', error);
      reject(error);
    }
  });
}

/**
 * Stop the JMusicBot process
 * @returns {Promise<boolean>} Success status
 */
async function stopMusicBot() {
  return new Promise(async (resolve, reject) => {
    const status = await getMusicBotStatus();
    
    if (!status.running) {
      console.log('No running JMusicBot process found');
      resolve(true);
      return;
    }
    
    console.log(`Stopping JMusicBot process with PID: ${status.pid}`);
    
    try {
      // First try a normal kill
      process.kill(status.pid);
      
      // Wait a bit and check if it's still running
      setTimeout(async () => {
        const newStatus = await getMusicBotStatus();
        
        if (newStatus.running && newStatus.pid === status.pid) {
          // It's still running, try force kill
          console.log('JMusicBot process still running, attempting force kill...');
          process.kill(status.pid, 'SIGKILL');
          
          // Check again
          setTimeout(async () => {
            const finalStatus = await getMusicBotStatus();
            
            if (finalStatus.running && finalStatus.pid === status.pid) {
              reject(new Error('Failed to stop JMusicBot process'));
            } else {
              // Cleanup PID file
              if (fs.existsSync(PID_FILE)) {
                fs.unlinkSync(PID_FILE);
              }
              resolve(true);
            }
          }, 1000);
        } else {
          // Cleanup PID file
          if (fs.existsSync(PID_FILE)) {
            fs.unlinkSync(PID_FILE);
          }
          resolve(true);
        }
      }, 2000);
    } catch (error) {
      console.error('Error stopping JMusicBot:', error);
      reject(error);
    }
  });
}

/**
 * Restart the JMusicBot process
 * @returns {Promise<boolean>} Success status
 */
async function restartMusicBot() {
  try {
    await stopMusicBot();
    return await startMusicBot();
  } catch (error) {
    console.error('Error restarting JMusicBot:', error);
    throw error;
  }
}

/**
 * Get the recent logs from JMusicBot
 * @param {number} lines Number of lines to retrieve
 * @returns {Promise<string>} Log content
 */
async function getMusicBotLogs(lines = 50) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(LOG_FILE)) {
      resolve('No log file found');
      return;
    }
    
    exec(`tail -n ${lines} ${LOG_FILE}`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      
      resolve(stdout);
    });
  });
}

/**
 * Execute a command on the JMusicBot
 * This simulates someone typing the command in Discord with the JMusicBot prefix
 * @param {string} command The command to execute (without prefix)
 * @returns {Promise<boolean>} Success status
 */
async function executeCommand(command) {
  return new Promise(async (resolve, reject) => {
    const status = await getMusicBotStatus();
    
    if (!status.running) {
      reject(new Error('JMusicBot is not running'));
      return;
    }
    
    try {
      // Log the command for debugging
      console.log(`Executing JMusicBot command: ;${command}`);
      
      // For now, we just log the command as there's no direct way to send
      // commands to JMusicBot without going through Discord.
      // In a real implementation, we would use Discord.js to send the command
      // to a designated channel that JMusicBot is listening to.
      
      // We'll return success for now
      resolve(true);
    } catch (error) {
      console.error('Error executing JMusicBot command:', error);
      reject(error);
    }
  });
}

module.exports = {
  getMusicBotStatus,
  startMusicBot,
  stopMusicBot,
  restartMusicBot,
  getMusicBotLogs,
  executeCommand
};