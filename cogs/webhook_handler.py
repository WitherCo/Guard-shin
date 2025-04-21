import discord
from discord.ext import commands, tasks
import json
import os
import logging
import asyncio
import time

# Setup logging
logger = logging.getLogger('guard-shin.webhook_handler')

class WebhookHandler(commands.Cog):
    """Handler for premium subscription webhooks"""
    
    def __init__(self, bot):
        self.bot = bot
        self.premium_updates_file = 'premium_updates.json'
        self.last_checked = 0
        
        # Start background task to check for premium updates
        self.check_premium_updates.start()
    
    def cog_unload(self):
        """Called when the cog is unloaded"""
        self.check_premium_updates.cancel()
    
    @tasks.loop(seconds=60.0)
    async def check_premium_updates(self):
        """Periodically check for premium updates"""
        try:
            # Skip if file doesn't exist
            if not os.path.exists(self.premium_updates_file):
                return
                
            # Load updates
            updates = []
            try:
                with open(self.premium_updates_file, 'r') as f:
                    content = f.read().strip()
                    if content:
                        updates = json.loads(content)
            except Exception as e:
                logger.error(f"Error loading premium updates: {e}")
                return
                
            # Process unprocessed updates
            unprocessed = [update for update in updates if not update.get('processed', False)]
            
            if unprocessed:
                logger.info(f"Found {len(unprocessed)} unprocessed premium updates")
                
                for update in unprocessed:
                    try:
                        # Get guild ID and check if it exists
                        guild_id = int(update.get('guild_id'))
                        guild = self.bot.get_guild(guild_id)
                        
                        if not guild:
                            logger.warning(f"Guild {guild_id} not found, will process later")
                            continue
                            
                        # Get premium tier
                        tier = update.get('tier')
                        expires = update.get('expires', 0)
                        
                        # Process the update
                        await self.process_premium_update(guild, tier, expires)
                        
                        # Mark as processed
                        update['processed'] = True
                        logger.info(f"Processed premium update for guild {guild_id}")
                        
                    except Exception as e:
                        logger.error(f"Error processing update for guild {update.get('guild_id')}: {e}")
                
                # Save updates back to file
                try:
                    with open(self.premium_updates_file, 'w') as f:
                        json.dump(updates, f, indent=2)
                except Exception as e:
                    logger.error(f"Error saving premium updates: {e}")
        
        except Exception as e:
            logger.error(f"Error in check_premium_updates task: {e}")
    
    @check_premium_updates.before_loop
    async def before_check_premium_updates(self):
        """Wait until the bot is ready before starting the task"""
        await self.bot.wait_until_ready()
        
    async def process_premium_update(self, guild, tier, expires):
        """Process a premium update for a guild"""
        try:
            # Get the premium cog
            premium_cog = self.bot.get_cog('Premium')
            if not premium_cog:
                logger.error(f"Premium cog not found")
                return False
                
            # Update premium status
            if tier:
                # Add or update premium
                await premium_cog.add_premium(guild.id, tier, expires)
                
                # Send notification to guild
                try:
                    # Try to find a suitable channel to send notification
                    channel = None
                    
                    # First try to find a "premium" or "bot" channel
                    for ch in guild.text_channels:
                        if ch.permissions_for(guild.me).send_messages:
                            if "premium" in ch.name.lower() or "bot" in ch.name.lower():
                                channel = ch
                                break
                    
                    # If not found, try system channel
                    if not channel and guild.system_channel and guild.system_channel.permissions_for(guild.me).send_messages:
                        channel = guild.system_channel
                    
                    # If still not found, use the first channel where the bot can send messages
                    if not channel:
                        for ch in guild.text_channels:
                            if ch.permissions_for(guild.me).send_messages:
                                channel = ch
                                break
                    
                    if channel:
                        # Create embed
                        embed = discord.Embed(
                            title="🎉 Premium Activated!",
                            description=f"Thank you for purchasing Guard-shin Premium! Your server now has access to premium features.",
                            color=0x8249F0
                        )
                        
                        # Add tier info
                        tier_name = tier.capitalize()
                        embed.add_field(name="Tier", value=tier_name)
                        
                        # Add expiry info
                        if expires > 0:
                            expiry_date = time.strftime('%Y-%m-%d', time.localtime(expires))
                            embed.add_field(name="Expires", value=expiry_date)
                        
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
                        embed.set_footer(text="Use g!premium to view your premium status and features")
                        
                        await channel.send(embed=embed)
                    
                except Exception as e:
                    logger.error(f"Error sending premium notification to guild {guild.id}: {e}")
            else:
                # Remove premium
                await premium_cog.remove_premium(guild.id)
                
                # Try to send notification
                try:
                    # Find a channel
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
                    logger.error(f"Error sending premium expiry notification to guild {guild.id}: {e}")
            
            return True
            
        except Exception as e:
            logger.error(f"Error processing premium update for guild {guild.id}: {e}")
            return False

async def setup(bot):
    """Add the WebhookHandler cog to the bot"""
    await bot.add_cog(WebhookHandler(bot))