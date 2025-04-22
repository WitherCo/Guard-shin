import discord
from discord.ext import commands
import logging
import asyncio
import datetime
import re
import json
import os

logger = logging.getLogger('guard-shin.moderation')

class Moderation(commands.Cog):
    """Moderation commands for managing members and content"""
    
    def __init__(self, bot):
        self.bot = bot
        self.automod_settings = {}
        self.load_automod()
        
    def load_automod(self):
        """Load automod settings from file"""
        try:
            if os.path.exists('automod.json'):
                with open('automod.json', 'r') as f:
                    self.automod_settings = json.load(f)
                logger.info(f"Loaded automod settings for {len(self.automod_settings)} guilds")
        except Exception as e:
            logger.error(f"Error loading automod settings: {e}")
            self.automod_settings = {}
            
    def save_automod(self):
        """Save automod settings to file"""
        try:
            with open('automod.json', 'w') as f:
                json.dump(self.automod_settings, f)
            logger.info(f"Saved automod settings for {len(self.automod_settings)} guilds")
        except Exception as e:
            logger.error(f"Error saving automod settings: {e}")
            
    @commands.Cog.listener()
    async def on_message(self, message):
        """Check messages for automod violations"""
        # Skip bot messages and DMs
        if message.author.bot or message.guild is None:
            return
            
        # Skip if the user has manage messages permission
        if message.author.guild_permissions.manage_messages:
            return
            
        guild_id = str(message.guild.id)
        
        # Check if automod is enabled for this guild
        if guild_id not in self.automod_settings:
            return
            
        settings = self.automod_settings[guild_id]
        
        # Skip if automod is disabled
        if not settings.get('enabled', False):
            return
            
        content = message.content.lower()
        
        # Check for banned words
        if settings.get('banned_words_enabled', False):
            banned_words = settings.get('banned_words', [])
            for word in banned_words:
                if re.search(r'\b' + re.escape(word.lower()) + r'\b', content):
                    try:
                        await message.delete()
                        await message.channel.send(f"{message.author.mention}, your message was removed because it contained a banned word.")
                        
                        # Log to automod channel if configured
                        await self.log_automod_action(message.guild, message.author, "Message deleted", f"Message contained banned word: {word}")
                        
                        return
                    except discord.Forbidden:
                        logger.warning(f"Missing permission to delete message in {message.guild.id}")
                    except Exception as e:
                        logger.error(f"Error deleting message in {message.guild.id}: {e}")
        
        # Check for invite links
        if settings.get('invite_filter_enabled', False):
            invite_pattern = r'(discord\.gg|discord\.com\/invite)\/\w+'
            if re.search(invite_pattern, content):
                try:
                    await message.delete()
                    await message.channel.send(f"{message.author.mention}, your message was removed because it contained an invite link.")
                    
                    # Log to automod channel
                    await self.log_automod_action(message.guild, message.author, "Message deleted", "Message contained an invite link")
                    
                    return
                except discord.Forbidden:
                    logger.warning(f"Missing permission to delete message in {message.guild.id}")
                except Exception as e:
                    logger.error(f"Error deleting message in {message.guild.id}: {e}")
        
        # Add more automod checks as needed
    
    async def log_automod_action(self, guild, user, action, reason):
        """Log automod actions to a configured channel"""
        guild_id = str(guild.id)
        
        if guild_id not in self.automod_settings:
            return
            
        settings = self.automod_settings[guild_id]
        
        # Check if logging is enabled
        if not settings.get('logging_enabled', False):
            return
            
        # Get the log channel
        log_channel_id = settings.get('log_channel_id')
        if not log_channel_id:
            return
            
        try:
            channel = guild.get_channel(int(log_channel_id))
            if channel is None:
                return
                
            embed = discord.Embed(
                title=f"Automod: {action}",
                description=reason,
                color=discord.Color.orange(),
                timestamp=datetime.datetime.utcnow()
            )
            embed.set_author(name=f"{user} ({user.id})", icon_url=user.avatar.url if user.avatar else None)
            
            await channel.send(embed=embed)
        except Exception as e:
            logger.error(f"Error logging automod action in {guild.id}: {e}")
            
    @commands.group(name="automod", invoke_without_command=True)
    @commands.has_permissions(manage_guild=True)
    async def automod(self, ctx):
        """Manage automod settings"""
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.automod_settings:
            self.automod_settings[guild_id] = {
                'enabled': False,
                'banned_words_enabled': False,
                'banned_words': [],
                'invite_filter_enabled': False,
                'logging_enabled': False,
                'log_channel_id': None
            }
            
        settings = self.automod_settings[guild_id]
        
        embed = discord.Embed(
            title="Automod Settings",
            description=f"Status: {'✅ Enabled' if settings.get('enabled', False) else '❌ Disabled'}",
            color=discord.Color.blue()
        )
        
        # Banned words settings
        banned_words_status = "✅ Enabled" if settings.get('banned_words_enabled', False) else "❌ Disabled"
        banned_words_count = len(settings.get('banned_words', []))
        embed.add_field(name="Banned Words", value=f"{banned_words_status}\n{banned_words_count} words configured", inline=False)
        
        # Invite filter settings
        invite_filter_status = "✅ Enabled" if settings.get('invite_filter_enabled', False) else "❌ Disabled"
        embed.add_field(name="Invite Filter", value=invite_filter_status, inline=False)
        
        # Logging settings
        logging_status = "✅ Enabled" if settings.get('logging_enabled', False) else "❌ Disabled"
        log_channel_id = settings.get('log_channel_id')
        log_channel = ctx.guild.get_channel(int(log_channel_id)) if log_channel_id else None
        log_channel_text = f"Channel: {log_channel.mention}" if log_channel else "No channel configured"
        embed.add_field(name="Logging", value=f"{logging_status}\n{log_channel_text}", inline=False)
        
        embed.set_footer(text="Use 'g!automod help' to see available commands")
        
        await ctx.send(embed=embed)
        
    @automod.command(name="enable")
    @commands.has_permissions(manage_guild=True)
    async def automod_enable(self, ctx):
        """Enable automod"""
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.automod_settings:
            self.automod_settings[guild_id] = {
                'enabled': False,
                'banned_words_enabled': False,
                'banned_words': [],
                'invite_filter_enabled': False,
                'logging_enabled': False,
                'log_channel_id': None
            }
            
        self.automod_settings[guild_id]['enabled'] = True
        self.save_automod()
        
        await ctx.send("✅ Automod has been enabled.")
        
    @automod.command(name="disable")
    @commands.has_permissions(manage_guild=True)
    async def automod_disable(self, ctx):
        """Disable automod"""
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.automod_settings:
            self.automod_settings[guild_id] = {
                'enabled': False,
                'banned_words_enabled': False,
                'banned_words': [],
                'invite_filter_enabled': False,
                'logging_enabled': False,
                'log_channel_id': None
            }
            
        self.automod_settings[guild_id]['enabled'] = False
        self.save_automod()
        
        await ctx.send("❌ Automod has been disabled.")
        
    @automod.group(name="words", invoke_without_command=True)
    @commands.has_permissions(manage_guild=True)
    async def automod_words(self, ctx):
        """Manage banned words"""
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.automod_settings:
            self.automod_settings[guild_id] = {
                'enabled': False,
                'banned_words_enabled': False,
                'banned_words': [],
                'invite_filter_enabled': False,
                'logging_enabled': False,
                'log_channel_id': None
            }
            
        settings = self.automod_settings[guild_id]
        banned_words = settings.get('banned_words', [])
        status = "✅ Enabled" if settings.get('banned_words_enabled', False) else "❌ Disabled"
        
        if not banned_words:
            await ctx.send(f"Banned words filter: {status}\nNo banned words configured.")
            return
            
        # Send banned words list in DM to avoid showing them in the server
        try:
            words_text = "\n".join(banned_words)
            embed = discord.Embed(
                title="Banned Words List",
                description=f"Status: {status}\n```\n{words_text}\n```",
                color=discord.Color.blue()
            )
            
            await ctx.author.send(embed=embed)
            await ctx.send(f"Banned words filter: {status}\nList of {len(banned_words)} banned words has been sent to your DMs.")
        except discord.Forbidden:
            await ctx.send("I couldn't send you a DM. Please enable DMs from server members.")
            
    @automod_words.command(name="add")
    @commands.has_permissions(manage_guild=True)
    async def automod_words_add(self, ctx, *, word):
        """Add a word to the banned words list"""
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.automod_settings:
            self.automod_settings[guild_id] = {
                'enabled': False,
                'banned_words_enabled': False,
                'banned_words': [],
                'invite_filter_enabled': False,
                'logging_enabled': False,
                'log_channel_id': None
            }
            
        settings = self.automod_settings[guild_id]
        
        if word.lower() in settings.get('banned_words', []):
            await ctx.send("That word is already in the banned words list.")
            return
            
        if 'banned_words' not in settings:
            settings['banned_words'] = []
            
        settings['banned_words'].append(word.lower())
        self.save_automod()
        
        await ctx.send(f"Added `{word}` to the banned words list.")
        
    @automod_words.command(name="remove")
    @commands.has_permissions(manage_guild=True)
    async def automod_words_remove(self, ctx, *, word):
        """Remove a word from the banned words list"""
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.automod_settings:
            return await ctx.send("Automod is not configured for this server.")
            
        settings = self.automod_settings[guild_id]
        
        if word.lower() not in settings.get('banned_words', []):
            await ctx.send("That word is not in the banned words list.")
            return
            
        settings['banned_words'].remove(word.lower())
        self.save_automod()
        
        await ctx.send(f"Removed `{word}` from the banned words list.")
        
    @automod_words.command(name="enable")
    @commands.has_permissions(manage_guild=True)
    async def automod_words_enable(self, ctx):
        """Enable the banned words filter"""
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.automod_settings:
            self.automod_settings[guild_id] = {
                'enabled': False,
                'banned_words_enabled': False,
                'banned_words': [],
                'invite_filter_enabled': False,
                'logging_enabled': False,
                'log_channel_id': None
            }
            
        self.automod_settings[guild_id]['banned_words_enabled'] = True
        self.save_automod()
        
        await ctx.send("✅ Banned words filter has been enabled.")
        
    @automod_words.command(name="disable")
    @commands.has_permissions(manage_guild=True)
    async def automod_words_disable(self, ctx):
        """Disable the banned words filter"""
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.automod_settings:
            self.automod_settings[guild_id] = {
                'enabled': False,
                'banned_words_enabled': False,
                'banned_words': [],
                'invite_filter_enabled': False,
                'logging_enabled': False,
                'log_channel_id': None
            }
            
        self.automod_settings[guild_id]['banned_words_enabled'] = False
        self.save_automod()
        
        await ctx.send("❌ Banned words filter has been disabled.")
        
    @automod.group(name="invites", invoke_without_command=True)
    @commands.has_permissions(manage_guild=True)
    async def automod_invites(self, ctx):
        """Manage invite link filter"""
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.automod_settings:
            self.automod_settings[guild_id] = {
                'enabled': False,
                'banned_words_enabled': False,
                'banned_words': [],
                'invite_filter_enabled': False,
                'logging_enabled': False,
                'log_channel_id': None
            }
            
        settings = self.automod_settings[guild_id]
        status = "✅ Enabled" if settings.get('invite_filter_enabled', False) else "❌ Disabled"
        
        await ctx.send(f"Invite link filter: {status}")
        
    @automod_invites.command(name="enable")
    @commands.has_permissions(manage_guild=True)
    async def automod_invites_enable(self, ctx):
        """Enable the invite link filter"""
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.automod_settings:
            self.automod_settings[guild_id] = {
                'enabled': False,
                'banned_words_enabled': False,
                'banned_words': [],
                'invite_filter_enabled': False,
                'logging_enabled': False,
                'log_channel_id': None
            }
            
        self.automod_settings[guild_id]['invite_filter_enabled'] = True
        self.save_automod()
        
        await ctx.send("✅ Invite link filter has been enabled.")
        
    @automod_invites.command(name="disable")
    @commands.has_permissions(manage_guild=True)
    async def automod_invites_disable(self, ctx):
        """Disable the invite link filter"""
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.automod_settings:
            self.automod_settings[guild_id] = {
                'enabled': False,
                'banned_words_enabled': False,
                'banned_words': [],
                'invite_filter_enabled': False,
                'logging_enabled': False,
                'log_channel_id': None
            }
            
        self.automod_settings[guild_id]['invite_filter_enabled'] = False
        self.save_automod()
        
        await ctx.send("❌ Invite link filter has been disabled.")
        
    @automod.group(name="logging", invoke_without_command=True)
    @commands.has_permissions(manage_guild=True)
    async def automod_logging(self, ctx):
        """Manage automod logging"""
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.automod_settings:
            self.automod_settings[guild_id] = {
                'enabled': False,
                'banned_words_enabled': False,
                'banned_words': [],
                'invite_filter_enabled': False,
                'logging_enabled': False,
                'log_channel_id': None
            }
            
        settings = self.automod_settings[guild_id]
        status = "✅ Enabled" if settings.get('logging_enabled', False) else "❌ Disabled"
        
        log_channel_id = settings.get('log_channel_id')
        log_channel = ctx.guild.get_channel(int(log_channel_id)) if log_channel_id else None
        
        if log_channel:
            await ctx.send(f"Automod logging: {status}\nLog channel: {log_channel.mention}")
        else:
            await ctx.send(f"Automod logging: {status}\nNo log channel configured.")
            
    @automod_logging.command(name="enable")
    @commands.has_permissions(manage_guild=True)
    async def automod_logging_enable(self, ctx):
        """Enable automod logging"""
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.automod_settings:
            self.automod_settings[guild_id] = {
                'enabled': False,
                'banned_words_enabled': False,
                'banned_words': [],
                'invite_filter_enabled': False,
                'logging_enabled': False,
                'log_channel_id': None
            }
            
        settings = self.automod_settings[guild_id]
        
        if not settings.get('log_channel_id'):
            return await ctx.send("Please set a log channel first with `g!automod logging channel #channel`.")
            
        self.automod_settings[guild_id]['logging_enabled'] = True
        self.save_automod()
        
        await ctx.send("✅ Automod logging has been enabled.")
        
    @automod_logging.command(name="disable")
    @commands.has_permissions(manage_guild=True)
    async def automod_logging_disable(self, ctx):
        """Disable automod logging"""
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.automod_settings:
            self.automod_settings[guild_id] = {
                'enabled': False,
                'banned_words_enabled': False,
                'banned_words': [],
                'invite_filter_enabled': False,
                'logging_enabled': False,
                'log_channel_id': None
            }
            
        self.automod_settings[guild_id]['logging_enabled'] = False
        self.save_automod()
        
        await ctx.send("❌ Automod logging has been disabled.")
        
    @automod_logging.command(name="channel")
    @commands.has_permissions(manage_guild=True)
    async def automod_logging_channel(self, ctx, channel: discord.TextChannel):
        """Set the automod log channel"""
        if not channel.permissions_for(ctx.guild.me).send_messages:
            return await ctx.send(f"I don't have permission to send messages in {channel.mention}.")
            
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.automod_settings:
            self.automod_settings[guild_id] = {
                'enabled': False,
                'banned_words_enabled': False,
                'banned_words': [],
                'invite_filter_enabled': False,
                'logging_enabled': False,
                'log_channel_id': None
            }
            
        self.automod_settings[guild_id]['log_channel_id'] = str(channel.id)
        self.save_automod()
        
        await ctx.send(f"Set {channel.mention} as the automod log channel.")
        
    @commands.command(name="slowmode")
    @commands.has_permissions(manage_channels=True)
    @commands.bot_has_permissions(manage_channels=True)
    async def slowmode(self, ctx, seconds: int = None):
        """Set the slowmode delay for the current channel"""
        if seconds is None:
            current_delay = ctx.channel.slowmode_delay
            return await ctx.send(f"Current slowmode delay is {current_delay} seconds.")
            
        if seconds < 0:
            return await ctx.send("Slowmode delay cannot be negative.")
            
        if seconds > 21600:  # Discord's maximum is 6 hours
            return await ctx.send("Slowmode delay cannot be more than 6 hours (21600 seconds).")
            
        try:
            await ctx.channel.edit(slowmode_delay=seconds)
            
            if seconds == 0:
                await ctx.send("Slowmode has been disabled.")
            else:
                await ctx.send(f"Slowmode set to {seconds} seconds.")
                
        except discord.Forbidden:
            await ctx.send("I don't have permission to edit this channel.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred: {e}")
            
    @commands.command(name="clean")
    @commands.has_permissions(manage_messages=True)
    @commands.bot_has_permissions(manage_messages=True)
    async def clean(self, ctx, user: discord.Member, amount: int = 100):
        """Delete messages from a specific user"""
        if amount <= 0:
            return await ctx.send("Please provide a positive number of messages to check.")
            
        if amount > 100:
            return await ctx.send("You can only check up to 100 messages at once.")
            
        # Delete the command message first
        await ctx.message.delete()
        
        # Get messages from the channel
        messages = []
        async for message in ctx.channel.history(limit=amount):
            if message.author == user:
                messages.append(message)
                
        if not messages:
            temp_msg = await ctx.send(f"No messages from {user.mention} found in the last {amount} messages.")
            await asyncio.sleep(5)
            await temp_msg.delete()
            return
            
        # Delete the messages
        try:
            await ctx.channel.delete_messages(messages)
            msg = await ctx.send(f"Deleted {len(messages)} messages from {user.mention}.")
            await asyncio.sleep(5)
            await msg.delete()
        except discord.Forbidden:
            await ctx.send("I don't have permission to delete messages.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred: {e}")
            
    @commands.command(name="warn")
    @commands.has_permissions(kick_members=True)
    async def warn(self, ctx, member: discord.Member, *, reason=None):
        """Warn a member for breaking the rules"""
        if member.bot:
            return await ctx.send("You cannot warn a bot.")
            
        if member == ctx.author:
            return await ctx.send("You cannot warn yourself.")
            
        if member.top_role >= ctx.author.top_role and ctx.author != ctx.guild.owner:
            return await ctx.send("You cannot warn someone with a higher or equal role.")
            
        # Default reason if none provided
        reason = reason or f"No reason provided"
        
        # Create warning embed
        embed = discord.Embed(
            title="Member Warned",
            description=f"{member.mention} has been warned.",
            color=discord.Color.yellow()
        )
        embed.add_field(name="Reason", value=reason)
        embed.set_footer(text=f"Warned by {ctx.author}")
        
        # Try to DM the user
        try:
            dm_embed = discord.Embed(
                title="You have been warned",
                description=f"You have been warned in {ctx.guild.name}.",
                color=discord.Color.yellow()
            )
            dm_embed.add_field(name="Reason", value=reason)
            dm_embed.set_footer(text=f"Warned by {ctx.author}")
            
            await member.send(embed=dm_embed)
        except:
            embed.add_field(name="Note", value="Could not send DM to the user.", inline=False)
            
        await ctx.send(embed=embed)
        
        # Log to automod channel if configured
        guild_id = str(ctx.guild.id)
        if guild_id in self.automod_settings:
            settings = self.automod_settings[guild_id]
            if settings.get('logging_enabled', False) and settings.get('log_channel_id'):
                try:
                    log_channel = ctx.guild.get_channel(int(settings['log_channel_id']))
                    if log_channel:
                        log_embed = discord.Embed(
                            title="Member Warned",
                            description=f"{member.mention} has been warned.",
                            color=discord.Color.yellow(),
                            timestamp=datetime.datetime.utcnow()
                        )
                        log_embed.add_field(name="Reason", value=reason)
                        log_embed.add_field(name="Warned by", value=ctx.author.mention)
                        log_embed.set_footer(text=f"User ID: {member.id}")
                        
                        await log_channel.send(embed=log_embed)
                except:
                    pass

async def setup(bot):
    await bot.add_cog(Moderation(bot))