import discord
from discord.ext import commands
import asyncio
import re
import datetime
import typing

class ModerationCommands(commands.Cog):
    """Moderation commands for Guard-shin bot that use prefix"""
    
    def __init__(self, bot):
        self.bot = bot
    
    @commands.command(name="ban")
    @commands.has_permissions(ban_members=True)
    @commands.bot_has_permissions(ban_members=True)
    async def ban(self, ctx, member: discord.Member, *, reason=None):
        """Ban a member from the server"""
        if member == ctx.author:
            return await ctx.send("You cannot ban yourself.")
            
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            return await ctx.send("You cannot ban someone with a role higher than or equal to yours.")
            
        if member.top_role >= ctx.guild.me.top_role:
            return await ctx.send("I cannot ban someone with a role higher than or equal to mine.")
            
        # Format the reason and add the moderator's name
        mod_reason = f"{reason} | Banned by {ctx.author}" if reason else f"Banned by {ctx.author}"
        
        # Send a DM to the user before banning (will fail silently if blocked)
        try:
            embed = discord.Embed(
                title="You have been banned",
                description=f"You have been banned from {ctx.guild.name}",
                color=discord.Color.red()
            )
            if reason:
                embed.add_field(name="Reason", value=reason, inline=False)
            
            await member.send(embed=embed)
        except:
            pass
        
        # Ban the member
        await ctx.guild.ban(member, reason=mod_reason, delete_message_days=0)
        
        # Send confirmation message
        embed = discord.Embed(
            title="Member Banned",
            description=f"{member.mention} has been banned from the server.",
            color=discord.Color.red(),
            timestamp=datetime.datetime.now()
        )
        embed.add_field(name="Reason", value=reason or "No reason provided", inline=False)
        embed.set_footer(text=f"Banned by {ctx.author}")
        
        await ctx.send(embed=embed)
    
    @commands.command(name="kick")
    @commands.has_permissions(kick_members=True)
    @commands.bot_has_permissions(kick_members=True)
    async def kick(self, ctx, member: discord.Member, *, reason=None):
        """Kick a member from the server"""
        if member == ctx.author:
            return await ctx.send("You cannot kick yourself.")
            
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            return await ctx.send("You cannot kick someone with a role higher than or equal to yours.")
            
        if member.top_role >= ctx.guild.me.top_role:
            return await ctx.send("I cannot kick someone with a role higher than or equal to mine.")
            
        # Format the reason and add the moderator's name
        mod_reason = f"{reason} | Kicked by {ctx.author}" if reason else f"Kicked by {ctx.author}"
        
        # Send a DM to the user before kicking (will fail silently if blocked)
        try:
            embed = discord.Embed(
                title="You have been kicked",
                description=f"You have been kicked from {ctx.guild.name}",
                color=discord.Color.orange()
            )
            if reason:
                embed.add_field(name="Reason", value=reason, inline=False)
            
            await member.send(embed=embed)
        except:
            pass
        
        # Kick the member
        await ctx.guild.kick(member, reason=mod_reason)
        
        # Send confirmation message
        embed = discord.Embed(
            title="Member Kicked",
            description=f"{member.mention} has been kicked from the server.",
            color=discord.Color.orange(),
            timestamp=datetime.datetime.now()
        )
        embed.add_field(name="Reason", value=reason or "No reason provided", inline=False)
        embed.set_footer(text=f"Kicked by {ctx.author}")
        
        await ctx.send(embed=embed)
    
    @commands.command(name="unban")
    @commands.has_permissions(ban_members=True)
    @commands.bot_has_permissions(ban_members=True)
    async def unban(self, ctx, *, user_id_or_name):
        """Unban a user by ID or name"""
        # Check if input is a user ID
        is_id = re.match(r"^[0-9]{17,20}$", user_id_or_name)
        
        if is_id:
            # Find by ID
            user_id = int(user_id_or_name)
            try:
                # Fetch ban entry directly
                ban_entry = await ctx.guild.fetch_ban(discord.Object(id=user_id))
                await ctx.guild.unban(ban_entry.user, reason=f"Unbanned by {ctx.author}")
                
                embed = discord.Embed(
                    title="User Unbanned",
                    description=f"{ban_entry.user.mention} (`{ban_entry.user}`) has been unbanned.",
                    color=discord.Color.green(),
                    timestamp=datetime.datetime.now()
                )
                embed.set_footer(text=f"Unbanned by {ctx.author}")
                
                await ctx.send(embed=embed)
                return
            except discord.NotFound:
                await ctx.send(f"No banned user with ID {user_id} was found.")
                return
        
        # If not ID or ID not found, try to find by name
        # Get list of banned users
        bans = [ban_entry async for ban_entry in ctx.guild.bans()]
        
        # Find user by name#discriminator or name
        found_users = []
        for ban_entry in bans:
            user = ban_entry.user
            # Check full username with discriminator if 4 digits
            if str(user) == user_id_or_name:
                # Exact match, unban immediately
                await ctx.guild.unban(user, reason=f"Unbanned by {ctx.author}")
                
                embed = discord.Embed(
                    title="User Unbanned",
                    description=f"{user.mention} (`{user}`) has been unbanned.",
                    color=discord.Color.green(),
                    timestamp=datetime.datetime.now()
                )
                embed.set_footer(text=f"Unbanned by {ctx.author}")
                
                await ctx.send(embed=embed)
                return
            
            # Check just the name
            if user.name.lower() == user_id_or_name.lower():
                found_users.append(user)
        
        # Handle found users
        if len(found_users) == 1:
            # If only one found, unban
            user = found_users[0]
            await ctx.guild.unban(user, reason=f"Unbanned by {ctx.author}")
            
            embed = discord.Embed(
                title="User Unbanned",
                description=f"{user.mention} (`{user}`) has been unbanned.",
                color=discord.Color.green(),
                timestamp=datetime.datetime.now()
            )
            embed.set_footer(text=f"Unbanned by {ctx.author}")
            
            await ctx.send(embed=embed)
        elif len(found_users) > 1:
            # If multiple found, show options
            embed = discord.Embed(
                title="Multiple Matches Found",
                description="Multiple banned users match that name. Please use their ID instead.",
                color=discord.Color.orange()
            )
            
            for i, user in enumerate(found_users[:10]):  # Limit to first 10
                embed.add_field(
                    name=f"{i+1}. {user}",
                    value=f"ID: {user.id}",
                    inline=False
                )
            
            if len(found_users) > 10:
                embed.set_footer(text=f"Showing 10 of {len(found_users)} matches")
            
            await ctx.send(embed=embed)
        else:
            await ctx.send(f"No banned user matching `{user_id_or_name}` was found.")
    
    @commands.command(name="clear", aliases=["purge"])
    @commands.has_permissions(manage_messages=True)
    @commands.bot_has_permissions(manage_messages=True)
    async def clear(self, ctx, amount: int, target: typing.Optional[discord.Member] = None):
        """
        Clear a specific number of messages from a channel
        
        Examples:
        !clear 10         # Clear 10 messages
        !clear 10 @user   # Clear 10 messages from a specific user
        """
        if amount <= 0:
            return await ctx.send("Please provide a positive number of messages to delete.")
        
        if amount > 100:
            return await ctx.send("I can only delete up to 100 messages at once.")
        
        # Delete the command message
        await ctx.message.delete()
        
        # Define a check function if filtering by user
        def check_user(message):
            return target is None or message.author == target
        
        # Purge messages
        deleted = await ctx.channel.purge(limit=amount, check=check_user)
        
        # Send confirmation (and then delete after 5 seconds)
        if target:
            confirmation = await ctx.send(f"Deleted {len(deleted)} messages from {target.mention}.")
        else:
            confirmation = await ctx.send(f"Deleted {len(deleted)} messages.")
            
        await asyncio.sleep(5)
        try:
            await confirmation.delete()
        except:
            pass
    
    @commands.command(name="mute", aliases=["timeout"])
    @commands.has_permissions(moderate_members=True)
    @commands.bot_has_permissions(moderate_members=True)
    async def mute(self, ctx, member: discord.Member, duration: str, *, reason=None):
        """
        Timeout (mute) a member for a specific duration
        
        Duration format: 1d, 2h, 30m, 10s (days, hours, minutes, seconds)
        Examples:
        !mute @user 1h Spamming
        !mute @user 30m
        """
        if member == ctx.author:
            return await ctx.send("You cannot mute yourself.")
            
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            return await ctx.send("You cannot mute someone with a role higher than or equal to yours.")
            
        if member.top_role >= ctx.guild.me.top_role:
            return await ctx.send("I cannot mute someone with a role higher than or equal to mine.")
        
        # Parse the duration
        time_units = {
            's': 1,
            'm': 60,
            'h': 3600,
            'd': 86400,
            'w': 604800
        }
        
        total_seconds = 0
        time_pattern = re.compile(r'(\d+)([smhdw])')
        matches = time_pattern.findall(duration)
        
        if not matches:
            return await ctx.send("Invalid duration format. Use format like 1d, 2h, 30m, 10s.")
        
        for value, unit in matches:
            total_seconds += int(value) * time_units[unit]
        
        # Cap at 28 days (Discord maximum)
        if total_seconds > 2419200:  # 28 days in seconds
            total_seconds = 2419200
            duration = "28 days (maximum)"
        
        # Calculate the expiry time
        until = discord.utils.utcnow() + datetime.timedelta(seconds=total_seconds)
        
        # Format the reason
        mod_reason = f"{reason} | Muted by {ctx.author}" if reason else f"Muted by {ctx.author}"
        
        # Try to DM the user
        try:
            embed = discord.Embed(
                title="You have been timed out",
                description=f"You have been timed out in {ctx.guild.name} for {duration}",
                color=discord.Color.orange()
            )
            if reason:
                embed.add_field(name="Reason", value=reason, inline=False)
            
            await member.send(embed=embed)
        except:
            pass
        
        # Apply the timeout
        await member.timeout(until, reason=mod_reason)
        
        # Send confirmation
        embed = discord.Embed(
            title="Member Timed Out",
            description=f"{member.mention} has been timed out until {discord.utils.format_dt(until, style='R')}.",
            color=discord.Color.orange(),
            timestamp=datetime.datetime.now()
        )
        
        embed.add_field(name="Duration", value=duration, inline=True)
        embed.add_field(name="Expires", value=discord.utils.format_dt(until), inline=True)
        
        if reason:
            embed.add_field(name="Reason", value=reason, inline=False)
            
        embed.set_footer(text=f"Timed out by {ctx.author}")
        
        await ctx.send(embed=embed)
    
    @commands.command(name="unmute", aliases=["untimeout"])
    @commands.has_permissions(moderate_members=True)
    @commands.bot_has_permissions(moderate_members=True)
    async def unmute(self, ctx, member: discord.Member, *, reason=None):
        """Remove a timeout (unmute) from a member"""
        # Check if the member is actually timed out
        if not member.is_timed_out():
            return await ctx.send(f"{member.mention} is not currently timed out.")
        
        # Format the reason
        mod_reason = f"{reason} | Timeout removed by {ctx.author}" if reason else f"Timeout removed by {ctx.author}"
        
        # Remove the timeout
        await member.timeout(None, reason=mod_reason)
        
        # Send confirmation
        embed = discord.Embed(
            title="Timeout Removed",
            description=f"{member.mention}'s timeout has been removed.",
            color=discord.Color.green(),
            timestamp=datetime.datetime.now()
        )
        
        if reason:
            embed.add_field(name="Reason", value=reason, inline=False)
            
        embed.set_footer(text=f"Timeout removed by {ctx.author}")
        
        await ctx.send(embed=embed)
    
    @commands.command(name="slowmode")
    @commands.has_permissions(manage_channels=True)
    @commands.bot_has_permissions(manage_channels=True)
    async def slowmode(self, ctx, seconds: typing.Optional[int] = None):
        """Set the slowmode cooldown for a channel"""
        if seconds is None:
            # If no time provided, show current slowmode
            current = ctx.channel.slowmode_delay
            if current == 0:
                await ctx.send(f"There is currently no slowmode in this channel.")
            else:
                await ctx.send(f"The current slowmode in this channel is {current} seconds.")
            return
        
        # Ensure seconds is within Discord's limits
        if seconds < 0:
            return await ctx.send("Slowmode delay cannot be negative.")
        
        if seconds > 21600:  # 6 hours is Discord's max
            return await ctx.send("Slowmode delay cannot be more than 6 hours (21600 seconds).")
        
        # Set the slowmode
        await ctx.channel.edit(slowmode_delay=seconds)
        
        if seconds == 0:
            await ctx.send("Slowmode has been turned off for this channel.")
        else:
            await ctx.send(f"Slowmode has been set to {seconds} seconds for this channel.")
    
    @commands.command(name="lockdown", aliases=["lock"])
    @commands.has_permissions(manage_channels=True)
    @commands.bot_has_permissions(manage_channels=True)
    async def lockdown(self, ctx, *, reason=None):
        """Prevent everyone from sending messages in a channel"""
        # Get the default role (@everyone)
        default_role = ctx.guild.default_role
        
        # Set permissions to deny sending messages
        await ctx.channel.set_permissions(default_role, send_messages=False, reason=f"Lockdown by {ctx.author}")
        
        # Send confirmation message
        embed = discord.Embed(
            title="🔒 Channel Locked",
            description="This channel has been locked. Only staff members can send messages.",
            color=discord.Color.red(),
            timestamp=datetime.datetime.now()
        )
        
        if reason:
            embed.add_field(name="Reason", value=reason, inline=False)
            
        embed.set_footer(text=f"Locked by {ctx.author}")
        
        await ctx.send(embed=embed)
    
    @commands.command(name="unlock")
    @commands.has_permissions(manage_channels=True)
    @commands.bot_has_permissions(manage_channels=True)
    async def unlock(self, ctx):
        """Restore everyone's ability to send messages in a channel"""
        # Get the default role (@everyone)
        default_role = ctx.guild.default_role
        
        # Reset permissions to allow sending messages (or None to remove overrides)
        await ctx.channel.set_permissions(default_role, send_messages=None, reason=f"Unlock by {ctx.author}")
        
        # Send confirmation message
        embed = discord.Embed(
            title="🔓 Channel Unlocked",
            description="This channel has been unlocked. Everyone can send messages again.",
            color=discord.Color.green(),
            timestamp=datetime.datetime.now()
        )
        
        embed.set_footer(text=f"Unlocked by {ctx.author}")
        
        await ctx.send(embed=embed)

async def setup(bot):
    await bot.add_cog(ModerationCommands(bot))