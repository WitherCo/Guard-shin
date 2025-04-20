import os
import discord
from discord.ext import commands
from discord import app_commands
import asyncio
import datetime
import logging
import sys
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('guard-shin')

# Get token directly from environment
TOKEN = os.getenv('DISCORD_BOT_TOKEN')

class HelpCog(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self._original_help_command = bot.help_command
        bot.help_command = commands.DefaultHelpCommand(
            no_category="Commands", 
            sort_commands=True,
            command_attrs={"hidden": False}
        )
        bot.help_command.cog = self
    
    def cog_unload(self):
        self.bot.help_command = self._original_help_command

class GuardShin(commands.Bot):
    def __init__(self):
        # Use message content intent (required for prefix commands)
        # and guilds/members intents (required for moderation)
        intents = discord.Intents.default()
        intents.guilds = True
        intents.members = True
        intents.message_content = True
        
        # Server prefix storage
        self.guild_prefixes = {}
        
        super().__init__(
            command_prefix=self.get_prefix,
            intents=intents,
            help_command=None,
            description="Guard-shin: Advanced Discord moderation and security bot"
        )
        
        # Sync slash commands on startup
        self.synced = False
    
    async def get_prefix(self, bot, message):
        """Get the appropriate prefix for a guild"""
        # Default prefix if not in a guild
        default_prefix = '>'
        
        # Use mentions as prefix always
        prefixes = [f'<@{bot.user.id}> ', f'<@!{bot.user.id}> ']
        
        # If DM, only use default and mentions
        if message.guild is None:
            prefixes.append(default_prefix)
            return prefixes
        
        # Get server-specific prefix if available
        guild_id = str(message.guild.id)
        custom_prefix = self.guild_prefixes.get(guild_id, default_prefix)
        prefixes.append(custom_prefix)
        
        return prefixes
    
    def set_guild_prefix(self, guild_id, prefix):
        """Set a guild's custom prefix"""
        guild_id = str(guild_id)
        self.guild_prefixes[guild_id] = prefix
        self.save_prefixes()
        return True
    
    def get_guild_prefix(self, guild_id):
        """Get a guild's custom prefix"""
        guild_id = str(guild_id)
        return self.guild_prefixes.get(guild_id, '>')
    
    def save_prefixes(self):
        """Save guild prefixes"""
        logger.info(f"Saved custom prefixes for {len(self.guild_prefixes)} guilds")
        # In a real implementation, this would save to a database
        
    async def setup_hook(self):
        """Initialize modules and tasks when the bot starts"""
        logger.info("Bot is starting up...")
        
        # Load custom prefixes (this would load from a database in a real implementation)
        # For demonstration purposes, we'll set up a few example prefixes
        self.guild_prefixes = {
            '123456789012345678': '.',   # Example guild 1
            '987654321098765432': '?',   # Example guild 2
            '876543210987654321': '+'    # Example guild 3
        }
        logger.info(f"Loaded {len(self.guild_prefixes)} custom guild prefixes")
        
        # Add help command
        await self.add_cog(HelpCog(self))
        
        # Load command modules
        try:
            # Utility commands (ping, info, etc.)
            from bot.python.commands import utility
            await self.add_cog(utility.Utility(self))
            logger.info("Loaded utility commands")
            
            # Admin commands (prefix, setup, etc.)
            from bot.python.commands import admin
            await self.add_cog(admin.Admin(self))
            logger.info("Loaded admin commands")
            
            # Moderation commands (warn, ban, etc.)
            from bot.python.commands import moderation
            await self.add_cog(moderation.Moderation(self))
            logger.info("Loaded moderation commands")
            
            # Load verification module
            from bot.python.moderation import verification
            await self.add_cog(verification.Verification(self))
            logger.info("Loaded verification module")
            
        except Exception as e:
            logger.error(f"Error loading modules: {e}")
        
        # Start status rotation task
        self.status_task = self.loop.create_task(self.rotate_status())
        
    async def rotate_status(self):
        """Rotate bot status regularly between Lifeless Rose statuses"""
        await self.wait_until_ready()
        
        # Status rotation with Guard-shin themed statuses
        statuses = [
            (discord.ActivityType.watching, "your server"),
            (discord.ActivityType.playing, "with moderation"),
            (discord.ActivityType.listening, "command requests"),
            (discord.ActivityType.watching, "for rule breakers")
        ]
        
        while not self.is_closed():
            for activity_type, name in statuses:
                activity = discord.Activity(type=activity_type, name=name)
                await self.change_presence(activity=activity)
                logger.info(f"Changed status to: {activity_type.name} {name}")
                
                # Wait before changing (2 minutes)
                await asyncio.sleep(120)
        
    async def on_ready(self):
        """Event triggered when the bot is fully ready"""
        logger.info(f'Logged in as {self.user} (ID: {self.user.id})')
        logger.info(f'Connected to {len(self.guilds)} guilds')
        logger.info('------')
        
        # Sync slash commands if not already done
        if not self.synced:
            try:
                # First sync to specific guilds for faster testing
                for guild in self.guilds:
                    try:
                        # Clear existing commands in the guild first
                        self.tree.clear_commands(guild=guild)
                        # Then sync new commands to the guild
                        await self.tree.sync(guild=guild)
                        logger.info(f"Slash commands synced to guild: {guild.name}")
                    except discord.HTTPException as e:
                        logger.error(f"Failed to sync commands to {guild.name}: {e}")
                
                # Then do a global sync (takes up to an hour to propagate)
                # Clear existing global commands first
                self.tree.clear_commands(guild=None)
                # Then sync new commands globally
                await self.tree.sync()
                logger.info("Slash commands synced globally")
                
                self.synced = True
            except Exception as e:
                logger.error(f"Failed to sync slash commands: {e}")
        
        logger.info('Bot is now online with status rotation!')

# Main function to run the bot
def main():
    """Initialize and run the bot"""
    if not TOKEN:
        logger.error("No Discord token provided. Please check your DISCORD_BOT_TOKEN environment variable.")
        return False
    
    bot = GuardShin()
    
    try:
        logger.info("Starting bot...")
        bot.run(TOKEN)
        return True
    except discord.LoginFailure:
        logger.error("Invalid Discord token. Please check your DISCORD_BOT_TOKEN environment variable.")
        return False
    except Exception as e:
        logger.error(f"Error starting bot: {e}")
        return False

if __name__ == "__main__":
    main()