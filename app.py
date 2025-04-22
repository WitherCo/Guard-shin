"""
Guard-shin Web Server for Render Deployment

This script provides a simple web server that keeps the bot process alive
and provides a health check endpoint for Render.
"""

import os
import sys
import logging
import time
import threading
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger('guard-shin-web')

# Bot process
bot_process = None

def start_bot():
    """Start the Discord bot process"""
    global bot_process
    
    if bot_process is not None:
        logger.info("Bot process is already running")
        return
    
    logger.info("Starting Guard-shin Discord bot...")
    try:
        # Start the bot process
        bot_process = subprocess.Popen([sys.executable, "run_bot.py"], 
                                      stdout=subprocess.PIPE,
                                      stderr=subprocess.PIPE)
        logger.info(f"Bot process started with PID: {bot_process.pid}")
        
        # Start thread to monitor bot process
        threading.Thread(target=monitor_bot, daemon=True).start()
    except Exception as e:
        logger.error(f"Failed to start bot: {e}")

def monitor_bot():
    """Monitor the bot process and restart it if it crashes"""
    global bot_process
    
    while True:
        if bot_process is None:
            logger.warning("Bot process not found. Starting new instance...")
            start_bot()
            time.sleep(5)
            continue
            
        # Check if process is still running
        if bot_process.poll() is not None:
            exit_code = bot_process.poll()
            stdout, stderr = bot_process.communicate()
            logger.warning(f"Bot process exited with code {exit_code}")
            logger.info(f"Bot stdout: {stdout.decode() if stdout else 'None'}")
            logger.error(f"Bot stderr: {stderr.decode() if stderr else 'None'}")
            
            # Reset the process reference
            bot_process = None
            
            # Wait before restarting
            logger.info("Waiting 10 seconds before restarting bot...")
            time.sleep(10)
            start_bot()
        
        time.sleep(30)  # Check every 30 seconds

class GuardShinHandler(BaseHTTPRequestHandler):
    """HTTP request handler for Guard-shin web server"""
    
    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/':
            # Main status page
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            
            # Check if bot is running
            bot_status = "running" if bot_process and bot_process.poll() is None else "not running"
            
            response = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <title>Guard-shin Status</title>
                <style>
                    body {{ font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }}
                    h1 {{ color: #333; }}
                    .status {{ padding: 10px; border-radius: 5px; margin: 20px 0; }}
                    .running {{ background-color: #d4edda; color: #155724; }}
                    .not-running {{ background-color: #f8d7da; color: #721c24; }}
                </style>
            </head>
            <body>
                <h1>Guard-shin Discord Bot</h1>
                <div class="status {'running' if bot_status == 'running' else 'not-running'}">
                    <strong>Status:</strong> {bot_status}
                </div>
                <p>The Guard-shin Discord bot is {bot_status}.</p>
                <p><small>Last checked: {time.strftime('%Y-%m-%d %H:%M:%S')}</small></p>
            </body>
            </html>
            """
            
            self.wfile.write(response.encode())
        elif self.path == '/health':
            # Simple health check endpoint for Render
            bot_status = "running" if bot_process and bot_process.poll() is None else "not running"
            
            if bot_status == "running":
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status":"healthy","message":"Bot is running"}')
            else:
                self.send_response(503)  # Service Unavailable
                self.send_header('Content-type', 'application/json')
                self.end_headers()
                self.wfile.write(b'{"status":"unhealthy","message":"Bot is not running"}')
        else:
            # 404 for any other path
            self.send_response(404)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'Not Found')

def run_server():
    """Run the HTTP server"""
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 8080))
    
    server_address = ('', port)
    httpd = HTTPServer(server_address, GuardShinHandler)
    
    logger.info(f"Starting web server on port {port}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("Stopping web server...")
        httpd.server_close()

if __name__ == '__main__':
    # Start the bot in a separate thread
    threading.Thread(target=start_bot, daemon=True).start()
    
    # Start the web server in the main thread
    run_server()