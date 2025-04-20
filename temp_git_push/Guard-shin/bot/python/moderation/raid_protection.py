import discord
from discord.ext import commands
import asyncio
import datetime
import logging
from collections import deque
import json
import os

logger = logging.getLogger('guard-shin')

class RaidProtection(commands.Cog):
    def __init__(self, bot):
        self.bot = bot
        self.recent_joins = {}  # guild_id -> deque of join timestamps
        self.lockdowns = {}  # guild_id -> lockdown status
        self.settings = {}  # guild_id -> settings
        self.load_settings()
    
    def load_settings(self):
        """Load raid protection settings from storage"""
        # This would normally load from a database
        # For now, we'll use default settings for all guilds
        default_settings = {
            'enabled': True,
            'join_threshold': 10,  # Number of joins to trigger
            'time_threshold': 60,  # Time window in seconds
            'action': 'lockdown',  # lockdown, kick, ban
            'notification_channel': None,
            'auto_lockdown': True,
            'lockdown_duration': 300  # 5 minutes
        }
        
        for guild in self.bot.guilds:
            self.settings[guild.id] = default_settings.copy()
            self.recent_joins[guild.id] = deque(maxlen=100)  # Store up to 100 recent joins
    
    @commands.Cog.listener()
    async def on_member_join(self, member):
        """Track member joins to detect potential raids"""
        guild = member.guild
        now = discord.utils.utcnow()
        
        # Skip if raid protection is disabled for this guild
        if not self.settings.get(guild.id, {}).get('enabled', False):
            return
        
        # Add join to recent joins
        self.recent_joins.setdefault(guild.id, deque(maxlen=100)).append((member.id, now))
        
        # Check for raid conditions
        await self.check_raid_conditions(guild)
    
    async def check_raid_conditions(self, guild):
        """Check if current join patterns indicate a raid"""
        settings = self.settings.get(guild.id, {})
        if not settings.get('enabled', False):
            return False
        
        # Get join threshold and time threshold from settings
        join_threshold = settings.get('join_threshold', 10)
        time_threshold = settings.get('time_threshold', 60)
        
        # Get recent joins within the time threshold
        now = discord.utils.utcnow()
        recent_joins = self.recent_joins.get(guild.id, deque())
        
        # Filter joins within the time window
        joins_in_window = [(user_id, timestamp) for user_id, timestamp in recent_joins
                          if (now - timestamp).total_seconds() <= time_threshold]
        
        # Check if we've exceeded the threshold
        if len(joins_in_window) >= join_threshold:
            logger.warning(f"Potential raid detected in {guild.name} ({guild.id}): {len(joins_in_window)} joins in {time_threshold}s")
            
            # Take action based on settings
            if settings.get('auto_lockdown', True):
                await self.lockdown_guild(guild, 
                                          duration=settings.get('lockdown_duration', 300),
                                          reason="Potential raid detected")
            
            # Notify the server staff
            await self.notify_staff(guild, joins_in_window)
            return True
        
        return False
    
    async def lockdown_guild(self, guild, duration=300, reason="Raid protection"):
        """Place the guild in lockdown mode"""
        logger.info(f"Placing {guild.name} ({guild.id}) in lockdown for {duration} seconds")
        
        # Don't lockdown if already in lockdown
        if self.lockdowns.get(guild.id, False):
            return
        
        self.lockdowns[guild.id] = True
        
        # Update permissions for all channels to prevent new members from speaking
        try:
            # Get the @everyone role
            everyone_role = guild.default_role
            
            # Store original permissions for later restore
            original_perms = {}
            
            # Modify permissions for all text channels
            for channel in guild.text_channels:
                original_perms[channel.id] = channel.overwrites_for(everyone_role)
                overwrites = channel.overwrites_for(everyone_role)
                overwrites.send_messages = False
                await channel.set_permissions(everyone_role, overwrite=overwrites, reason=reason)
            
            # Notify that the server is in lockdown
            notification_channel_id = self.settings.get(guild.id, {}).get('notification_channel')
            if notification_channel_id:
                channel = guild.get_channel(int(notification_channel_id))
                if channel:
                    embed = discord.Embed(
                        title="🔒 Server Lockdown",
                        description=f"This server has been placed in lockdown mode for {duration} seconds due to potential raid activity.",
                        color=discord.Color.red()
                    )
                    embed.add_field(name="Reason", value=reason)
                    embed.add_field(name="Duration", value=f"{duration} seconds")
                    embed.add_field(name="Automatic Unlock", value=f"<t:{int((discord.utils.utcnow() + datetime.timedelta(seconds=duration)).timestamp())}:R>")
                    await channel.send(embed=embed)
            
            # Schedule unlock after the specified duration
            await asyncio.sleep(duration)
            
            # Remove lockdown
            await self.unlock_guild(guild, original_perms, reason="Lockdown duration expired")
        
        except Exception as e:
            logger.error(f"Error during lockdown: {e}")
            self.lockdowns[guild.id] = False
    
    async def unlock_guild(self, guild, original_perms=None, reason="Lockdown ended"):
        """Remove the guild from lockdown mode"""
        logger.info(f"Removing lockdown from {guild.name} ({guild.id})")
        
        # Skip if not in lockdown
        if not self.lockdowns.get(guild.id, False):
            return
        
        try:
            # Get the @everyone role
            everyone_role = guild.default_role
            
            # Restore original permissions
            if original_perms:
                for channel_id, overwrites in original_perms.items():
                    channel = guild.get_channel(channel_id)
                    if channel:
                        await channel.set_permissions(everyone_role, overwrite=overwrites, reason=reason)
            
            # Or just enable messages for all channels
            else:
                for channel in guild.text_channels:
                    overwrites = channel.overwrites_for(everyone_role)
                    overwrites.send_messages = None  # Reset to default
                    await channel.set_permissions(everyone_role, overwrite=overwrites, reason=reason)
            
            # Notify that the lockdown is over
            notification_channel_id = self.settings.get(guild.id, {}).get('notification_channel')
            if notification_channel_id:
                channel = guild.get_channel(int(notification_channel_id))
                if channel:
                    embed = discord.Embed(
                        title="🔓 Lockdown Ended",
                        description="The server lockdown has been lifted.",
                        color=discord.Color.green()
                    )
                    embed.add_field(name="Reason", value=reason)
                    await channel.send(embed=embed)
            
            # Update lockdown status
            self.lockdowns[guild.id] = False
        
        except Exception as e:
            logger.error(f"Error during unlock: {e}")
    
    async def notify_staff(self, guild, suspicious_joins):
        """Notify server staff about suspicious join activity"""
        # Get notification channel from settings
        notification_channel_id = self.settings.get(guild.id, {}).get('notification_channel')
        if not notification_channel_id:
            # Try to find a logging or mod channel if none specified
            potential_channels = ["mod-log", "logs", "audit-log", "security", "raid-alerts", "staff-alerts"]
            for ch_name in potential_channels:
                channel = discord.utils.get(guild.text_channels, name=ch_name)
                if channel:
                    notification_channel_id = channel.id
                    break
        
        if notification_channel_id:
            channel = guild.get_channel(int(notification_channel_id))
            if channel:
                # Create an embed with the raid information
                embed = discord.Embed(
                    title="🚨 Potential Raid Detected",
                    description=f"{len(suspicious_joins)} members joined in a short time period.",
                    color=discord.Color.red()
                )
                
                # List recent members (up to 15)
                recent_members = []
                for user_id, timestamp in list(suspicious_joins)[-15:]:
                    member = guild.get_member(user_id)
                    if member:
                        account_age = (discord.utils.utcnow() - member.created_at).days
                        recent_members.append(f"{member.mention} (Age: {account_age} days)")
                
                if recent_members:
                    embed.add_field(name="Recent Joins", value="\n".join(recent_members), inline=False)
                
                # Add timestamp
                embed.timestamp = discord.utils.utcnow()
                
                await channel.send(embed=embed)
    
    @commands.command(name="raidmode")
    @commands.has_permissions(administrator=True)
    async def raidmode(self, ctx, setting="status"):
        """Toggle or check raid protection mode"""
        guild = ctx.guild
        
        # Initialize settings if they don't exist
        if guild.id not in self.settings:
            self.settings[guild.id] = {
                'enabled': True,
                'join_threshold': 10,
                'time_threshold': 60,
                'action': 'lockdown',
                'notification_channel': None,
                'auto_lockdown': True,
                'lockdown_duration': 300
            }
        
        # Check status
        if setting.lower() in ["status", "check"]:
            settings = self.settings[guild.id]
            
            embed = discord.Embed(
                title="Raid Protection Status",
                color=discord.Color.blue()
            )
            
            embed.add_field(name="Enabled", value="✅ Yes" if settings.get('enabled', False) else "❌ No")
            embed.add_field(name="Join Threshold", value=f"{settings.get('join_threshold', 10)} joins")
            embed.add_field(name="Time Window", value=f"{settings.get('time_threshold', 60)} seconds")
            embed.add_field(name="Auto-Lockdown", value="✅ Yes" if settings.get('auto_lockdown', False) else "❌ No")
            embed.add_field(name="Lockdown Duration", value=f"{settings.get('lockdown_duration', 300)} seconds")
            
            notification_channel_id = settings.get('notification_channel')
            notification_channel = "None"
            if notification_channel_id:
                channel = guild.get_channel(int(notification_channel_id))
                notification_channel = f"#{channel.name}" if channel else "Invalid Channel"
            
            embed.add_field(name="Notification Channel", value=notification_channel)
            
            await ctx.send(embed=embed)
            return
        
        # Toggle on/off
        elif setting.lower() in ["on", "enable", "true", "yes"]:
            self.settings[guild.id]['enabled'] = True
            await ctx.send("✅ Raid protection has been **enabled**.")
        
        elif setting.lower() in ["off", "disable", "false", "no"]:
            self.settings[guild.id]['enabled'] = False
            await ctx.send("❌ Raid protection has been **disabled**.")
        
        # Set lockdown duration
        elif setting.lower().startswith("duration:"):
            try:
                duration = int(setting.split(":", 1)[1])
                if duration < 30 or duration > 3600:
                    await ctx.send("⚠️ Lockdown duration must be between 30 seconds and 1 hour (3600 seconds).")
                    return
                
                self.settings[guild.id]['lockdown_duration'] = duration
                await ctx.send(f"✅ Lockdown duration set to **{duration} seconds**.")
            
            except ValueError:
                await ctx.send("⚠️ Invalid duration. Please specify a number of seconds.")
        
        # Set join threshold
        elif setting.lower().startswith("joins:"):
            try:
                threshold = int(setting.split(":", 1)[1])
                if threshold < 3 or threshold > 100:
                    await ctx.send("⚠️ Join threshold must be between 3 and 100 joins.")
                    return
                
                self.settings[guild.id]['join_threshold'] = threshold
                await ctx.send(f"✅ Join threshold set to **{threshold} joins**.")
            
            except ValueError:
                await ctx.send("⚠️ Invalid threshold. Please specify a number of joins.")
        
        # Set time window
        elif setting.lower().startswith("window:"):
            try:
                window = int(setting.split(":", 1)[1])
                if window < 10 or window > 600:
                    await ctx.send("⚠️ Time window must be between 10 and 600 seconds.")
                    return
                
                self.settings[guild.id]['time_threshold'] = window
                await ctx.send(f"✅ Time window set to **{window} seconds**.")
            
            except ValueError:
                await ctx.send("⚠️ Invalid window. Please specify a number of seconds.")
        
        else:
            await ctx.send("⚠️ Invalid setting. Use `on`, `off`, `status`, `duration:X`, `joins:X`, or `window:X`.")
    
    @commands.command(name="lockdown")
    @commands.has_permissions(administrator=True)
    async def lockdown(self, ctx, duration: int = 300, *, reason="Manual lockdown"):
        """Manually place the server in lockdown mode"""
        if duration < 30:
            await ctx.send("⚠️ Lockdown duration must be at least 30 seconds.")
            return
        
        if duration > 3600:
            await ctx.send("⚠️ Lockdown duration cannot exceed 1 hour (3600 seconds).")
            return
        
        await ctx.send(f"🔒 Placing server in lockdown for {duration} seconds...")
        
        # Set notification channel for this lockdown
        if ctx.guild.id in self.settings:
            self.settings[ctx.guild.id]['notification_channel'] = str(ctx.channel.id)
        
        # Execute lockdown
        await self.lockdown_guild(ctx.guild, duration=duration, reason=reason)
    
    @commands.command(name="unlock")
    @commands.has_permissions(administrator=True)
    async def unlock(self, ctx, *, reason="Manual unlock"):
        """Manually remove the server from lockdown mode"""
        if not self.lockdowns.get(ctx.guild.id, False):
            await ctx.send("⚠️ The server is not currently in lockdown.")
            return
        
        await ctx.send("🔓 Removing server lockdown...")
        
        # Set notification channel for this unlock
        if ctx.guild.id in self.settings:
            self.settings[ctx.guild.id]['notification_channel'] = str(ctx.channel.id)
        
        # Execute unlock
        await self.unlock_guild(ctx.guild, reason=reason)
    
    def cog_unload(self):
        """Save settings when the cog is unloaded"""
        # In a real implementation, we would save settings to a database here
        pass

async def setup(bot):
    await bot.add_cog(RaidProtection(bot))