import discord
from discord.ext import commands
import json
import asyncio
import datetime
import logging
import os

logger = logging.getLogger('guard-shin.moderation')

class Moderation(commands.Cog):
    """Moderation commands for server administrators"""
    
    def __init__(self, bot):
        self.bot = bot
        self.infractions = {}
        self.infractions_file = "infractions.json"
        self.load_infractions()
    
    def load_infractions(self):
        """Load infractions from file"""
        try:
            with open(self.infractions_file, 'r') as f:
                self.infractions = json.load(f)
                logger.info(f"Loaded infractions for {len(self.infractions)} guilds")
        except FileNotFoundError:
            logger.info("No infractions file found, creating new infractions database")
            self.infractions = {}
        except json.JSONDecodeError:
            logger.error("Error decoding infractions file, creating new infractions database")
            self.infractions = {}
    
    def save_infractions(self):
        """Save infractions to file"""
        with open(self.infractions_file, 'w') as f:
            json.dump(self.infractions, f)
    
    def add_infraction(self, guild_id, user_id, action_type, reason, mod_id):
        """Add an infraction to a user's record"""
        guild_id = str(guild_id)
        user_id = str(user_id)
        
        if guild_id not in self.infractions:
            self.infractions[guild_id] = {}
        
        if user_id not in self.infractions[guild_id]:
            self.infractions[guild_id][user_id] = []
        
        infraction = {
            "type": action_type,
            "reason": reason,
            "timestamp": datetime.datetime.utcnow().isoformat(),
            "mod_id": str(mod_id)
        }
        
        self.infractions[guild_id][user_id].append(infraction)
        self.save_infractions()
        
        return len(self.infractions[guild_id][user_id])
    
    @commands.command()
    @commands.has_permissions(kick_members=True)
    async def kick(self, ctx, member: discord.Member, *, reason="No reason provided"):
        """Kick a member from the server"""
        if member.id == ctx.author.id:
            await ctx.send("You cannot kick yourself.")
            return
        
        if member.top_role.position >= ctx.author.top_role.position and ctx.author.id != ctx.guild.owner_id:
            await ctx.send("You cannot kick someone with a higher or equal role.")
            return
        
        try:
            # Add infraction to the user's record
            infraction_count = self.add_infraction(ctx.guild.id, member.id, "kick", reason, ctx.author.id)
            
            # Send DM to the user
            try:
                embed = discord.Embed(
                    title=f"You have been kicked from {ctx.guild.name}",
                    description=f"Reason: {reason}",
                    color=discord.Color.orange()
                )
                await member.send(embed=embed)
            except discord.Forbidden:
                pass  # Cannot send DM to the user
            
            # Kick the user
            await member.kick(reason=reason)
            
            # Send confirmation
            embed = discord.Embed(
                title="Member Kicked",
                description=f"{member.mention} has been kicked from the server.",
                color=discord.Color.orange()
            )
            embed.add_field(name="Reason", value=reason)
            embed.add_field(name="Infractions", value=str(infraction_count))
            embed.set_footer(text=f"Kicked by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to kick that member.")
        except Exception as e:
            await ctx.send(f"An error occurred: {e}")
    
    @commands.command()
    @commands.has_permissions(ban_members=True)
    async def ban(self, ctx, member: discord.Member, *, reason="No reason provided"):
        """Ban a member from the server"""
        if member.id == ctx.author.id:
            await ctx.send("You cannot ban yourself.")
            return
        
        if member.top_role.position >= ctx.author.top_role.position and ctx.author.id != ctx.guild.owner_id:
            await ctx.send("You cannot ban someone with a higher or equal role.")
            return
        
        try:
            # Add infraction to the user's record
            infraction_count = self.add_infraction(ctx.guild.id, member.id, "ban", reason, ctx.author.id)
            
            # Send DM to the user
            try:
                embed = discord.Embed(
                    title=f"You have been banned from {ctx.guild.name}",
                    description=f"Reason: {reason}",
                    color=discord.Color.red()
                )
                await member.send(embed=embed)
            except discord.Forbidden:
                pass  # Cannot send DM to the user
            
            # Ban the user
            await member.ban(reason=reason)
            
            # Send confirmation
            embed = discord.Embed(
                title="Member Banned",
                description=f"{member.mention} has been banned from the server.",
                color=discord.Color.red()
            )
            embed.add_field(name="Reason", value=reason)
            embed.add_field(name="Infractions", value=str(infraction_count))
            embed.set_footer(text=f"Banned by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to ban that member.")
        except Exception as e:
            await ctx.send(f"An error occurred: {e}")
    
    @commands.command()
    @commands.has_permissions(ban_members=True)
    async def unban(self, ctx, user_id: int, *, reason="No reason provided"):
        """Unban a user by ID"""
        try:
            # Fetch the ban list
            bans = await ctx.guild.bans()
            banned_user = discord.utils.get(bans, user__id=user_id)
            
            if not banned_user:
                await ctx.send(f"User with ID {user_id} is not banned.")
                return
            
            # Unban the user
            await ctx.guild.unban(banned_user.user, reason=reason)
            
            # Send confirmation
            embed = discord.Embed(
                title="User Unbanned",
                description=f"User <@{user_id}> has been unbanned from the server.",
                color=discord.Color.green()
            )
            embed.add_field(name="Reason", value=reason)
            embed.set_footer(text=f"Unbanned by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to unban users.")
        except Exception as e:
            await ctx.send(f"An error occurred: {e}")
    
    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def warn(self, ctx, member: discord.Member, *, reason="No reason provided"):
        """Warn a member"""
        if member.id == ctx.author.id:
            await ctx.send("You cannot warn yourself.")
            return
        
        if member.top_role.position >= ctx.author.top_role.position and ctx.author.id != ctx.guild.owner_id:
            await ctx.send("You cannot warn someone with a higher or equal role.")
            return
        
        # Add infraction to the user's record
        infraction_count = self.add_infraction(ctx.guild.id, member.id, "warn", reason, ctx.author.id)
        
        # Send DM to the user
        try:
            embed = discord.Embed(
                title=f"You have been warned in {ctx.guild.name}",
                description=f"Reason: {reason}",
                color=discord.Color.gold()
            )
            await member.send(embed=embed)
        except discord.Forbidden:
            pass  # Cannot send DM to the user
        
        # Send confirmation
        embed = discord.Embed(
            title="Member Warned",
            description=f"{member.mention} has been warned.",
            color=discord.Color.gold()
        )
        embed.add_field(name="Reason", value=reason)
        embed.add_field(name="Warnings", value=str(infraction_count))
        embed.set_footer(text=f"Warned by {ctx.author}")
        
        await ctx.send(embed=embed)
    
    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def infractions(self, ctx, member: discord.Member):
        """View infractions for a member"""
        guild_id = str(ctx.guild.id)
        user_id = str(member.id)
        
        if guild_id not in self.infractions or user_id not in self.infractions[guild_id]:
            await ctx.send(f"{member.mention} has no infractions.")
            return
        
        user_infractions = self.infractions[guild_id][user_id]
        
        if not user_infractions:
            await ctx.send(f"{member.mention} has no infractions.")
            return
        
        embed = discord.Embed(
            title=f"Infractions for {member}",
            description=f"Total: {len(user_infractions)}",
            color=discord.Color.blue()
        )
        
        for i, infraction in enumerate(user_infractions[-10:], 1):  # Show last 10 infractions
            timestamp = datetime.datetime.fromisoformat(infraction["timestamp"]).strftime("%Y-%m-%d %H:%M UTC")
            mod = ctx.guild.get_member(int(infraction["mod_id"]))
            mod_name = mod.name if mod else "Unknown Moderator"
            
            embed.add_field(
                name=f"{i}. {infraction['type'].upper()} - {timestamp}",
                value=f"**Reason:** {infraction['reason']}\n**Moderator:** {mod_name}",
                inline=False
            )
        
        await ctx.send(embed=embed)
    
    @commands.command()
    @commands.has_permissions(manage_messages=True)
    async def clear(self, ctx, amount: int):
        """Clear a specified number of messages (max 100)"""
        if amount < 1 or amount > 100:
            await ctx.send("Please provide a number between 1 and 100.")
            return
        
        deleted = await ctx.channel.purge(limit=amount + 1)  # +1 to include the command message
        
        # Send confirmation
        message = await ctx.send(f"Deleted {len(deleted) - 1} messages.")
        await asyncio.sleep(3)
        await message.delete()
    
    @commands.command()
    @commands.has_permissions(manage_channels=True)
    async def slowmode(self, ctx, seconds: int):
        """Set the slowmode delay for the current channel"""
        if seconds < 0 or seconds > 21600:
            await ctx.send("Slowmode delay must be between 0 and 21600 seconds (6 hours).")
            return
        
        await ctx.channel.edit(slowmode_delay=seconds)
        
        if seconds == 0:
            await ctx.send("Slowmode disabled.")
        else:
            await ctx.send(f"Slowmode set to {seconds} seconds.")
    
    @commands.command()
    @commands.has_permissions(manage_channels=True)
    async def lock(self, ctx, channel: discord.TextChannel = None):
        """Lock a channel to prevent members from sending messages"""
        channel = channel or ctx.channel
        
        # Get the default role (@everyone)
        default_role = ctx.guild.default_role
        
        # Modify channel permissions
        await channel.set_permissions(default_role, send_messages=False)
        
        await ctx.send(f"🔒 {channel.mention} has been locked.")
    
    @commands.command()
    @commands.has_permissions(manage_channels=True)
    async def unlock(self, ctx, channel: discord.TextChannel = None):
        """Unlock a channel to allow members to send messages"""
        channel = channel or ctx.channel
        
        # Get the default role (@everyone)
        default_role = ctx.guild.default_role
        
        # Modify channel permissions
        await channel.set_permissions(default_role, send_messages=None)  # Reset to default
        
        await ctx.send(f"🔓 {channel.mention} has been unlocked.")

def setup(bot):
    bot.add_cog(Moderation(bot))