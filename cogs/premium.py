import discord
from discord.ext import commands, tasks
import json
import os
import logging
import asyncio
import time

# Setup logging
logger = logging.getLogger('guard-shin.premium')

class Premium(commands.Cog):
    """Premium commands and functionality"""
    
    def __init__(self, bot):
        self.bot = bot
        self.premium_guilds_file = 'premium_guilds.json'
        self.premium_guilds = {}
        self.load_premium_guilds()
        
        # Start the premium check task
        self.check_premium_expirations.start()
    
    def cog_unload(self):
        """Called when the cog is unloaded"""
        self.check_premium_expirations.cancel()
    
    def load_premium_guilds(self):
        """Load premium guilds from file"""
        try:
            if os.path.exists(self.premium_guilds_file):
                with open(self.premium_guilds_file, 'r') as f:
                    content = f.read().strip()
                    if content:
                        self.premium_guilds = json.loads(content)
                    else:
                        self.premium_guilds = {}
                logger.info(f"Loaded premium status for {len(self.premium_guilds)} guilds")
            else:
                logger.info("No premium guilds file found, creating new one")
                self.premium_guilds = {}
                self.save_premium_guilds()
        except Exception as e:
            logger.error(f"Error loading premium guilds: {e}")
            self.premium_guilds = {}
    
    def save_premium_guilds(self):
        """Save premium guilds to file"""
        try:
            with open(self.premium_guilds_file, 'w') as f:
                json.dump(self.premium_guilds, f, indent=2)
            logger.info(f"Saved premium status for {len(self.premium_guilds)} guilds")
            return True
        except Exception as e:
            logger.error(f"Error saving premium guilds: {e}")
            return False
    
    def is_premium(self, guild_id):
        """Check if a guild has premium status"""
        guild_id = str(guild_id)
        
        # Check if the guild is in premium guilds
        if guild_id not in self.premium_guilds:
            return False
            
        # Check if premium has expired
        expires = self.premium_guilds[guild_id].get('expires', 0)
        
        # If expires is 0, premium is permanent
        if expires == 0:
            return True
            
        # Check if premium has expired
        now = int(time.time())
        if expires <= now:
            return False
            
        return True
    
    def get_tier(self, guild_id):
        """Get the premium tier for a guild"""
        guild_id = str(guild_id)
        
        # Check if the guild is premium
        if not self.is_premium(guild_id):
            return None
            
        # Return the tier
        return self.premium_guilds[guild_id].get('tier', 'basic')
    
    async def add_premium(self, guild_id, tier='basic', expires=0):
        """Add or update premium for a guild"""
        guild_id = str(guild_id)
        
        # If expires is not set, set it to 30 days from now
        if not expires:
            # 30 days from now
            expires = int(time.time()) + (30 * 24 * 60 * 60)
            
        # Add or update premium
        self.premium_guilds[guild_id] = {
            'tier': tier,
            'expires': expires,
            'activated': int(time.time())
        }
        
        # Save premium guilds
        self.save_premium_guilds()
        
        logger.info(f"Added premium for guild {guild_id} (tier: {tier}, expires: {expires})")
        return True
    
    async def remove_premium(self, guild_id):
        """Remove premium from a guild"""
        guild_id = str(guild_id)
        
        # Check if the guild is premium
        if guild_id not in self.premium_guilds:
            return False
            
        # Remove premium
        del self.premium_guilds[guild_id]
        
        # Save premium guilds
        self.save_premium_guilds()
        
        logger.info(f"Removed premium for guild {guild_id}")
        return True
    
    @tasks.loop(hours=1.0)
    async def check_premium_expirations(self):
        """Check for expired premium guilds"""
        try:
            # Current time
            now = int(time.time())
            
            # Find expired guilds
            expired_guilds = []
            for guild_id, info in self.premium_guilds.items():
                expires = info.get('expires', 0)
                if expires > 0 and expires <= now:
                    expired_guilds.append(guild_id)
            
            # Remove expired guilds
            for guild_id in expired_guilds:
                logger.info(f"Premium expired for guild {guild_id}")
                await self.remove_premium(guild_id)
                
                # Try to send expiration notification
                try:
                    guild = self.bot.get_guild(int(guild_id))
                    if guild:
                        # Find a channel to send notification
                        channel = None
                        if guild.system_channel and guild.system_channel.permissions_for(guild.me).send_messages:
                            channel = guild.system_channel
                        else:
                            for ch in guild.text_channels:
                                if ch.permissions_for(guild.me).send_messages:
                                    channel = ch
                                    break
                        
                        if channel:
                            embed = discord.Embed(
                                title="Premium Expired",
                                description="Your Guard-shin Premium subscription has expired. You no longer have access to premium features.",
                                color=discord.Color.orange()
                            )
                            embed.add_field(name="Renew Premium", value="Visit https://witherco.github.io/Guard-shin/ to renew your premium subscription.")
                            embed.set_footer(text="Thank you for using Guard-shin!")
                            
                            await channel.send(embed=embed)
                except Exception as e:
                    logger.error(f"Error sending premium expiration notification to guild {guild_id}: {e}")
        
        except Exception as e:
            logger.error(f"Error checking premium expirations: {e}")
    
    @check_premium_expirations.before_loop
    async def before_check_premium_expirations(self):
        """Wait until the bot is ready before starting the task"""
        await self.bot.wait_until_ready()
    
    @commands.command(name="premium")
    async def premium_command(self, ctx):
        """View premium status and features"""
        # Check if guild has premium
        is_premium = self.is_premium(ctx.guild.id)
        tier = self.get_tier(ctx.guild.id) if is_premium else None
        
        if is_premium:
            # Get premium info
            guild_id = str(ctx.guild.id)
            expires = self.premium_guilds[guild_id].get('expires', 0)
            activated = self.premium_guilds[guild_id].get('activated', 0)
            
            # Create embed
            embed = discord.Embed(
                title="Premium Status",
                description=f"{ctx.guild.name} has Guard-shin Premium!",
                color=0x8249F0
            )
            
            # Add tier info
            tier_name = tier.capitalize()
            embed.add_field(name="Tier", value=tier_name)
            
            # Add activation date
            if activated > 0:
                activation_date = time.strftime('%Y-%m-%d', time.localtime(activated))
                embed.add_field(name="Activated", value=activation_date)
            
            # Add expiry date
            if expires > 0:
                expiry_date = time.strftime('%Y-%m-%d', time.localtime(expires))
                embed.add_field(name="Expires", value=expiry_date)
            else:
                embed.add_field(name="Expires", value="Never")
            
            # Add features based on tier
            if tier == "basic":
                features = "• 5 Music Channels\n• Basic Anti-Raid Protection\n• Custom Welcome Messages"
            elif tier == "standard":
                features = "• 10 Music Channels\n• Advanced Anti-Raid Protection\n• Auto-Response System\n• Custom Bot Prefix\n• Discord Server Backup"
            elif tier == "professional":
                features = "• Unlimited Music Channels\n• Priority Support\n• Custom Commands\n• Custom Bot Branding\n• All Standard Features\n• Advanced Analytics"
            else:
                features = "• Premium Features"
                
            embed.add_field(name="Features", value=features, inline=False)
            
            # Add footer
            embed.set_footer(text="Thank you for supporting Guard-shin!")
            
        else:
            # Create embed for non-premium guild
            embed = discord.Embed(
                title="Premium Status",
                description=f"{ctx.guild.name} does not have Guard-shin Premium.",
                color=discord.Color.light_grey()
            )
            
            # Add upgrade info
            embed.add_field(
                name="Upgrade to Premium",
                value="Visit https://witherco.github.io/Guard-shin/ to upgrade to premium and unlock additional features!",
                inline=False
            )
            
            # Add features info
            embed.add_field(
                name="Premium Features",
                value="• Music Commands\n• Advanced Anti-Raid Protection\n• Custom Welcome Messages\n• Auto-Response System\n• Custom Bot Prefix\n• Discord Server Backup\n• And more!",
                inline=False
            )
            
            # Add footer
            embed.set_footer(text="Support Guard-shin's development and unlock powerful features!")
        
        await ctx.send(embed=embed)
    
    @commands.command(name="add_premium")
    @commands.is_owner()
    async def add_premium_command(self, ctx, guild_id: int, tier: str = "basic", days: int = 30):
        """Add premium to a guild (Bot owner only)"""
        # Calculate expiry time
        if days <= 0:
            expires = 0  # Never expires
        else:
            expires = int(time.time()) + (days * 24 * 60 * 60)
            
        # Add premium
        success = await self.add_premium(guild_id, tier, expires)
        
        if success:
            await ctx.send(f"Added premium tier '{tier}' for guild {guild_id} (expires in {days} days)")
        else:
            await ctx.send(f"Failed to add premium for guild {guild_id}")
    
    @commands.command(name="remove_premium")
    @commands.is_owner()
    async def remove_premium_command(self, ctx, guild_id: int):
        """Remove premium from a guild (Bot owner only)"""
        # Remove premium
        success = await self.remove_premium(guild_id)
        
        if success:
            await ctx.send(f"Removed premium from guild {guild_id}")
        else:
            await ctx.send(f"Failed to remove premium from guild {guild_id}")

async def setup(bot):
    """Add the Premium cog to the bot"""
    await bot.add_cog(Premium(bot))