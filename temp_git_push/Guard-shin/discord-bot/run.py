#!/usr/bin/env python3
"""
Guard-shin Discord Bot runner
This script starts the Guard-shin Discord bot
"""
import os
import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger('guard-shin-runner')

if __name__ == "__main__":
    try:
        logger.info("Starting Guard-shin Discord Bot...")
        # Import and run the bot
        import bot
        
        # The bot.py script has the main code and bot.run() will be called
        # when the script is imported
    except Exception as e:
        logger.error(f"Error starting bot: {e}")
        sys.exit(1)