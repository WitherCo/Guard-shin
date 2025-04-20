import discord
from discord.ext import commands
from discord import app_commands
import asyncio
import datetime
import logging
import re
import json
import os
from typing import Optional, Union, List

logger = logging.getLogger('guard-shin')

class DurationConverter(commands.Converter):
    """Convert duration strings like 1d2h3m into timedeltas"""
    async def convert(self, ctx, argument):
        # Regular expression to match time patterns like 1d2h3m4s
        pattern = re.compile(r'(?:(\d+)d)?(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?')
        match = pattern.fullmatch(argument)
        
        if not match or not any(match.groups()):
            raise commands.BadArgument("Invalid duration format. Use a combination of days (d), hours (h), minutes (m), and seconds (s). Example: 1d12h30m")
        
        days, hours, minutes, seconds = match.groups()
        
        # Convert to integers, treating None as 0
        days = int(days) if days else 0
        hours = int(hours) if hours else 0
        minutes = int(minutes) if minutes else 0
        seconds = int(seconds) if seconds else 0
        
        if days == 0 and hours == 0 and minutes == 0 and seconds == 0:
            raise commands.BadArgument("Duration must be greater than 0")
        
        return datetime.timedelta(
            days=days,
            hours=hours,
            minutes=minutes,
            seconds=seconds
        )

