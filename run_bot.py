import discord
from discord.ext import commands
import os
import logging
import datetime
import json
import asyncio
import random
import sys

# Set up logging
logger = logging.getLogger('guard-shin')
logger.setLevel(logging.INFO)
handler = logging.FileHandler(filename='guard-shin.log', encoding='utf-8', mode='a')
handler.setFormatter(logging.Formatter('%(asctime)s:%(levelname)s:%(name)s: %(message)s'))
logger.addHandler(handler)

# Also log to console
console = logging.StreamHandler()
console.setFormatter(logging.Formatter('%(asctime)s:%(levelname)s:%(name)s: %(message)s'))
logger.addHandler(console)

# Status messages for the bot to cycle through
STATUS_MESSAGES = [
    "Protecting servers!",
    "Type g!help for commands",
    "Visit witherco.github.io/Guard-shin",
    "Premium features available!",
    "Music, moderation, security, and more!"
]

class HelpCog(commands.Cog):
    def __init__(self, bot):
        self._original_help_command = bot.help_command
        bot.help_command = commands.DefaultHelpCommand()
        bot.help_command.cog = self

    def cog_unload(self):
        self.bot.help_command = self._original_help_command

class GuardShin(commands.Bot):
    def __init__(self):
        intents = discord.Intents.all()
        super().__init__(
            command_prefix=self.get_prefix,
            intents=intents,
            description="Advanced Discord moderation and security bot",
            activity=discord.Game(name="Starting up...")
        )
        
        # Guild prefixes
        self.prefixes = {}
        self.load_prefixes()
        
        # Path to commands
        self.core_commands_path = "bot/python/commands"
        self.premium_commands_path = "cogs"
        
    async def get_prefix(self, bot, message):
        """Get the appropriate prefix for a guild"""
        # DM channel has no guild
        if message.guild is None:
            return commands.when_mentioned_or("g!")(bot, message)
            
        # Get custom prefix for this guild, default to "g!"
        guild_id = str(message.guild.id)
        prefix = self.get_guild_prefix(guild_id)
        
        return commands.when_mentioned_or(prefix)(bot, message)
        
    def set_guild_prefix(self, guild_id, prefix):
        """Set a guild's custom prefix"""
        self.prefixes[str(guild_id)] = prefix
        self.save_prefixes()
        
    def get_guild_prefix(self, guild_id):
        """Get a guild's custom prefix"""
        return self.prefixes.get(str(guild_id), "g!")
        
    def load_prefixes(self):
        """Load guild prefixes from file"""
        try:
            if os.path.exists('prefixes.json'):
                with open('prefixes.json', 'r') as f:
                    self.prefixes = json.load(f)
                logger.info(f"Loaded prefixes for {len(self.prefixes)} guilds")
        except Exception as e:
            logger.error(f"Error loading prefixes: {e}")
            self.prefixes = {}
            
    def save_prefixes(self):
        """Save guild prefixes"""
        try:
            with open('prefixes.json', 'w') as f:
                json.dump(self.prefixes, f)
            logger.info(f"Saved prefixes for {len(self.prefixes)} guilds")
        except Exception as e:
            logger.error(f"Error saving prefixes: {e}")
        
    async def setup_hook(self):
        """Initialize modules and tasks when the bot starts"""
        # Load core commands
        if os.path.exists(self.core_commands_path):
            for filename in os.listdir(self.core_commands_path):
                if filename.endswith('.py') and not filename.startswith('_'):
                    module_name = filename[:-3]  # Remove .py extension
                    try:
                        await self.load_extension(f"bot.python.commands.{module_name}")
                        logger.info(f"Loaded core extension: {module_name}")
                    except Exception as e:
                        logger.error(f"Failed to load extension {module_name}: {e}")
        else:
            logger.warning(f"Core commands directory not found: {self.core_commands_path}")
        
        # Load premium commands
        if os.path.exists(self.premium_commands_path):
            for filename in os.listdir(self.premium_commands_path):
                if filename.endswith('.py') and not filename.startswith('_'):
                    module_name = filename[:-3]  # Remove .py extension
                    try:
                        await self.load_extension(f"cogs.{module_name}")
                        logger.info(f"Loaded premium extension: {module_name}")
                    except Exception as e:
                        logger.error(f"Failed to load premium extension {module_name}: {e}")
        else:
            logger.warning(f"Premium commands directory not found: {self.premium_commands_path}")
                
        # Start background tasks
        self.bg_task = self.loop.create_task(self.rotate_status())
        logger.info("Started background tasks")
        
    async def rotate_status(self):
        """Rotate bot status regularly"""
        await self.wait_until_ready()
        while not self.is_closed():
            status = random.choice(STATUS_MESSAGES)
            await self.change_presence(activity=discord.Game(name=status))
            await asyncio.sleep(60)  # Change status every minute
    
    async def on_ready(self):
        """Event triggered when the bot is fully ready"""
        logger.info(f'Logged in as {self.user.name} (ID: {self.user.id})')
        logger.info(f'Connected to {len(self.guilds)} guilds, serving {sum(g.member_count for g in self.guilds)} users')
        
        # Load help command
        await self.add_cog(HelpCog(self))
        
def main():
    """Initialize and run the bot"""
    bot = GuardShin()
    
    # Get token from environment variable
    token = os.getenv('DISCORD_BOT_TOKEN')
    if not token:
        logger.error("No token found in DISCORD_BOT_TOKEN environment variable")
        print("ERROR: No Discord bot token found. Please set the DISCORD_BOT_TOKEN environment variable.")
        sys.exit(1)
        
    try:
        bot.run(token, log_handler=None)  # log_handler=None to avoid duplicate logging
    except discord.errors.LoginFailure:
        logger.error("Invalid token provided")
        print("ERROR: Invalid Discord bot token.")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Error running bot: {e}")
        print(f"ERROR: Failed to start bot: {e}")
        sys.exit(1)
        
if __name__ == "__main__":
    main()