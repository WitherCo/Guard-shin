import discord
from discord.ext import commands
import asyncio
import datetime
import random
import re
import typing
import wavelink
import os

# Import premium check decorator
try:
    from premium_check import premium_only
except ImportError:
    # Define fallback decorator if import fails
    def premium_only():
        async def predicate(ctx):
            if not hasattr(ctx.bot, 'is_premium'):
                return False
            return ctx.bot.is_premium(ctx.guild.id) if ctx.guild else False
        return commands.check(predicate)

class MusicCommands(commands.Cog):
    """Music commands for Guard-shin bot that require premium"""
    
    def __init__(self, bot):
        self.bot = bot
        self.currently_playing = {}  # Store currently playing track info
        bot.loop.create_task(self.setup_nodes())
    
    async def setup_nodes(self):
        """Set up Wavelink nodes"""
        await self.bot.wait_until_ready()
        
        # Wait for wavelink to be ready
        if not hasattr(self.bot, 'wavelink'):
            self.bot.wavelink = wavelink.Client(bot=self.bot)
        
        # Create lavalink node
        try:
            await wavelink.NodePool.create_node(
                bot=self.bot,
                host='lavalink.oops.wtf',  # Public Lavalink server
                port=443,
                password='www.freelavalink.ga',
                https=True,
                identifier='Public Lavalink'
            )
        except Exception as e:
            print(f"Failed to connect to Lavalink node: {e}")
    
    async def cog_check(self, ctx):
        """Check that runs before every command in this cog"""
        # Check if in a voice channel
        if not ctx.author.voice and ctx.command.name not in ['nowplaying', 'queue']:
            await ctx.send("You must be in a voice channel to use music commands.")
            return False
        return True
    
    @commands.Cog.listener()
    async def on_wavelink_node_ready(self, node: wavelink.Node):
        """Event fired when a Wavelink node is ready"""
        print(f"Node {node.identifier} is ready!")
    
    @commands.Cog.listener()
    async def on_wavelink_track_end(self, player: wavelink.Player, track: wavelink.Track, reason):
        """Event fired when a track ends"""
        guild_id = player.guild.id
        
        # If there was a reason other than FINISHED, don't autoplay next
        if reason != "FINISHED":
            return
            
        # If the guild has a queue, play the next track
        if hasattr(player, 'queue') and player.queue:
            next_track = player.queue.pop(0)
            await player.play(next_track)
            
            # Update currently playing info
            self.currently_playing[guild_id] = {
                'track': next_track,
                'requester': next_track.requester if hasattr(next_track, 'requester') else None,
                'start_time': datetime.datetime.now()
            }
            
            # Send now playing message
            if getattr(player, 'text_channel', None):
                embed = discord.Embed(
                    title="Now Playing",
                    description=f"[{next_track.title}]({next_track.uri})",
                    color=discord.Color.purple()
                )
                embed.set_thumbnail(url=f"https://img.youtube.com/vi/{next_track.identifier}/maxresdefault.jpg")
                await player.text_channel.send(embed=embed)
        else:
            # Remove from currently playing if queue is empty
            if guild_id in self.currently_playing:
                del self.currently_playing[guild_id]
    
    @commands.command(name="join", aliases=["connect"])
    @premium_only()
    async def join(self, ctx):
        """Join your voice channel"""
        if not ctx.author.voice:
            return await ctx.send("You need to be in a voice channel to use this command.")
            
        channel = ctx.author.voice.channel
        
        # Check if already connected
        if ctx.voice_client:
            if ctx.voice_client.channel.id == channel.id:
                return await ctx.send(f"I'm already connected to {channel.mention}")
            else:
                await ctx.voice_client.move_to(channel)
                return await ctx.send(f"Moved to {channel.mention}")
        
        # Connect to voice channel
        try:
            player = await channel.connect(cls=wavelink.Player)
            player.text_channel = ctx.channel  # Store text channel for notifications
            player.queue = []  # Initialize queue
            await ctx.send(f"Joined {channel.mention}")
        except Exception as e:
            await ctx.send(f"Could not join voice channel: {e}")
    
    @commands.command(name="leave", aliases=["disconnect", "stop"])
    @premium_only()
    async def leave(self, ctx):
        """Leave the voice channel"""
        if not ctx.voice_client:
            return await ctx.send("I'm not connected to any voice channel.")
            
        # Store channel for message
        channel = ctx.voice_client.channel
        
        # Clear queue and currently playing
        if hasattr(ctx.voice_client, 'queue'):
            ctx.voice_client.queue = []
        
        if ctx.guild.id in self.currently_playing:
            del self.currently_playing[ctx.guild.id]
        
        # Disconnect
        await ctx.voice_client.disconnect()
        await ctx.send(f"Disconnected from {channel.mention}")
    
    @commands.command(name="play", aliases=["p"])
    @premium_only()
    async def play(self, ctx, *, query: str):
        """
        Play a song from YouTube or a supported streaming site
        
        Examples:
        !play despacito
        !play https://www.youtube.com/watch?v=dQw4w9WgXcQ
        """
        # Connect to voice if not already connected
        if not ctx.voice_client:
            await ctx.invoke(self.join)
            
        if not ctx.voice_client:  # If still not connected, something went wrong
            return
            
        # Indicate that the bot is searching
        searching_message = await ctx.send(f"🔍 Searching for `{query}`...")
        
        # Check if it's a URL
        is_url = bool(re.match(r"https?://", query))
        
        try:
            # Search for the track
            if is_url:
                tracks = await wavelink.NodePool.get_node().get_tracks(wavelink.TrackPayload, query)
            else:
                # Search on YouTube
                search_query = f"ytsearch:{query}"
                tracks = await wavelink.NodePool.get_node().get_tracks(wavelink.TrackPayload, search_query)
            
            if not tracks:
                return await searching_message.edit(content=f"❌ No results found for `{query}`.")
                
            # Get the first track
            track = tracks[0]
            
            # Store the requester
            track.requester = ctx.author
            
            # If already playing, add to queue
            if ctx.voice_client.is_playing():
                # Add to queue
                ctx.voice_client.queue.append(track)
                
                # Update searching message
                await searching_message.edit(content=f"Added [{track.title}]({track.uri}) to the queue.")
            else:
                # Play immediately
                await ctx.voice_client.play(track)
                
                # Update currently playing info
                self.currently_playing[ctx.guild.id] = {
                    'track': track,
                    'requester': ctx.author,
                    'start_time': datetime.datetime.now()
                }
                
                # Update searching message
                await searching_message.edit(content=f"Now playing: [{track.title}]({track.uri})")
                
        except Exception as e:
            await searching_message.edit(content=f"❌ An error occurred: {e}")
    
    @commands.command(name="skip")
    @premium_only()
    async def skip(self, ctx):
        """Skip the current song"""
        if not ctx.voice_client or not ctx.voice_client.is_playing():
            return await ctx.send("Nothing is currently playing.")
        
        # Store the current track info for the message
        current_track = ctx.voice_client.track
        
        # Skip the current track
        await ctx.voice_client.stop()
        
        await ctx.send(f"Skipped: {current_track.title}")
    
    @commands.command(name="pause")
    @premium_only()
    async def pause(self, ctx):
        """Pause the current song"""
        if not ctx.voice_client or not ctx.voice_client.is_playing():
            return await ctx.send("Nothing is currently playing.")
            
        if ctx.voice_client.is_paused():
            return await ctx.send("The music is already paused.")
            
        await ctx.voice_client.pause()
        await ctx.send("⏸️ Paused the music.")
    
    @commands.command(name="resume")
    @premium_only()
    async def resume(self, ctx):
        """Resume the paused song"""
        if not ctx.voice_client:
            return await ctx.send("I'm not connected to any voice channel.")
            
        if not ctx.voice_client.is_paused():
            return await ctx.send("The music is not paused.")
            
        await ctx.voice_client.resume()
        await ctx.send("▶️ Resumed the music.")
    
    @commands.command(name="nowplaying", aliases=["np", "current"])
    @premium_only()
    async def nowplaying(self, ctx):
        """Display information about the current song"""
        if not ctx.voice_client or not ctx.voice_client.is_playing():
            return await ctx.send("Nothing is currently playing.")
            
        # Get the track and info
        guild_id = ctx.guild.id
        if guild_id not in self.currently_playing:
            return await ctx.send("No song information available.")
            
        info = self.currently_playing[guild_id]
        track = info['track']
        requester = info['requester']
        start_time = info['start_time']
        
        # Calculate elapsed time
        elapsed = (datetime.datetime.now() - start_time).total_seconds()
        elapsed_str = f"{int(elapsed // 60)}:{int(elapsed % 60):02d}"
        
        # Format duration
        duration_seconds = track.length / 1000  # Convert from milliseconds
        duration_str = f"{int(duration_seconds // 60)}:{int(duration_seconds % 60):02d}"
        
        # Create embed
        embed = discord.Embed(
            title="Now Playing",
            description=f"[{track.title}]({track.uri})",
            color=discord.Color.purple()
        )
        
        # Add thumbnail from YouTube if available
        if hasattr(track, 'identifier'):
            embed.set_thumbnail(url=f"https://img.youtube.com/vi/{track.identifier}/maxresdefault.jpg")
        
        # Add track info
        embed.add_field(name="Duration", value=f"{elapsed_str}/{duration_str}", inline=True)
        embed.add_field(name="Requested By", value=requester.mention if requester else "Unknown", inline=True)
        
        # Add author at the bottom
        if track.author:
            embed.set_footer(text=f"Author: {track.author}")
        
        await ctx.send(embed=embed)
    
    @commands.command(name="queue", aliases=["q"])
    @premium_only()
    async def queue(self, ctx):
        """View the current queue"""
        if not ctx.voice_client:
            return await ctx.send("I'm not connected to any voice channel.")
            
        if not hasattr(ctx.voice_client, 'queue') or not ctx.voice_client.queue:
            return await ctx.send("The queue is empty.")
            
        # Create embed for queue
        embed = discord.Embed(
            title="Music Queue",
            description=f"**Now Playing:** {ctx.voice_client.track.title}",
            color=discord.Color.purple()
        )
        
        # Add queue items (up to 10 for readability)
        queue_length = len(ctx.voice_client.queue)
        display_items = min(10, queue_length)
        
        # Calculate total duration
        total_duration = ctx.voice_client.track.length  # Current track in ms
        for track in ctx.voice_client.queue:
            total_duration += track.length
            
        total_duration_seconds = total_duration / 1000
        hours = int(total_duration_seconds // 3600)
        minutes = int((total_duration_seconds % 3600) // 60)
        seconds = int(total_duration_seconds % 60)
        
        if hours > 0:
            duration_str = f"{hours}h {minutes}m {seconds}s"
        else:
            duration_str = f"{minutes}m {seconds}s"
        
        # Add queue information
        embed.add_field(
            name="Queue Information",
            value=f"**{queue_length}** songs in queue | Duration: **{duration_str}**",
            inline=False
        )
        
        # Add queue items
        queue_list = ""
        for i, track in enumerate(ctx.voice_client.queue[:display_items], start=1):
            duration_seconds = track.length / 1000
            duration_str = f"{int(duration_seconds // 60)}:{int(duration_seconds % 60):02d}"
            requester = getattr(track, 'requester', None)
            requester_mention = requester.mention if requester else "Unknown"
            
            queue_list += f"`{i}.` [{track.title}]({track.uri}) | `{duration_str}` | {requester_mention}\n"
            
        embed.add_field(name="Up Next", value=queue_list or "No songs in queue", inline=False)
        
        # Add note if there are more songs
        if queue_length > display_items:
            embed.add_field(
                name="And more...",
                value=f"Plus {queue_length - display_items} more songs not shown",
                inline=False
            )
        
        await ctx.send(embed=embed)
    
    @commands.command(name="clear")
    @premium_only()
    async def clear_queue(self, ctx):
        """Clear the music queue"""
        if not ctx.voice_client:
            return await ctx.send("I'm not connected to any voice channel.")
            
        if not hasattr(ctx.voice_client, 'queue'):
            return await ctx.send("No queue to clear.")
            
        queue_length = len(ctx.voice_client.queue)
        ctx.voice_client.queue = []
        
        await ctx.send(f"🧹 Cleared {queue_length} songs from the queue.")
    
    @commands.command(name="volume", aliases=["vol"])
    @premium_only()
    async def volume(self, ctx, volume: int = None):
        """
        View or change the player volume (0-100)
        
        Examples:
        !volume 50 - Set volume to 50%
        !volume - Show current volume
        """
        if not ctx.voice_client:
            return await ctx.send("I'm not connected to any voice channel.")
        
        # If no volume specified, display current volume
        if volume is None:
            return await ctx.send(f"🔊 Current volume: **{ctx.voice_client.volume}%**")
            
        # Check volume range
        if not 0 <= volume <= 100:
            return await ctx.send("Volume must be between 0 and 100.")
            
        # Set the volume
        await ctx.voice_client.set_volume(volume)
        await ctx.send(f"🔊 Volume set to **{volume}%**")
    
    @commands.command(name="shuffle")
    @premium_only()
    async def shuffle(self, ctx):
        """Shuffle the music queue"""
        if not ctx.voice_client:
            return await ctx.send("I'm not connected to any voice channel.")
            
        if not hasattr(ctx.voice_client, 'queue') or len(ctx.voice_client.queue) <= 1:
            return await ctx.send("Not enough songs in the queue to shuffle.")
            
        # Shuffle the queue
        random.shuffle(ctx.voice_client.queue)
        
        await ctx.send("🔀 Queue shuffled.")
    
    @commands.command(name="remove")
    @premium_only()
    async def remove(self, ctx, index: int):
        """
        Remove a song from the queue by its position
        
        Example:
        !remove 3 - Remove the 3rd song from the queue
        """
        if not ctx.voice_client:
            return await ctx.send("I'm not connected to any voice channel.")
            
        if not hasattr(ctx.voice_client, 'queue') or not ctx.voice_client.queue:
            return await ctx.send("The queue is empty.")
            
        # Check if index is valid
        if not 1 <= index <= len(ctx.voice_client.queue):
            return await ctx.send(f"Position must be between 1 and {len(ctx.voice_client.queue)}.")
            
        # Get the track to remove (adjust index to 0-based)
        track = ctx.voice_client.queue.pop(index - 1)
        
        await ctx.send(f"Removed `{track.title}` from the queue.")
    
    @commands.command(name="replay")
    @premium_only()
    async def replay(self, ctx):
        """Replay the current song from the beginning"""
        if not ctx.voice_client or not ctx.voice_client.is_playing():
            return await ctx.send("Nothing is currently playing.")
            
        # Get the current track
        track = ctx.voice_client.track
        
        # Stop the current track and play it again
        await ctx.voice_client.seek(0)
        
        await ctx.send(f"🔁 Replaying: `{track.title}`")
    
    @commands.command(name="loop")
    @premium_only()
    async def loop(self, ctx):
        """Toggle loop mode for the current song"""
        if not ctx.voice_client or not ctx.voice_client.is_playing():
            return await ctx.send("Nothing is currently playing.")
            
        # Toggle loop mode
        ctx.voice_client.loop = not getattr(ctx.voice_client, 'loop', False)
        
        if ctx.voice_client.loop:
            await ctx.send("🔁 Loop mode enabled for the current song.")
        else:
            await ctx.send("➡️ Loop mode disabled.")
    
    @commands.command(name="search")
    @premium_only()
    async def search(self, ctx, *, query: str):
        """
        Search for songs on YouTube
        
        Example:
        !search despacito
        """
        if not query:
            return await ctx.send("Please provide a search query.")
            
        # Indicate that the bot is searching
        searching_message = await ctx.send(f"🔍 Searching for `{query}`...")
        
        try:
            # Search on YouTube (get 5 results)
            search_query = f"ytsearch5:{query}"
            tracks = await wavelink.NodePool.get_node().get_tracks(wavelink.TrackPayload, search_query)
            
            if not tracks:
                return await searching_message.edit(content=f"❌ No results found for `{query}`.")
                
            # Create embed for search results
            embed = discord.Embed(
                title=f"Search Results for '{query}'",
                description="Select a song to play by reacting with the corresponding number.",
                color=discord.Color.purple()
            )
            
            # Add each track with its number
            for i, track in enumerate(tracks, start=1):
                duration_seconds = track.length / 1000
                duration_str = f"{int(duration_seconds // 60)}:{int(duration_seconds % 60):02d}"
                embed.add_field(
                    name=f"{i}. {track.title}",
                    value=f"Duration: `{duration_str}` | [Link]({track.uri})",
                    inline=False
                )
            
            # Edit the searching message with the embed
            await searching_message.edit(content="", embed=embed)
            
            # Add reaction options (1-5)
            reactions = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣"]
            for reaction in reactions[:len(tracks)]:
                await searching_message.add_reaction(reaction)
                
            # Wait for the user to select an option
            def check(reaction, user):
                return (
                    user == ctx.author
                    and reaction.message.id == searching_message.id
                    and str(reaction.emoji) in reactions
                )
                
            try:
                reaction, user = await self.bot.wait_for("reaction_add", timeout=30.0, check=check)
                
                # Get the selected track index (0-based)
                selected_index = reactions.index(str(reaction.emoji))
                selected_track = tracks[selected_index]
                
                # Play the selected track
                # Connect to voice if not already connected
                if not ctx.voice_client:
                    await ctx.invoke(self.join)
                
                # Store the requester
                selected_track.requester = ctx.author
                
                # If already playing, add to queue
                if ctx.voice_client.is_playing():
                    # Add to queue
                    ctx.voice_client.queue.append(selected_track)
                    
                    await ctx.send(f"Added [{selected_track.title}]({selected_track.uri}) to the queue.")
                else:
                    # Play immediately
                    await ctx.voice_client.play(selected_track)
                    
                    # Update currently playing info
                    self.currently_playing[ctx.guild.id] = {
                        'track': selected_track,
                        'requester': ctx.author,
                        'start_time': datetime.datetime.now()
                    }
                    
                    await ctx.send(f"Now playing: [{selected_track.title}]({selected_track.uri})")
                
            except asyncio.TimeoutError:
                await searching_message.clear_reactions()
                await searching_message.edit(content="Search timed out.", embed=None)
                
        except Exception as e:
            await searching_message.edit(content=f"❌ An error occurred: {e}")
    
    @commands.command(name="skipto")
    @premium_only()
    async def skipto(self, ctx, position: int):
        """
        Skip to a specific position in the queue
        
        Example:
        !skipto 3 - Skip to the 3rd song in the queue
        """
        if not ctx.voice_client:
            return await ctx.send("I'm not connected to any voice channel.")
            
        if not hasattr(ctx.voice_client, 'queue') or not ctx.voice_client.queue:
            return await ctx.send("The queue is empty.")
            
        # Check if position is valid
        if not 1 <= position <= len(ctx.voice_client.queue):
            return await ctx.send(f"Position must be between 1 and {len(ctx.voice_client.queue)}.")
            
        # Get the track at the specified position (adjust to 0-based)
        position -= 1
        track = ctx.voice_client.queue[position]
        
        # Remove all tracks before the specified position
        ctx.voice_client.queue = ctx.voice_client.queue[position:]
        
        # Skip the current track to start playing the selected track
        await ctx.voice_client.stop()
        
        await ctx.send(f"Skipped to `{track.title}`")

async def setup(bot):
    await bot.add_cog(MusicCommands(bot))