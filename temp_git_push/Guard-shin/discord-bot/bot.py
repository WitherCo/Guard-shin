# -*- coding: utf-8 -*-
"""
Guard-shin Discord Bot
Advanced moderation and security bot for Discord servers

Copyright (c) 2025 WitherCo
All rights reserved.

This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.
"""

import os
import discord
from discord.ext import commands, tasks
import json
import asyncio
import logging
import random
from dotenv import load_dotenv
import requests

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('guard-shin')

# Bot configuration
TOKEN = os.getenv('DISCORD_BOT_TOKEN') or os.getenv('GUARD_SHIN_BOT_TOKEN')
WEBHOOK_URL = os.getenv('UPDATE_WEBHOOK_URL')

# Check for required tokens
if not TOKEN:
    logger.error("No Discord bot token found in environment variables.")
    exit(1)

if not WEBHOOK_URL:
    logger.warning("No update webhook URL found in environment variables.")

# Bot setup
intents = discord.Intents.default()
intents.members = True
intents.message_content = True
intents.guilds = True

bot = commands.Bot(command_prefix="!", intents=intents)

# Store guild prefixes
guild_prefixes = {}
PREFIX_FILE = "guild_prefixes.json"

def load_prefixes():
    """Load guild prefixes from file"""
    global guild_prefixes
    try:
        with open(PREFIX_FILE, 'r') as f:
            guild_prefixes = json.load(f)
            logger.info(f"Loaded prefixes for {len(guild_prefixes)} guilds")
    except FileNotFoundError:
        logger.info("No prefix file found, using default prefixes")
        guild_prefixes = {}
    except json.JSONDecodeError:
        logger.error("Error decoding prefix file, using default prefixes")
        guild_prefixes = {}

def get_prefix(bot, message):
    """Get guild-specific prefix or default to '!'"""
    if not message.guild:
        return '!'
    
    guild_id = str(message.guild.id)
    return guild_prefixes.get(guild_id, '!')

def save_prefixes():
    """Save guild prefixes to file"""
    with open(PREFIX_FILE, 'w') as f:
        json.dump(guild_prefixes, f)
    logger.info(f"Saved prefixes for {len(guild_prefixes)} guilds")

# Events
@bot.event
async def on_ready():
    """When the bot is ready"""
    logger.info(f'Logged in as {bot.user.name} ({bot.user.id})')
    logger.info(f'Connected to {len(bot.guilds)} guilds')
    
    # Start status rotation
    rotate_status.start()
    
    # Send startup webhook notification
    if WEBHOOK_URL:
        try:
            data = {
                "content": "",
                "embeds": [{
                    "title": "Lifeless rose updated:",
                    "description": f"Guard-shin Bot has restarted successfully\nConnected to {len(bot.guilds)} guilds",
                    "color": 0x8a2be2,  # BlueViolet color
                }]
            }
            requests.post(WEBHOOK_URL, json=data)
        except Exception as e:
            logger.error(f"Failed to send webhook notification: {e}")

@bot.event
async def on_guild_join(guild):
    """When the bot joins a new guild"""
    logger.info(f'Joined guild: {guild.name} (ID: {guild.id})')
    
    # Default prefix for new guild
    guild_prefixes[str(guild.id)] = '!'
    save_prefixes()
    
    # Notify via webhook
    if WEBHOOK_URL:
        try:
            data = {
                "content": "",
                "embeds": [{
                    "title": "Lifeless rose updated:",
                    "description": f"Guard-shin Bot joined a new server: {guild.name} ({guild.member_count} members)",
                    "color": 0x00ff00,  # Green color
                }]
            }
            requests.post(WEBHOOK_URL, json=data)
        except Exception as e:
            logger.error(f"Failed to send webhook notification: {e}")

@bot.event
async def on_guild_remove(guild):
    """When the bot is removed from a guild"""
    logger.info(f'Left guild: {guild.name} (ID: {guild.id})')
    
    # Clean up prefix for removed guild
    if str(guild.id) in guild_prefixes:
        del guild_prefixes[str(guild.id)]
        save_prefixes()
    
    # Notify via webhook
    if WEBHOOK_URL:
        try:
            data = {
                "content": "",
                "embeds": [{
                    "title": "Lifeless rose updated:",
                    "description": f"Guard-shin Bot left a server: {guild.name}",
                    "color": 0xff0000,  # Red color
                }]
            }
            requests.post(WEBHOOK_URL, json=data)
        except Exception as e:
            logger.error(f"Failed to send webhook notification: {e}")

@bot.event
async def on_message(message):
    """Process messages"""
    # Don't respond to bot messages
    if message.author.bot:
        return
    
    # Process commands
    await bot.process_commands(message)

