import discord
from discord.ext import commands
import asyncio
import datetime
import json
import os
import logging
from typing import Optional, Union, List, Dict, Any

logger = logging.getLogger('guard-shin.moderation')

class ModerationCommands(commands.Cog):
    """Moderation commands for Guard-shin"""

    def __init__(self, bot):
        self.bot = bot
        self.warnings = self._load_warnings()
        self.mutes = {}
        
    def _load_warnings(self) -> Dict[str, List[Dict[str, Any]]]:
        """Load user warnings from file"""
        try:
            if os.path.exists("warnings.json"):
                with open("warnings.json", "r") as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error loading warnings: {e}")
        
        # Default empty warnings
        return {}
        
    def _save_warnings(self):
        """Save warnings to file"""
        try:
            with open("warnings.json", "w") as f:
                json.dump(self.warnings, f)
        except Exception as e:
            logger.error(f"Error saving warnings: {e}")
            
    def _get_guild_warnings(self, guild_id: str) -> Dict[str, List[Dict[str, Any]]]:
        """Get warnings for a specific guild"""
        if guild_id not in self.warnings:
            self.warnings[guild_id] = {}
            
        return self.warnings[guild_id]
        
    @commands.command()
    @commands.has_permissions(ban_members=True)
    async def unban(self, ctx: commands.Context, user_id: int, *, reason: str = "No reason provided"):
        """Unban a user from the server"""
        try:
            # Look for the banned user in the list of bans
            ban_entries = [ban async for ban in ctx.guild.bans()]
            user = None
            
            for ban_entry in ban_entries:
                if ban_entry.user.id == user_id:
                    user = ban_entry.user
                    break
                    
            if user is None:
                return await ctx.send(f"No user with ID {user_id} found in the ban list.")
                
            # Unban the user
            await ctx.guild.unban(user, reason=f"{reason} - Unbanned by {ctx.author}")
            
            # Send confirmation message
            embed = discord.Embed(
                title="User Unbanned",
                description=f"**{user}** has been unbanned from the server.",
                color=0x8249F0
            )
            embed.add_field(name="Reason", value=reason)
            embed.set_footer(text=f"Unbanned by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to unban that user.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred: {e}")
            
    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def warn(self, ctx: commands.Context, member: discord.Member, *, reason: str):
        """Warn a user with a reason"""
        if member.id == ctx.author.id:
            return await ctx.send("You cannot warn yourself.")
            
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            return await ctx.send("You cannot warn someone with a higher or equal role.")
            
        guild_id = str(ctx.guild.id)
        user_id = str(member.id)
        timestamp = datetime.datetime.utcnow().isoformat()
        
        # Get guild warnings
        guild_warnings = self._get_guild_warnings(guild_id)
        
        # Initialize user warnings if they don't exist
        if user_id not in guild_warnings:
            guild_warnings[user_id] = []
            
        # Add the warning
        warning_id = len(guild_warnings[user_id]) + 1
        warning = {
            "id": warning_id,
            "reason": reason,
            "timestamp": timestamp,
            "moderator_id": ctx.author.id,
            "moderator_name": str(ctx.author)
        }
        
        guild_warnings[user_id].append(warning)
        self._save_warnings()
        
        # Send warning message to user
        try:
            embed = discord.Embed(
                title=f"Warning from {ctx.guild.name}",
                description=f"You have been warned for: {reason}",
                color=0xFFDD00
            )
            embed.set_footer(text=f"Warning #{warning_id}")
            await member.send(embed=embed)
        except discord.HTTPException:
            # Can't send DM to the user
            pass
            
        # Send confirmation message to channel
        embed = discord.Embed(
            title="User Warned",
            description=f"**{member}** has been warned.",
            color=0x8249F0
        )
        embed.add_field(name="Reason", value=reason)
        embed.add_field(name="Warning ID", value=f"#{warning_id}")
        embed.set_footer(text=f"Warned by {ctx.author}")
        
        await ctx.send(embed=embed)
        
    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def warnings(self, ctx: commands.Context, member: discord.Member = None):
        """View warnings for a user"""
        member = member or ctx.author
        guild_id = str(ctx.guild.id)
        user_id = str(member.id)
        
        # Get guild warnings
        guild_warnings = self._get_guild_warnings(guild_id)
        
        # Check if user has warnings
        if user_id not in guild_warnings or not guild_warnings[user_id]:
            return await ctx.send(f"{member} has no warnings.")
            
        # Create embed with warnings
        embed = discord.Embed(
            title=f"Warnings for {member}",
            description=f"This user has {len(guild_warnings[user_id])} warning(s).",
            color=0x8249F0
        )
        
        for warning in guild_warnings[user_id]:
            timestamp = datetime.datetime.fromisoformat(warning["timestamp"])
            embed.add_field(
                name=f"Warning #{warning['id']} | {timestamp.strftime('%Y-%m-%d %H:%M:%S')} UTC",
                value=f"**Reason:** {warning['reason']}\n**Moderator:** {warning['moderator_name']}",
                inline=False
            )
            
        await ctx.send(embed=embed)
        
    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def clearwarnings(self, ctx: commands.Context, member: discord.Member):
        """Clear warnings for a user"""
        guild_id = str(ctx.guild.id)
        user_id = str(member.id)
        
        # Get guild warnings
        guild_warnings = self._get_guild_warnings(guild_id)
        
        # Check if user has warnings
        if user_id not in guild_warnings or not guild_warnings[user_id]:
            return await ctx.send(f"{member} has no warnings.")
            
        # Get warning count for confirmation message
        warning_count = len(guild_warnings[user_id])
        
        # Clear the warnings
        guild_warnings[user_id] = []
        self._save_warnings()
        
        # Send confirmation message
        await ctx.send(f"Cleared {warning_count} warning(s) for {member}.")
        
    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def mute(self, ctx: commands.Context, member: discord.Member, time: str, *, reason: str = "No reason provided"):
        """Mute a user for a specified time"""
        if member.id == ctx.author.id:
            return await ctx.send("You cannot mute yourself.")
            
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            return await ctx.send("You cannot mute someone with a higher or equal role.")
            
        # Parse time format
        time_units = {"s": 1, "m": 60, "h": 3600, "d": 86400}
        duration = 0
        
        # Simple time format parsing
        if time[-1].lower() in time_units and time[:-1].isdigit():
            duration = int(time[:-1]) * time_units[time[-1].lower()]
        else:
            return await ctx.send("Invalid time format. Use `<number><s|m|h|d>` (e.g. 10m for 10 minutes)")
            
        # Check if guild has a mute role
        mute_role = discord.utils.get(ctx.guild.roles, name="Muted")
        
        # Create mute role if it doesn't exist
        if mute_role is None:
            try:
                mute_role = await ctx.guild.create_role(name="Muted", reason="Auto-created mute role")
                
                # Update permissions for all text channels
                for channel in ctx.guild.text_channels:
                    await channel.set_permissions(mute_role, send_messages=False, add_reactions=False)
                    
                # Update permissions for all voice channels
                for channel in ctx.guild.voice_channels:
                    await channel.set_permissions(mute_role, speak=False, connect=False)
                    
                await ctx.send("Created `Muted` role with appropriate permissions.")
                
            except discord.Forbidden:
                return await ctx.send("I don't have permission to create roles and set permissions.")
                
        try:
            # Add role to user
            await member.add_roles(mute_role, reason=f"{reason} - Muted by {ctx.author} for {time}")
            
            # Store mute info for unmute tracking
            self.mutes[member.id] = {
                "guild_id": ctx.guild.id,
                "role_id": mute_role.id,
                "end_time": datetime.datetime.utcnow() + datetime.timedelta(seconds=duration)
            }
            
            # Schedule unmute
            self.bot.loop.create_task(self._unmute_task(member.id, duration))
            
            # Send confirmation message
            embed = discord.Embed(
                title="User Muted",
                description=f"**{member}** has been muted for {time}.",
                color=0x8249F0
            )
            embed.add_field(name="Reason", value=reason)
            embed.add_field(name="Duration", value=time)
            embed.set_footer(text=f"Muted by {ctx.author}")
            
            # Send DM to muted user
            try:
                user_embed = discord.Embed(
                    title=f"You've been muted in {ctx.guild.name}",
                    description=f"Reason: {reason}\nDuration: {time}",
                    color=0xFF0000
                )
                await member.send(embed=user_embed)
            except discord.HTTPException:
                # Can't send DM to the user
                pass
                
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to mute that user.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred: {e}")
            
    async def _unmute_task(self, member_id: int, duration: int):
        """Task to automatically unmute a user after duration"""
        await asyncio.sleep(duration)
        
        # Check if mute is still active
        if member_id not in self.mutes:
            return
            
        mute_info = self.mutes.pop(member_id)
        guild = self.bot.get_guild(mute_info["guild_id"])
        
        if not guild:
            return
            
        member = guild.get_member(member_id)
        
        if not member:
            return
            
        role = guild.get_role(mute_info["role_id"])
        
        if not role:
            return
            
        try:
            await member.remove_roles(role, reason="Automatic unmute after duration")
            
            # Log to a mod channel if available
            log_channel = discord.utils.get(guild.text_channels, name="mod-logs")
            
            if log_channel:
                embed = discord.Embed(
                    title="User Unmuted",
                    description=f"**{member}** has been automatically unmuted after their mute duration expired.",
                    color=0x00FF00
                )
                await log_channel.send(embed=embed)
                
        except discord.Forbidden:
            # No permissions to unmute
            pass
        except discord.HTTPException:
            # Some other error occurred
            pass
            
    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def unmute(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        """Unmute a user"""
        # Check if user is muted
        mute_role = discord.utils.get(ctx.guild.roles, name="Muted")
        
        if not mute_role:
            return await ctx.send("There is no `Muted` role set up on this server.")
            
        if mute_role not in member.roles:
            return await ctx.send(f"{member} is not muted.")
            
        try:
            # Remove mute role
            await member.remove_roles(mute_role, reason=f"{reason} - Unmuted by {ctx.author}")
            
            # Remove from mutes dict if present
            if member.id in self.mutes:
                del self.mutes[member.id]
                
            # Send confirmation message
            embed = discord.Embed(
                title="User Unmuted",
                description=f"**{member}** has been unmuted.",
                color=0x8249F0
            )
            embed.add_field(name="Reason", value=reason)
            embed.set_footer(text=f"Unmuted by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to unmute that user.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred: {e}")
            
    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def slowmode(self, ctx: commands.Context, seconds: int):
        """Set slowmode for the current channel"""
        if seconds < 0:
            return await ctx.send("Slowmode seconds cannot be negative.")
            
        if seconds > 21600:
            return await ctx.send("Slowmode cannot be longer than 6 hours (21600 seconds).")
            
        try:
            await ctx.channel.edit(slowmode_delay=seconds)
            
            if seconds == 0:
                await ctx.send("Slowmode has been disabled for this channel.")
            else:
                await ctx.send(f"Slowmode has been set to {seconds} seconds for this channel.")
                
        except discord.Forbidden:
            await ctx.send("I don't have permission to edit this channel.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred: {e}")
            
    @commands.command()
    @commands.has_permissions(manage_channels=True)
    async def lockdown(self, ctx: commands.Context, channel: discord.TextChannel = None):
        """Lock a channel, preventing users from sending messages"""
        channel = channel or ctx.channel
        
        # Get default role (@everyone)
        default_role = ctx.guild.default_role
        
        # Store current permissions for restoration
        self.permission_cache = channel.overwrites_for(default_role)
        
        try:
            # Set permission overwrite to deny sending messages
            await channel.set_permissions(default_role, send_messages=False)
            
            embed = discord.Embed(
                title="🔒 Channel Locked",
                description=f"{channel.mention} has been locked.",
                color=0xFF0000
            )
            embed.set_footer(text=f"Locked by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to lock this channel.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred: {e}")
            
    @commands.command()
    @commands.has_permissions(manage_channels=True)
    async def unlock(self, ctx: commands.Context, channel: discord.TextChannel = None):
        """Unlock a previously locked channel"""
        channel = channel or ctx.channel
        
        # Get default role (@everyone)
        default_role = ctx.guild.default_role
        
        try:
            # Reset permission overwrite to allow sending messages
            perms = channel.overwrites_for(default_role)
            perms.send_messages = None
            await channel.set_permissions(default_role, overwrite=perms)
            
            embed = discord.Embed(
                title="🔓 Channel Unlocked",
                description=f"{channel.mention} has been unlocked.",
                color=0x00FF00
            )
            embed.set_footer(text=f"Unlocked by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to unlock this channel.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred: {e}")
            
    @commands.command()
    @commands.has_permissions(ban_members=True)
    async def softban(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        """Ban and immediately unban a user to delete their messages"""
        if member.id == ctx.author.id:
            return await ctx.send("You cannot softban yourself.")
            
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            return await ctx.send("You cannot softban someone with a higher or equal role.")
            
        try:
            # Send DM to the user being softbanned
            try:
                embed = discord.Embed(
                    title=f"You've been soft-banned from {ctx.guild.name}",
                    description=f"Reason: {reason}\n\nYou may rejoin the server, but your recent messages have been removed.",
                    color=0xFF0000
                )
                await member.send(embed=embed)
            except discord.HTTPException:
                # Can't send DM to the user
                pass
                
            # Softban the user (ban and then immediately unban)
            await ctx.guild.ban(member, reason=f"{reason} - Softbanned by {ctx.author}", delete_message_days=1)
            await ctx.guild.unban(member, reason=f"Softban - Automatically unbanned")
            
            # Send confirmation message
            embed = discord.Embed(
                title="User Softbanned",
                description=f"**{member}** has been softbanned from the server.",
                color=0x8249F0
            )
            embed.add_field(name="Reason", value=reason)
            embed.set_footer(text=f"Softbanned by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to ban/unban that user.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred: {e}")
            
    @commands.command()
    @commands.has_permissions(kick_members=True)
    async def voicekick(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        """Kick a user from a voice channel"""
        if not member.voice:
            return await ctx.send(f"{member} is not in a voice channel.")
            
        try:
            # Get the voice channel the member is in
            voice_channel = member.voice.channel
            
            # Disconnect the member from voice
            await member.move_to(None, reason=f"{reason} - Voice kicked by {ctx.author}")
            
            # Send confirmation message
            embed = discord.Embed(
                title="Voice Kick",
                description=f"**{member}** has been kicked from {voice_channel.name}.",
                color=0x8249F0
            )
            embed.add_field(name="Reason", value=reason)
            embed.set_footer(text=f"Voice kicked by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to disconnect that user from voice.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred: {e}")
            
    @commands.command()
    @commands.has_permissions(moderate_members=True)
    async def timeout(self, ctx: commands.Context, member: discord.Member, duration: str, *, reason: str = "No reason provided"):
        """Timeout a user for a specified duration"""
        if member.id == ctx.author.id:
            return await ctx.send("You cannot timeout yourself.")
            
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            return await ctx.send("You cannot timeout someone with a higher or equal role.")
            
        # Parse time format
        time_units = {"s": 1, "m": 60, "h": 3600, "d": 86400}
        seconds = 0
        
        # Simple time format parsing
        if duration[-1].lower() in time_units and duration[:-1].isdigit():
            seconds = int(duration[:-1]) * time_units[duration[-1].lower()]
        else:
            return await ctx.send("Invalid time format. Use `<number><s|m|h|d>` (e.g. 10m for 10 minutes)")
            
        # Convert to timedelta
        delta = datetime.timedelta(seconds=seconds)
        
        # Check if duration is within Discord's limits
        if seconds < 60:
            return await ctx.send("Timeout duration must be at least 1 minute.")
            
        if seconds > 60 * 60 * 24 * 28:  # 28 days
            return await ctx.send("Timeout duration cannot exceed 28 days.")
            
        try:
            # Apply timeout
            await member.timeout_for(delta, reason=f"{reason} - Timed out by {ctx.author}")
            
            # Calculate end time for the embed
            end_time = discord.utils.utcnow() + delta
            
            # Send confirmation message
            embed = discord.Embed(
                title="User Timed Out",
                description=f"**{member}** has been timed out.",
                color=0x8249F0
            )
            embed.add_field(name="Reason", value=reason)
            embed.add_field(name="Duration", value=duration)
            embed.add_field(name="Expires", value=f"<t:{int(end_time.timestamp())}:R>")
            embed.set_footer(text=f"Timed out by {ctx.author}")
            
            # Send DM to timed out user
            try:
                user_embed = discord.Embed(
                    title=f"You've been timed out in {ctx.guild.name}",
                    description=f"Reason: {reason}\nDuration: {duration}\nExpires: <t:{int(end_time.timestamp())}:R>",
                    color=0xFF0000
                )
                await member.send(embed=user_embed)
            except discord.HTTPException:
                # Can't send DM to the user
                pass
                
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to timeout that user.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred: {e}")
            
    @commands.command()
    @commands.has_permissions(moderate_members=True)
    async def untimeout(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        """Remove timeout from a user"""
        if not member.is_timed_out():
            return await ctx.send(f"{member} is not timed out.")
            
        try:
            # Remove timeout
            await member.timeout(None, reason=f"{reason} - Timeout removed by {ctx.author}")
            
            # Send confirmation message
            embed = discord.Embed(
                title="Timeout Removed",
                description=f"**{member}**'s timeout has been removed.",
                color=0x8249F0
            )
            embed.add_field(name="Reason", value=reason)
            embed.set_footer(text=f"Timeout removed by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to remove the timeout from that user.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred: {e}")))

# Proper setup function for Discord.py extension loading
def setup(bot):
    # For Discord.py 2.0, we need to manually register the cog
    # without using the async add_cog method
    bot._BotBase__cogs[ModerationCommands.__name__] = ModerationCommands(bot)
