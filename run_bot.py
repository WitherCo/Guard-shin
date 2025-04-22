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
        # Get application ID from environment and convert to integer
        client_id = os.getenv('DISCORD_CLIENT_ID')
        application_id = int(client_id) if client_id and client_id.isdigit() else None
        
        # Log application ID for debugging
        if application_id:
            print(f"Using application ID: {application_id}")
        else:
            print("WARNING: No valid DISCORD_CLIENT_ID found in environment variables")
            
        super().__init__(
            command_prefix=self.get_prefix,
            intents=intents,
            description="Advanced Discord moderation and security bot",
            activity=discord.Game(name="Starting up..."),
            application_id=application_id
        )
        
        # Guild prefixes
        self.prefixes = {}
        self.load_prefixes()
        
        # Path to commands
        self.core_commands_path = "bot/python/commands"
        self.premium_commands_path = "cogs"
        
        # Premium servers
        self.premium_guilds = self.load_premium_guilds()
        
        # Support server ID
        self.SUPPORT_SERVER_ID = 1233495879223345172
        
        # Development mode 
        # When True, slash commands are only registered to the support server
        self.DEV_MODE = os.getenv('BOT_DEV_MODE', 'true').lower() == 'true'
        if self.DEV_MODE:
            logger.info("Running in DEVELOPMENT MODE. Commands will only be registered to the support server.")
        else:
            logger.info("Running in PRODUCTION MODE. Commands will be registered globally.")
        
        # Command registration
        logger.info("Initializing command tree")
        self.synced = False
        
        # Add basic slash commands to the tree
        @self.tree.command(name="ping", description="Check the bot's latency")
        async def ping(interaction: discord.Interaction):
            await interaction.response.send_message(f"Pong! {round(self.latency * 1000)}ms")
            
        @self.tree.command(name="info", description="Get information about Guard-shin")
        async def info(interaction: discord.Interaction):
            await interaction.response.send_message(
                "Guard-shin is an advanced Discord moderation and security bot. "
                "Visit https://witherco.github.io/Guard-shin/ for more information!"
            )
            
        @self.tree.command(name="invite", description="Get the bot invite link")
        async def invite(interaction: discord.Interaction):
            invite_url = f"https://discord.com/oauth2/authorize?client_id={self.application_id}&permissions=8&scope=bot%20applications.commands"
            await interaction.response.send_message(f"Invite Guard-shin to your server: {invite_url}")
            
        # Create a moderation command group
        moderation = discord.app_commands.Group(name="mod", description="Moderation commands")
        
        @moderation.command(name="ban", description="Ban a member from the server")
        @discord.app_commands.describe(user="The user to ban", reason="Reason for the ban")
        async def ban(interaction: discord.Interaction, user: discord.User, reason: str = None):
            if not interaction.guild:
                await interaction.response.send_message("This command can only be used in a server", ephemeral=True)
                return
                
            # Check if user has permission to ban
            if not interaction.user.guild_permissions.ban_members:
                await interaction.response.send_message("You don't have permission to ban members", ephemeral=True)
                return
                
            try:
                await interaction.guild.ban(user, reason=reason)
                await interaction.response.send_message(f"Banned {user.mention}" + (f" for {reason}" if reason else ""))
            except discord.Forbidden:
                await interaction.response.send_message("I don't have permission to ban that user", ephemeral=True)
            except Exception as e:
                await interaction.response.send_message(f"Error banning user: {e}", ephemeral=True)
        
        # Add the moderation group to the command tree
        self.tree.add_command(moderation)
        
        # Add a help command
        @self.tree.command(name="help", description="View available commands")
        async def help_command(interaction: discord.Interaction):
            # Standard help text
            help_text = """
**Guard-shin Commands**

*Basic Commands*
/ping - Check the bot's latency
/info - Get information about Guard-shin
/invite - Get the bot invite link
/help - View this help message
/premium - Get information about premium features

*Moderation Commands*
/mod ban - Ban a member from the server

Visit our dashboard for more information and a full command list:
https://witherco.github.io/Guard-shin/
"""
            # Add admin commands if user is an admin
            is_admin = interaction.user.guild_permissions.administrator if interaction.guild else False
            
            if is_admin:
                admin_text = """
*Admin Commands*
/devmode - Toggle between development and production mode for slash commands
"""
                help_text += admin_text
                
            await interaction.response.send_message(help_text)
        
        # Add premium command
        @self.tree.command(name="premium", description="Get information about premium features")
        async def premium(interaction: discord.Interaction):
            premium_text = """
**Guard-shin Premium**

Upgrade to premium for access to:
- Music commands
- Advanced moderation
- Custom welcome images
- Auto-response system
- Analytics and more!

Pricing:
- Basic: $4.99/month
- Standard: $9.99/month
- Premium: $24.99/month

Visit our dashboard to purchase:
https://witherco.github.io/Guard-shin/
"""
            await interaction.response.send_message(premium_text)
        
        # Add development mode toggle command (admin only)
        @self.tree.command(name="devmode", description="Toggle development mode (admin only)")
        async def devmode(interaction: discord.Interaction):
            # Check if user is a bot administrator
            if interaction.user.id != 1233495879223345172 and not interaction.user.guild_permissions.administrator:
                await interaction.response.send_message("❌ This command is only available to bot administrators.", ephemeral=True)
                return
            
            # Toggle development mode
            self.DEV_MODE = not self.DEV_MODE
            
            if self.DEV_MODE:
                await interaction.response.send_message("✅ Development mode **ENABLED**. Commands will only be registered to the support server.")
            else:
                await interaction.response.send_message("🌐 Development mode **DISABLED**. Commands will be registered globally.")
            
            # Re-register commands with the new mode
            await self.register_commands()
            
        logger.info("Added slash commands to command tree")
        
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
        
    def load_premium_guilds(self):
        """Load the list of premium guild IDs"""
        try:
            if os.path.exists('premium_guilds.json'):
                with open('premium_guilds.json', 'r') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        # Handle flat list format
                        premium_guilds = set([int(guild_id) for guild_id in data])
                    else:
                        # Handle object format with guild_ids property
                        premium_guilds = set([int(guild_id) for guild_id in data.get("guild_ids", [])])
                    logger.info(f"Loaded {len(premium_guilds)} premium guilds")
                    return premium_guilds
        except Exception as e:
            logger.error(f"Error loading premium guilds: {e}")
        
        # Set Guard-shin support server as premium by default
        return {1233495879223345172}  # Support server ID is 1233495879223345172
        
    def save_premium_guilds(self):
        """Save premium guild IDs to file"""
        try:
            with open('premium_guilds.json', 'w') as f:
                json.dump(list(self.premium_guilds), f)
            logger.info(f"Saved {len(self.premium_guilds)} premium guilds")
        except Exception as e:
            logger.error(f"Error saving premium guilds: {e}")
            
    def add_premium_guild(self, guild_id):
        """Add a guild to the premium list"""
        guild_id = int(guild_id)
        if guild_id not in self.premium_guilds:
            self.premium_guilds.add(guild_id)
            self.save_premium_guilds()
            logger.info(f"Added guild {guild_id} to premium")
            return True
        return False
        
    def remove_premium_guild(self, guild_id):
        """Remove a guild from the premium list"""
        guild_id = int(guild_id)
        if guild_id in self.premium_guilds:
            self.premium_guilds.remove(guild_id)
            self.save_premium_guilds()
            logger.info(f"Removed guild {guild_id} from premium")
            return True
        return False
        
    def is_premium(self, guild_id):
        """Check if a guild has premium access"""
        return int(guild_id) in self.premium_guilds
        
    async def register_commands(self):
        """Register all slash commands with Discord"""
        logger.info("Registering application commands with Discord...")
        try:
            # Check if application ID is set
            if not self.application_id:
                logger.error("No application ID set. Make sure DISCORD_CLIENT_ID is valid and properly configured.")
                client_id = os.getenv('DISCORD_CLIENT_ID', 'Not set')
                logger.info(f"Current DISCORD_CLIENT_ID value: {client_id}")
                
                # Try to get user ID as a fallback
                if self.user:
                    logger.info(f"Bot user ID: {self.user.id}. This can be used as application ID.")
                    # Auto-fix: If we have the user ID but not application ID, use that
                    self.application_id = self.user.id
                    logger.info(f"Auto-fixing application ID using bot user ID: {self.application_id}")
                else:
                    return False
            
            # In development mode, only register commands to the support server
            if self.DEV_MODE:
                logger.info(f"Development mode active. Only registering commands to support server (ID: {self.SUPPORT_SERVER_ID})")
                
                # Check if the bot is in the support server before trying to sync
                is_in_support_server = False
                for guild in self.guilds:
                    if guild.id == self.SUPPORT_SERVER_ID:
                        is_in_support_server = True
                        break
                
                if not is_in_support_server:
                    logger.warning(f"Bot is not in the support server (ID: {self.SUPPORT_SERVER_ID}). Cannot register commands.")
                    logger.info("Please add the bot to the support server first, then restart.")
                    # Still mark as synced to avoid repeated attempts
                    self.synced = True
                    return False
                
                # Create support guild object for command sync
                support_guild = discord.Object(id=self.SUPPORT_SERVER_ID)
                
                try:
                    # Sync commands to the support server only
                    support_commands = await self.tree.sync(guild=support_guild)
                    logger.info(f"Synced {len(support_commands)} commands to support server")
                    logger.info("Commands registered in development mode (only visible in support server)")
                    self.synced = True
                    return True
                except Exception as e:
                    logger.error(f"Failed to sync commands to support server: {e}")
                    logger.warning("Make sure the bot has proper permissions in the support server.")
                    return False
            
            # PRODUCTION MODE - For all servers
            # Instead of global sync, sync per guild for better reliability
            success = False
            
            # If we have no guilds yet, try global sync first
            if len(self.guilds) == 0:
                logger.warning("No guilds available yet, trying global command registration...")
                logger.info(f"Application ID: {self.application_id}")
                logger.info(f"User ID: {self.user.id if self.user else 'Not available yet'}")
                logger.info(f"Is bot ready: {self.is_ready()}")
                
                try:
                    # Try global sync
                    global_commands = await self.tree.sync()
                    logger.info(f"Synced {len(global_commands)} commands globally")
                    success = True
                except Exception as e:
                    logger.error(f"Failed to sync commands globally: {e}")
                    # Continue to try individual guild sync even if global fails
            
            # Log guilds we're going to try to register commands to 
            logger.info(f"Bot is connected to {len(self.guilds)} guilds:")
            for guild in self.guilds:
                logger.info(f"  - {guild.name} (ID: {guild.id})")
            
            # Sync commands to each guild individually
            for guild in self.guilds:
                try:
                    guild_id = guild.id
                    guild_obj = discord.Object(id=guild_id)
                    guild_commands = await self.tree.sync(guild=guild_obj)
                    logger.info(f"Synced {len(guild_commands)} commands to guild: {guild.name} (ID: {guild_id})")
                    success = True
                except discord.errors.Forbidden as e:
                    logger.error(f"Insufficient permissions for guild {guild.name}: {e}")
                except Exception as e:
                    logger.error(f"Failed to sync commands to guild {guild.name}: {e}")
            
            # If all guilds were processed but none succeeded
            if not success:
                # Try again with global sync as a last resort
                try:
                    logger.info("Trying global command sync as fallback...")
                    global_commands = await self.tree.sync()
                    logger.info(f"Synced {len(global_commands)} commands globally")
                    success = True
                except Exception as e:
                    logger.error(f"Failed to sync commands globally: {e}")
                    
                    logger.warning("""
                    Failed to register commands in all guilds. Possible reasons:
                    1. Bot application ID and token mismatch
                    2. Bot missing 'applications.commands' scope
                    3. Bot doesn't have sufficient permissions
                    
                    Make sure your DISCORD_CLIENT_ID matches your bot token and the bot 
                    was invited with the 'applications.commands' scope.
                    
                    Invite URL format: https://discord.com/oauth2/authorize?client_id=1361873604882731008&permissions=8&scope=bot%20applications.commands
                    """)
            
            # Log success based on sync results
            if success:
                logger.info("Successfully registered commands")
                self.synced = True
            else:
                logger.warning("Failed to register commands to any guilds")
            
            return success
        except Exception as e:
            logger.error(f"Error registering commands: {e}")
            return False
    
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
                    
                    # Skip music extension due to wavelink issues
                    if module_name == "music":
                        logger.info(f"Skipping music extension due to wavelink compatibility issues")
                        continue
                        
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
        
        # Register commands with Discord
        await self.register_commands()
        
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
        
        # Register slash commands to ensure they're available
        await self.register_commands()
        
        # Save server information to a file
        try:
            servers_data = []
            for guild in self.guilds:
                # Get moderation actions count (placeholder for now)
                mod_actions = 0
                try:
                    # Count number of audit log entries as a proxy for moderation actions
                    async for entry in guild.audit_logs(limit=None):
                        if entry.action.name in ['ban', 'kick', 'mute', 'unban', 'timeout']:
                            mod_actions += 1
                except Exception as e:
                    logger.error(f"Error getting audit logs for {guild.name}: {e}")
                
                # Determine plan type (customize as needed)
                plan_type = "Free"
                if hasattr(self, 'premium_guilds') and guild.id in getattr(self, 'premium_guilds', set()):
                    plan_type = "Premium"
                
                servers_data.append({
                    "id": str(guild.id),
                    "name": guild.name,
                    "icon": str(guild.icon.url) if guild.icon else None,
                    "members": guild.member_count,
                    "moderation_actions": mod_actions,
                    "plan": plan_type
                })
            
            # Save to files for dashboard to read
            # Save to server_data.json (this is for internal use)
            with open('server_data.json', 'w') as f:
                json.dump({"servers": servers_data}, f)
                
            # Also save to bot_guilds.json (this is expected by our API endpoints)
            with open('bot_guilds.json', 'w') as f:
                json.dump(servers_data, f)
                
            logger.info(f"Saved data for {len(servers_data)} servers to both server_data.json and bot_guilds.json")
        except Exception as e:
            logger.error(f"Error saving server data: {e}")
        
        # Load help command
        await self.add_cog(HelpCog(self))
        
def main():
    """Initialize and run the bot"""
    bot = GuardShin()
    
    # Get token from environment variable
    token = os.getenv('DISCORD_BOT_TOKEN') or os.getenv('GUARD_SHIN_BOT_TOKEN')
    if not token:
        logger.error("No token found in DISCORD_BOT_TOKEN or GUARD_SHIN_BOT_TOKEN environment variables")
        print("ERROR: No Discord bot token found. Please set either the DISCORD_BOT_TOKEN or GUARD_SHIN_BOT_TOKEN environment variable.")
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