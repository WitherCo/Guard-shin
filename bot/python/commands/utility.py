import discord
from discord.ext import commands
from discord import app_commands
import asyncio
import datetime
import platform
import time
import logging
import os
import sys
import psutil
from typing import Optional, List

logger = logging.getLogger('guard-shin')

class Utility(commands.Cog):
    """Utility commands for general bot usage"""

    def __init__(self, bot):
        self.bot = bot
        self.bot_start_time = datetime.datetime.now()
        
        # Register slash commands
        self._register_slash_commands()
    
    def _register_slash_commands(self):
        """Register slash commands with the bot"""
        # Ping command
        @self.bot.tree.command(name="ping", description="Check the bot's latency")
        async def ping_slash(interaction: discord.Interaction):
            await self._ping_logic(interaction)
        
        # Info command
        @self.bot.tree.command(name="info", description="Get information about the bot")
        async def info_slash(interaction: discord.Interaction):
            await self._info_logic(interaction)
        
        # Avatar command
        @self.bot.tree.command(name="avatar", description="Get a user's avatar")
        @app_commands.describe(user="The user whose avatar you want to see")
        async def avatar_slash(interaction: discord.Interaction, user: Optional[discord.Member] = None):
            await self._avatar_logic(interaction, user or interaction.user)
        
        # User info command
        @self.bot.tree.command(name="userinfo", description="Get information about a user")
        @app_commands.describe(user="The user you want information about")
        async def userinfo_slash(interaction: discord.Interaction, user: Optional[discord.Member] = None):
            await self._userinfo_logic(interaction, user or interaction.user)
        
        # Server info command
        @self.bot.tree.command(name="serverinfo", description="Get information about the server")
        async def serverinfo_slash(interaction: discord.Interaction):
            await self._serverinfo_logic(interaction)
    
    async def _ping_logic(self, ctx_or_interaction):
        """Shared logic for ping command"""
        is_interaction = isinstance(ctx_or_interaction, discord.Interaction)
        
        start_time = time.time()
        
        if is_interaction:
            # For slash commands
            await ctx_or_interaction.response.send_message("Pinging...")
            message = await ctx_or_interaction.original_response()
        else:
            # For prefix commands
            message = await ctx_or_interaction.send("Pinging...")
        
        end_time = time.time()
        
        # Calculate round-trip and API latency
        api_latency = round(self.bot.latency * 1000)
        round_trip = round((end_time - start_time) * 1000)
        
        # Create embed
        embed = discord.Embed(
            title="🏓 Pong!",
            color=discord.Color.green(),
            timestamp=discord.utils.utcnow()
        )
        
        embed.add_field(name="Bot Latency", value=f"{round_trip}ms", inline=True)
        embed.add_field(name="API Latency", value=f"{api_latency}ms", inline=True)
        
        # Edit the message with the embed
        if is_interaction:
            await message.edit(content=None, embed=embed)
        else:
            await message.edit(content=None, embed=embed)
    
    async def _info_logic(self, ctx_or_interaction):
        """Shared logic for info command"""
        is_interaction = isinstance(ctx_or_interaction, discord.Interaction)
        
        # Get bot's guild count
        guild_count = len(self.bot.guilds)
        
        # Calculate total members (unique)
        user_count = sum(g.member_count for g in self.bot.guilds)
        
        # Calculate uptime
        uptime = datetime.datetime.now() - self.bot_start_time
        uptime_str = str(uptime).split('.')[0]  # Remove microseconds
        
        # Create embed
        embed = discord.Embed(
            title=f"{self.bot.user.name} Info",
            description="A Wick-like moderation bot built with Python",
            color=discord.Color.blue(),
            timestamp=discord.utils.utcnow()
        )
        
        # Add bot avatar
        embed.set_thumbnail(url=self.bot.user.display_avatar.url)
        
        # Basic info
        embed.add_field(name="Bot ID", value=self.bot.user.id, inline=True)
        embed.add_field(name="Servers", value=guild_count, inline=True)
        embed.add_field(name="Users", value=user_count, inline=True)
        
        # Technical info
        embed.add_field(name="Python Version", value=platform.python_version(), inline=True)
        embed.add_field(name="Discord.py Version", value=discord.__version__, inline=True)
        embed.add_field(name="Uptime", value=uptime_str, inline=True)
        
        # System info
        embed.add_field(name="CPU Usage", value=f"{psutil.cpu_percent()}%", inline=True)
        embed.add_field(name="Memory Usage", value=f"{psutil.virtual_memory().percent}%", inline=True)
        embed.add_field(name="Platform", value=platform.system(), inline=True)
        
        # Send the embed
        if is_interaction:
            await ctx_or_interaction.response.send_message(embed=embed)
        else:
            await ctx_or_interaction.send(embed=embed)
    
    async def _avatar_logic(self, ctx_or_interaction, user):
        """Shared logic for avatar command"""
        is_interaction = isinstance(ctx_or_interaction, discord.Interaction)
        
        # Create embed
        embed = discord.Embed(
            title=f"{user}'s Avatar",
            color=user.color if hasattr(user, "color") else discord.Color.blue(),
            timestamp=discord.utils.utcnow()
        )
        
        # Add avatar
        embed.set_image(url=user.display_avatar.url)
        
        # Add links for different formats
        formats = []
        if "webp" in user.display_avatar.url:
            formats.append(f"[WebP]({user.display_avatar.with_format('webp')})")
        if "png" in user.display_avatar.url or True:  # PNG is always available
            formats.append(f"[PNG]({user.display_avatar.with_format('png')})")
        if "jpg" in user.display_avatar.url or "jpeg" in user.display_avatar.url:
            formats.append(f"[JPG]({user.display_avatar.with_format('jpg')})")
        if "gif" in user.display_avatar.url and user.display_avatar.is_animated():
            formats.append(f"[GIF]({user.display_avatar.with_format('gif')})")
        
        if formats:
            embed.add_field(name="Links", value=" | ".join(formats), inline=False)
        
        # Send the embed
        if is_interaction:
            await ctx_or_interaction.response.send_message(embed=embed)
        else:
            await ctx_or_interaction.send(embed=embed)
    
    async def _userinfo_logic(self, ctx_or_interaction, user):
        """Shared logic for userinfo command"""
        is_interaction = isinstance(ctx_or_interaction, discord.Interaction)
        
        # Create embed
        embed = discord.Embed(
            title=f"User Info - {user}",
            color=user.color if hasattr(user, "color") else discord.Color.blue(),
            timestamp=discord.utils.utcnow()
        )
        
        # Add user avatar
        embed.set_thumbnail(url=user.display_avatar.url)
        
        # Basic info
        embed.add_field(name="User ID", value=user.id, inline=True)
        embed.add_field(name="Display Name", value=user.display_name, inline=True)
        embed.add_field(name="Bot", value="Yes" if user.bot else "No", inline=True)
        
        # Account info
        created_at = int(user.created_at.timestamp())
        embed.add_field(name="Account Created", value=f"<t:{created_at}:R> (<t:{created_at}:F>)", inline=False)
        
        # Server-specific info (if user is a member)
        if hasattr(user, "joined_at") and user.joined_at:
            joined_at = int(user.joined_at.timestamp())
            embed.add_field(name="Joined Server", value=f"<t:{joined_at}:R> (<t:{joined_at}:F>)", inline=False)
        
        # Role info (if user is a member)
        if hasattr(user, "roles") and len(user.roles) > 1:  # Exclude @everyone
            role_str = ""
            roles = [role.mention for role in reversed(user.roles) if role.name != "@everyone"]
            
            if len(roles) > 10:
                # If there are too many roles, show the top 10 and count
                role_str = ", ".join(roles[:10]) + f"... and {len(roles) - 10} more"
            else:
                role_str = ", ".join(roles)
            
            embed.add_field(name=f"Roles [{len(roles)}]", value=role_str or "None", inline=False)
        
        # Send the embed
        if is_interaction:
            await ctx_or_interaction.response.send_message(embed=embed)
        else:
            await ctx_or_interaction.send(embed=embed)
    
    async def _serverinfo_logic(self, ctx_or_interaction):
        """Shared logic for serverinfo command"""
        is_interaction = isinstance(ctx_or_interaction, discord.Interaction)
        
        # Get the guild
        if is_interaction:
            guild = ctx_or_interaction.guild
        else:
            guild = ctx_or_interaction.guild
        
        if not guild:
            response = "This command can only be used in a server."
            if is_interaction:
                await ctx_or_interaction.response.send_message(response, ephemeral=True)
            else:
                await ctx_or_interaction.send(response)
            return
        
        # Create embed
        embed = discord.Embed(
            title=f"Server Info - {guild.name}",
            color=discord.Color.blue(),
            timestamp=discord.utils.utcnow()
        )
        
        # Add server icon
        if guild.icon:
            embed.set_thumbnail(url=guild.icon.url)
        
        # Basic info
        embed.add_field(name="Server ID", value=guild.id, inline=True)
        embed.add_field(name="Owner", value=f"{guild.owner}", inline=True)
        embed.add_field(name="Created", value=f"<t:{int(guild.created_at.timestamp())}:R>", inline=True)
        
        # Member counts
        total_members = guild.member_count
        human_count = sum(1 for m in guild.members if not m.bot)
        bot_count = sum(1 for m in guild.members if m.bot)
        
        embed.add_field(name="Total Members", value=total_members, inline=True)
        embed.add_field(name="Humans", value=human_count, inline=True)
        embed.add_field(name="Bots", value=bot_count, inline=True)
        
        # Channel counts
        text_channels = len(guild.text_channels)
        voice_channels = len(guild.voice_channels)
        categories = len(guild.categories)
        
        embed.add_field(name="Text Channels", value=text_channels, inline=True)
        embed.add_field(name="Voice Channels", value=voice_channels, inline=True)
        embed.add_field(name="Categories", value=categories, inline=True)
        
        # Role count
        embed.add_field(name="Roles", value=len(guild.roles), inline=True)
        
        # Boost info
        embed.add_field(name="Boost Level", value=f"Level {guild.premium_tier}", inline=True)
        embed.add_field(name="Boosts", value=guild.premium_subscription_count, inline=True)
        
        # Send the embed
        if is_interaction:
            await ctx_or_interaction.response.send_message(embed=embed)
        else:
            await ctx_or_interaction.send(embed=embed)
    
    @commands.command()
    async def ping(self, ctx):
        """Check the bot's latency"""
        await self._ping_logic(ctx)
    
    @commands.command()
    async def info(self, ctx):
        """Get information about the bot"""
        await self._info_logic(ctx)
    
    @commands.command()
    async def avatar(self, ctx, *, user: Optional[discord.Member] = None):
        """Get a user's avatar
        
        Examples:
        !avatar
        !avatar @user
        """
        await self._avatar_logic(ctx, user or ctx.author)
    
    @commands.command()
    async def userinfo(self, ctx, *, user: Optional[discord.Member] = None):
        """Get information about a user
        
        Examples:
        !userinfo
        !userinfo @user
        """
        await self._userinfo_logic(ctx, user or ctx.author)
    
    @commands.command(aliases=["guildinfo", "server"])
    async def serverinfo(self, ctx):
        """Get information about the server"""
        await self._serverinfo_logic(ctx)

async def setup(bot):
    await bot.add_cog(Utility(bot))