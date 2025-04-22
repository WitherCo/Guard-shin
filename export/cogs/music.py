import discord
from discord.ext import commands
import wavelink
import json
import os
import logging
import asyncio

# Setup logging
logger = logging.getLogger('guard-shin.music')

class Music(commands.Cog):
    """Music commands for premium servers"""
    
    def __init__(self, bot):
        self.bot = bot
        self.music_channels_file = 'music_channels.json'
        self.music_channels = {}
        self.load_music_channels()
        
        # Music queue per guild (guild_id -> list of tracks)
        self.queues = {}
        
        # Register wavelink events
        bot.loop.create_task(self.connect_nodes())
    
    def load_music_channels(self):
        """Load music channel settings from file"""
        try:
            if os.path.exists(self.music_channels_file):
                with open(self.music_channels_file, 'r') as f:
                    self.music_channels = json.load(f)
                logger.info(f"Loaded music channels for {len(self.music_channels)} guilds")
            else:
                logger.info("No music channels file found, creating new one")
                self.music_channels = {}
                self.save_music_channels()
        except Exception as e:
            logger.error(f"Error loading music channels: {e}")
            self.music_channels = {}
    
    def save_music_channels(self):
        """Save music channel settings"""
        try:
            with open(self.music_channels_file, 'w') as f:
                json.dump(self.music_channels, f, indent=2)
            logger.info(f"Saved music channels for {len(self.music_channels)} guilds")
        except Exception as e:
            logger.error(f"Error saving music channels: {e}")
    
    async def connect_nodes(self):
        """Connect to Wavelink nodes"""
        await self.bot.wait_until_ready()
        
        try:
            await wavelink.NodePool.create_node(
                bot=self.bot,
                host='lavalink.oops.wtf',
                port=443,
                password='www.freelavalink.ga',
                https=True
            )
            logger.info("Connected to Wavelink node")
        except Exception as e:
            logger.error(f"Failed to connect to Wavelink node: {e}")
    
    def is_music_channel(self, ctx):
        """Check if the channel is designated as a music channel"""
        guild_id = str(ctx.guild.id)
        channel_id = ctx.channel.id
        
        # If no music channels are set for this guild, allow any channel
        if guild_id not in self.music_channels:
            return True
            
        # If there are no music channels configured (empty list), allow any channel
        if not self.music_channels[guild_id]:
            return True
            
        # Check if the channel is in the music channels list
        return str(channel_id) in self.music_channels[guild_id]
    
    def is_premium(self, guild_id):
        """Check if a guild has premium status"""
        premium_cog = self.bot.get_cog('Premium')
        if not premium_cog:
            return False
            
        return premium_cog.is_premium(guild_id)
    
    def get_tier_limit(self, guild_id):
        """Get the music channel limit based on premium tier"""
        premium_cog = self.bot.get_cog('Premium')
        if not premium_cog:
            return 0
            
        tier = premium_cog.get_tier(guild_id)
        
        # Set limits based on tier
        if tier == "professional":
            return -1  # Unlimited
        elif tier == "standard":
            return 10
        elif tier == "basic":
            return 5
        else:
            return 0
    
    @commands.command(name="join")
    async def join(self, ctx):
        """Join the user's voice channel"""
        # Check if the guild has premium
        if not self.is_premium(ctx.guild.id):
            embed = discord.Embed(
                title="Premium Feature",
                description="Music commands are a premium feature. Use `;premium` to learn more.",
                color=discord.Color.orange()
            )
            return await ctx.send(embed=embed)
            
        # Check if used in a music channel
        if not self.is_music_channel(ctx):
            embed = discord.Embed(
                title="Wrong Channel",
                description="This command can only be used in designated music channels.",
                color=discord.Color.red()
            )
            return await ctx.send(embed=embed)
        
        # Check if user is in a voice channel
        if not ctx.author.voice:
            embed = discord.Embed(
                title="Not Connected",
                description="You must be connected to a voice channel to use this command.",
                color=discord.Color.red()
            )
            return await ctx.send(embed=embed)
            
        # Join the voice channel
        channel = ctx.author.voice.channel
        player = await channel.connect(cls=wavelink.Player)
        
        embed = discord.Embed(
            title="Connected",
            description=f"Joined {channel.mention}",
            color=discord.Color.green()
        )
        await ctx.send(embed=embed)
    
    @commands.command(name="leave")
    async def leave(self, ctx):
        """Leave the voice channel"""
        # Check if the guild has premium
        if not self.is_premium(ctx.guild.id):
            embed = discord.Embed(
                title="Premium Feature",
                description="Music commands are a premium feature. Use `;premium` to learn more.",
                color=discord.Color.orange()
            )
            return await ctx.send(embed=embed)
            
        # Check if used in a music channel
        if not self.is_music_channel(ctx):
            embed = discord.Embed(
                title="Wrong Channel",
                description="This command can only be used in designated music channels.",
                color=discord.Color.red()
            )
            return await ctx.send(embed=embed)
        
        # Check if the bot is in a voice channel
        player = ctx.guild.voice_client
        if not player:
            embed = discord.Embed(
                title="Not Connected",
                description="I'm not connected to a voice channel.",
                color=discord.Color.red()
            )
            return await ctx.send(embed=embed)
            
        # Clear the queue
        self.queues[ctx.guild.id] = []
            
        # Leave the voice channel
        await player.disconnect()
        
        embed = discord.Embed(
            title="Disconnected",
            description="Left the voice channel",
            color=discord.Color.green()
        )
        await ctx.send(embed=embed)
    
    @commands.command(name="play")
    async def play(self, ctx, *, query: str):
        """Play a song or add it to the queue"""
        # Check if the guild has premium
        if not self.is_premium(ctx.guild.id):
            embed = discord.Embed(
                title="Premium Feature",
                description="Music commands are a premium feature. Use `;premium` to learn more.",
                color=discord.Color.orange()
            )
            return await ctx.send(embed=embed)
            
        # Check if used in a music channel
        if not self.is_music_channel(ctx):
            embed = discord.Embed(
                title="Wrong Channel",
                description="This command can only be used in designated music channels.",
                color=discord.Color.red()
            )
            return await ctx.send(embed=embed)
        
        # Check if user is in a voice channel
        if not ctx.author.voice:
            embed = discord.Embed(
                title="Not Connected",
                description="You must be connected to a voice channel to use this command.",
                color=discord.Color.red()
            )
            return await ctx.send(embed=embed)
            
        # Get or create player
        player = ctx.guild.voice_client
        
        if not player:
            player = await ctx.author.voice.channel.connect(cls=wavelink.Player)
        
        # Initialize queue if it doesn't exist
        if ctx.guild.id not in self.queues:
            self.queues[ctx.guild.id] = []
        
        # Search for the track
        try:
            # Check if it's a URL
            if query.startswith('http'):
                tracks = await wavelink.NodePool.get_node().get_tracks(query)
            else:
                tracks = await wavelink.NodePool.get_node().get_tracks(f'ytsearch:{query}')
            
            if not tracks:
                embed = discord.Embed(
                    title="Not Found",
                    description=f"No results found for `{query}`",
                    color=discord.Color.red()
                )
                return await ctx.send(embed=embed)
                
            # Get the first track
            track = tracks[0]
            
            # Add track to queue
            self.queues[ctx.guild.id].append(track)
            
            embed = discord.Embed(
                title="Added to Queue",
                description=f"Added `{track.title}` to the queue",
                color=discord.Color.green()
            )
            embed.set_footer(text=f"Requested by {ctx.author.display_name}")
            await ctx.send(embed=embed)
            
            # If the player is not playing, start playing
            if not player.is_playing():
                # Play the first track in the queue
                await self.play_next(ctx.guild.id)
                
        except Exception as e:
            logger.error(f"Error playing track: {e}")
            embed = discord.Embed(
                title="Error",
                description=f"An error occurred: {str(e)}",
                color=discord.Color.red()
            )
            await ctx.send(embed=embed)
    
    async def play_next(self, guild_id):
        """Play the next song in the queue"""
        guild = self.bot.get_guild(guild_id)
        if not guild:
            return
            
        # Get the player
        player = guild.voice_client
        if not player:
            return
            
        # Get the queue
        queue = self.queues.get(guild_id, [])
        
        if not queue:
            return
            
        # Get the next track
        track = queue.pop(0)
        
        # Play the track
        await player.play(track)
    
    @commands.command(name="skip")
    async def skip(self, ctx):
        """Skip the current song"""
        # Check if the guild has premium
        if not self.is_premium(ctx.guild.id):
            embed = discord.Embed(
                title="Premium Feature",
                description="Music commands are a premium feature. Use `;premium` to learn more.",
                color=discord.Color.orange()
            )
            return await ctx.send(embed=embed)
            
        # Check if used in a music channel
        if not self.is_music_channel(ctx):
            embed = discord.Embed(
                title="Wrong Channel",
                description="This command can only be used in designated music channels.",
                color=discord.Color.red()
            )
            return await ctx.send(embed=embed)
        
        # Check if the bot is in a voice channel
        player = ctx.guild.voice_client
        if not player or not player.is_playing():
            embed = discord.Embed(
                title="Not Playing",
                description="I'm not playing anything right now.",
                color=discord.Color.red()
            )
            return await ctx.send(embed=embed)
            
        # Skip the current song
        await player.stop()
        
        embed = discord.Embed(
            title="Skipped",
            description="Skipped to the next song",
            color=discord.Color.green()
        )
        await ctx.send(embed=embed)
    
    @commands.command(name="pause")
    async def pause(self, ctx):
        """Pause the current song"""
        # Check if the guild has premium
        if not self.is_premium(ctx.guild.id):
            embed = discord.Embed(
                title="Premium Feature",
                description="Music commands are a premium feature. Use `;premium` to learn more.",
                color=discord.Color.orange()
            )
            return await ctx.send(embed=embed)
            
        # Check if used in a music channel
        if not self.is_music_channel(ctx):
            embed = discord.Embed(
                title="Wrong Channel",
                description="This command can only be used in designated music channels.",
                color=discord.Color.red()
            )
            return await ctx.send(embed=embed)
        
        # Check if the bot is in a voice channel
        player = ctx.guild.voice_client
        if not player or not player.is_playing():
            embed = discord.Embed(
                title="Not Playing",
                description="I'm not playing anything right now.",
                color=discord.Color.red()
            )
            return await ctx.send(embed=embed)
            
        # Pause the player
        await player.pause()
        
        embed = discord.Embed(
            title="Paused",
            description="Paused the current song",
            color=discord.Color.green()
        )
        await ctx.send(embed=embed)
    
    @commands.command(name="resume")
    async def resume(self, ctx):
        """Resume the paused song"""
        # Check if the guild has premium
        if not self.is_premium(ctx.guild.id):
            embed = discord.Embed(
                title="Premium Feature",
                description="Music commands are a premium feature. Use `;premium` to learn more.",
                color=discord.Color.orange()
            )
            return await ctx.send(embed=embed)
            
        # Check if used in a music channel
        if not self.is_music_channel(ctx):
            embed = discord.Embed(
                title="Wrong Channel",
                description="This command can only be used in designated music channels.",
                color=discord.Color.red()
            )
            return await ctx.send(embed=embed)
        
        # Check if the bot is in a voice channel
        player = ctx.guild.voice_client
        if not player:
            embed = discord.Embed(
                title="Not Connected",
                description="I'm not connected to a voice channel.",
                color=discord.Color.red()
            )
            return await ctx.send(embed=embed)
            
        # Resume the player
        await player.resume()
        
        embed = discord.Embed(
            title="Resumed",
            description="Resumed the current song",
            color=discord.Color.green()
        )
        await ctx.send(embed=embed)
    
    @commands.command(name="queue")
    async def queue(self, ctx):
        """Show the current queue"""
        # Check if the guild has premium
        if not self.is_premium(ctx.guild.id):
            embed = discord.Embed(
                title="Premium Feature",
                description="Music commands are a premium feature. Use `;premium` to learn more.",
                color=discord.Color.orange()
            )
            return await ctx.send(embed=embed)
            
        # Check if used in a music channel
        if not self.is_music_channel(ctx):
            embed = discord.Embed(
                title="Wrong Channel",
                description="This command can only be used in designated music channels.",
                color=discord.Color.red()
            )
            return await ctx.send(embed=embed)
        
        # Get the queue
        queue = self.queues.get(ctx.guild.id, [])
        
        # Get current track
        player = ctx.guild.voice_client
        current = player.track if player and player.is_playing() else None
        
        embed = discord.Embed(
            title="Music Queue",
            color=discord.Color.blue()
        )
        
        # Add current track
        if current:
            embed.add_field(
                name="Now Playing",
                value=f"`{current.title}`",
                inline=False
            )
        
        # Add queue
        if queue:
            queue_text = ""
            for i, track in enumerate(queue[:10], 1):
                queue_text += f"{i}. `{track.title}`\n"
                
            if len(queue) > 10:
                queue_text += f"\n... and {len(queue) - 10} more"
                
            embed.add_field(
                name="Queue",
                value=queue_text,
                inline=False
            )
        else:
            embed.add_field(
                name="Queue",
                value="The queue is empty",
                inline=False
            )
        
        await ctx.send(embed=embed)
    
    @commands.command(name="clear")
    async def clear(self, ctx):
        """Clear the music queue"""
        # Check if the guild has premium
        if not self.is_premium(ctx.guild.id):
            embed = discord.Embed(
                title="Premium Feature",
                description="Music commands are a premium feature. Use `;premium` to learn more.",
                color=discord.Color.orange()
            )
            return await ctx.send(embed=embed)
            
        # Check if used in a music channel
        if not self.is_music_channel(ctx):
            embed = discord.Embed(
                title="Wrong Channel",
                description="This command can only be used in designated music channels.",
                color=discord.Color.red()
            )
            return await ctx.send(embed=embed)
        
        # Clear the queue
        self.queues[ctx.guild.id] = []
        
        embed = discord.Embed(
            title="Queue Cleared",
            description="Cleared the music queue",
            color=discord.Color.green()
        )
        await ctx.send(embed=embed)
    
    @commands.group(name="music_channel")
    @commands.has_permissions(administrator=True)
    async def music_channel(self, ctx):
        """Manage music channels for this server (Admin only)"""
        if ctx.invoked_subcommand is None:
            # Check premium status for music channels
            if not self.is_premium(ctx.guild.id):
                embed = discord.Embed(
                    title="Premium Feature",
                    description="Music channels are a premium feature. Use `;premium` to learn more.",
                    color=discord.Color.orange()
                )
                return await ctx.send(embed=embed)
                
            # Show current music channels
            guild_id = str(ctx.guild.id)
            channels = self.music_channels.get(guild_id, [])
            
            embed = discord.Embed(
                title="Music Channels",
                color=discord.Color.blue()
            )
            
            if channels:
                channel_text = ""
                for i, channel_id in enumerate(channels, 1):
                    channel = ctx.guild.get_channel(int(channel_id))
                    if channel:
                        channel_text += f"{i}. {channel.mention}\n"
                    else:
                        channel_text += f"{i}. (Unknown Channel: {channel_id})\n"
                        
                embed.add_field(
                    name="Current Music Channels",
                    value=channel_text,
                    inline=False
                )
            else:
                embed.add_field(
                    name="Current Music Channels",
                    value="No music channels set. Music commands can be used in any channel.",
                    inline=False
                )
                
            # Show usage
            embed.add_field(
                name="Commands",
                value=(
                    "`;music_channel add #channel` - Add a music channel\n"
                    "`;music_channel remove #channel` - Remove a music channel\n"
                    "`;music_channel clear` - Remove all music channels"
                ),
                inline=False
            )
            
            # Show tier limits
            tier_limit = self.get_tier_limit(ctx.guild.id)
            if tier_limit == -1:
                limit_text = "Unlimited"
            else:
                limit_text = str(tier_limit)
                
            embed.add_field(
                name="Channel Limit",
                value=f"Your server can have up to {limit_text} music channels",
                inline=False
            )
            
            await ctx.send(embed=embed)
    
    @music_channel.command(name="add")
    @commands.has_permissions(administrator=True)
    async def add_music_channel(self, ctx, channel: discord.TextChannel):
        """Add a text channel as a music channel"""
        # Check premium status for music channels
        if not self.is_premium(ctx.guild.id):
            embed = discord.Embed(
                title="Premium Feature",
                description="Music channels are a premium feature. Use `;premium` to learn more.",
                color=discord.Color.orange()
            )
            return await ctx.send(embed=embed)
            
        # Convert IDs to strings for JSON
        guild_id = str(ctx.guild.id)
        channel_id = str(channel.id)
        
        # Initialize if needed
        if guild_id not in self.music_channels:
            self.music_channels[guild_id] = []
            
        # Check if channel is already a music channel
        if channel_id in self.music_channels[guild_id]:
            embed = discord.Embed(
                title="Already Added",
                description=f"{channel.mention} is already a music channel.",
                color=discord.Color.orange()
            )
            return await ctx.send(embed=embed)
            
        # Check tier limit
        tier_limit = self.get_tier_limit(ctx.guild.id)
        
        if tier_limit != -1 and len(self.music_channels[guild_id]) >= tier_limit:
            embed = discord.Embed(
                title="Limit Reached",
                description=f"You have reached your limit of {tier_limit} music channels. Upgrade your premium tier for more.",
                color=discord.Color.red()
            )
            return await ctx.send(embed=embed)
            
        # Add channel to music channels
        self.music_channels[guild_id].append(channel_id)
        self.save_music_channels()
        
        embed = discord.Embed(
            title="Music Channel Added",
            description=f"{channel.mention} has been added as a music channel. Music commands will work in this channel.",
            color=discord.Color.green()
        )
        await ctx.send(embed=embed)
    
    @music_channel.command(name="remove")
    @commands.has_permissions(administrator=True)
    async def remove_music_channel(self, ctx, channel: discord.TextChannel):
        """Remove a text channel from music channels"""
        # Check premium status for music channels
        if not self.is_premium(ctx.guild.id):
            embed = discord.Embed(
                title="Premium Feature",
                description="Music channels are a premium feature. Use `;premium` to learn more.",
                color=discord.Color.orange()
            )
            return await ctx.send(embed=embed)
            
        # Convert IDs to strings for JSON
        guild_id = str(ctx.guild.id)
        channel_id = str(channel.id)
        
        # Check if guild has any music channels
        if guild_id not in self.music_channels or not self.music_channels[guild_id]:
            embed = discord.Embed(
                title="No Music Channels",
                description="This server has no music channels configured.",
                color=discord.Color.orange()
            )
            return await ctx.send(embed=embed)
            
        # Check if channel is a music channel
        if channel_id not in self.music_channels[guild_id]:
            embed = discord.Embed(
                title="Not a Music Channel",
                description=f"{channel.mention} is not a music channel.",
                color=discord.Color.orange()
            )
            return await ctx.send(embed=embed)
            
        # Remove channel from music channels
        self.music_channels[guild_id].remove(channel_id)
        self.save_music_channels()
        
        embed = discord.Embed(
            title="Music Channel Removed",
            description=f"{channel.mention} has been removed from music channels.",
            color=discord.Color.green()
        )
        await ctx.send(embed=embed)
    
    @music_channel.command(name="clear")
    @commands.has_permissions(administrator=True)
    async def clear_music_channels(self, ctx):
        """Remove all music channels for this server"""
        # Check premium status for music channels
        if not self.is_premium(ctx.guild.id):
            embed = discord.Embed(
                title="Premium Feature",
                description="Music channels are a premium feature. Use `;premium` to learn more.",
                color=discord.Color.orange()
            )
            return await ctx.send(embed=embed)
            
        # Convert IDs to strings for JSON
        guild_id = str(ctx.guild.id)
        
        # Check if guild has any music channels
        if guild_id not in self.music_channels or not self.music_channels[guild_id]:
            embed = discord.Embed(
                title="No Music Channels",
                description="This server has no music channels configured.",
                color=discord.Color.orange()
            )
            return await ctx.send(embed=embed)
            
        # Clear music channels
        self.music_channels[guild_id] = []
        self.save_music_channels()
        
        embed = discord.Embed(
            title="Music Channels Cleared",
            description="All music channels have been removed. Music commands will work in any channel.",
            color=discord.Color.green()
        )
        await ctx.send(embed=embed)
    
    @wavelink.WavelinkMixin.listener("on_node_ready")
    async def on_wavelink_node_ready(self, node: wavelink.Node):
        """Event fired when a wavelink node is ready"""
        logger.info(f"Wavelink node {node.identifier} is ready")
    
    @wavelink.WavelinkMixin.listener("on_track_end")
    async def on_wavelink_track_end(self, player: wavelink.Player, track: wavelink.Track, reason):
        """Event fired when a track ends"""
        # Get the guild ID
        guild_id = player.guild.id
        
        # Play the next song in the queue
        await self.play_next(guild_id)

async def setup(bot):
    """Add the Music cog to the bot"""
    await bot.add_cog(Music(bot))