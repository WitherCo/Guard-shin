import discord
from discord.ext import commands
import asyncio
import logging
import json
import os
import datetime
import random
import string
from discord import ui

logger = logging.getLogger('guard-shin')

# Verification types
VERIFICATION_TYPES = {
    "reaction": "React to a message",
    "button": "Click a button",
    "captcha": "Solve a captcha",
    "message": "Send a specific message"
}

class VerificationButton(ui.Button):
    def __init__(self, label="Verify", custom_id="verify_button", style=discord.ButtonStyle.primary):
        super().__init__(label=label, custom_id=custom_id, style=style)
    
    async def callback(self, interaction: discord.Interaction):
        # Get the verification cog
        verification_cog = interaction.client.get_cog("Verification")
        if verification_cog:
            await verification_cog.process_verification(interaction)
        else:
            await interaction.response.send_message("Verification system is not available.", ephemeral=True)

class VerificationView(ui.View):
    def __init__(self):
        super().__init__(timeout=None)  # Persistent view
        self.add_item(VerificationButton())

class Verification(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.settings = {}  # guild_id -> settings
        self.pending_verifications = {}  # user_id -> verification_data
        self.captchas = {}  # user_id -> captcha_data
        self.load_settings()
        
        # Register persistent view
        self.bot.add_view(VerificationView())
    
    def load_settings(self):
        """Load verification settings from storage"""
        # This would normally load from a database
        # For now, we'll use default settings for all guilds
        default_settings = {
            'enabled': True,
            'verification_type': 'button',  # reaction, button, captcha, message
            'verification_channel_id': None,
            'verified_role_id': None,
            'welcome_channel_id': None,
            'welcome_message': "Welcome to {server}, {user}!",
            'verification_message': "Please click the button below to verify yourself.",
            'log_channel_id': None,
            'captcha_difficulty': 'medium',  # easy, medium, hard
            'verification_message_id': None,
            'auto_kick': False,
            'auto_kick_delay': 1440  # 24 hours in minutes
        }
        
        # Apply default settings to all guilds
        for guild in self.bot.guilds:
            self.settings[guild.id] = default_settings.copy()
    
    @commands.Cog.listener()
    async def on_member_join(self, member):
        """Send verification instructions to new members"""
        # Skip bots
        if member.bot:
            return
        
        guild = member.guild
        
        # Get settings for this guild
        settings = self.settings.get(guild.id, {})
        
        # Skip if verification is disabled
        if not settings.get('enabled', False):
            return
        
        # Get verification channel
        verification_channel_id = settings.get('verification_channel_id')
        if not verification_channel_id:
            # Try to find a channel with 'verification' or 'welcome' in the name
            verification_channels = [c for c in guild.text_channels if 'verif' in c.name.lower() or 'welcome' in c.name.lower()]
            if verification_channels:
                verification_channel = verification_channels[0]
                settings['verification_channel_id'] = verification_channel.id
            else:
                logger.warning(f"No verification channel set for {guild.name} and none found")
                return
        else:
            verification_channel = guild.get_channel(int(verification_channel_id))
            if not verification_channel:
                logger.warning(f"Verification channel not found in {guild.name}")
                return
        
        # Get verification type
        verification_type = settings.get('verification_type', 'button')
        
        # Check if there's a verification message to direct users to
        verification_message_id = settings.get('verification_message_id')
        if verification_message_id:
            try:
                verification_message = await verification_channel.fetch_message(int(verification_message_id))
                # Just direct the user to the existing message
                try:
                    await member.send(
                        f"Welcome to **{guild.name}**! Please verify yourself in {verification_channel.mention} by "
                        f"following the instructions there."
                    )
                except discord.Forbidden:
                    logger.warning(f"Cannot send DM to {member} in {guild.name}")
                return
            except (discord.NotFound, discord.Forbidden):
                # Message no longer exists, we'll create a new one
                settings['verification_message_id'] = None
        
        # Create appropriate verification based on the type
        if verification_type == "button":
            await self.setup_button_verification(member, verification_channel, settings)
        
        elif verification_type == "reaction":
            await self.setup_reaction_verification(member, verification_channel, settings)
        
        elif verification_type == "captcha":
            await self.setup_captcha_verification(member, verification_channel, settings)
        
        elif verification_type == "message":
            await self.setup_message_verification(member, verification_channel, settings)
    
    async def setup_button_verification(self, member, channel, settings):
        """Set up button-based verification"""
        # Check if there's already a verification message
        message_id = settings.get('verification_message_id')
        
        if not message_id:
            # Create a new verification message
            embed = discord.Embed(
                title="Verification Required",
                description=settings.get('verification_message', "Please click the button below to verify yourself."),
                color=discord.Color.blue()
            )
            
            view = VerificationView()
            message = await channel.send(embed=embed, view=view)
            
            # Save the message ID
            settings['verification_message_id'] = message.id
        
        # Try to notify the member
        try:
            await member.send(
                f"Welcome to **{member.guild.name}**! Please verify yourself in {channel.mention} by "
                f"clicking the verification button."
            )
        except discord.Forbidden:
            logger.warning(f"Cannot send DM to {member} in {member.guild.name}")
    
    async def setup_reaction_verification(self, member, channel, settings):
        """Set up reaction-based verification"""
        # Check if there's already a verification message
        message_id = settings.get('verification_message_id')
        
        if not message_id:
            # Create a new verification message
            embed = discord.Embed(
                title="Verification Required",
                description=settings.get('verification_message', "Please react with ✅ to verify yourself."),
                color=discord.Color.blue()
            )
            
            message = await channel.send(embed=embed)
            await message.add_reaction("✅")
            
            # Save the message ID
            settings['verification_message_id'] = message.id
        else:
            # Use existing message
            try:
                message = await channel.fetch_message(int(message_id))
                # Make sure it has the reaction
                await message.add_reaction("✅")
            except (discord.NotFound, discord.Forbidden):
                # Message no longer exists, create a new one
                embed = discord.Embed(
                    title="Verification Required",
                    description=settings.get('verification_message', "Please react with ✅ to verify yourself."),
                    color=discord.Color.blue()
                )
                
                message = await channel.send(embed=embed)
                await message.add_reaction("✅")
                
                # Save the message ID
                settings['verification_message_id'] = message.id
        
        # Try to notify the member
        try:
            await member.send(
                f"Welcome to **{member.guild.name}**! Please verify yourself in {channel.mention} by "
                f"reacting with ✅ to the verification message."
            )
        except discord.Forbidden:
            logger.warning(f"Cannot send DM to {member} in {member.guild.name}")
    
    async def setup_captcha_verification(self, member, channel, settings):
        """Set up captcha-based verification"""
        # Generate a captcha
        captcha_code = self.generate_captcha(settings.get('captcha_difficulty', 'medium'))
        
        # Store the captcha
        self.captchas[member.id] = {
            'code': captcha_code,
            'guild_id': member.guild.id,
            'created_at': datetime.datetime.now()
        }
        
        # Create captcha embed
        embed = discord.Embed(
            title="Verification Required",
            description=f"{member.mention}, please type the following code to verify yourself:\n\n"
                       f"`{captcha_code}`\n\n"
                       f"Type the code in this channel.",
            color=discord.Color.blue()
        )
        
        await channel.send(embed=embed)
        
        # Try to notify the member
        try:
            await member.send(
                f"Welcome to **{member.guild.name}**! Please verify yourself in {channel.mention} by "
                f"typing the captcha code: `{captcha_code}`"
            )
        except discord.Forbidden:
            logger.warning(f"Cannot send DM to {member} in {member.guild.name}")
    
    async def setup_message_verification(self, member, channel, settings):
        """Set up message-based verification"""
        # Generate a verification phrase
        verification_code = ''.join(random.choices(string.ascii_uppercase, k=4))
        verification_phrase = f"I verify {verification_code}"
        
        # Store the verification data
        self.pending_verifications[member.id] = {
            'phrase': verification_phrase,
            'guild_id': member.guild.id,
            'created_at': datetime.datetime.now()
        }
        
        # Create verification embed
        embed = discord.Embed(
            title="Verification Required",
            description=f"{member.mention}, please type the following phrase to verify yourself:\n\n"
                       f"`{verification_phrase}`\n\n"
                       f"Type the phrase in this channel.",
            color=discord.Color.blue()
        )
        
        await channel.send(embed=embed)
        
        # Try to notify the member
        try:
            await member.send(
                f"Welcome to **{member.guild.name}**! Please verify yourself in {channel.mention} by "
                f"typing the verification phrase: `{verification_phrase}`"
            )
        except discord.Forbidden:
            logger.warning(f"Cannot send DM to {member} in {member.guild.name}")
    
    @commands.Cog.listener()
    async def on_message(self, message):
        """Process verification messages"""
        # Skip messages from bots or in DMs
        if message.author.bot or not message.guild:
            return
        
        # Get settings for this guild
        settings = self.settings.get(message.guild.id, {})
        
        # Skip if verification is disabled
        if not settings.get('enabled', False):
            return
        
        # Check if the channel is the verification channel
        verification_channel_id = settings.get('verification_channel_id')
        if not verification_channel_id or int(verification_channel_id) != message.channel.id:
            return
        
        # Check verification type
        verification_type = settings.get('verification_type', 'button')
        
        # Process message verification
        if verification_type == "message":
            # Check if user has pending verification
            if message.author.id in self.pending_verifications:
                verification_data = self.pending_verifications[message.author.id]
                
                # Check if the message matches the phrase
                if message.content.strip().lower() == verification_data['phrase'].lower():
                    # Verify the user
                    await self.verify_user(message.author, message.guild, "message verification", message.channel)
                    
                    # Clean up
                    del self.pending_verifications[message.author.id]
                    
                    # Delete the verification message
                    try:
                        await message.delete()
                    except:
                        pass
        
        # Process captcha verification
        elif verification_type == "captcha":
            # Check if user has a captcha
            if message.author.id in self.captchas:
                captcha_data = self.captchas[message.author.id]
                
                # Check if the message matches the captcha
                if message.content.strip().upper() == captcha_data['code'].upper():
                    # Verify the user
                    await self.verify_user(message.author, message.guild, "captcha verification", message.channel)
                    
                    # Clean up
                    del self.captchas[message.author.id]
                    
                    # Delete the verification message
                    try:
                        await message.delete()
                    except:
                        pass
    
    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload):
        """Process verification reactions"""
        # Skip bot reactions
        if payload.user_id == self.bot.user.id:
            return
        
        # Get the guild
        guild = self.bot.get_guild(payload.guild_id)
        if not guild:
            return
        
        # Get settings for this guild
        settings = self.settings.get(guild.id, {})
        
        # Skip if verification is disabled
        if not settings.get('enabled', False):
            return
        
        # Check if the reaction is for verification
        verification_type = settings.get('verification_type', 'button')
        verification_message_id = settings.get('verification_message_id')
        
        if verification_type == "reaction" and verification_message_id and int(verification_message_id) == payload.message_id:
            # Check if the reaction is the correct one
            if payload.emoji.name == "✅":
                # Get the member
                member = guild.get_member(payload.user_id)
                
                if member:
                    # Get the channel
                    channel = guild.get_channel(payload.channel_id)
                    
                    # Verify the user
                    await self.verify_user(member, guild, "reaction verification", channel)
                    
                    # Remove the reaction
                    try:
                        message = await channel.fetch_message(payload.message_id)
                        await message.remove_reaction(payload.emoji, member)
                    except:
                        pass
    
    async def process_verification(self, interaction):
        """Process button verification"""
        # Get the guild
        guild = interaction.guild
        
        # Get settings for this guild
        settings = self.settings.get(guild.id, {})
        
        # Skip if verification is disabled
        if not settings.get('enabled', False):
            return
        
        # Check verification type
        verification_type = settings.get('verification_type', 'button')
        
        if verification_type == "button":
            # Verify the user
            success = await self.verify_user(interaction.user, guild, "button verification", interaction.channel)
            
            if success:
                await interaction.response.send_message(
                    "You have been successfully verified!",
                    ephemeral=True
                )
            else:
                await interaction.response.send_message(
                    "Verification failed. Please try again or contact a server administrator.",
                    ephemeral=True
                )
        else:
            await interaction.response.send_message(
                f"This server uses {VERIFICATION_TYPES.get(verification_type, 'another')} verification method. "
                f"Please follow the instructions provided.",
                ephemeral=True
            )
    
    async def verify_user(self, member, guild, method, channel=None):
        """Verify a user by giving them the verified role"""
        # Get settings for this guild
        settings = self.settings.get(guild.id, {})
        
        # Get the verified role
        verified_role_id = settings.get('verified_role_id')
        verified_role = None
        
        if verified_role_id:
            verified_role = guild.get_role(int(verified_role_id))
        
        if not verified_role:
            # Try to find a role with 'verified' or 'member' in the name
            verified_roles = [r for r in guild.roles if 'verif' in r.name.lower() or 'member' in r.name.lower()]
            if verified_roles:
                verified_role = verified_roles[0]
                settings['verified_role_id'] = verified_role.id
            else:
                logger.warning(f"No verified role set for {guild.name} and none found")
                return False
        
        # Check if the user already has the role
        if verified_role in member.roles:
            logger.info(f"{member} in {guild.name} already verified")
            return True
        
        # Add the role
        try:
            await member.add_roles(verified_role, reason=f"Verified via {method}")
            logger.info(f"Verified {member} in {guild.name} via {method}")
            
            # Log the verification
            await self.log_verification(member, guild, method)
            
            # Send welcome message
            await self.send_welcome_message(member, guild)
            
            return True
        
        except discord.Forbidden:
            logger.warning(f"Cannot add verified role to {member} in {guild.name}: Missing permissions")
            if channel:
                await channel.send(
                    f"Error: I don't have permission to assign the verified role. "
                    f"Please ask an administrator to check my role permissions."
                )
            return False
        
        except Exception as e:
            logger.error(f"Error verifying {member} in {guild.name}: {e}")
            return False
    
    async def log_verification(self, member, guild, method):
        """Log verification to a specified channel"""
        # Get settings for this guild
        settings = self.settings.get(guild.id, {})
        
        # Get log channel
        log_channel_id = settings.get('log_channel_id')
        if not log_channel_id:
            return
        
        log_channel = guild.get_channel(int(log_channel_id))
        if not log_channel:
            return
        
        # Create log embed
        embed = discord.Embed(
            title="User Verified",
            description=f"{member.mention} has been verified.",
            color=discord.Color.green(),
            timestamp=discord.utils.utcnow()
        )
        
        embed.add_field(name="User", value=f"{member} ({member.id})")
        embed.add_field(name="Method", value=method)
        embed.add_field(name="Account Created", value=f"<t:{int(member.created_at.timestamp())}:R>")
        embed.add_field(name="Account Age", value=f"{(discord.utils.utcnow() - member.created_at).days} days")
        
        # Add user avatar
        embed.set_thumbnail(url=member.display_avatar.url)
        
        await log_channel.send(embed=embed)
    
    async def send_welcome_message(self, member, guild):
        """Send a welcome message for verified users"""
        # Get settings for this guild
        settings = self.settings.get(guild.id, {})
        
        # Get welcome channel
        welcome_channel_id = settings.get('welcome_channel_id')
        if not welcome_channel_id:
            # Try to find a welcome channel
            welcome_channels = [c for c in guild.text_channels if 'welcome' in c.name.lower() or 'general' in c.name.lower()]
            if welcome_channels:
                welcome_channel = welcome_channels[0]
            else:
                return  # No welcome channel found
        else:
            welcome_channel = guild.get_channel(int(welcome_channel_id))
            if not welcome_channel:
                return
        
        # Get welcome message
        welcome_message = settings.get('welcome_message', "Welcome to {server}, {user}!")
        
        # Format the message
        message = welcome_message.format(
            server=guild.name,
            user=member.mention,
            username=member.name,
            member_count=guild.member_count
        )
        
        # Send the welcome message
        await welcome_channel.send(message)
    
    def generate_captcha(self, difficulty="medium"):
        """Generate a CAPTCHA code based on difficulty"""
        if difficulty == "easy":
            # Simple numeric code
            return ''.join(random.choices(string.digits, k=5))
        
        elif difficulty == "hard":
            # Complex alphanumeric with symbols
            chars = string.ascii_uppercase + string.digits + "!@#$%&*"
            return ''.join(random.choices(chars, k=8))
        
        else:  # medium (default)
            # Alphanumeric
            return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    
    @commands.command(name="verification")
    @commands.has_permissions(administrator=True)
    async def verification_settings(self, ctx, setting=None, *, value=None):
        """Configure verification settings"""
        guild = ctx.guild
        
        # Initialize settings if they don't exist
        if guild.id not in self.settings:
            self.load_settings()
        
        # Show status if no setting specified
        if not setting or setting.lower() in ["status", "check"]:
            settings = self.settings[guild.id]
            
            embed = discord.Embed(
                title="Verification Settings",
                color=discord.Color.blue()
            )
            
            embed.add_field(name="Enabled", value="✅ Yes" if settings.get('enabled', False) else "❌ No")
            
            verification_type = settings.get('verification_type', 'button')
            embed.add_field(name="Type", value=VERIFICATION_TYPES.get(verification_type, verification_type))
            
            # Verification channel
            verification_channel_id = settings.get('verification_channel_id')
            verification_channel = "None"
            if verification_channel_id:
                channel = guild.get_channel(int(verification_channel_id))
                verification_channel = f"#{channel.name}" if channel else "Invalid Channel"
            
            embed.add_field(name="Verification Channel", value=verification_channel)
            
            # Verified role
            verified_role_id = settings.get('verified_role_id')
            verified_role = "None"
            if verified_role_id:
                role = guild.get_role(int(verified_role_id))
                verified_role = role.name if role else "Invalid Role"
            
            embed.add_field(name="Verified Role", value=verified_role)
            
            # Welcome channel
            welcome_channel_id = settings.get('welcome_channel_id')
            welcome_channel = "None"
            if welcome_channel_id:
                channel = guild.get_channel(int(welcome_channel_id))
                welcome_channel = f"#{channel.name}" if channel else "Invalid Channel"
            
            embed.add_field(name="Welcome Channel", value=welcome_channel)
            
            # Log channel
            log_channel_id = settings.get('log_channel_id')
            log_channel = "None"
            if log_channel_id:
                channel = guild.get_channel(int(log_channel_id))
                log_channel = f"#{channel.name}" if channel else "Invalid Channel"
            
            embed.add_field(name="Log Channel", value=log_channel)
            
            # Auto-kick
            auto_kick = settings.get('auto_kick', False)
            auto_kick_delay = settings.get('auto_kick_delay', 1440)
            embed.add_field(
                name="Auto-Kick Unverified",
                value=f"{'✅ Yes' if auto_kick else '❌ No'} (after {auto_kick_delay} minutes)"
            )
            
            await ctx.send(embed=embed)
            return
        
        # Toggle verification on/off
        if setting.lower() in ["on", "enable", "true", "yes"]:
            self.settings[guild.id]['enabled'] = True
            await ctx.send("✅ Verification system has been **enabled**.")
            return
        
        elif setting.lower() in ["off", "disable", "false", "no"]:
            self.settings[guild.id]['enabled'] = False
            await ctx.send("❌ Verification system has been **disabled**.")
            return
        
        # Set verification type
        elif setting.lower() == "type":
            if not value or value.lower() not in ["reaction", "button", "captcha", "message"]:
                await ctx.send("⚠️ Please specify a valid verification type: `reaction`, `button`, `captcha`, or `message`.")
                return
            
            self.settings[guild.id]['verification_type'] = value.lower()
            
            # Reset the verification message ID when changing types
            self.settings[guild.id]['verification_message_id'] = None
            
            await ctx.send(f"✅ Verification type set to **{value.lower()}**.")
            
            # Send instructions for setting up the new type
            if value.lower() == "reaction":
                await ctx.send(
                    "To set up reaction verification:\n"
                    "1. Use `!verification channel #channel` to set the verification channel.\n"
                    "2. Use `!verification role @role` to set the verified role.\n"
                    "3. The verification message will be automatically created in the verification channel."
                )
            
            elif value.lower() == "button":
                await ctx.send(
                    "To set up button verification:\n"
                    "1. Use `!verification channel #channel` to set the verification channel.\n"
                    "2. Use `!verification role @role` to set the verified role.\n"
                    "3. The verification message with button will be automatically created in the verification channel."
                )
            
            elif value.lower() == "captcha":
                await ctx.send(
                    "To set up captcha verification:\n"
                    "1. Use `!verification channel #channel` to set the verification channel.\n"
                    "2. Use `!verification role @role` to set the verified role.\n"
                    "3. Use `!verification difficulty easy/medium/hard` to set the captcha difficulty.\n"
                    "4. Captcha codes will be generated for each new member."
                )
            
            elif value.lower() == "message":
                await ctx.send(
                    "To set up message verification:\n"
                    "1. Use `!verification channel #channel` to set the verification channel.\n"
                    "2. Use `!verification role @role` to set the verified role.\n"
                    "3. Verification phrases will be generated for each new member."
                )
        
        # Set verification channel
        elif setting.lower() in ["channel", "verification_channel"]:
            if not ctx.message.channel_mentions:
                await ctx.send("⚠️ Please mention a channel.")
                return
            
            channel = ctx.message.channel_mentions[0]
            self.settings[guild.id]['verification_channel_id'] = channel.id
            
            # Reset the verification message ID when changing channels
            self.settings[guild.id]['verification_message_id'] = None
            
            await ctx.send(f"✅ Verification channel set to {channel.mention}.")
            
            # Suggest next steps
            await ctx.send(
                "Next steps:\n"
                "1. Use `!verification role @role` to set the verified role.\n"
                "2. Use `!verification setup` to create the verification message."
            )
        
        # Set verified role
        elif setting.lower() in ["role", "verified_role"]:
            if not ctx.message.role_mentions:
                await ctx.send("⚠️ Please mention a role.")
                return
            
            role = ctx.message.role_mentions[0]
            self.settings[guild.id]['verified_role_id'] = role.id
            
            await ctx.send(f"✅ Verified role set to @{role.name}.")
            
            # Check role hierarchy
            if role.position >= guild.me.top_role.position:
                await ctx.send(
                    "⚠️ Warning: The verified role is higher than or equal to my highest role. "
                    "I won't be able to assign it to users. Please move my role above the verified role in the role hierarchy."
                )
        
        # Set welcome channel
        elif setting.lower() in ["welcome", "welcome_channel"]:
            if not ctx.message.channel_mentions:
                await ctx.send("⚠️ Please mention a channel.")
                return
            
            channel = ctx.message.channel_mentions[0]
            self.settings[guild.id]['welcome_channel_id'] = channel.id
            
            await ctx.send(f"✅ Welcome channel set to {channel.mention}.")
        
        # Set log channel
        elif setting.lower() in ["log", "log_channel"]:
            if not ctx.message.channel_mentions:
                await ctx.send("⚠️ Please mention a channel.")
                return
            
            channel = ctx.message.channel_mentions[0]
            self.settings[guild.id]['log_channel_id'] = channel.id
            
            await ctx.send(f"✅ Log channel set to {channel.mention}.")
        
        # Set welcome message
        elif setting.lower() in ["message", "welcome_message"]:
            if not value:
                await ctx.send(
                    "⚠️ Please specify a welcome message. You can use these placeholders:\n"
                    "`{user}` - User mention\n"
                    "`{username}` - User name\n"
                    "`{server}` - Server name\n"
                    "`{member_count}` - Server member count"
                )
                return
            
            self.settings[guild.id]['welcome_message'] = value
            
            # Preview the message
            preview = value.format(
                user=ctx.author.mention,
                username=ctx.author.name,
                server=guild.name,
                member_count=guild.member_count
            )
            
            await ctx.send(f"✅ Welcome message set. Preview:\n\n{preview}")
        
        # Set captcha difficulty
        elif setting.lower() == "difficulty":
            if not value or value.lower() not in ["easy", "medium", "hard"]:
                await ctx.send("⚠️ Please specify a valid difficulty: `easy`, `medium`, or `hard`.")
                return
            
            self.settings[guild.id]['captcha_difficulty'] = value.lower()
            
            # Show an example
            example = self.generate_captcha(value.lower())
            
            await ctx.send(f"✅ Captcha difficulty set to **{value.lower()}**. Example: `{example}`")
        
        # Toggle auto-kick
        elif setting.lower() in ["autokick", "auto_kick"]:
            if not value or value.lower() not in ["on", "off", "enable", "disable", "true", "false", "yes", "no"]:
                await ctx.send("⚠️ Please specify `on` or `off`.")
                return
            
            auto_kick = value.lower() in ["on", "enable", "true", "yes"]
            self.settings[guild.id]['auto_kick'] = auto_kick
            
            if auto_kick:
                delay = self.settings[guild.id].get('auto_kick_delay', 1440)
                await ctx.send(f"✅ Auto-kick has been **enabled**. Unverified users will be kicked after {delay} minutes.")
            else:
                await ctx.send("❌ Auto-kick has been **disabled**.")
        
        # Set auto-kick delay
        elif setting.lower() in ["kickdelay", "kick_delay", "delay"]:
            if not value:
                await ctx.send("⚠️ Please specify a delay in minutes.")
                return
            
            try:
                delay = int(value)
                if delay < 5:
                    await ctx.send("⚠️ Delay must be at least 5 minutes.")
                    return
                
                self.settings[guild.id]['auto_kick_delay'] = delay
                
                # Enable auto-kick if it wasn't already
                if not self.settings[guild.id].get('auto_kick', False):
                    self.settings[guild.id]['auto_kick'] = True
                    await ctx.send(f"✅ Auto-kick has been **enabled** with a delay of **{delay} minutes**.")
                else:
                    await ctx.send(f"✅ Auto-kick delay set to **{delay} minutes**.")
            
            except ValueError:
                await ctx.send("⚠️ Please specify a valid number of minutes.")
        
        # Set up verification
        elif setting.lower() == "setup":
            # Get verification type
            verification_type = self.settings[guild.id].get('verification_type', 'button')
            
            # Get verification channel
            verification_channel_id = self.settings[guild.id].get('verification_channel_id')
            if not verification_channel_id:
                await ctx.send("⚠️ No verification channel set. Please use `!verification channel #channel` first.")
                return
            
            verification_channel = guild.get_channel(int(verification_channel_id))
            if not verification_channel:
                await ctx.send("⚠️ Invalid verification channel. Please set a valid channel.")
                return
            
            # Get verified role
            verified_role_id = self.settings[guild.id].get('verified_role_id')
            if not verified_role_id:
                await ctx.send("⚠️ No verified role set. Please use `!verification role @role` first.")
                return
            
            verified_role = guild.get_role(int(verified_role_id))
            if not verified_role:
                await ctx.send("⚠️ Invalid verified role. Please set a valid role.")
                return
            
            # Check permissions
            if not verification_channel.permissions_for(guild.me).send_messages:
                await ctx.send(f"⚠️ I don't have permission to send messages in {verification_channel.mention}.")
                return
            
            if not verification_channel.permissions_for(guild.me).embed_links:
                await ctx.send(f"⚠️ I don't have permission to embed links in {verification_channel.mention}.")
                return
            
            if verification_type == "reaction" and not verification_channel.permissions_for(guild.me).add_reactions:
                await ctx.send(f"⚠️ I don't have permission to add reactions in {verification_channel.mention}.")
                return
            
            # Create verification message based on type
            if verification_type == "button":
                embed = discord.Embed(
                    title="Verification Required",
                    description=self.settings[guild.id].get('verification_message', "Please click the button below to verify yourself."),
                    color=discord.Color.blue()
                )
                
                view = VerificationView()
                message = await verification_channel.send(embed=embed, view=view)
                
                self.settings[guild.id]['verification_message_id'] = message.id
                
            elif verification_type == "reaction":
                embed = discord.Embed(
                    title="Verification Required",
                    description=self.settings[guild.id].get('verification_message', "Please react with ✅ to verify yourself."),
                    color=discord.Color.blue()
                )
                
                message = await verification_channel.send(embed=embed)
                await message.add_reaction("✅")
                
                self.settings[guild.id]['verification_message_id'] = message.id
                
            elif verification_type in ["captcha", "message"]:
                await ctx.send(f"⚠️ {verification_type.capitalize()} verification doesn't use a static message. Each user will receive individual instructions.")
                return
            
            await ctx.send(f"✅ Verification has been set up in {verification_channel.mention}!")
        
        # Unknown setting
        else:
            await ctx.send(
                "⚠️ Unknown setting. Available settings:\n"
                "- `on/off` - Enable/disable verification\n"
                "- `type` - Set verification type (reaction, button, captcha, message)\n"
                "- `channel` - Set verification channel\n"
                "- `role` - Set verified role\n"
                "- `welcome` - Set welcome channel\n"
                "- `log` - Set log channel\n"
                "- `message` - Set welcome message\n"
                "- `difficulty` - Set captcha difficulty\n"
                "- `autokick` - Enable/disable auto-kick for unverified users\n"
                "- `delay` - Set auto-kick delay\n"
                "- `setup` - Set up verification message\n"
                "- `status` - Show current settings"
            )
    
    def cog_unload(self):
        """Save settings when the cog is unloaded"""
        # In a real implementation, we would save settings to a database here
        pass

async def setup(bot):
    await bot.add_cog(Verification(bot))