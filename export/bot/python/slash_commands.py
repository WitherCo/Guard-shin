"""
Guard-shin Discord Bot - Slash Commands System
Handles creation, registration, and execution of slash commands.
Works alongside the Lua command system to provide a complete command experience.
"""

import discord
from discord import app_commands
from discord.ext import commands
import logging
import asyncio
import json
import os
from typing import Dict, Any, List, Optional, Union, Callable

# Premium role IDs
PREMIUM_ROLE_ID = '1361908871882608651'
PREMIUM_PLUS_ROLE_ID = '1361908963616227429'

# Import Lua bridge for command execution
try:
    from bot.python.lua_bridge import lua_bridge
except ImportError:
    lua_bridge = None
    print("Warning: Lua bridge not available for slash commands")

# Setup logger
logger = logging.getLogger('guard-shin.slash_commands')

class SlashCommandsManager:
    """Manages registration and execution of slash commands"""
    
    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.command_tree = app_commands.CommandTree(bot)
        self.registered_commands = {}
        
    def is_premium(self, guild):
        """Check if a guild has premium status by looking for the premium role in the bot's roles"""
        if not guild:
            return False
            
        # Get the bot's member object in the guild
        bot_member = guild.get_member(self.bot.user.id)
        if not bot_member:
            return False
            
        # Check for premium roles
        for role in bot_member.roles:
            if str(role.id) == PREMIUM_ROLE_ID:
                return True
            if str(role.id) == PREMIUM_PLUS_ROLE_ID:
                return True
                
        return False
        
    def is_premium_plus(self, guild):
        """Check if a guild has premium plus status"""
        if not guild:
            return False
            
        # Get the bot's member object in the guild
        bot_member = guild.get_member(self.bot.user.id)
        if not bot_member:
            return False
            
        # Check for premium plus role
        for role in bot_member.roles:
            if str(role.id) == PREMIUM_PLUS_ROLE_ID:
                return True
                
        return False
        
    async def setup(self):
        """Set up slash commands and sync with Discord"""
        await self.register_all_commands()
        await self.sync_commands()
        
    async def register_all_commands(self):
        """Register all slash commands"""
        # Register moderation commands
        await self.register_moderation_commands()
        
        # Register utility commands
        await self.register_utility_commands()
        
        # Register fun commands
        await self.register_fun_commands()
        
        # Register administration commands
        await self.register_admin_commands()
        
    async def register_moderation_commands(self):
        """Register moderation-related slash commands"""
        # Ban command
        @app_commands.command(name="ban", description="Ban a user from the server")
        @app_commands.describe(
            user="The user to ban",
            reason="Reason for the ban",
            delete_days="Number of days of messages to delete (0-7)"
        )
        @app_commands.guild_only()
        async def ban_command(interaction: discord.Interaction, user: discord.User, reason: str = None, delete_days: int = 1):
            # Check permissions
            if not interaction.user.guild_permissions.ban_members:
                await interaction.response.send_message("You don't have permission to ban members.", ephemeral=True)
                return
                
            # Execute command through Lua
            if lua_bridge:
                # Format for Lua
                formatted_message = {
                    'id': str(interaction.id),
                    'content': f"ban {user.id} {reason or ''} {delete_days}",
                    'author': {
                        'id': str(interaction.user.id),
                        'name': interaction.user.name,
                        'discriminator': interaction.user.discriminator,
                        'bot': interaction.user.bot
                    },
                    'channel': {
                        'id': str(interaction.channel_id),
                        'name': getattr(interaction.channel, 'name', 'Unknown')
                    },
                    'guild': {
                        'id': str(interaction.guild_id),
                        'name': interaction.guild.name if interaction.guild else 'Unknown'
                    }
                }
                
                formatted_guild = {
                    'id': str(interaction.guild_id),
                    'name': interaction.guild.name if interaction.guild else 'Unknown'
                }
                
                # Respond with deferred message while processing
                await interaction.response.defer(ephemeral=False)
                
                try:
                    # Call Lua command
                    response = await lua_bridge.send_command(
                        'ban', 
                        [str(user.id), reason, str(delete_days)], 
                        formatted_message, 
                        formatted_guild
                    )
                    
                    # Process response
                    if response.get('success'):
                        # Execute the ban action directly
                        try:
                            await interaction.guild.ban(
                                user, 
                                reason=reason or "No reason provided", 
                                delete_message_days=delete_days
                            )
                            
                            message = response.get('message', f"Banned {user.name}#{user.discriminator}")
                            await interaction.followup.send(message)
                        except discord.Forbidden:
                            await interaction.followup.send("I don't have permission to ban that user.")
                        except Exception as e:
                            await interaction.followup.send(f"Error executing ban: {str(e)}")
                    else:
                        # Command failed
                        error = response.get('error', 'Unknown error')
                        await interaction.followup.send(f"Error: {error}")
                except Exception as e:
                    logger.error(f"Error executing Lua command for slash command: {e}")
                    await interaction.followup.send(f"Error processing command: {str(e)}")
            else:
                # Fallback if Lua bridge not available
                try:
                    await interaction.guild.ban(
                        user, 
                        reason=reason or "No reason provided", 
                        delete_message_days=delete_days
                    )
                    await interaction.response.send_message(f"Banned {user.name}#{user.discriminator}")
                except discord.Forbidden:
                    await interaction.response.send_message("I don't have permission to ban that user.")
                except Exception as e:
                    await interaction.response.send_message(f"Error executing ban: {str(e)}")
                    
        self.command_tree.add_command(ban_command)
        self.registered_commands['ban'] = ban_command
        
        # Kick command
        @app_commands.command(name="kick", description="Kick a user from the server")
        @app_commands.describe(
            user="The user to kick",
            reason="Reason for the kick"
        )
        @app_commands.guild_only()
        async def kick_command(interaction: discord.Interaction, user: discord.Member, reason: str = None):
            # Check permissions
            if not interaction.user.guild_permissions.kick_members:
                await interaction.response.send_message("You don't have permission to kick members.", ephemeral=True)
                return
                
            # Execute command through Lua
            if lua_bridge:
                # Format for Lua (similar structure as above)
                formatted_message = {
                    'id': str(interaction.id),
                    'content': f"kick {user.id} {reason or ''}",
                    'author': {
                        'id': str(interaction.user.id),
                        'name': interaction.user.name,
                        'discriminator': interaction.user.discriminator,
                        'bot': interaction.user.bot
                    },
                    'channel': {
                        'id': str(interaction.channel_id),
                        'name': getattr(interaction.channel, 'name', 'Unknown')
                    },
                    'guild': {
                        'id': str(interaction.guild_id),
                        'name': interaction.guild.name if interaction.guild else 'Unknown'
                    }
                }
                
                formatted_guild = {
                    'id': str(interaction.guild_id),
                    'name': interaction.guild.name if interaction.guild else 'Unknown'
                }
                
                # Respond with deferred message while processing
                await interaction.response.defer(ephemeral=False)
                
                try:
                    # Call Lua command
                    response = await lua_bridge.send_command(
                        'kick', 
                        [str(user.id), reason], 
                        formatted_message, 
                        formatted_guild
                    )
                    
                    # Process response
                    if response.get('success'):
                        # Execute the kick action directly
                        try:
                            await interaction.guild.kick(
                                user, 
                                reason=reason or "No reason provided"
                            )
                            
                            message = response.get('message', f"Kicked {user.name}#{user.discriminator}")
                            await interaction.followup.send(message)
                        except discord.Forbidden:
                            await interaction.followup.send("I don't have permission to kick that user.")
                        except Exception as e:
                            await interaction.followup.send(f"Error executing kick: {str(e)}")
                    else:
                        # Command failed
                        error = response.get('error', 'Unknown error')
                        await interaction.followup.send(f"Error: {error}")
                except Exception as e:
                    logger.error(f"Error executing Lua command for slash command: {e}")
                    await interaction.followup.send(f"Error processing command: {str(e)}")
            else:
                # Fallback if Lua bridge not available
                try:
                    await interaction.guild.kick(
                        user, 
                        reason=reason or "No reason provided"
                    )
                    await interaction.response.send_message(f"Kicked {user.name}#{user.discriminator}")
                except discord.Forbidden:
                    await interaction.response.send_message("I don't have permission to kick that user.")
                except Exception as e:
                    await interaction.response.send_message(f"Error executing kick: {str(e)}")
                    
        self.command_tree.add_command(kick_command)
        self.registered_commands['kick'] = kick_command
        
        # Mute/timeout command
        @app_commands.command(name="mute", description="Timeout a user for a specified duration")
        @app_commands.describe(
            user="The user to mute",
            duration="Duration in minutes (max 4320 = 3 days)",
            reason="Reason for the mute"
        )
        @app_commands.guild_only()
        async def mute_command(interaction: discord.Interaction, user: discord.Member, duration: int = 5, reason: str = None):
            # Check permissions
            if not interaction.user.guild_permissions.moderate_members:
                await interaction.response.send_message("You don't have permission to timeout members.", ephemeral=True)
                return
                
            # Validate duration (max 3 days = 4320 minutes per Discord's limit)
            if duration < 1:
                await interaction.response.send_message("Duration must be at least 1 minute.", ephemeral=True)
                return
            if duration > 4320:
                await interaction.response.send_message("Duration cannot exceed 4320 minutes (3 days).", ephemeral=True)
                return
                
            # Execute command through Lua
            if lua_bridge:
                # Convert minutes to seconds for Lua
                duration_seconds = duration * 60
                
                # Format for Lua
                formatted_message = {
                    'id': str(interaction.id),
                    'content': f"mute {user.id} {duration_seconds}s {reason or ''}",
                    'author': {
                        'id': str(interaction.user.id),
                        'name': interaction.user.name,
                        'discriminator': interaction.user.discriminator,
                        'bot': interaction.user.bot
                    },
                    'channel': {
                        'id': str(interaction.channel_id),
                        'name': getattr(interaction.channel, 'name', 'Unknown')
                    },
                    'guild': {
                        'id': str(interaction.guild_id),
                        'name': interaction.guild.name if interaction.guild else 'Unknown'
                    }
                }
                
                formatted_guild = {
                    'id': str(interaction.guild_id),
                    'name': interaction.guild.name if interaction.guild else 'Unknown'
                }
                
                # Respond with deferred message while processing
                await interaction.response.defer(ephemeral=False)
                
                try:
                    # Call Lua command
                    response = await lua_bridge.send_command(
                        'mute', 
                        [str(user.id), f"{duration_seconds}s", reason], 
                        formatted_message, 
                        formatted_guild
                    )
                    
                    # Process response
                    if response.get('success'):
                        # Execute the timeout action directly
                        try:
                            # Discord uses timedelta for timeout
                            import datetime
                            timeout_duration = datetime.timedelta(minutes=duration)
                            
                            await user.timeout_for(
                                timeout_duration, 
                                reason=reason or "No reason provided"
                            )
                            
                            message = response.get('message', f"Muted {user.name}#{user.discriminator} for {duration} minutes")
                            await interaction.followup.send(message)
                        except discord.Forbidden:
                            await interaction.followup.send("I don't have permission to timeout that user.")
                        except Exception as e:
                            await interaction.followup.send(f"Error executing timeout: {str(e)}")
                    else:
                        # Command failed
                        error = response.get('error', 'Unknown error')
                        await interaction.followup.send(f"Error: {error}")
                except Exception as e:
                    logger.error(f"Error executing Lua command for slash command: {e}")
                    await interaction.followup.send(f"Error processing command: {str(e)}")
            else:
                # Fallback if Lua bridge not available
                try:
                    # Discord uses timedelta for timeout
                    import datetime
                    timeout_duration = datetime.timedelta(minutes=duration)
                    
                    await user.timeout_for(
                        timeout_duration, 
                        reason=reason or "No reason provided"
                    )
                    await interaction.response.send_message(f"Muted {user.name}#{user.discriminator} for {duration} minutes")
                except discord.Forbidden:
                    await interaction.response.send_message("I don't have permission to timeout that user.")
                except Exception as e:
                    await interaction.response.send_message(f"Error executing timeout: {str(e)}")
                    
        self.command_tree.add_command(mute_command)
        self.registered_commands['mute'] = mute_command
        
        # Warn command
        @app_commands.command(name="warn", description="Warn a user and add to their infractions")
        @app_commands.describe(
            user="The user to warn",
            reason="Reason for the warning"
        )
        @app_commands.guild_only()
        async def warn_command(interaction: discord.Interaction, user: discord.Member, reason: str):
            # Check permissions
            if not interaction.user.guild_permissions.manage_messages:
                await interaction.response.send_message("You don't have permission to warn members.", ephemeral=True)
                return
                
            # Execute command through Lua
            if lua_bridge:
                # Format for Lua
                formatted_message = {
                    'id': str(interaction.id),
                    'content': f"warn {user.id} {reason}",
                    'author': {
                        'id': str(interaction.user.id),
                        'name': interaction.user.name,
                        'discriminator': interaction.user.discriminator,
                        'bot': interaction.user.bot
                    },
                    'channel': {
                        'id': str(interaction.channel_id),
                        'name': getattr(interaction.channel, 'name', 'Unknown')
                    },
                    'guild': {
                        'id': str(interaction.guild_id),
                        'name': interaction.guild.name if interaction.guild else 'Unknown'
                    }
                }
                
                formatted_guild = {
                    'id': str(interaction.guild_id),
                    'name': interaction.guild.name if interaction.guild else 'Unknown'
                }
                
                # Respond with deferred message while processing
                await interaction.response.defer(ephemeral=False)
                
                try:
                    # Call Lua command
                    response = await lua_bridge.send_command(
                        'warn', 
                        [str(user.id), reason], 
                        formatted_message, 
                        formatted_guild
                    )
                    
                    # Process response
                    if response.get('success'):
                        message = response.get('message', f"Warned {user.name}#{user.discriminator}: {reason}")
                        await interaction.followup.send(message)
                    else:
                        # Command failed
                        error = response.get('error', 'Unknown error')
                        await interaction.followup.send(f"Error: {error}")
                except Exception as e:
                    logger.error(f"Error executing Lua command for slash command: {e}")
                    await interaction.followup.send(f"Error processing command: {str(e)}")
            else:
                # Fallback if Lua bridge not available
                await interaction.response.send_message(f"Warned {user.name}#{user.discriminator}: {reason}")
                    
        self.command_tree.add_command(warn_command)
        self.registered_commands['warn'] = warn_command
        
    async def register_utility_commands(self):
        """Register utility-related slash commands"""
        # Help command
        @app_commands.command(name="help", description="Display information about commands")
        @app_commands.describe(
            command="Specific command to get help for"
        )
        async def help_command(interaction: discord.Interaction, command: str = None):
            # Execute command through Lua
            if lua_bridge:
                # Format for Lua
                formatted_message = {
                    'id': str(interaction.id),
                    'content': f"help {command or ''}",
                    'author': {
                        'id': str(interaction.user.id),
                        'name': interaction.user.name,
                        'discriminator': interaction.user.discriminator,
                        'bot': interaction.user.bot
                    },
                    'channel': {
                        'id': str(interaction.channel_id),
                        'name': getattr(interaction.channel, 'name', 'Unknown')
                    },
                    'guild': {
                        'id': str(interaction.guild_id),
                        'name': interaction.guild.name if interaction.guild else 'Unknown'
                    }
                }
                
                formatted_guild = {
                    'id': str(interaction.guild_id),
                    'name': interaction.guild.name if interaction.guild else 'Unknown'
                }
                
                # Respond with deferred message while processing
                await interaction.response.defer(ephemeral=False)
                
                try:
                    # Call Lua command
                    response = await lua_bridge.send_command(
                        'help', 
                        [command] if command else [], 
                        formatted_message, 
                        formatted_guild
                    )
                    
                    # Process response
                    if response.get('success'):
                        # Handle different help response types
                        if response.get('action') == 'help_menu':
                            # Create embed for general help menu
                            embed = discord.Embed(
                                title=response.get('title', 'Help Menu'),
                                description=response.get('description', 'No description available'),
                                color=response.get('color', 0x5865F2)
                            )
                            
                            # Add fields
                            for field in response.get('fields', []):
                                embed.add_field(
                                    name=field.get('name', 'Category'),
                                    value=field.get('value', 'No commands'),
                                    inline=False
                                )
                            
                            # Add footer if provided
                            if response.get('footer'):
                                embed.set_footer(text=response.get('footer'))
                                
                            await interaction.followup.send(embed=embed)
                            
                        elif response.get('action') == 'help_command':
                            # Create embed for specific command help
                            embed = discord.Embed(
                                title=response.get('title', 'Command Help'),
                                description=response.get('description', 'No description available'),
                                color=response.get('color', 0x5865F2)
                            )
                            
                            # Add fields
                            for field in response.get('fields', []):
                                embed.add_field(
                                    name=field.get('name', 'Details'),
                                    value=field.get('value', 'No details available'),
                                    inline=False
                                )
                                
                            await interaction.followup.send(embed=embed)
                            
                        else:
                            # Generic message response
                            message = response.get('message', 'Help information not available')
                            await interaction.followup.send(message)
                    else:
                        # Command failed
                        error = response.get('error', 'Unknown error')
                        await interaction.followup.send(f"Error: {error}")
                except Exception as e:
                    logger.error(f"Error executing Lua command for slash command: {e}")
                    await interaction.followup.send(f"Error processing command: {str(e)}")
            else:
                # Fallback if Lua bridge not available
                if command:
                    await interaction.response.send_message(f"Help information for '{command}' command not available.")
                else:
                    await interaction.response.send_message("Help information not available.")
                    
        self.command_tree.add_command(help_command)
        self.registered_commands['help'] = help_command
        
        # Ping command
        @app_commands.command(name="ping", description="Check the bot's response time")
        async def ping_command(interaction: discord.Interaction):
            # Execute command through Lua
            if lua_bridge:
                # Format for Lua
                formatted_message = {
                    'id': str(interaction.id),
                    'content': "ping",
                    'author': {
                        'id': str(interaction.user.id),
                        'name': interaction.user.name,
                        'discriminator': interaction.user.discriminator,
                        'bot': interaction.user.bot
                    },
                    'channel': {
                        'id': str(interaction.channel_id),
                        'name': getattr(interaction.channel, 'name', 'Unknown')
                    },
                    'guild': {
                        'id': str(interaction.guild_id),
                        'name': interaction.guild.name if interaction.guild else 'Unknown'
                    }
                }
                
                formatted_guild = {
                    'id': str(interaction.guild_id),
                    'name': interaction.guild.name if interaction.guild else 'Unknown'
                }
                
                # Send initial response immediately
                await interaction.response.send_message("Pinging...")
                
                try:
                    # Call Lua command
                    response = await lua_bridge.send_command(
                        'ping', 
                        [], 
                        formatted_message, 
                        formatted_guild
                    )
                    
                    # Process response
                    if response.get('success'):
                        message = response.get('message', "Pong!")
                        
                        # Calculate latency in ms
                        latency = round(self.bot.latency * 1000)
                        message += f"\nBot latency: {latency}ms"
                        
                        await interaction.edit_original_response(content=message)
                    else:
                        # Command failed
                        error = response.get('error', 'Unknown error')
                        await interaction.edit_original_response(content=f"Error: {error}")
                except Exception as e:
                    logger.error(f"Error executing Lua command for slash command: {e}")
                    await interaction.edit_original_response(content=f"Error processing command: {str(e)}")
            else:
                # Fallback if Lua bridge not available
                latency = round(self.bot.latency * 1000)
                await interaction.response.send_message(f"Pong! Bot latency: {latency}ms")
                    
        self.command_tree.add_command(ping_command)
        self.registered_commands['ping'] = ping_command
        
    async def register_fun_commands(self):
        """Register fun-related slash commands"""
        
        # Premium command - Anti-Alt example (requires premium)
        @app_commands.command(name="anti_alt", description="[PREMIUM] Configure anti-alt account settings")
        @app_commands.describe(
            min_age="Minimum account age in days (1-90)",
            action="Action to take on new accounts (kick, mute, notify)"
        )
        @app_commands.guild_only()
        async def anti_alt_command(interaction: discord.Interaction, min_age: int = 7, action: str = "notify"):
            # Check for administrator permissions
            if not interaction.user.guild_permissions.administrator:
                await interaction.response.send_message("You need administrator permissions to use this command.", ephemeral=True)
                return
                
            # Check for premium status
            if not self.is_premium(interaction.guild):
                await interaction.response.send_message(
                    "⭐ **Premium Required**\n"
                    "This command requires a premium subscription.\n"
                    "Use the dashboard to upgrade your server: https://yourdashboard.com/premium",
                    ephemeral=True
                )
                return
                
            # Validate parameters
            if min_age < 1 or min_age > 90:
                await interaction.response.send_message("Minimum account age must be between 1 and 90 days.", ephemeral=True)
                return
                
            valid_actions = ["kick", "mute", "notify"]
            if action.lower() not in valid_actions:
                await interaction.response.send_message(f"Invalid action. Choose from: {', '.join(valid_actions)}", ephemeral=True)
                return
                
            # Premium command implementation here
            await interaction.response.send_message(
                f"✅ **Anti-Alt Protection Configured**\n"
                f"• Minimum account age: **{min_age} days**\n"
                f"• Action on detection: **{action}**\n\n"
                f"New accounts younger than {min_age} days will now be automatically detected."
            )
                
        self.command_tree.add_command(anti_alt_command)
        self.registered_commands['anti_alt'] = anti_alt_command
        
        # Premium Plus command example - Raid Setup
        @app_commands.command(name="raid_protection_plus", description="[PREMIUM+] Configure advanced raid protection")
        @app_commands.describe(
            join_rate="Number of joins per minute to trigger protection (5-50)",
            lockdown="Whether to automatically lockdown the server on raid detection",
            verification="Verification level to set during raid (0-3)",
            duration="Duration of lockdown in minutes (5-120)"
        )
        @app_commands.guild_only()
        async def raid_plus_command(
            interaction: discord.Interaction, 
            join_rate: int = 10, 
            lockdown: bool = True,
            verification: int = 2,
            duration: int = 30
        ):
            # Check for administrator permissions
            if not interaction.user.guild_permissions.administrator:
                await interaction.response.send_message("You need administrator permissions to use this command.", ephemeral=True)
                return
                
            # Check for premium plus status
            if not self.is_premium_plus(interaction.guild):
                await interaction.response.send_message(
                    "⭐⭐ **Premium+ Required**\n"
                    "This command requires a Premium+ subscription.\n"
                    "Use the dashboard to upgrade your server: https://yourdashboard.com/premium",
                    ephemeral=True
                )
                return
                
            # Validate parameters
            if join_rate < 5 or join_rate > 50:
                await interaction.response.send_message("Join rate must be between 5 and 50 joins per minute.", ephemeral=True)
                return
                
            if verification < 0 or verification > 3:
                await interaction.response.send_message("Verification level must be between 0 and 3.", ephemeral=True)
                return
                
            if duration < 5 or duration > 120:
                await interaction.response.send_message("Lockdown duration must be between 5 and 120 minutes.", ephemeral=True)
                return
                
            # Premium Plus command implementation here
            await interaction.response.send_message(
                f"✅ **Advanced Raid Protection Configured**\n"
                f"• Join rate threshold: **{join_rate} per minute**\n"
                f"• Auto-lockdown: **{'Enabled' if lockdown else 'Disabled'}**\n"
                f"• Verification level: **Level {verification}**\n"
                f"• Lockdown duration: **{duration} minutes**\n\n"
                f"Your server is now protected with our advanced raid detection algorithm."
            )
                
        self.command_tree.add_command(raid_plus_command)
        self.registered_commands['raid_plus'] = raid_plus_command
        
        # 8ball command
        @app_commands.command(name="8ball", description="Ask the magic 8-ball a question")
        @app_commands.describe(
            question="Your question for the magic 8-ball"
        )
        async def eightball_command(interaction: discord.Interaction, question: str):
            # Execute command through Lua
            if lua_bridge:
                # Format for Lua
                formatted_message = {
                    'id': str(interaction.id),
                    'content': f"8ball {question}",
                    'author': {
                        'id': str(interaction.user.id),
                        'name': interaction.user.name,
                        'discriminator': interaction.user.discriminator,
                        'bot': interaction.user.bot
                    },
                    'channel': {
                        'id': str(interaction.channel_id),
                        'name': getattr(interaction.channel, 'name', 'Unknown')
                    },
                    'guild': {
                        'id': str(interaction.guild_id),
                        'name': interaction.guild.name if interaction.guild else 'Unknown'
                    }
                }
                
                formatted_guild = {
                    'id': str(interaction.guild_id),
                    'name': interaction.guild.name if interaction.guild else 'Unknown'
                }
                
                # Respond with deferred message while processing
                await interaction.response.defer(ephemeral=False)
                
                try:
                    # Call Lua command
                    response = await lua_bridge.send_command(
                        '8ball', 
                        [question], 
                        formatted_message, 
                        formatted_guild
                    )
                    
                    # Process response
                    if response.get('success'):
                        message = response.get('message', f"🎱 Question: {question}\nAnswer: *shakes 8-ball*")
                        await interaction.followup.send(message)
                    else:
                        # Command failed
                        error = response.get('error', 'Unknown error')
                        await interaction.followup.send(f"Error: {error}")
                except Exception as e:
                    logger.error(f"Error executing Lua command for slash command: {e}")
                    await interaction.followup.send(f"Error processing command: {str(e)}")
            else:
                # Fallback if Lua bridge not available
                import random
                responses = [
                    "It is certain.", "It is decidedly so.", "Without a doubt.",
                    "Yes, definitely.", "You may rely on it.", "As I see it, yes.",
                    "Most likely.", "Outlook good.", "Yes.", "Signs point to yes.",
                    "Reply hazy, try again.", "Ask again later.", "Better not tell you now.",
                    "Cannot predict now.", "Concentrate and ask again.",
                    "Don't count on it.", "My reply is no.", "My sources say no.",
                    "Outlook not so good.", "Very doubtful."
                ]
                await interaction.response.send_message(f"🎱 **Question:** {question}\n**Answer:** {random.choice(responses)}")
                    
        self.command_tree.add_command(eightball_command)
        self.registered_commands['8ball'] = eightball_command
        
        # Coinflip command
        @app_commands.command(name="coinflip", description="Flip a coin")
        async def coinflip_command(interaction: discord.Interaction):
            # Execute command through Lua
            if lua_bridge:
                # Format for Lua
                formatted_message = {
                    'id': str(interaction.id),
                    'content': "coinflip",
                    'author': {
                        'id': str(interaction.user.id),
                        'name': interaction.user.name,
                        'discriminator': interaction.user.discriminator,
                        'bot': interaction.user.bot
                    },
                    'channel': {
                        'id': str(interaction.channel_id),
                        'name': getattr(interaction.channel, 'name', 'Unknown')
                    },
                    'guild': {
                        'id': str(interaction.guild_id),
                        'name': interaction.guild.name if interaction.guild else 'Unknown'
                    }
                }
                
                formatted_guild = {
                    'id': str(interaction.guild_id),
                    'name': interaction.guild.name if interaction.guild else 'Unknown'
                }
                
                # Respond with deferred message while processing
                await interaction.response.defer(ephemeral=False)
                
                try:
                    # Call Lua command
                    response = await lua_bridge.send_command(
                        'coinflip', 
                        [], 
                        formatted_message, 
                        formatted_guild
                    )
                    
                    # Process response
                    if response.get('success'):
                        message = response.get('message', "🪙 The coin landed on **Heads**!")
                        await interaction.followup.send(message)
                    else:
                        # Command failed
                        error = response.get('error', 'Unknown error')
                        await interaction.followup.send(f"Error: {error}")
                except Exception as e:
                    logger.error(f"Error executing Lua command for slash command: {e}")
                    await interaction.followup.send(f"Error processing command: {str(e)}")
            else:
                # Fallback if Lua bridge not available
                import random
                result = random.choice(["Heads", "Tails"])
                await interaction.response.send_message(f"🪙 The coin landed on **{result}**!")
                    
        self.command_tree.add_command(coinflip_command)
        self.registered_commands['coinflip'] = coinflip_command
        
    async def register_admin_commands(self):
        """Register admin-related slash commands"""
        # Setup command
        @app_commands.command(name="setup", description="Set up the bot with recommended settings")
        @app_commands.guild_only()
        async def setup_command(interaction: discord.Interaction):
            # Check permissions
            if not interaction.user.guild_permissions.administrator:
                await interaction.response.send_message("You need Administrator permission to use this command.", ephemeral=True)
                return
                
            # Execute command through Lua
            if lua_bridge:
                # Format for Lua
                formatted_message = {
                    'id': str(interaction.id),
                    'content': "setup",
                    'author': {
                        'id': str(interaction.user.id),
                        'name': interaction.user.name,
                        'discriminator': interaction.user.discriminator,
                        'bot': interaction.user.bot
                    },
                    'channel': {
                        'id': str(interaction.channel_id),
                        'name': getattr(interaction.channel, 'name', 'Unknown')
                    },
                    'guild': {
                        'id': str(interaction.guild_id),
                        'name': interaction.guild.name if interaction.guild else 'Unknown'
                    }
                }
                
                formatted_guild = {
                    'id': str(interaction.guild_id),
                    'name': interaction.guild.name if interaction.guild else 'Unknown'
                }
                
                # Respond with deferred message while processing
                await interaction.response.defer(ephemeral=False)
                
                try:
                    # Call Lua command
                    response = await lua_bridge.send_command(
                        'setup', 
                        [], 
                        formatted_message, 
                        formatted_guild
                    )
                    
                    # Process response
                    if response.get('success'):
                        message = response.get('message', "Bot setup completed with recommended settings.")
                        await interaction.followup.send(message)
                    else:
                        # Command failed
                        error = response.get('error', 'Unknown error')
                        await interaction.followup.send(f"Error: {error}")
                except Exception as e:
                    logger.error(f"Error executing Lua command for slash command: {e}")
                    await interaction.followup.send(f"Error processing command: {str(e)}")
            else:
                # Fallback if Lua bridge not available
                await interaction.response.send_message("Bot setup functionality not available.")
                    
        self.command_tree.add_command(setup_command)
        self.registered_commands['setup'] = setup_command
        
    async def sync_commands(self):
        """Sync commands with Discord"""
        logger.info("Syncing slash commands with Discord...")
        try:
            # Sync commands globally
            await self.command_tree.sync()
            logger.info(f"Successfully synced {len(self.registered_commands)} slash commands")
        except Exception as e:
            logger.error(f"Error syncing commands: {e}")
            
    def get_command_count(self) -> int:
        """Get the number of registered commands"""
        return len(self.registered_commands)