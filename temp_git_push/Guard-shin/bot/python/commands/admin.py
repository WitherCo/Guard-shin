import discord
from discord.ext import commands
from discord import app_commands
import asyncio
import datetime
import logging
import json
import os
from typing import Optional, List, Literal

logger = logging.getLogger('guard-shin')

class Admin(commands.Cog):
    """Admin commands for bot configuration and management"""

    def __init__(self, bot):
        self.bot = bot
        
        # Initialize settings
        self.config = {}
        self.load_config()
        
        # Register slash commands
        self._register_slash_commands()
    
    def _register_slash_commands(self):
        """Register slash commands with the bot"""
        # Prefix command
        prefix_group = app_commands.Group(name="prefix", description="Manage the bot's command prefix")
        
        @prefix_group.command(name="set", description="Change the bot's command prefix")
        @app_commands.describe(new_prefix="The new prefix to use for commands")
        @app_commands.checks.has_permissions(administrator=True)
        async def prefix_set_slash(interaction: discord.Interaction, new_prefix: str):
            await self._prefix_logic(interaction, new_prefix)
        
        @prefix_group.command(name="show", description="Show the current command prefix")
        async def prefix_show_slash(interaction: discord.Interaction):
            if not interaction.guild:
                await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
                return
            
            # Get the current prefix
            current_prefix = self.bot.get_guild_prefix(interaction.guild.id)
            
            # Create embed with prefix info
            embed = discord.Embed(
                title="Server Prefix",
                description=f"The current command prefix is `{current_prefix}`",
                color=discord.Color.blue()
            )
            
            # Show examples
            examples = [
                f"`{current_prefix}help` - Show help",
                f"`{current_prefix}ping` - Check bot latency",
                f"`{current_prefix}prefix .` - Change prefix to ."
            ]
            embed.add_field(name="Example Commands", value="\n".join(examples), inline=False)
            
            # Add mention info
            embed.add_field(
                name="Alternative",
                value=f"You can always mention me instead of using a prefix: <@{self.bot.user.id}> help",
                inline=False
            )
            
            await interaction.response.send_message(embed=embed)
        
        # Add prefix group to command tree
        self.bot.tree.add_command(prefix_group)
        
        # Setup command
        @self.bot.tree.command(name="setup", description="Set up the bot with recommended settings")
        @app_commands.checks.has_permissions(administrator=True)
        async def setup_slash(interaction: discord.Interaction):
            await self._setup_logic(interaction)
        
        # Module command
        module_group = app_commands.Group(name="module", description="Manage bot modules")
        
        @module_group.command(name="enable", description="Enable a module")
        @app_commands.describe(
            module="The module to enable",
            channel="The channel to use for the module (optional)"
        )
        @app_commands.checks.has_permissions(administrator=True)
        async def module_enable_slash(
            interaction: discord.Interaction, 
            module: Literal["automod", "verification", "raidprotection", "logging"],
            channel: Optional[discord.TextChannel] = None
        ):
            await self._module_enable_logic(interaction, module, channel)
        
        @module_group.command(name="disable", description="Disable a module")
        @app_commands.describe(module="The module to disable")
        @app_commands.checks.has_permissions(administrator=True)
        async def module_disable_slash(
            interaction: discord.Interaction,
            module: Literal["automod", "verification", "raidprotection", "logging"]
        ):
            await self._module_disable_logic(interaction, module)
        
        # Add module group to command tree
        self.bot.tree.add_command(module_group)
        
        # Log channel command
        @self.bot.tree.command(name="logchannel", description="Set the channel for bot logs")
        @app_commands.describe(channel="The channel to use for logs")
        @app_commands.checks.has_permissions(administrator=True)
        async def logchannel_slash(interaction: discord.Interaction, channel: discord.TextChannel):
            await self._logchannel_logic(interaction, channel)
    
    def load_config(self):
        """Load bot configuration from storage"""
        # In a real implementation, this would load from a database
        # For now, we'll initialize empty config for each guild
        for guild in self.bot.guilds:
            if guild.id not in self.config:
                self.config[guild.id] = {
                    'prefix': '>',
                    'modules': {
                        'automod': {
                            'enabled': False,
                            'channel_id': None
                        },
                        'verification': {
                            'enabled': False,
                            'channel_id': None
                        },
                        'raidprotection': {
                            'enabled': False,
                            'channel_id': None
                        },
                        'logging': {
                            'enabled': False,
                            'channel_id': None
                        }
                    }
                }
    
    def save_config(self):
        """Save bot configuration to storage"""
        # In a real implementation, this would save to a database
        # For now, we'll just log that config was saved
        logger.info("Bot configuration saved")
    
    async def _prefix_logic(self, ctx_or_interaction, new_prefix):
        """Shared logic for prefix command"""
        is_interaction = isinstance(ctx_or_interaction, discord.Interaction)
        
        # Get the guild
        if is_interaction:
            guild = ctx_or_interaction.guild
            if not guild:
                await ctx_or_interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
                return
        else:
            guild = ctx_or_interaction.guild
        
        # Validate prefix length
        if len(new_prefix) > 5:
            response = "Prefix cannot be longer than 5 characters."
            if is_interaction:
                await ctx_or_interaction.response.send_message(response, ephemeral=True)
            else:
                await ctx_or_interaction.send(response)
            return
        
        # Immediately acknowledge the interaction to prevent timeout
        if is_interaction:
            # Use defer if we need time to process
            await ctx_or_interaction.response.defer(ephemeral=False)
        
        try:
            # Update prefix in bot
            self.bot.set_guild_prefix(guild.id, new_prefix)
            
            # Update prefix in config
            if guild.id not in self.config:
                self.config[guild.id] = {'prefix': new_prefix, 'modules': {}}
            else:
                self.config[guild.id]['prefix'] = new_prefix
            
            # Save config
            self.save_config()
            
            # Send confirmation
            response = f"✅ Prefix has been changed to `{new_prefix}`"
            
            if is_interaction:
                await ctx_or_interaction.followup.send(response)
            else:
                await ctx_or_interaction.send(response)
                
            # Add help text
            help_message = f"You can now use commands like `{new_prefix}help` or `{new_prefix}ping`.\nYou can also mention me: <@{self.bot.user.id}> help"
            
            if is_interaction:
                await ctx_or_interaction.followup.send(help_message)
            else:
                await ctx_or_interaction.send(help_message)
                
        except Exception as e:
            logger.error(f"Error updating prefix: {e}")
            error_msg = f"❌ An error occurred while updating the prefix: {str(e)}"
            
            if is_interaction:
                await ctx_or_interaction.followup.send(error_msg, ephemeral=True)
            else:
                await ctx_or_interaction.send(error_msg)
    
    async def _setup_logic(self, ctx_or_interaction):
        """Shared logic for setup command"""
        is_interaction = isinstance(ctx_or_interaction, discord.Interaction)
        
        # Get the guild
        if is_interaction:
            guild = ctx_or_interaction.guild
            if not guild:
                await ctx_or_interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
                return
        else:
            guild = ctx_or_interaction.guild
        
        # Send initial response
        if is_interaction:
            await ctx_or_interaction.response.defer(thinking=True)
            response = await ctx_or_interaction.original_response()
        else:
            response = await ctx_or_interaction.send("🔄 Setting up the bot...")
        
        # Find or create log channel
        log_channel = discord.utils.get(guild.text_channels, name="bot-logs")
        if not log_channel:
            try:
                log_channel = await guild.create_text_channel(
                    "bot-logs",
                    topic="Bot logs and notifications",
                    reason="Bot setup command"
                )
                await response.edit(content=f"🔄 Setting up the bot...\n✅ Created log channel {log_channel.mention}")
            except discord.Forbidden:
                await response.edit(content="❌ I don't have permission to create channels.")
                return
            except discord.HTTPException as e:
                await response.edit(content=f"❌ Failed to create log channel: {e}")
                return
        else:
            await response.edit(content=f"🔄 Setting up the bot...\n✅ Using existing log channel {log_channel.mention}")
        
        # Update config
        if guild.id not in self.config:
            self.config[guild.id] = {
                'prefix': '>',
                'modules': {
                    'automod': {'enabled': True, 'channel_id': log_channel.id},
                    'verification': {'enabled': False, 'channel_id': None},
                    'raidprotection': {'enabled': True, 'channel_id': log_channel.id},
                    'logging': {'enabled': True, 'channel_id': log_channel.id}
                }
            }
        else:
            self.config[guild.id]['modules']['automod'] = {'enabled': True, 'channel_id': log_channel.id}
            self.config[guild.id]['modules']['raidprotection'] = {'enabled': True, 'channel_id': log_channel.id}
            self.config[guild.id]['modules']['logging'] = {'enabled': True, 'channel_id': log_channel.id}
        
        # Save config
        self.save_config()
        
        # Send confirmation
        embed = discord.Embed(
            title="✅ Bot Setup Complete",
            description="Guard-shin has been configured with recommended settings",
            color=discord.Color.green(),
            timestamp=discord.utils.utcnow()
        )
        
        embed.add_field(name="Log Channel", value=log_channel.mention, inline=False)
        embed.add_field(
            name="Enabled Modules", 
            value="• Auto-Moderation\n• Raid Protection\n• Logging", 
            inline=False
        )
        
        embed.add_field(
            name="Next Steps",
            value=(
                "• Set up verification with `/module enable verification #channel`\n"
                "• Customize auto-moderation settings\n"
                "• Configure raid protection thresholds"
            ),
            inline=False
        )
        
        await response.edit(content=None, embed=embed)
    
    async def _module_enable_logic(self, ctx_or_interaction, module, channel=None):
        """Shared logic for module enable command"""
        is_interaction = isinstance(ctx_or_interaction, discord.Interaction)
        
        # Get the guild
        if is_interaction:
            guild = ctx_or_interaction.guild
            if not guild:
                await ctx_or_interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
                return
        else:
            guild = ctx_or_interaction.guild
        
        # Make sure config exists for this guild
        if guild.id not in self.config:
            self.config[guild.id] = {
                'prefix': '>',
                'modules': {
                    'automod': {'enabled': False, 'channel_id': None},
                    'verification': {'enabled': False, 'channel_id': None},
                    'raidprotection': {'enabled': False, 'channel_id': None},
                    'logging': {'enabled': False, 'channel_id': None}
                }
            }
        
        # Check if the module exists
        if module not in self.config[guild.id]['modules']:
            response = f"❌ Module `{module}` does not exist."
            if is_interaction:
                await ctx_or_interaction.response.send_message(response, ephemeral=True)
            else:
                await ctx_or_interaction.send(response)
            return
        
        # Update module config
        self.config[guild.id]['modules'][module]['enabled'] = True
        
        # Set channel if provided
        if channel:
            self.config[guild.id]['modules'][module]['channel_id'] = channel.id
            channel_mention = channel.mention
        else:
            channel_mention = "Not set (using server default)"
        
        # Save config
        self.save_config()
        
        # Send confirmation
        embed = discord.Embed(
            title=f"Module Enabled: {module.title()}",
            description=f"The {module} module has been enabled",
            color=discord.Color.green(),
            timestamp=discord.utils.utcnow()
        )
        
        embed.add_field(name="Channel", value=channel_mention, inline=False)
        
        if is_interaction:
            await ctx_or_interaction.response.send_message(embed=embed)
        else:
            await ctx_or_interaction.send(embed=embed)
    
    async def _module_disable_logic(self, ctx_or_interaction, module):
        """Shared logic for module disable command"""
        is_interaction = isinstance(ctx_or_interaction, discord.Interaction)
        
        # Get the guild
        if is_interaction:
            guild = ctx_or_interaction.guild
            if not guild:
                await ctx_or_interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
                return
        else:
            guild = ctx_or_interaction.guild
        
        # Make sure config exists for this guild
        if guild.id not in self.config:
            self.config[guild.id] = {
                'prefix': '>',
                'modules': {
                    'automod': {'enabled': False, 'channel_id': None},
                    'verification': {'enabled': False, 'channel_id': None},
                    'raidprotection': {'enabled': False, 'channel_id': None},
                    'logging': {'enabled': False, 'channel_id': None}
                }
            }
        
        # Check if the module exists
        if module not in self.config[guild.id]['modules']:
            response = f"❌ Module `{module}` does not exist."
            if is_interaction:
                await ctx_or_interaction.response.send_message(response, ephemeral=True)
            else:
                await ctx_or_interaction.send(response)
            return
        
        # Check if the module is already disabled
        if not self.config[guild.id]['modules'][module]['enabled']:
            response = f"⚠️ Module `{module}` is already disabled."
            if is_interaction:
                await ctx_or_interaction.response.send_message(response, ephemeral=True)
            else:
                await ctx_or_interaction.send(response)
            return
        
        # Update module config
        self.config[guild.id]['modules'][module]['enabled'] = False
        
        # Save config
        self.save_config()
        
        # Send confirmation
        embed = discord.Embed(
            title=f"Module Disabled: {module.title()}",
            description=f"The {module} module has been disabled",
            color=discord.Color.red(),
            timestamp=discord.utils.utcnow()
        )
        
        if is_interaction:
            await ctx_or_interaction.response.send_message(embed=embed)
        else:
            await ctx_or_interaction.send(embed=embed)
    
    async def _logchannel_logic(self, ctx_or_interaction, channel):
        """Shared logic for logchannel command"""
        is_interaction = isinstance(ctx_or_interaction, discord.Interaction)
        
        # Get the guild
        if is_interaction:
            guild = ctx_or_interaction.guild
            if not guild:
                await ctx_or_interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
                return
        else:
            guild = ctx_or_interaction.guild
        
        # Make sure config exists for this guild
        if guild.id not in self.config:
            self.config[guild.id] = {
                'prefix': '>',
                'modules': {
                    'automod': {'enabled': False, 'channel_id': None},
                    'verification': {'enabled': False, 'channel_id': None},
                    'raidprotection': {'enabled': False, 'channel_id': None},
                    'logging': {'enabled': False, 'channel_id': None}
                }
            }
        
        # Update logging module config
        self.config[guild.id]['modules']['logging']['enabled'] = True
        self.config[guild.id]['modules']['logging']['channel_id'] = channel.id
        
        # Save config
        self.save_config()
        
        # Send confirmation
        embed = discord.Embed(
            title="Log Channel Set",
            description=f"Log channel has been set to {channel.mention}",
            color=discord.Color.green(),
            timestamp=discord.utils.utcnow()
        )
        
        if is_interaction:
            await ctx_or_interaction.response.send_message(embed=embed)
        else:
            await ctx_or_interaction.send(embed=embed)
    
    @commands.group(invoke_without_command=True)
    @commands.has_permissions(administrator=True)
    async def prefix(self, ctx, new_prefix=None):
        """Set the bot's command prefix
        
        Examples:
        >prefix .
        >prefix ?
        """
        if new_prefix is None:
            current_prefix = self.bot.get_guild_prefix(ctx.guild.id)
            await ctx.send(f"Current prefix: `{current_prefix}`")
            return
        
        # Validate prefix length
        if len(new_prefix) > 5:
            await ctx.send("❌ Prefix cannot be longer than 5 characters.")
            return
        
        # Set the new prefix
        self.bot.set_guild_prefix(ctx.guild.id, new_prefix)
        
        # Update local config cache as well
        if ctx.guild.id not in self.config:
            self.config[ctx.guild.id] = {'prefix': new_prefix, 'modules': {}}
        else:
            self.config[ctx.guild.id]['prefix'] = new_prefix
        
        # Confirmation message
        await ctx.send(f"✅ Prefix has been changed to `{new_prefix}`")
        
        # Add help text for using the new prefix
        help_command = f"{new_prefix}help"
        example_command = f"{new_prefix}ping"
        await ctx.send(f"You can now use commands like `{help_command}` or `{example_command}`.\nYou can also mention me: <@{self.bot.user.id}> help")
    
    @commands.command()
    @commands.has_permissions(administrator=True)
    async def setup(self, ctx):
        """Set up the bot with recommended settings"""
        await self._setup_logic(ctx)
    
    @commands.group(invoke_without_command=True)
    @commands.has_permissions(administrator=True)
    async def module(self, ctx):
        """Manage bot modules"""
        guild_id = ctx.guild.id
        
        # Show module status
        embed = discord.Embed(
            title="Module Status",
            description="Current status of all bot modules",
            color=discord.Color.blue(),
            timestamp=discord.utils.utcnow()
        )
        
        # Make sure config exists for this guild
        if guild_id not in self.config:
            self.load_config()
        
        # Add fields for each module
        for module, config in self.config[guild_id]['modules'].items():
            status = "✅ Enabled" if config['enabled'] else "❌ Disabled"
            
            channel_str = "Not set"
            if config['channel_id']:
                channel = ctx.guild.get_channel(config['channel_id'])
                channel_str = channel.mention if channel else "Invalid Channel"
            
            embed.add_field(
                name=f"{module.title()} ({status})",
                value=f"Channel: {channel_str}",
                inline=False
            )
        
        await ctx.send(embed=embed)
    
    @module.command(name="enable")
    @commands.has_permissions(administrator=True)
    async def module_enable(self, ctx, module: str, channel: Optional[discord.TextChannel] = None):
        """Enable a bot module
        
        Examples:
        >module enable automod
        >module enable verification #verification
        """
        # Convert module name to lowercase
        module = module.lower()
        
        # Check if the module is valid
        valid_modules = ["automod", "verification", "raidprotection", "logging"]
        if module not in valid_modules:
            await ctx.send(f"❌ Invalid module. Valid modules are: {', '.join(valid_modules)}")
            return
        
        await self._module_enable_logic(ctx, module, channel)
    
    @module.command(name="disable")
    @commands.has_permissions(administrator=True)
    async def module_disable(self, ctx, module: str):
        """Disable a bot module
        
        Example:
        >module disable automod
        """
        # Convert module name to lowercase
        module = module.lower()
        
        # Check if the module is valid
        valid_modules = ["automod", "verification", "raidprotection", "logging"]
        if module not in valid_modules:
            await ctx.send(f"❌ Invalid module. Valid modules are: {', '.join(valid_modules)}")
            return
        
        await self._module_disable_logic(ctx, module)
    
    @commands.command()
    @commands.has_permissions(administrator=True)
    async def logchannel(self, ctx, channel: discord.TextChannel):
        """Set the channel for bot logs
        
        Example:
        >logchannel #bot-logs
        """
        await self._logchannel_logic(ctx, channel)

async def setup(bot):
    await bot.add_cog(Admin(bot))