class Moderation(commands.Cog):
    """Moderation commands for server management"""

    def __init__(self, bot):
        self.bot = bot
        self.infractions = {}  # guild_id -> user_id -> [infractions]
        self.load_infractions()
    
    def load_infractions(self):
        """Load infractions from storage"""
        # In a real implementation, this would load from a database
        # For now, we'll initialize empty data for each guild
        for guild in self.bot.guilds:
            if guild.id not in self.infractions:
                self.infractions[guild.id] = {}
    
    def get_next_infraction_id(self, guild_id):
        """Get the next infraction ID for a guild"""
        # Find the highest existing ID and add 1
        highest_id = 0
        for user_id, infractions in self.infractions.get(guild_id, {}).items():
            for infraction in infractions:
                if infraction.get('id', 0) > highest_id:
                    highest_id = infraction['id']
        return highest_id + 1
    
    async def add_infraction(self, guild_id, user_id, mod_id, infraction_type, reason=None, duration=None, active=True):
        """Add an infraction to a user's record"""
        # Initialize guild and user if they don't exist
        if guild_id not in self.infractions:
            self.infractions[guild_id] = {}
        
        if user_id not in self.infractions[guild_id]:
            self.infractions[guild_id][user_id] = []
        
        # Create the infraction
        infraction = {
            'id': self.get_next_infraction_id(guild_id),
            'user_id': str(user_id),
            'mod_id': str(mod_id),
            'type': infraction_type,
            'reason': reason or "No reason provided",
            'timestamp': datetime.datetime.now().isoformat(),
            'active': active
        }
        
        # Add expiry time if duration provided
        if duration:
            expiry = datetime.datetime.now() + duration
            infraction['expires_at'] = expiry.isoformat()
        
        # Add to infractions
        self.infractions[guild_id][user_id].append(infraction)
        
        # Save changes
        self.save_infractions()
        
        return infraction
    
    def save_infractions(self):
        """Save infractions to storage"""
        # In a real implementation, this would save to a database
        # For now, we'll just log that infractions were saved
        logger.info("Infractions saved")
    
    async def log_moderation_action(self, guild, user, mod, action, reason=None, duration=None):
        """Log a moderation action to a specified log channel"""
        # Find a log channel
        log_channel = None
        for channel in guild.text_channels:
            if 'log' in channel.name.lower() or 'mod' in channel.name.lower():
                log_channel = channel
                break
        
        if not log_channel:
            return  # No log channel found
        
        # Create embed for the log
        embed = discord.Embed(
            title=f"{action.title()} | {user}",
            color=discord.Color.red(),
            timestamp=discord.utils.utcnow()
        )
        
        embed.add_field(name="User", value=f"{user.mention} ({user.id})")
        embed.add_field(name="Moderator", value=f"{mod.mention} ({mod.id})")
        
        if reason:
            embed.add_field(name="Reason", value=reason, inline=False)
        
        if duration:
            embed.add_field(name="Duration", value=str(duration), inline=False)
            embed.add_field(name="Expires", value=f"<t:{int((discord.utils.utcnow() + duration).timestamp())}:R>", inline=False)
        
        # Add user avatar
        embed.set_thumbnail(url=user.display_avatar.url)
        
        try:
            await log_channel.send(embed=embed)
        except discord.Forbidden:
            logger.warning(f"Missing permissions to send logs to {log_channel.name} in {guild.name}")
    
    @commands.command()
    @commands.has_permissions(kick_members=True)
    async def warn(self, ctx, member: discord.Member, *, reason=None):
        """Warn a member
        
        Example:
        !warn @user Spamming in general chat
        """
        if member.id == ctx.author.id:
            return await ctx.send("You cannot warn yourself.")
        
        if member.id == self.bot.user.id:
            return await ctx.send("I cannot warn myself.")
        
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            return await ctx.send("You cannot warn someone with a higher or equal role than yourself.")
        
        # Add infraction to the user's record
        infraction = await self.add_infraction(
            ctx.guild.id, 
            member.id, 
            ctx.author.id, 
            'warn', 
            reason
        )
        
        # Send confirmation
        await ctx.send(f"⚠️ **{member}** has been warned. | Infraction ID: {infraction['id']}")
        
        # DM the user
        try:
            embed = discord.Embed(
                title="Warning",
                description=f"You have been warned in **{ctx.guild.name}**",
                color=discord.Color.gold()
            )
            embed.add_field(name="Reason", value=reason or "No reason provided")
            embed.add_field(name="Moderator", value=ctx.author.name)
            embed.set_footer(text=f"Infraction ID: {infraction['id']}")
            
            await member.send(embed=embed)
        except discord.Forbidden:
            await ctx.send("Note: Unable to DM user")
        
        # Log the action
        await self.log_moderation_action(ctx.guild, member, ctx.author, "warn", reason)
    
    @commands.command()
    @commands.has_permissions(kick_members=True)
    async def kick(self, ctx, member: discord.Member, *, reason=None):
        """Kick a member from the server
        
        Example:
        !kick @user Breaking server rules
        """
        if member.id == ctx.author.id:
            return await ctx.send("You cannot kick yourself.")
        
        if member.id == self.bot.user.id:
            return await ctx.send("I cannot kick myself.")
        
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            return await ctx.send("You cannot kick someone with a higher or equal role than yourself.")
        
        if not member.guild.me.guild_permissions.kick_members:
            return await ctx.send("I don't have permission to kick members.")
        
        if member.top_role >= member.guild.me.top_role:
            return await ctx.send("I cannot kick a member with a higher or equal role than myself.")
        
        # Add infraction to the user's record
        infraction = await self.add_infraction(
            ctx.guild.id, 
            member.id, 
            ctx.author.id, 
            'kick', 
            reason
        )
        
        # DM the user before kicking
        try:
            embed = discord.Embed(
                title="Kick",
                description=f"You have been kicked from **{ctx.guild.name}**",
                color=discord.Color.orange()
            )
            embed.add_field(name="Reason", value=reason or "No reason provided")
            embed.add_field(name="Moderator", value=ctx.author.name)
            
            await member.send(embed=embed)
        except discord.Forbidden:
            pass  # Unable to DM user
        
        # Kick the member
        try:
            await member.kick(reason=f"{ctx.author}: {reason}" if reason else f"Kicked by {ctx.author}")
            await ctx.send(f"👢 **{member}** has been kicked. | Infraction ID: {infraction['id']}")
        except discord.Forbidden:
            await ctx.send("I don't have permission to kick that member.")
            return
        except discord.HTTPException as e:
            await ctx.send(f"Failed to kick member: {e}")
            return
        
        # Log the action
        await self.log_moderation_action(ctx.guild, member, ctx.author, "kick", reason)
    
    @commands.command()
    @commands.has_permissions(ban_members=True)
    async def ban(self, ctx, member: Union[discord.Member, discord.User, str], *, reason=None):
        """Ban a member from the server
        
        Example:
        !ban @user Repeated rule violations
        !ban 123456789012345678 Raiding
        """
        # Handle different input types for member
        user = None
        if isinstance(member, discord.Member) or isinstance(member, discord.User):
            user = member
        else:
            # Try to convert to a user ID
            try:
                user_id = int(member)
                user = await self.bot.fetch_user(user_id)
            except (ValueError, discord.NotFound, discord.HTTPException):
                await ctx.send("Invalid user or user ID.")
                return
        
        if user is None:
            await ctx.send("Failed to find user.")
            return
        
        # Check if the target is valid
        if user.id == ctx.author.id:
            return await ctx.send("You cannot ban yourself.")
        
        if user.id == self.bot.user.id:
            return await ctx.send("I cannot ban myself.")
        
        # Special checks for server members
        if isinstance(user, discord.Member):
            if user.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
                return await ctx.send("You cannot ban someone with a higher or equal role than yourself.")
            
            if not user.guild.me.guild_permissions.ban_members:
                return await ctx.send("I don't have permission to ban members.")
            
            if user.top_role >= user.guild.me.top_role:
                return await ctx.send("I cannot ban a member with a higher or equal role than myself.")
            
            # DM the user before banning if they're in the server
            try:
                embed = discord.Embed(
                    title="Ban",
                    description=f"You have been banned from **{ctx.guild.name}**",
                    color=discord.Color.red()
                )
                embed.add_field(name="Reason", value=reason or "No reason provided")
                embed.add_field(name="Moderator", value=ctx.author.name)
                
                await user.send(embed=embed)
            except discord.Forbidden:
                pass  # Unable to DM user
        
        # Add infraction to the user's record
        infraction = await self.add_infraction(
            ctx.guild.id, 
            user.id, 
            ctx.author.id, 
            'ban', 
            reason
        )
        
        # Ban the user
        try:
            await ctx.guild.ban(user, reason=f"{ctx.author}: {reason}" if reason else f"Banned by {ctx.author}")
            await ctx.send(f"🔨 **{user}** has been banned. | Infraction ID: {infraction['id']}")
        except discord.Forbidden:
            await ctx.send("I don't have permission to ban that user.")
            return
        except discord.HTTPException as e:
            await ctx.send(f"Failed to ban user: {e}")
            return
        
        # Log the action
        await self.log_moderation_action(ctx.guild, user, ctx.author, "ban", reason)
    
    @commands.command()
    @commands.has_permissions(ban_members=True)
    async def tempban(self, ctx, member: Union[discord.Member, discord.User, str], duration: DurationConverter, *, reason=None):
        """Temporarily ban a member from the server
        
        Examples:
        !tempban @user 7d Repeated rule violations
        !tempban 123456789012345678 24h Raiding
        """
        # Handle different input types for member
        user = None
        if isinstance(member, discord.Member) or isinstance(member, discord.User):
            user = member
        else:
            # Try to convert to a user ID
            try:
                user_id = int(member)
                user = await self.bot.fetch_user(user_id)
            except (ValueError, discord.NotFound, discord.HTTPException):
                await ctx.send("Invalid user or user ID.")
                return
        
        if user is None:
            await ctx.send("Failed to find user.")
            return
        
        # Check if the target is valid
        if user.id == ctx.author.id:
            return await ctx.send("You cannot tempban yourself.")
        
        if user.id == self.bot.user.id:
            return await ctx.send("I cannot tempban myself.")
        
        # Special checks for server members
        if isinstance(user, discord.Member):
            if user.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
                return await ctx.send("You cannot tempban someone with a higher or equal role than yourself.")
            
            if not user.guild.me.guild_permissions.ban_members:
                return await ctx.send("I don't have permission to ban members.")
            
            if user.top_role >= user.guild.me.top_role:
                return await ctx.send("I cannot ban a member with a higher or equal role than myself.")
            
            # DM the user before banning if they're in the server
            try:
                embed = discord.Embed(
                    title="Temporary Ban",
                    description=f"You have been temporarily banned from **{ctx.guild.name}**",
                    color=discord.Color.red()
                )
                embed.add_field(name="Duration", value=str(duration))
                embed.add_field(name="Expires", value=f"<t:{int((discord.utils.utcnow() + duration).timestamp())}:R>")
                embed.add_field(name="Reason", value=reason or "No reason provided", inline=False)
                embed.add_field(name="Moderator", value=ctx.author.name)
                
                await user.send(embed=embed)
            except discord.Forbidden:
                pass  # Unable to DM user
        
        # Add infraction to the user's record
        infraction = await self.add_infraction(
            ctx.guild.id, 
            user.id, 
            ctx.author.id, 
            'tempban', 
            reason,
            duration
        )
        
        # Ban the user
        try:
            await ctx.guild.ban(user, reason=f"{ctx.author}: {reason} (Temp: {duration})" if reason else f"Temp banned by {ctx.author} for {duration}")
            await ctx.send(f"⏱️🔨 **{user}** has been temporarily banned for {duration}. | Infraction ID: {infraction['id']}")
        except discord.Forbidden:
            await ctx.send("I don't have permission to ban that user.")
            return
        except discord.HTTPException as e:
            await ctx.send(f"Failed to ban user: {e}")
            return
        
        # Log the action
        await self.log_moderation_action(ctx.guild, user, ctx.author, "tempban", reason, duration)
    
    @commands.command()
    @commands.has_permissions(ban_members=True)
    async def unban(self, ctx, user_id: str, *, reason=None):
        """Unban a user from the server
        
        Example:
        !unban 123456789012345678 Appealed successfully
        """
        try:
            user_id = int(user_id)
        except ValueError:
            await ctx.send("Please provide a valid user ID.")
            return
        
        # Check if the ban exists
        try:
            ban_entry = await ctx.guild.fetch_ban(discord.Object(id=user_id))
            user = ban_entry.user
        except discord.NotFound:
            await ctx.send("This user is not banned.")
            return
        except discord.HTTPException as e:
            await ctx.send(f"Failed to retrieve ban: {e}")
            return
        
        # Update infractions
        guild_infractions = self.infractions.get(ctx.guild.id, {})
        user_infractions = guild_infractions.get(str(user_id), [])
        
        for infraction in user_infractions:
            if infraction['type'] in ['ban', 'tempban'] and infraction['active']:
                infraction['active'] = False
                infraction['removed_by'] = str(ctx.author.id)
                infraction['removed_at'] = datetime.datetime.now().isoformat()
                infraction['removal_reason'] = reason
        
        self.save_infractions()
        
        # Unban the user
        try:
            await ctx.guild.unban(user, reason=f"{ctx.author}: {reason}" if reason else f"Unbanned by {ctx.author}")
            await ctx.send(f"🔓 **{user}** has been unbanned.")
        except discord.Forbidden:
            await ctx.send("I don't have permission to unban users.")
            return
        except discord.HTTPException as e:
            await ctx.send(f"Failed to unban user: {e}")
            return
        
        # Log the action
        await self.log_moderation_action(ctx.guild, user, ctx.author, "unban", reason)
    
    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def mute(self, ctx, member: discord.Member, *, reason=None):
        """Mute a member (timeout)
        
        Example:
        !mute @user Disrupting conversation
        """
        if member.id == ctx.author.id:
            return await ctx.send("You cannot mute yourself.")
        
        if member.id == self.bot.user.id:
            return await ctx.send("I cannot mute myself.")
        
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            return await ctx.send("You cannot mute someone with a higher or equal role than yourself.")
        
        if not member.guild.me.guild_permissions.moderate_members:
            return await ctx.send("I don't have permission to timeout members (missing Moderate Members permission).")
        
        if member.top_role >= member.guild.me.top_role:
            return await ctx.send("I cannot mute a member with a higher or equal role than myself.")
        
        # Default mute duration (28 days is Discord's maximum)
        duration = datetime.timedelta(days=28)
        
        # Add infraction to the user's record
        infraction = await self.add_infraction(
            ctx.guild.id, 
            member.id, 
            ctx.author.id, 
            'mute', 
            reason,
            duration
        )
        
        # DM the user
        try:
            embed = discord.Embed(
                title="Mute",
                description=f"You have been muted in **{ctx.guild.name}**",
                color=discord.Color.dark_orange()
            )
            embed.add_field(name="Reason", value=reason or "No reason provided")
            embed.add_field(name="Moderator", value=ctx.author.name)
            
            await member.send(embed=embed)
        except discord.Forbidden:
            pass  # Unable to DM user
        
        # Apply timeout
        try:
            await member.timeout(duration, reason=f"{ctx.author}: {reason}" if reason else f"Muted by {ctx.author}")
            await ctx.send(f"🔇 **{member}** has been muted. | Infraction ID: {infraction['id']}")
        except discord.Forbidden:
            await ctx.send("I don't have permission to mute that member.")
            return
        except discord.HTTPException as e:
            await ctx.send(f"Failed to mute member: {e}")
            return
        
        # Log the action
        await self.log_moderation_action(ctx.guild, member, ctx.author, "mute", reason, duration)
    
    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def tempmute(self, ctx, member: discord.Member, duration: DurationConverter, *, reason=None):
        """Temporarily mute a member (timeout)
        
        Example:
        !tempmute @user 1h Disrupting conversation
        """
        if member.id == ctx.author.id:
            return await ctx.send("You cannot mute yourself.")
        
        if member.id == self.bot.user.id:
            return await ctx.send("I cannot mute myself.")
        
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            return await ctx.send("You cannot mute someone with a higher or equal role than yourself.")
        
        if not member.guild.me.guild_permissions.moderate_members:
            return await ctx.send("I don't have permission to timeout members (missing Moderate Members permission).")
        
        if member.top_role >= member.guild.me.top_role:
            return await ctx.send("I cannot mute a member with a higher or equal role than myself.")
        
        # Check if duration exceeds Discord's maximum (28 days)
        max_duration = datetime.timedelta(days=28)
        if duration > max_duration:
            duration = max_duration
            await ctx.send("⚠️ Duration exceeded Discord's 28-day maximum, setting timeout to 28 days instead.")
        
        # Add infraction to the user's record
        infraction = await self.add_infraction(
            ctx.guild.id, 
            member.id, 
            ctx.author.id, 
            'tempmute', 
            reason,
            duration
        )
        
        # DM the user
        try:
            embed = discord.Embed(
                title="Temporary Mute",
                description=f"You have been temporarily muted in **{ctx.guild.name}**",
                color=discord.Color.dark_orange()
            )
            embed.add_field(name="Duration", value=str(duration))
            embed.add_field(name="Expires", value=f"<t:{int((discord.utils.utcnow() + duration).timestamp())}:R>")
            embed.add_field(name="Reason", value=reason or "No reason provided", inline=False)
            embed.add_field(name="Moderator", value=ctx.author.name)
            
            await member.send(embed=embed)
        except discord.Forbidden:
            pass  # Unable to DM user
        
        # Apply timeout
        try:
            await member.timeout(duration, reason=f"{ctx.author}: {reason} (Temp: {duration})" if reason else f"Temp muted by {ctx.author} for {duration}")
            await ctx.send(f"⏱️🔇 **{member}** has been temporarily muted for {duration}. | Infraction ID: {infraction['id']}")
        except discord.Forbidden:
            await ctx.send("I don't have permission to mute that member.")
            return
        except discord.HTTPException as e:
            await ctx.send(f"Failed to mute member: {e}")
            return
        
        # Log the action
        await self.log_moderation_action(ctx.guild, member, ctx.author, "tempmute", reason, duration)
    
    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def unmute(self, ctx, member: discord.Member, *, reason=None):
        """Unmute a member (remove timeout)
        
        Example:
        !unmute @user Time served
        """
        if not member.guild.me.guild_permissions.moderate_members:
            return await ctx.send("I don't have permission to manage timeouts (missing Moderate Members permission).")
        
        if not member.is_timed_out():
            return await ctx.send("This member is not muted.")
        
        # Update infractions
        guild_infractions = self.infractions.get(ctx.guild.id, {})
        user_infractions = guild_infractions.get(str(member.id), [])
        
        for infraction in user_infractions:
            if infraction['type'] in ['mute', 'tempmute'] and infraction['active']:
                infraction['active'] = False
                infraction['removed_by'] = str(ctx.author.id)
                infraction['removed_at'] = datetime.datetime.now().isoformat()
                infraction['removal_reason'] = reason
        
        self.save_infractions()
        
        # Remove timeout
        try:
            await member.timeout(None, reason=f"{ctx.author}: {reason}" if reason else f"Unmuted by {ctx.author}")
            await ctx.send(f"🔊 **{member}** has been unmuted.")
        except discord.Forbidden:
            await ctx.send("I don't have permission to unmute that member.")
            return
        except discord.HTTPException as e:
            await ctx.send(f"Failed to unmute member: {e}")
            return
        
        # Log the action
        await self.log_moderation_action(ctx.guild, member, ctx.author, "unmute", reason)
    
    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def infractions(self, ctx, member: discord.Member = None, page: int = 1):
        """View a member's infractions
        
        Examples:
        !infractions @user
        !infractions @user 2
        !infractions
        """
        guild_id = ctx.guild.id
        
        # Check if viewing all infractions or a specific member's
        if member is None:
            # Get all infractions for the guild
            all_infractions = []
            for user_id, infractions in self.infractions.get(guild_id, {}).items():
                all_infractions.extend(infractions)
            
            # Sort by timestamp (newest first)
            all_infractions.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            if not all_infractions:
                return await ctx.send("No infractions found for this server.")
            
            # Paginate results
            per_page = 5
            pages = (len(all_infractions) + per_page - 1) // per_page
            
            if page < 1 or page > pages:
                return await ctx.send(f"Invalid page. Please specify a page between 1 and {pages}.")
            
            start_idx = (page - 1) * per_page
            end_idx = min(start_idx + per_page, len(all_infractions))
            
            # Create embed
            embed = discord.Embed(
                title=f"All Infractions | Page {page}/{pages}",
                color=discord.Color.blue(),
                description=f"Showing {start_idx + 1}-{end_idx} of {len(all_infractions)} infractions"
            )
            
            # Add infractions to embed
            for i, infraction in enumerate(all_infractions[start_idx:end_idx], start=1):
                # Try to get user and mod info
                user_id = infraction.get('user_id')
                mod_id = infraction.get('mod_id')
                user = await self.bot.fetch_user(int(user_id)) if user_id else None
                mod = await self.bot.fetch_user(int(mod_id)) if mod_id else None
                
                user_str = f"{user} ({user_id})" if user else user_id
                mod_str = f"{mod} ({mod_id})" if mod else mod_id
                
                field_title = f"{i}. #{infraction.get('id')} | {infraction.get('type').title()}"
                if not infraction.get('active', True):
                    field_title += " (Inactive)"
                
                field_value = f"**User:** {user_str}\n"
                field_value += f"**Moderator:** {mod_str}\n"
                field_value += f"**Reason:** {infraction.get('reason', 'No reason')}\n"
                field_value += f"**Date:** <t:{int(datetime.datetime.fromisoformat(infraction.get('timestamp', '')).timestamp())}:R>\n"
                
                if 'expires_at' in infraction:
                    expiry = datetime.datetime.fromisoformat(infraction['expires_at'])
                    field_value += f"**Expires:** <t:{int(expiry.timestamp())}:R>\n"
                
                embed.add_field(name=field_title, value=field_value, inline=False)
            
            # Add pagination info
            embed.set_footer(text=f"Use {ctx.prefix}infractions {page+1} to see the next page")
            
            await ctx.send(embed=embed)
            
        else:
            # Get infractions for specific member
            user_infractions = self.infractions.get(guild_id, {}).get(str(member.id), [])
            
            if not user_infractions:
                return await ctx.send(f"No infractions found for {member}.")
            
            # Sort by timestamp (newest first)
            user_infractions.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
            
            # Paginate results
            per_page = 5
            pages = (len(user_infractions) + per_page - 1) // per_page
            
            if page < 1 or page > pages:
                return await ctx.send(f"Invalid page. Please specify a page between 1 and {pages}.")
            
            start_idx = (page - 1) * per_page
            end_idx = min(start_idx + per_page, len(user_infractions))
            
            # Create embed
            embed = discord.Embed(
                title=f"Infractions for {member} | Page {page}/{pages}",
                color=member.color,
                description=f"Showing {start_idx + 1}-{end_idx} of {len(user_infractions)} infractions"
            )
            
            # Add member info
            embed.set_thumbnail(url=member.display_avatar.url)
            
            # Add infractions to embed
            for i, infraction in enumerate(user_infractions[start_idx:end_idx], start=1):
                # Try to get mod info
                mod_id = infraction.get('mod_id')
                mod = await self.bot.fetch_user(int(mod_id)) if mod_id else None
                mod_str = f"{mod} ({mod_id})" if mod else mod_id
                
                field_title = f"{i}. #{infraction.get('id')} | {infraction.get('type').title()}"
                if not infraction.get('active', True):
                    field_title += " (Inactive)"
                
                field_value = f"**Moderator:** {mod_str}\n"
                field_value += f"**Reason:** {infraction.get('reason', 'No reason')}\n"
                field_value += f"**Date:** <t:{int(datetime.datetime.fromisoformat(infraction.get('timestamp', '')).timestamp())}:R>\n"
                
                if 'expires_at' in infraction:
                    expiry = datetime.datetime.fromisoformat(infraction['expires_at'])
                    field_value += f"**Expires:** <t:{int(expiry.timestamp())}:R>\n"
                
                embed.add_field(name=field_title, value=field_value, inline=False)
            
            # Add pagination info
            embed.set_footer(text=f"Use {ctx.prefix}infractions {member} {page+1} to see the next page")
            
            await ctx.send(embed=embed)
    
    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def purge(self, ctx, amount: int, *, user: discord.Member = None):
        """Purge messages from a channel
        
        Examples:
        !purge 10
        !purge 10 @user
        """
        if amount <= 0:
            return await ctx.send("Please specify a positive number of messages to purge.")
        
        if amount > 100:
            amount = 100
            await ctx.send("⚠️ Maximum purge amount is 100 messages. Setting to 100.")
        
        # Delete command message first
        try:
            await ctx.message.delete()
        except (discord.Forbidden, discord.HTTPException):
            pass
        
        # Define check based on user
        def check(message):
            if user:
                return message.author == user
            return True
        
        try:
            # Purge messages
            deleted = await ctx.channel.purge(limit=amount, check=check)
            
            # Send confirmation
            confirmation_message = await ctx.send(f"🧹 Purged {len(deleted)} messages.")
            
            # Delete confirmation after a short delay
            await asyncio.sleep(3)
            await confirmation_message.delete()
            
            # Log the action
            if user:
                reason = f"Purged {len(deleted)} messages from {user}"
            else:
                reason = f"Purged {len(deleted)} messages from #{ctx.channel.name}"
            
            await self.log_moderation_action(ctx.guild, user or ctx.guild.me, ctx.author, "purge", reason)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to delete messages in this channel.")
        except discord.HTTPException as e:
            await ctx.send(f"Error purging messages: {e}")
    
    @commands.command()
    @commands.has_permissions(administrator=True)
    async def slowmode(self, ctx, seconds: int = None):
        """Set slowmode for the current channel
        
        Examples:
        !slowmode 5
        !slowmode 0 (to disable)
        !slowmode (to check current slowmode)
        """
        # Just show current slowmode if no value provided
        if seconds is None:
            current = ctx.channel.slowmode_delay
            if current == 0:
                return await ctx.send("Slowmode is currently disabled in this channel.")
            else:
                return await ctx.send(f"Slowmode is currently set to {current} seconds in this channel.")
        
        # Validate seconds
        if seconds < 0:
            return await ctx.send("Slowmode cannot be negative.")
        
        if seconds > 21600:  # Discord's maximum is 6 hours
            seconds = 21600
            await ctx.send("⚠️ Maximum slowmode is 6 hours (21600 seconds). Setting to maximum.")
        
        try:
            await ctx.channel.edit(slowmode_delay=seconds)
            
            if seconds == 0:
                await ctx.send("✅ Slowmode has been disabled for this channel.")
            else:
                await ctx.send(f"✅ Slowmode has been set to {seconds} seconds for this channel.")
            
            # Log the action
            reason = f"Set slowmode to {seconds}s in #{ctx.channel.name}"
            await self.log_moderation_action(ctx.guild, ctx.guild.me, ctx.author, "slowmode", reason)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to edit this channel.")
        except discord.HTTPException as e:
            await ctx.send(f"Error setting slowmode: {e}")
    
    @commands.command()
    @commands.has_permissions(administrator=True)
    async def nuke(self, ctx, reason: Optional[str] = "Channel cleanup"):
        """Clone and delete the current channel (nuke it)
        
        Example:
        !nuke
        !nuke Cleaning up spam
        """
        channel_name = ctx.channel.name
        channel_position = ctx.channel.position
        channel_category = ctx.channel.category
        channel_topic = ctx.channel.topic
        channel_slowmode = ctx.channel.slowmode_delay
        channel_nsfw = ctx.channel.is_nsfw()
        
        # Confirm with user
        confirm_msg = await ctx.send(f"⚠️ Are you sure you want to nuke #{channel_name}? This will delete ALL messages. Type `yes` to confirm or `no` to cancel.")
        
        def check(m):
            return m.author == ctx.author and m.channel == ctx.channel and m.content.lower() in ["yes", "no"]
        
        try:
            response = await self.bot.wait_for("message", check=check, timeout=30.0)
        except asyncio.TimeoutError:
            await confirm_msg.edit(content="Nuke cancelled due to timeout.")
            return
        
        if response.content.lower() != "yes":
            await ctx.send("Nuke cancelled.")
            return
        
        try:
            # Create a new channel with the same settings
            new_channel = await ctx.channel.clone(reason=reason)
            await new_channel.edit(position=channel_position)
            
            # Delete the old channel
            await ctx.channel.delete(reason=reason)
            
            # Send confirmation message in new channel
            await new_channel.send(f"💥 Channel has been nuked by {ctx.author.mention}.\n**Reason:** {reason}")
            
            # Log the action
            await self.log_moderation_action(ctx.guild, ctx.guild.me, ctx.author, "nuke", reason)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to manage channels.")
        except discord.HTTPException as e:
            await ctx.send(f"Error nuking channel: {e}")
            
    @commands.command()
    @commands.has_permissions(administrator=True)
    async def lock(self, ctx, channel: discord.TextChannel = None, *, reason=None):
        """Lock a channel to prevent users from sending messages
        
        Examples:
        !lock
        !lock #general
        !lock #general Raid in progress
        """
        channel = channel or ctx.channel
        
        # Get the default role (@everyone)
        default_role = ctx.guild.default_role
        
        # Prepare permission overwrite
        overwrite = channel.overwrites_for(default_role)
        
        # Check if already locked
        if overwrite.send_messages is False:
            await ctx.send(f"#{channel.name} is already locked.")
            return
        
        # Update permissions
        overwrite.send_messages = False
        
        try:
            await channel.set_permissions(default_role, overwrite=overwrite, reason=f"{ctx.author}: {reason}" if reason else f"Locked by {ctx.author}")
            
            # Send confirmation
            await channel.send(f"🔒 This channel has been locked by {ctx.author.mention}." + (f"\n**Reason:** {reason}" if reason else ""))
            
            if channel != ctx.channel:
                await ctx.send(f"🔒 #{channel.name} has been locked.")
            
            # Log the action
            reason_text = f"Locked #{channel.name}" + (f" - {reason}" if reason else "")
            await self.log_moderation_action(ctx.guild, ctx.guild.me, ctx.author, "lock", reason_text)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to edit channel permissions.")
        except discord.HTTPException as e:
            await ctx.send(f"Error locking channel: {e}")
            
    @commands.command()
    @commands.has_permissions(administrator=True)
    async def unlock(self, ctx, channel: discord.TextChannel = None, *, reason=None):
        """Unlock a channel to allow users to send messages
        
        Examples:
        !unlock
        !unlock #general
        !unlock #general Raid over
        """
        channel = channel or ctx.channel
        
        # Get the default role (@everyone)
        default_role = ctx.guild.default_role
        
        # Prepare permission overwrite
        overwrite = channel.overwrites_for(default_role)
        
        # Check if already unlocked
        if overwrite.send_messages is None or overwrite.send_messages is True:
            await ctx.send(f"#{channel.name} is already unlocked.")
            return
        
        # Update permissions
        overwrite.send_messages = None
        
        # Remove empty overwrite
        if overwrite.is_empty():
            await channel.set_permissions(default_role, overwrite=None, reason=f"{ctx.author}: {reason}" if reason else f"Unlocked by {ctx.author}")
        else:
            await channel.set_permissions(default_role, overwrite=overwrite, reason=f"{ctx.author}: {reason}" if reason else f"Unlocked by {ctx.author}")
        
        # Send confirmation
        await channel.send(f"🔓 This channel has been unlocked by {ctx.author.mention}." + (f"\n**Reason:** {reason}" if reason else ""))
        
        if channel != ctx.channel:
            await ctx.send(f"🔓 #{channel.name} has been unlocked.")
        
        # Log the action
        reason_text = f"Unlocked #{channel.name}" + (f" - {reason}" if reason else "")
        await self.log_moderation_action(ctx.guild, ctx.guild.me, ctx.author, "unlock", reason_text)
        
    @commands.group(invoke_without_command=True)
    @commands.has_permissions(administrator=True)
    async def lockdown(self, ctx):
        """Manage server lockdowns
        
        Examples:
        !lockdown start
        !lockdown end
        """
        await ctx.send(
            "**Lockdown Commands**\n"
            f"`{ctx.prefix}lockdown start [reason]` - Lock all channels\n"
            f"`{ctx.prefix}lockdown end [reason]` - Unlock all channels"
        )
        
    @lockdown.command(name="start")
    @commands.has_permissions(administrator=True)
    async def lockdown_start(self, ctx, *, reason=None):
        """Start a server-wide lockdown
        
        Example:
        !lockdown start Raid in progress
        """
        reason = reason or "Server-wide lockdown"
        
        # Confirm with user
        confirm_msg = await ctx.send(f"⚠️ Are you sure you want to lock down ALL channels? Type `yes` to confirm or `no` to cancel.")
        
        def check(m):
            return m.author == ctx.author and m.channel == ctx.channel and m.content.lower() in ["yes", "no"]
        
        try:
            response = await self.bot.wait_for("message", check=check, timeout=30.0)
        except asyncio.TimeoutError:
            await confirm_msg.edit(content="Lockdown cancelled due to timeout.")
            return
        
        if response.content.lower() != "yes":
            await ctx.send("Lockdown cancelled.")
            return
        
        # Get default role (@everyone)
        default_role = ctx.guild.default_role
        
        # Store original permissions
        lockdown_data = {}
        
        # Count locked channels
        locked_channels = 0
        already_locked = 0
        
        # Send initial message
        status_msg = await ctx.send("🔒 Locking down the server...")
        
        # Lock all text channels
        for channel in ctx.guild.text_channels:
            try:
                overwrite = channel.overwrites_for(default_role)
                
                # Skip already locked channels
                if overwrite.send_messages is False:
                    already_locked += 1
                    continue
                
                # Store original permission
                lockdown_data[channel.id] = overwrite.send_messages
                
                # Update permission
                overwrite.send_messages = False
                await channel.set_permissions(default_role, overwrite=overwrite, reason=f"Lockdown: {reason}")
                
                # Send notification in each channel
                await channel.send(f"🔒 **SERVER LOCKDOWN**: This channel has been locked by {ctx.author.mention}.\n**Reason:** {reason}")
                
                locked_channels += 1
                
                # Update status every 5 channels
                if locked_channels % 5 == 0:
                    await status_msg.edit(content=f"🔒 Locking down the server... ({locked_channels} channels locked)")
                
            except discord.Forbidden:
                continue  # Skip channels we can't edit
        
        # Save lockdown data
        # In a real implementation, this would save to a database
        # For now, we'll just log that data was saved
        logger.info(f"Lockdown data saved for {len(lockdown_data)} channels")
        
        # Final confirmation
        await status_msg.edit(content=f"🔒 Server lockdown complete. Locked {locked_channels} channels. {already_locked} channels were already locked.")
        
        # Log the action
        await self.log_moderation_action(ctx.guild, ctx.guild.me, ctx.author, "lockdown", reason)
        
    @lockdown.command(name="end")
    @commands.has_permissions(administrator=True)
    async def lockdown_end(self, ctx, *, reason=None):
        """End a server-wide lockdown
        
        Example:
        !lockdown end Raid over
        """
        reason = reason or "Server-wide lockdown ended"
        
        # Confirm with user
        confirm_msg = await ctx.send(f"⚠️ Are you sure you want to end the lockdown and unlock ALL channels? Type `yes` to confirm or `no` to cancel.")
        
        def check(m):
            return m.author == ctx.author and m.channel == ctx.channel and m.content.lower() in ["yes", "no"]
        
        try:
            response = await self.bot.wait_for("message", check=check, timeout=30.0)
        except asyncio.TimeoutError:
            await confirm_msg.edit(content="Unlock cancelled due to timeout.")
            return
        
        if response.content.lower() != "yes":
            await ctx.send("Unlock cancelled.")
            return
        
        # Get default role (@everyone)
        default_role = ctx.guild.default_role
        
        # Count unlocked channels
        unlocked_channels = 0
        already_unlocked = 0
        
        # Send initial message
        status_msg = await ctx.send("🔓 Unlocking the server...")
        
        # Unlock all text channels
        for channel in ctx.guild.text_channels:
            try:
                overwrite = channel.overwrites_for(default_role)
                
                # Skip already unlocked channels
                if overwrite.send_messages is None or overwrite.send_messages is True:
                    already_unlocked += 1
                    continue
                
                # Update permission
                overwrite.send_messages = None
                
                # Remove empty overwrite
                if overwrite.is_empty():
                    await channel.set_permissions(default_role, overwrite=None, reason=f"Lockdown end: {reason}")
                else:
                    await channel.set_permissions(default_role, overwrite=overwrite, reason=f"Lockdown end: {reason}")
                
                # Send notification in each channel
                await channel.send(f"🔓 **LOCKDOWN ENDED**: This channel has been unlocked by {ctx.author.mention}.\n**Reason:** {reason}")
                
                unlocked_channels += 1
                
                # Update status every 5 channels
                if unlocked_channels % 5 == 0:
                    await status_msg.edit(content=f"🔓 Unlocking the server... ({unlocked_channels} channels unlocked)")
                
            except discord.Forbidden:
                continue  # Skip channels we can't edit
        
        # Final confirmation
        await status_msg.edit(content=f"🔓 Server lockdown ended. Unlocked {unlocked_channels} channels. {already_unlocked} channels were already unlocked.")
        
        # Log the action
        await self.log_moderation_action(ctx.guild, ctx.guild.me, ctx.author, "lockdown end", reason)
    
    @commands.command()
    @commands.has_permissions(administrator=True)
    async def nickname(self, ctx, member: discord.Member, *, new_nickname=None):
        """Change a member's nickname
        
        Examples:
        !nickname @user New Nickname
        !nickname @user reset
        """
        if member.id == ctx.guild.owner_id:
            return await ctx.send("I cannot change the server owner's nickname.")
        
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            return await ctx.send("You cannot change the nickname of someone with a higher or equal role than yourself.")
        
        if not ctx.guild.me.guild_permissions.manage_nicknames:
            return await ctx.send("I don't have permission to manage nicknames.")
        
        if member.top_role >= ctx.guild.me.top_role:
            return await ctx.send("I cannot change the nickname of a member with a higher or equal role than myself.")
        
        old_nickname = member.display_name
        
        # Reset nickname if "reset" is specified or if no nickname is provided
        if new_nickname is None or new_nickname.lower() == "reset":
            await member.edit(nick=None, reason=f"Nickname reset by {ctx.author}")
            await ctx.send(f"✅ Reset nickname for **{member}**.")
            
            # Log the action
            await self.log_moderation_action(ctx.guild, member, ctx.author, "nickname reset", f"Changed nickname from '{old_nickname}' to None")
            
            return
        
        # Change nickname
        try:
            await member.edit(nick=new_nickname[:32], reason=f"Nickname changed by {ctx.author}")
            await ctx.send(f"✅ Changed nickname for **{member}** to **{new_nickname[:32]}**.")
            
            # Log the action
            await self.log_moderation_action(ctx.guild, member, ctx.author, "nickname change", f"Changed nickname from '{old_nickname}' to '{new_nickname[:32]}'")
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to change that member's nickname.")
        except discord.HTTPException as e:
            await ctx.send(f"Error changing nickname: {e}")

async def setup(bot):
    await bot.add_cog(Moderation(bot))