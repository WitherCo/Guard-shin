import discord
from discord.ext import commands
import asyncio
import logging
import os
import json
import random
import datetime
from typing import Optional, Union, List, Dict, Any, Tuple
import wavelink  # For music functionality

logger = logging.getLogger('guard-shin.music')

class MusicCommands(commands.Cog):
    """Music commands for Guard-shin"""

    def __init__(self, bot):
        self.bot = bot
        self.playlists = {}
        self.queue_messages = {}
        
    async def cog_check(self, ctx: commands.Context):
        """Check if command can be used"""
        # Check if user is in a voice channel
        if not ctx.author.voice:
            await ctx.send("You need to be in a voice channel to use music commands.")
            return False
            
        return True
        
    @commands.command()
    async def play(self, ctx: commands.Context, *, query: str):
        """Play a song by URL or search query"""
        # Check if bot is in a voice channel
        player = ctx.voice_client
        
        # Connect to voice channel if not connected
        if not player:
            try:
                player = await ctx.author.voice.channel.connect(cls=wavelink.Player)
            except Exception as e:
                logger.error(f"Error connecting to voice channel: {e}")
                return await ctx.send(f"Error connecting to voice channel: {e}")
                
        # Create loading message
        loading_message = await ctx.send(f"🔍 Searching for `{query}`...")
        
        try:
            # Get tracks based on query
            if query.startswith(('http://', 'https://')) and any(service in query for service in ['youtube.com', 'youtu.be', 'soundcloud.com', 'spotify.com']):
                # Direct URL
                tracks = await wavelink.NodePool.get_node().get_tracks(query=query)
            else:
                # Search query
                tracks = await wavelink.NodePool.get_node().get_tracks(query=f'ytsearch:{query}')
                
            if not tracks:
                return await loading_message.edit(content=f"❌ No results found for `{query}`.")
                
            # Get the first track
            track = tracks[0]
            
            # Play or queue the track
            if not player.is_playing():
                # No track playing, play this track
                await player.play(track)
                embed = self._create_now_playing_embed(track)
                await loading_message.edit(content=None, embed=embed)
            else:
                # Track is playing, add to queue
                player.queue.put(track)
                embed = discord.Embed(
                    title="Added to Queue",
                    description=f"[{track.title}]({track.uri})",
                    color=0x8249F0
                )
                embed.set_thumbnail(url=track.thumbnail)
                embed.add_field(name="Channel", value=track.author, inline=True)
                embed.add_field(name="Duration", value=self._format_duration(track.duration), inline=True)
                embed.add_field(name="Position in Queue", value=f"#{player.queue.count()}", inline=True)
                
                await loading_message.edit(content=None, embed=embed)
                
        except Exception as e:
            logger.error(f"Error playing track: {e}")
            await loading_message.edit(content=f"❌ Error playing track: {e}")
            
    def _create_now_playing_embed(self, track):
        """Create an embed for the currently playing track"""
        embed = discord.Embed(
            title="Now Playing",
            description=f"[{track.title}]({track.uri})",
            color=0x8249F0
        )
        embed.set_thumbnail(url=track.thumbnail)
        embed.add_field(name="Channel", value=track.author, inline=True)
        embed.add_field(name="Duration", value=self._format_duration(track.duration), inline=True)
        
        # Add a progress bar (for display purposes only, not functional)
        progress_bar = "▬" * 10
        progress_bar = "▶️" + progress_bar
        embed.add_field(name="Progress", value=progress_bar, inline=False)
        
        return embed
        
    def _format_duration(self, duration_ms: int) -> str:
        """Format milliseconds into a readable time format"""
        seconds = duration_ms / 1000
        minutes, seconds = divmod(seconds, 60)
        hours, minutes = divmod(minutes, 60)
        
        if hours > 0:
            return f"{int(hours)}:{int(minutes):02d}:{int(seconds):02d}"
        else:
            return f"{int(minutes)}:{int(seconds):02d}"
            
    @commands.command()
    async def stop(self, ctx: commands.Context):
        """Stop playing music and clear the queue"""
        player = ctx.voice_client
        
        if not player:
            return await ctx.send("I'm not playing anything right now.")
            
        # Clear the queue and stop playing
        player.queue.clear()
        await player.stop()
        
        await ctx.send("⏹️ Stopped playback and cleared the queue.")
        
    @commands.command()
    async def skip(self, ctx: commands.Context):
        """Skip the current song"""
        player = ctx.voice_client
        
        if not player or not player.is_playing():
            return await ctx.send("I'm not playing anything right now.")
            
        # Skip the current track
        await player.stop()
        
        await ctx.send("⏭️ Skipped the current track.")
        
    @commands.command()
    async def pause(self, ctx: commands.Context):
        """Pause the current song"""
        player = ctx.voice_client
        
        if not player or not player.is_playing():
            return await ctx.send("I'm not playing anything right now.")
            
        if player.is_paused():
            return await ctx.send("Playback is already paused. Use `g!resume` to resume playback.")
            
        # Pause playback
        await player.pause()
        
        await ctx.send("⏸️ Paused playback.")
        
    @commands.command()
    async def resume(self, ctx: commands.Context):
        """Resume playback of paused music"""
        player = ctx.voice_client
        
        if not player:
            return await ctx.send("I'm not playing anything right now.")
            
        if not player.is_paused():
            return await ctx.send("Playback is already playing. Use `g!pause` to pause playback.")
            
        # Resume playback
        await player.resume()
        
        await ctx.send("▶️ Resumed playback.")
        
    @commands.command()
    async def queue(self, ctx: commands.Context, page: int = 1):
        """View the song queue"""
        player = ctx.voice_client
        
        if not player:
            return await ctx.send("I'm not playing anything right now.")
            
        if player.queue.is_empty and not player.is_playing():
            return await ctx.send("The queue is empty.")
            
        # Calculate total pages based on queue length
        items_per_page = 10
        queue_list = list(player.queue)
        total_pages = max(1, (len(queue_list) + items_per_page - 1) // items_per_page)
        
        if page < 1 or page > total_pages:
            return await ctx.send(f"Invalid page. Please specify a page between 1 and {total_pages}.")
            
        # Get current track info
        current_track = player.track
        
        embed = discord.Embed(
            title="Music Queue",
            description=f"**Now Playing**: [{current_track.title}]({current_track.uri}) `{self._format_duration(current_track.duration)}`",
            color=0x8249F0
        )
        
        # Display queue items for the current page
        start_idx = (page - 1) * items_per_page
        end_idx = min(start_idx + items_per_page, len(queue_list))
        
        if queue_list:
            queue_text = ""
            for i in range(start_idx, end_idx):
                track = queue_list[i]
                queue_text += f"`{i+1}.` [{track.title}]({track.uri}) `{self._format_duration(track.duration)}`\n"
                
            embed.add_field(name="Up Next", value=queue_text or "No songs in queue", inline=False)
        else:
            embed.add_field(name="Up Next", value="No songs in queue", inline=False)
            
        # Add page information
        embed.set_footer(text=f"Page {page}/{total_pages} | Total songs in queue: {len(queue_list)}")
        
        # Store the message ID to allow for queue updates
        queue_message = await ctx.send(embed=embed)
        self.queue_messages[ctx.guild.id] = queue_message.id
        
    @commands.command()
    async def nowplaying(self, ctx: commands.Context):
        """Show the currently playing song"""
        player = ctx.voice_client
        
        if not player or not player.is_playing():
            return await ctx.send("I'm not playing anything right now.")
            
        track = player.track
        position = player.position
        duration = track.duration
        
        # Calculate progress bar
        progress = min(position / duration, 1.0)
        bar_length = 20
        completed_length = round(bar_length * progress)
        
        progress_bar = "▬" * bar_length
        progress_bar = progress_bar[:completed_length] + "🔘" + progress_bar[completed_length+1:]
        
        embed = discord.Embed(
            title="Now Playing",
            description=f"[{track.title}]({track.uri})",
            color=0x8249F0
        )
        embed.set_thumbnail(url=track.thumbnail)
        embed.add_field(name="Channel", value=track.author, inline=True)
        embed.add_field(name="Duration", value=f"{self._format_duration(position)} / {self._format_duration(duration)}", inline=True)
        embed.add_field(name="Progress", value=progress_bar, inline=False)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def volume(self, ctx: commands.Context, volume: int = None):
        """Adjust the playback volume"""
        player = ctx.voice_client
        
        if not player:
            return await ctx.send("I'm not connected to a voice channel.")
            
        # Check if the user has premium
        cog = self.bot.get_cog("Commands")
        is_premium = False
        if cog:
            is_premium = cog.is_premium(ctx.guild.id)
            
        if not is_premium:
            return await ctx.send("⭐ This is a premium command. Use `g!premium` to learn more about premium access.")
            
        if volume is None:
            return await ctx.send(f"🔊 Current volume: **{player.volume}%**")
            
        if not 0 <= volume <= 100:
            return await ctx.send("Volume must be between 0 and 100.")
            
        await player.set_volume(volume)
        
        # Use emoji to indicate volume level
        if volume == 0:
            emoji = "🔇"
        elif volume < 30:
            emoji = "🔈"
        elif volume < 70:
            emoji = "🔉"
        else:
            emoji = "🔊"
            
        await ctx.send(f"{emoji} Volume set to **{volume}%**")
        
    @commands.command()
    async def shuffle(self, ctx: commands.Context):
        """Shuffle the song queue"""
        player = ctx.voice_client
        
        if not player:
            return await ctx.send("I'm not connected to a voice channel.")
            
        if player.queue.is_empty:
            return await ctx.send("The queue is empty.")
            
        # Check if the user has premium
        cog = self.bot.get_cog("Commands")
        is_premium = False
        if cog:
            is_premium = cog.is_premium(ctx.guild.id)
            
        if not is_premium:
            return await ctx.send("⭐ This is a premium command. Use `g!premium` to learn more about premium access.")
            
        # Shuffle the queue
        player.queue.shuffle()
        
        await ctx.send("🔀 Shuffled the queue.")
        
    @commands.command()
    async def remove(self, ctx: commands.Context, position: int):
        """Remove a song from the queue"""
        player = ctx.voice_client
        
        if not player:
            return await ctx.send("I'm not connected to a voice channel.")
            
        if player.queue.is_empty:
            return await ctx.send("The queue is empty.")
            
        # Check if the user has premium
        cog = self.bot.get_cog("Commands")
        is_premium = False
        if cog:
            is_premium = cog.is_premium(ctx.guild.id)
            
        if not is_premium:
            return await ctx.send("⭐ This is a premium command. Use `g!premium` to learn more about premium access.")
            
        # Check if position is valid
        if position < 1 or position > len(player.queue):
            return await ctx.send(f"Invalid position. Please specify a position between 1 and {len(player.queue)}.")
            
        # Get the track to remove (position is 1-indexed)
        track = player.queue[position - 1]
        
        # Remove the track
        removed_track = player.queue.pop(position - 1)
        
        await ctx.send(f"⏏️ Removed from queue: **{removed_track.title}**")
        
    @commands.command()
    async def loop(self, ctx: commands.Context, mode: str = None):
        """Loop the current song or queue"""
        player = ctx.voice_client
        
        if not player:
            return await ctx.send("I'm not connected to a voice channel.")
            
        # Check if the user has premium
        cog = self.bot.get_cog("Commands")
        is_premium = False
        if cog:
            is_premium = cog.is_premium(ctx.guild.id)
            
        if not is_premium:
            return await ctx.send("⭐ This is a premium command. Use `g!premium` to learn more about premium access.")
            
        if not mode:
            # Display current loop mode
            if player.queue.loop_mode == wavelink.QueueMode.LOOP:
                return await ctx.send("🔄 Currently looping the **current song**.")
            elif player.queue.loop_mode == wavelink.QueueMode.LOOP_ALL:
                return await ctx.send("🔄 Currently looping the **entire queue**.")
            else:
                return await ctx.send("▶️ Loop mode is currently **disabled**.")
                
        # Set loop mode based on input
        if mode.lower() in ["song", "track", "current"]:
            player.queue.mode = wavelink.QueueMode.LOOP
            await ctx.send("🔂 Now looping the **current song**.")
        elif mode.lower() in ["queue", "all"]:
            player.queue.mode = wavelink.QueueMode.LOOP_ALL
            await ctx.send("🔄 Now looping the **entire queue**.")
        elif mode.lower() in ["off", "disable", "disabled", "none"]:
            player.queue.mode = wavelink.QueueMode.NORMAL
            await ctx.send("▶️ Loop mode **disabled**.")
        else:
            await ctx.send("❌ Invalid loop mode. Use `song`, `queue`, or `off`.")
            
    @commands.command()
    async def search(self, ctx: commands.Context, *, query: str):
        """Search for songs to play"""
        # Check if the user has premium
        cog = self.bot.get_cog("Commands")
        is_premium = False
        if cog:
            is_premium = cog.is_premium(ctx.guild.id)
            
        if not is_premium:
            return await ctx.send("⭐ This is a premium command. Use `g!premium` to learn more about premium access.")
            
        # Create loading message
        loading_message = await ctx.send(f"🔍 Searching for `{query}`...")
        
        try:
            # Search for tracks
            tracks = await wavelink.NodePool.get_node().get_tracks(query=f'ytsearch:{query}')
            
            if not tracks:
                return await loading_message.edit(content=f"❌ No results found for `{query}`.")
                
            # Display up to 5 search results
            embed = discord.Embed(
                title=f"Search Results for: {query}",
                description="Select a song to play by typing its number.",
                color=0x8249F0
            )
            
            results = min(5, len(tracks))
            for i in range(results):
                track = tracks[i]
                embed.add_field(
                    name=f"{i+1}. {track.title}",
                    value=f"**Duration:** {self._format_duration(track.duration)} | **Channel:** {track.author}",
                    inline=False
                )
                
            await loading_message.edit(content=None, embed=embed)
            
            # Wait for user response
            def check(m):
                return (
                    m.author == ctx.author 
                    and m.channel == ctx.channel 
                    and m.content.isdigit() 
                    and 1 <= int(m.content) <= results
                )
                
            try:
                response = await self.bot.wait_for('message', check=check, timeout=30.0)
                selected = int(response.content)
                selected_track = tracks[selected - 1]
                
                # Delete search messages for cleanliness
                await loading_message.delete()
                await response.delete()
                
                # Play the selected track
                player = ctx.voice_client
                
                # Connect to voice channel if not connected
                if not player:
                    player = await ctx.author.voice.channel.connect(cls=wavelink.Player)
                    
                if not player.is_playing():
                    await player.play(selected_track)
                    embed = self._create_now_playing_embed(selected_track)
                else:
                    player.queue.put(selected_track)
                    embed = discord.Embed(
                        title="Added to Queue",
                        description=f"[{selected_track.title}]({selected_track.uri})",
                        color=0x8249F0
                    )
                    embed.set_thumbnail(url=selected_track.thumbnail)
                    embed.add_field(name="Position in Queue", value=f"#{player.queue.count()}", inline=True)
                    
                await ctx.send(embed=embed)
                
            except asyncio.TimeoutError:
                await loading_message.edit(content="❌ Search timed out. Please try again.")
                
        except Exception as e:
            logger.error(f"Error searching for tracks: {e}")
            await loading_message.edit(content=f"❌ Error: {e}")
            
    @commands.command()
    async def disconnect(self, ctx: commands.Context):
        """Disconnect the bot from voice channel"""
        player = ctx.voice_client
        
        if not player:
            return await ctx.send("I'm not connected to a voice channel.")
            
        await player.disconnect()
        
        await ctx.send("👋 Disconnected from voice channel.")
        
    # Event listeners for player events
    @commands.Cog.listener()
    async def on_wavelink_track_end(self, player, track, reason):
        """Fired when a track ends"""
        # If there's nothing in the queue, clear the NowPlaying message
        if player.queue.is_empty:
            # If we're in LOOP mode, play the same track again
            if player.queue.loop_mode == wavelink.QueueMode.LOOP:
                await player.play(track)
                
        # Rest of the queue handling is done automatically by wavelink
            
    @commands.Cog.listener()
    async def on_wavelink_track_start(self, player, track):
        """Fired when a track starts"""
        channel = player.channel
        
        if not channel:
            return
            
        guild = channel.guild
        
        # Create an embed for the currently playing track
        embed = self._create_now_playing_embed(track)
        
        # Send the now playing message
        text_channels = guild.text_channels
        last_channel = None
        
        for text_channel in text_channels:
            # Look for a music or bot channel first
            if any(name in text_channel.name.lower() for name in ["music", "bot", "commands"]):
                last_channel = text_channel
                break
                
        # If we didn't find a specific channel, use the most recent command channel
        if not last_channel:
            # Get the bot's message history to find the last command
            for channel in text_channels:
                if channel.permissions_for(guild.me).send_messages:
                    last_channel = channel
                    break
                    
        if last_channel:
            try:
                await last_channel.send(embed=embed)
            except discord.HTTPException:
                # Failed to send the message, ignore
                pass
                
    # Function to set up the cog
    async def setup(bot):
        await bot.add_cog(MusicCommands(bot))