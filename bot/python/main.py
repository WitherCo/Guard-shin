import os
import asyncio
import discord
from discord.ext import commands
import logging
import json
import sys

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger("GuardShinPython")

# Premium role ID from shared configuration
PREMIUM_ROLE_ID = "1234567890123456789"  # Will be replaced with actual role ID

# Premium commands that require a subscription
PREMIUM_COMMANDS = [
    "antialt",
    "customcommand",
    "advancedautomod",
    "raidplus",
    "verifyplus",
    "fulllogs"
]

# Bot class
class GuardShin(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.members = True
        
        super().__init__(command_prefix=self.get_prefix, intents=intents)
        
        # Store guild prefixes
        self.prefixes = {}
        try:
            with open("guild_prefixes.json", "r") as f:
                self.prefixes = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            self.prefixes = {}
            
        # Store cooldowns for commands
        self.cooldowns = {}
        
    async def get_prefix(self, bot, message):
        """Get the appropriate prefix for a guild"""
        if not message.guild:
            return "!"  # Default prefix in DMs
            
        # Get guild prefix or use default
        return self.prefixes.get(str(message.guild.id), "!")
    
    def set_guild_prefix(self, guild_id, prefix):
        """Set a guild's custom prefix"""
        self.prefixes[str(guild_id)] = prefix
        self.save_prefixes()
        
    def get_guild_prefix(self, guild_id):
        """Get a guild's custom prefix"""
        return self.prefixes.get(str(guild_id), "!")
        
    def save_prefixes(self):
        """Save guild prefixes"""
        with open("guild_prefixes.json", "w") as f:
            json.dump(self.prefixes, f, indent=4)
            
    async def setup_hook(self):
        """Initialize modules and tasks when the bot starts"""
        # Load command modules
        for folder in ['commands', 'events', 'moderation']:
            try:
                await self.load_extension(f"bot.python.{folder}")
                logger.info(f"Loaded extension: {folder}")
            except Exception as e:
                logger.error(f"Failed to load extension {folder}: {e}")
        
        # Start background tasks
        self.bg_task = self.loop.create_task(self.rotate_status())
        
    async def rotate_status(self):
        """Rotate bot status regularly"""
        await self.wait_until_ready()
        
        statuses = [
            discord.Activity(type=discord.ActivityType.watching, name="over your server"),
            discord.Activity(type=discord.ActivityType.listening, name="moderation commands"),
            discord.Game(name="with auto-moderation"),
            discord.Activity(type=discord.ActivityType.competing, name="security contests")
        ]
        
        while not self.is_closed():
            for status in statuses:
                await self.change_presence(activity=status)
                await asyncio.sleep(60)  # Change every minute
                
    async def on_ready(self):
        """Event triggered when the bot is fully ready"""
        logger.info(f"Logged in as {self.user.name} | {self.user.id}")
        logger.info(f"Connected to {len(self.guilds)} guilds")
        
    async def on_command(self, ctx):
        """Event triggered when a command is invoked"""
        # Check if it's a premium command
        if ctx.command.name in PREMIUM_COMMANDS:
            # Check if the guild has premium status
            guild = ctx.guild
            if not guild:
                await ctx.send("⚠️ Premium commands can only be used in servers.")
                return False
                
            # Check if premium role exists and is assigned to guild owner
            premium_role = discord.utils.get(guild.roles, id=int(PREMIUM_ROLE_ID))
            owner = guild.owner
            
            if not premium_role or not owner or premium_role not in owner.roles:
                await ctx.send("⚠️ **Premium Required:** This command requires a premium subscription. Visit the dashboard to upgrade.")
                return False
                
        return True
        
async def main():
    """Initialize and run the bot"""
    bot = GuardShin()
    
    # Register command check for premium commands
    @bot.check
    async def check_premium(ctx):
        return await bot.on_command(ctx)
            
    # Connect to Discord
    discord_token = os.environ.get("DISCORD_BOT_TOKEN")
    if not discord_token:
        logger.error("No Discord token found. Set the DISCORD_BOT_TOKEN environment variable.")
        return
        
    try:
        await bot.start(discord_token)
    except Exception as e:
        logger.error(f"Error starting the bot: {e}")
    finally:
        if not bot.is_closed():
            await bot.close()
            
if __name__ == "__main__":
    asyncio.run(main())