# Tasks
@tasks.loop(minutes=10)
async def rotate_status():
    """Rotate bot status regularly"""
    statuses = [
        discord.Activity(type=discord.ActivityType.watching, name="over your server"),
        discord.Activity(type=discord.ActivityType.listening, name="commands"),
        discord.Game(name="with moderation tools"),
        discord.Activity(type=discord.ActivityType.watching, name="for spammers"),
        discord.Game(name="!help for commands")
    ]
    
    await bot.change_presence(activity=random.choice(statuses))

# Commands
@bot.command(name="ping")
async def ping(ctx):
    """Simple command to check bot latency"""
    latency = round(bot.latency * 1000)
    await ctx.send(f"Pong! Latency: {latency}ms")

@bot.command(name="prefix")
@commands.has_permissions(administrator=True)
async def change_prefix(ctx, new_prefix=None):
    """Change the command prefix for this server"""
    if new_prefix is None:
        current_prefix = get_prefix(bot, ctx.message)
        await ctx.send(f"Current prefix is: `{current_prefix}`")
        return
    
    if len(new_prefix) > 5:
        await ctx.send("Prefix must be 5 characters or less")
        return
    
    guild_prefixes[str(ctx.guild.id)] = new_prefix
    save_prefixes()
    await ctx.send(f"Prefix changed to: `{new_prefix}`")

@bot.command(name="info")
async def info(ctx):
    """Display bot information"""
    embed = discord.Embed(
        title="Guard-shin Bot",
        description="Advanced moderation and security bot",
        color=discord.Color.purple()
    )
    embed.add_field(name="Servers", value=str(len(bot.guilds)), inline=True)
    embed.add_field(name="Users", value=str(sum(g.member_count for g in bot.guilds)), inline=True)
    embed.add_field(name="Ping", value=f"{round(bot.latency * 1000)}ms", inline=True)
    embed.add_field(name="Invite Link", value="[Click Here](https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8)")
    embed.add_field(name="Support Server", value="[Join Here](https://discord.gg/g3rFbaW6gw)")
    embed.set_footer(text="Guard-shin Bot | Advanced Moderation")
    
    await ctx.send(embed=embed)

@bot.command(name="help")
async def help_command(ctx, command_name=None):
    """Custom help command"""
    prefix = get_prefix(bot, ctx.message)
    
    if command_name is None:
        embed = discord.Embed(
            title="Guard-shin Bot Help",
            description=f"Use `{prefix}help <command>` for more information on a command",
            color=discord.Color.blue()
        )
        
        # Group commands by category
        categories = {
            "General": ["help", "info", "ping", "prefix"],
            "Moderation": ["ban", "kick", "mute", "warn", "infractions"],
            "Utility": ["serverinfo", "userinfo", "avatar"]
        }
        
        for category, cmds in categories.items():
            embed.add_field(
                name=category,
                value=", ".join(f"`{prefix}{cmd}`" for cmd in cmds),
                inline=False
            )
        
        embed.set_footer(text="Guard-shin Bot | Type !help <command> for details")
        await ctx.send(embed=embed)
    else:
        # Get command by name
        command = bot.get_command(command_name)
        if not command:
            await ctx.send(f"Command '{command_name}' not found.")
            return
        
        embed = discord.Embed(
            title=f"Help: {prefix}{command.name}",
            description=command.help or "No description available",
            color=discord.Color.blue()
        )
        
        # Add usage if command has parameters
        if command.signature:
            embed.add_field(name="Usage", value=f"`{prefix}{command.name} {command.signature}`")
        else:
            embed.add_field(name="Usage", value=f"`{prefix}{command.name}`")
        
        # Add aliases if any
        if command.aliases:
            embed.add_field(name="Aliases", value=", ".join(f"`{prefix}{alias}`" for alias in command.aliases))
        
        await ctx.send(embed=embed)

# Error handling
@bot.event
async def on_command_error(ctx, error):
    """Global error handler"""
    if isinstance(error, commands.CommandNotFound):
        return
    elif isinstance(error, commands.MissingPermissions):
        await ctx.send(f"You don't have permission to use this command.")
    elif isinstance(error, commands.MissingRequiredArgument):
        await ctx.send(f"Missing required argument: {error.param.name}")
    else:
        logger.error(f"Command error: {error}")
        await ctx.send(f"An error occurred: {error}")

# Load cogs
for filename in os.listdir("./cogs"):
    if filename.endswith(".py") and not filename.startswith("_"):
        bot.load_extension(f"cogs.{filename[:-3]}")
        logger.info(f"Loaded extension: {filename[:-3]}")

# Start the bot
if __name__ == "__main__":
    # Load prefixes before starting
    load_prefixes()
    
    # Run the bot
    bot.run(TOKEN)