#!/usr/bin/env python
"""
Guard-shin Render Deployment Check Script

This script tests the basic setup of the Guard-shin Discord bot on Render.
It verifies that the essential environment variables are set and the bot
can connect to Discord's gateway.

Usage:
  python check_render_deployment.py
"""

import os
import sys
import asyncio
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger('guard-shin-deployment-check')

# Check for required libraries
try:
    import discord
    from discord.ext import commands
    import dotenv
except ImportError as e:
    logger.error(f"Required library not found: {e}")
    logger.error("Make sure to install all required packages with: pip install -r requirements-render.txt")
    sys.exit(1)

# Load environment variables
dotenv.load_dotenv()

# Required environment variables
REQUIRED_VARS = [
    'DISCORD_BOT_TOKEN',
    'DISCORD_CLIENT_ID',
]

# Check for environment variables
missing_vars = []
for var in REQUIRED_VARS:
    if not os.getenv(var):
        missing_vars.append(var)

if missing_vars:
    logger.error(f"Missing required environment variables: {', '.join(missing_vars)}")
    logger.error("Please set these variables in your Render dashboard or .env file.")
    sys.exit(1)

logger.info("✓ All required environment variables are set.")

# Create a minimal bot instance to test connection
intents = discord.Intents.default()
intents.message_content = True
intents.guilds = True
intents.members = True

bot = commands.Bot(command_prefix="!", intents=intents)

@bot.event
async def on_ready():
    """Event triggered when the bot is fully ready"""
    logger.info(f"✓ Successfully connected to Discord as {bot.user.name} (ID: {bot.user.id})")
    logger.info(f"✓ Connected to {len(bot.guilds)} guilds, serving approximately {sum(g.member_count for g in bot.guilds)} users")
    logger.info("✓ Bot is ready! The deployment check is successful.")
    logger.info("✓ You can now stop this script and deploy the full bot.")
    
    # Exit after 5 seconds
    await asyncio.sleep(5)
    await bot.close()

async def main():
    """Run the bot to test connection"""
    logger.info(f"Starting Guard-shin deployment check at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info("Attempting to connect to Discord...")
    
    token = os.getenv('DISCORD_BOT_TOKEN') or os.getenv('GUARD_SHIN_BOT_TOKEN')
    if not token:
        logger.error("No Discord bot token found in environment variables.")
        return
    
    try:
        async with bot:
            await bot.start(token)
    except discord.errors.LoginFailure:
        logger.error("Invalid Discord bot token. Check your DISCORD_BOT_TOKEN environment variable.")
    except Exception as e:
        logger.error(f"Error during bot startup: {e}")

if __name__ == "__main__":
    asyncio.run(main())