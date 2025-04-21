import discord
from discord.ext import commands
import asyncio
import datetime
import time
import json
import os
import random
import logging
from typing import Optional, Union, List, Dict, Any
import urllib.parse

logger = logging.getLogger('guard-shin.utility')

class UtilityCommands(commands.Cog):
    """Utility commands for Guard-shin"""

    def __init__(self, bot):
        self.bot = bot
        self.reminders = {}
        self.afk_users = {}
        
    @commands.command()
    async def invite(self, ctx: commands.Context):
        """Get the invite link for the bot"""
        app_info = await self.bot.application_info()
        permissions = discord.Permissions(
            administrator=True,  # Bot requires admin permissions
        )
        
        invite_url = discord.utils.oauth_url(
            client_id=app_info.id,
            permissions=permissions,
            scopes=["bot", "applications.commands"]
        )
        
        embed = discord.Embed(
            title="Invite Guard-shin",
            description="Click the link below to add Guard-shin to your Discord server!",
            color=0x8249F0
        )
        embed.add_field(
            name="Invite Link",
            value=f"[Click Here to Invite]({invite_url})",
            inline=False
        )
        embed.add_field(
            name="Support Server",
            value="[Join our Support Server](https://discord.gg/g3rFbaW6gw)",
            inline=False
        )
        embed.set_footer(text="Thank you for using Guard-shin!")
        
        await ctx.send(embed=embed)
        
    @commands.command(aliases=["av"])
    async def avatar(self, ctx: commands.Context, *, member: discord.Member = None):
        """Display a user's avatar"""
        member = member or ctx.author
        
        formats = ["png", "jpg", "webp"]
        if member.avatar.is_animated():
            formats.append("gif")
            
        format_links = []
        for fmt in formats:
            format_links.append(f"[{fmt.upper()}]({member.avatar.with_format(fmt).url})")
            
        embed = discord.Embed(
            title=f"{member.name}'s Avatar",
            description=" | ".join(format_links),
            color=0x8249F0
        )
        
        embed.set_image(url=member.avatar.url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def servericon(self, ctx: commands.Context):
        """Display the server's icon"""
        if not ctx.guild.icon:
            return await ctx.send("This server doesn't have an icon.")
            
        formats = ["png", "jpg", "webp"]
        if ctx.guild.icon.is_animated():
            formats.append("gif")
            
        format_links = []
        for fmt in formats:
            format_links.append(f"[{fmt.upper()}]({ctx.guild.icon.with_format(fmt).url})")
            
        embed = discord.Embed(
            title=f"{ctx.guild.name}'s Icon",
            description=" | ".join(format_links),
            color=0x8249F0
        )
        
        embed.set_image(url=ctx.guild.icon.url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def poll(self, ctx: commands.Context, *, question_and_options: str):
        """Create a poll with up to 10 options
        Format: question | option1 | option2 | option3...
        """
        if "|" not in question_and_options:
            return await ctx.send("Invalid format. Use `question | option1 | option2 | ...`")
            
        parts = [p.strip() for p in question_and_options.split("|")]
        question = parts[0]
        options = parts[1:]
        
        if len(options) < 2:
            return await ctx.send("You need at least 2 options for a poll.")
            
        if len(options) > 10:
            return await ctx.send("You can't have more than 10 options in a poll.")
            
        emoji_numbers = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"]
        
        description = []
        for i, option in enumerate(options):
            description.append(f"{emoji_numbers[i]} {option}")
            
        embed = discord.Embed(
            title=f"📊 {question}",
            description="\n".join(description),
            color=0x8249F0
        )
        embed.set_footer(text=f"Poll by {ctx.author}")
        
        poll_message = await ctx.send(embed=embed)
        
        # Add reactions
        for i in range(len(options)):
            await poll_message.add_reaction(emoji_numbers[i])
            
    @commands.command()
    async def quickpoll(self, ctx: commands.Context, *, question: str):
        """Create a simple yes/no poll"""
        embed = discord.Embed(
            title=f"📊 {question}",
            color=0x8249F0
        )
        embed.set_footer(text=f"Poll by {ctx.author}")
        
        poll_message = await ctx.send(embed=embed)
        
        # Add reactions
        await poll_message.add_reaction("👍")  # Thumbs up
        await poll_message.add_reaction("👎")  # Thumbs down
        
    @commands.command()
    async def remindme(self, ctx: commands.Context, time: str, *, reminder: str):
        """Set a reminder
        Time format: <number><s|m|h|d> (e.g. 10m for 10 minutes)
        """
        time_units = {"s": 1, "m": 60, "h": 3600, "d": 86400}
        seconds = 0
        
        # Simple time format parsing
        if time[-1].lower() in time_units and time[:-1].isdigit():
            seconds = int(time[:-1]) * time_units[time[-1].lower()]
        else:
            return await ctx.send("Invalid time format. Use `<number><s|m|h|d>` (e.g. 10m for 10 minutes)")
            
        if seconds < 1:
            return await ctx.send("Time must be at least 1 second.")
            
        if seconds > 60 * 60 * 24 * 30:  # 30 days
            return await ctx.send("Sorry, I can't remind you more than 30 days from now.")
            
        # Calculate reminder timestamp
        reminder_time = datetime.datetime.utcnow() + datetime.timedelta(seconds=seconds)
        
        # Store reminder
        reminder_id = str(ctx.author.id) + str(int(time.time()))
        self.reminders[reminder_id] = {
            "user_id": ctx.author.id,
            "channel_id": ctx.channel.id,
            "message": reminder,
            "time": reminder_time.timestamp()
        }
        
        # Schedule reminder
        self.bot.loop.create_task(self._send_reminder(reminder_id, seconds))
        
        # Send confirmation
        embed = discord.Embed(
            title="Reminder Set",
            description=f"I'll remind you about: **{reminder}**",
            color=0x8249F0
        )
        embed.add_field(
            name="When",
            value=f"<t:{int(reminder_time.timestamp())}:R> (<t:{int(reminder_time.timestamp())}:F>)"
        )
        
        await ctx.send(embed=embed)
        
    async def _send_reminder(self, reminder_id: str, seconds: int):
        """Send a reminder after the specified time"""
        await asyncio.sleep(seconds)
        
        # Check if reminder still exists
        if reminder_id not in self.reminders:
            return
            
        reminder = self.reminders.pop(reminder_id)
        
        # Get user and channel
        user = self.bot.get_user(reminder.get("user_id"))
        channel = self.bot.get_channel(reminder.get("channel_id"))
        
        if not user or not channel:
            return
            
        # Create embed
        embed = discord.Embed(
            title="⏰ Reminder",
            description=reminder.get("message"),
            color=0x8249F0
        )
        
        # When the reminder was set
        time_diff = time.time() - reminder.get("time")
        hours, remainder = divmod(int(time_diff), 3600)
        minutes, seconds = divmod(remainder, 60)
        
        embed.set_footer(text=f"Reminder from {hours}h {minutes}m {seconds}s ago")
        
        try:
            await channel.send(f"{user.mention}, you asked me to remind you:", embed=embed)
        except discord.HTTPException:
            # If we can't send to the channel, try DMing the user
            try:
                await user.send("Here's your reminder:", embed=embed)
            except discord.HTTPException:
                # If we can't DM either, just give up
                pass
                
    @commands.command()
    async def afk(self, ctx: commands.Context, *, reason: str = "AFK"):
        """Set an AFK status"""
        # Store AFK info
        self.afk_users[ctx.author.id] = {
            "reason": reason,
            "time": time.time()
        }
        
        # Acknowledge
        await ctx.send(f"{ctx.author.mention}, I've set your AFK status: {reason}")
        
        # Try to update nickname
        if ctx.guild.me.guild_permissions.manage_nicknames:
            try:
                # Only update if we can edit the member's nick
                if ctx.author.top_role < ctx.guild.me.top_role:
                    # Save original nickname
                    original_nick = ctx.author.display_name
                    
                    # Set AFK prefix
                    if len(original_nick) <= 26:  # 32 - len("[AFK] ")
                        await ctx.author.edit(nick=f"[AFK] {original_nick}")
            except discord.HTTPException:
                pass
                
    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        """Check for AFK status"""
        if message.author.bot:
            return
            
        # Remove user's AFK status if they send a message
        if message.author.id in self.afk_users:
            # Get AFK data
            afk_data = self.afk_users.pop(message.author.id)
            
            # Calculate how long they were AFK
            afk_time = int(time.time() - afk_data.get("time"))
            hours, remainder = divmod(afk_time, 3600)
            minutes, seconds = divmod(remainder, 60)
            
            time_str = []
            if hours > 0:
                time_str.append(f"{hours}h")
            if minutes > 0:
                time_str.append(f"{minutes}m")
            if seconds > 0 or not time_str:
                time_str.append(f"{seconds}s")
                
            # Acknowledge return
            await message.channel.send(
                f"Welcome back {message.author.mention}! You were AFK for {' '.join(time_str)}."
            )
            
            # Try to restore nickname
            if message.guild and message.guild.me.guild_permissions.manage_nicknames:
                try:
                    # Only update if we can edit the member's nick
                    if message.author.top_role < message.guild.me.top_role:
                        current_nick = message.author.display_name
                        
                        # If nickname starts with [AFK], remove it
                        if current_nick.startswith("[AFK] "):
                            await message.author.edit(nick=current_nick[6:])
                except discord.HTTPException:
                    pass
                    
        # Check for mentions of AFK users
        if message.mentions:
            afk_mentions = []
            
            for mention in message.mentions:
                if mention.id in self.afk_users:
                    afk_data = self.afk_users[mention.id]
                    afk_time = int(time.time() - afk_data.get("time"))
                    
                    hours, remainder = divmod(afk_time, 3600)
                    minutes, seconds = divmod(remainder, 60)
                    
                    time_str = []
                    if hours > 0:
                        time_str.append(f"{hours}h")
                    if minutes > 0:
                        time_str.append(f"{minutes}m")
                    if seconds > 0 or not time_str:
                        time_str.append(f"{seconds}s")
                        
                    afk_mentions.append(
                        f"{mention.mention} is AFK: {afk_data.get('reason')} - {' '.join(time_str)} ago"
                    )
                    
            if afk_mentions:
                await message.channel.send("\n".join(afk_mentions))
                
    @commands.command()
    async def weather(self, ctx: commands.Context, *, location: str):
        """Get weather information for a location"""
        # This is a sample command that would normally use an API
        # In a real implementation, you would integrate with a weather API
        
        # Simulate API call
        await ctx.send(f"Getting weather information for {location}...")
        await asyncio.sleep(1)
        
        # Sample weather data
        weather_conditions = [
            "Sunny", "Partly Cloudy", "Cloudy", "Rainy", "Stormy",
            "Snowy", "Windy", "Foggy", "Clear"
        ]
        
        temperatures = {
            "Sunny": (70, 85),
            "Partly Cloudy": (65, 80),
            "Cloudy": (60, 75),
            "Rainy": (55, 70),
            "Stormy": (50, 65),
            "Snowy": (20, 35),
            "Windy": (45, 65),
            "Foggy": (50, 70),
            "Clear": (65, 85)
        }
        
        condition = random.choice(weather_conditions)
        temp_range = temperatures[condition]
        temp = random.randint(temp_range[0], temp_range[1])
        feels_like = temp + random.randint(-3, 3)
        humidity = random.randint(30, 90)
        wind_speed = random.randint(0, 20)
        
        embed = discord.Embed(
            title=f"Weather for {location}",
            description=f"Current condition: **{condition}**",
            color=0x8249F0
        )
        
        embed.add_field(name="Temperature", value=f"{temp}°F ({round((temp - 32) * 5/9)}°C)", inline=True)
        embed.add_field(name="Feels Like", value=f"{feels_like}°F ({round((feels_like - 32) * 5/9)}°C)", inline=True)
        embed.add_field(name="Humidity", value=f"{humidity}%", inline=True)
        embed.add_field(name="Wind Speed", value=f"{wind_speed} mph", inline=True)
        
        # Add appropriate icon
        weather_icons = {
            "Sunny": "☀️",
            "Partly Cloudy": "⛅",
            "Cloudy": "☁️",
            "Rainy": "🌧️",
            "Stormy": "⛈️",
            "Snowy": "❄️",
            "Windy": "💨",
            "Foggy": "🌫️",
            "Clear": "🌈"
        }
        
        embed.set_author(name=f"{weather_icons[condition]} Weather Information")
        embed.set_footer(text="Note: This is simulated weather data for demonstration. Use g!premium to get real weather data!")
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def calc(self, ctx: commands.Context, *, expression: str):
        """Simple calculator"""
        # For safety, restrict to basic arithmetic
        allowed_chars = set("0123456789+-*/() .")
        
        if not all(c in allowed_chars for c in expression):
            return await ctx.send("Expression contains invalid characters. Only numbers and basic operators (+, -, *, /) are allowed.")
            
        try:
            # Calculate the result
            result = eval(expression, {"__builtins__": {}})
            
            embed = discord.Embed(
                title="Calculator",
                description=f"Expression: `{expression}`",
                color=0x8249F0
            )
            embed.add_field(name="Result", value=f"`{result}`")
            
            await ctx.send(embed=embed)
            
        except Exception as e:
            await ctx.send(f"Error evaluating expression: {e}")
            
    @commands.command()
    async def timer(self, ctx: commands.Context, duration: str):
        """Set a timer
        Time format: <number><s|m|h|d> (e.g. 10m for 10 minutes)
        """
        time_units = {"s": 1, "m": 60, "h": 3600, "d": 86400}
        seconds = 0
        
        # Simple time format parsing
        if duration[-1].lower() in time_units and duration[:-1].isdigit():
            seconds = int(duration[:-1]) * time_units[duration[-1].lower()]
        else:
            return await ctx.send("Invalid time format. Use `<number><s|m|h|d>` (e.g. 10m for 10 minutes)")
            
        if seconds < 1 or seconds > 86400:  # 1 day max
            return await ctx.send("Timer must be between 1 second and 1 day.")
            
        # Calculate timer end time
        end_time = int((datetime.datetime.utcnow() + datetime.timedelta(seconds=seconds)).timestamp())
        
        # Send timer message
        embed = discord.Embed(
            title="⏲️ Timer Started",
            description=f"Timer set for **{duration}**",
            color=0x8249F0
        )
        embed.add_field(
            name="Ends",
            value=f"<t:{end_time}:R> (<t:{end_time}:f>)"
        )
        embed.set_footer(text=f"Requested by {ctx.author}")
        
        timer_msg = await ctx.send(embed=embed)
        
        # Start counting down
        await asyncio.sleep(seconds)
        
        # Timer completed
        embed = discord.Embed(
            title="⏲️ Timer Finished!",
            description=f"Your timer for **{duration}** has ended!",
            color=0x00FF00
        )
        embed.set_footer(text=f"Requested by {ctx.author}")
        
        await timer_msg.edit(embed=embed)
        await ctx.send(f"{ctx.author.mention}, your timer for **{duration}** has finished!")
        
    @commands.command()
    async def randomnumber(self, ctx: commands.Context, min_val: int, max_val: int):
        """Generate a random number between min and max"""
        if min_val >= max_val:
            return await ctx.send("The minimum value must be less than the maximum value.")
            
        number = random.randint(min_val, max_val)
        
        embed = discord.Embed(
            title="🎲 Random Number",
            description=f"Between {min_val} and {max_val}",
            color=0x8249F0
        )
        embed.add_field(name="Result", value=f"**{number}**")
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def roll(self, ctx: commands.Context, dice: str):
        """Roll dice in NdN format"""
        try:
            # Handle basic additions and subtractions
            parts = []
            current_part = ""
            operators = []
            
            for char in dice:
                if char in "+-" and current_part:
                    parts.append(current_part)
                    operators.append(char)
                    current_part = ""
                else:
                    current_part += char
                    
            if current_part:
                parts.append(current_part)
                
            # Process each part
            results = []
            roll_details = []
            
            for part in parts:
                if "d" in part.lower():
                    # It's dice
                    roll_parts = part.lower().split('d')
                    
                    if roll_parts[0] == "":
                        num_dice = 1
                    else:
                        num_dice = int(roll_parts[0])
                        
                    sides = int(roll_parts[1])
                    
                    if num_dice <= 0 or sides <= 0:
                        return await ctx.send("Invalid dice format. Dice count and sides must be positive.")
                        
                    if num_dice > 100:
                        return await ctx.send("You can't roll more than 100 dice at once.")
                        
                    # Roll the dice
                    dice_results = [random.randint(1, sides) for _ in range(num_dice)]
                    results.append(sum(dice_results))
                    
                    # Format roll details
                    detail = f"{num_dice}d{sides}: [{', '.join(map(str, dice_results))}]"
                    roll_details.append(detail)
                else:
                    # It's a modifier
                    results.append(int(part))
                    roll_details.append(part)
                    
            # Apply operators
            final_result = results[0]
            calculation = str(results[0])
            
            for i, op in enumerate(operators):
                if op == "+":
                    final_result += results[i + 1]
                    calculation += f" + {results[i + 1]}"
                else:  # op == "-"
                    final_result -= results[i + 1]
                    calculation += f" - {results[i + 1]}"
                    
            # Create embed
            embed = discord.Embed(
                title="🎲 Dice Roll",
                description=f"Rolling **{dice}**",
                color=0x8249F0
            )
            
            embed.add_field(name="Details", value="\n".join(roll_details), inline=False)
            
            if len(operators) > 0:
                embed.add_field(name="Calculation", value=calculation, inline=False)
                
            embed.add_field(name="Result", value=f"**{final_result}**", inline=False)
            
            await ctx.send(embed=embed)
            
        except Exception as e:
            await ctx.send(f"Invalid dice format. Use NdN format, e.g. 2d6 (2 dice with 6 sides).\nError: {e}")
            
    @commands.command()
    async def choose(self, ctx: commands.Context, *, options: str):
        """Choose between multiple options
        Format: option1 | option2 | option3...
        """
        if "|" not in options:
            return await ctx.send("Invalid format. Use `option1 | option2 | option3 | ...`")
            
        choices = [choice.strip() for choice in options.split("|")]
        
        if not all(choices):
            return await ctx.send("All options must be non-empty.")
            
        selected = random.choice(choices)
        
        embed = discord.Embed(
            title="🤔 Choice Made",
            description=f"I've chosen from {len(choices)} options",
            color=0x8249F0
        )
        embed.add_field(name="Options", value="\n".join(f"• {choice}" for choice in choices), inline=False)
        embed.add_field(name="Selected", value=f"**{selected}**", inline=False)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def urban(self, ctx: commands.Context, *, term: str):
        """Look up a term on Urban Dictionary"""
        # This would normally use an API, but we'll simulate the response
        
        # Simulate API call
        await ctx.send(f"Looking up `{term}` on Urban Dictionary...")
        await asyncio.sleep(1)
        
        # Generate a fake definition
        definitions = [
            {
                "definition": f"A slang term for {term}. Often used by young people in casual conversation.",
                "example": f"Did you see that {term} at the party last night?",
                "thumbs_up": random.randint(100, 5000),
                "thumbs_down": random.randint(10, 500)
            },
            {
                "definition": f"{term.capitalize()} refers to a specific type of behavior characterized by excessive enthusiasm.",
                "example": f"That's so {term}!",
                "thumbs_up": random.randint(100, 5000),
                "thumbs_down": random.randint(10, 500)
            },
            {
                "definition": f"A popular internet meme originating from {random.choice(['Twitter', 'Reddit', 'TikTok', 'Instagram'])} in {random.randint(2010, 2023)}.",
                "example": f"I can't believe you just {term}-ed me!",
                "thumbs_up": random.randint(100, 5000),
                "thumbs_down": random.randint(10, 500)
            }
        ]
        
        definition = random.choice(definitions)
        
        embed = discord.Embed(
            title=f"📚 Urban Dictionary: {term}",
            url=f"https://www.urbandictionary.com/define.php?term={urllib.parse.quote(term)}",
            color=0x8249F0
        )
        
        # Truncate definition if too long
        if len(definition["definition"]) > 1024:
            embed.add_field(name="Definition", value=definition["definition"][:1021] + "...", inline=False)
        else:
            embed.add_field(name="Definition", value=definition["definition"], inline=False)
            
        # Truncate example if too long
        if len(definition["example"]) > 1024:
            embed.add_field(name="Example", value=definition["example"][:1021] + "...", inline=False)
        else:
            embed.add_field(name="Example", value=definition["example"], inline=False)
            
        embed.add_field(name="👍", value=definition["thumbs_up"], inline=True)
        embed.add_field(name="👎", value=definition["thumbs_down"], inline=True)
        embed.set_footer(text="Note: This is simulated data for demonstration. Use g!premium to get real Urban Dictionary definitions!")
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def google(self, ctx: commands.Context, *, query: str):
        """Generate a Google search URL"""
        # Encode the query for URL
        encoded_query = urllib.parse.quote(query)
        search_url = f"https://www.google.com/search?q={encoded_query}"
        
        embed = discord.Embed(
            title=f"🔍 Google Search: {query}",
            url=search_url,
            color=0x8249F0
        )
        
        embed.set_footer(text="Click the title to open the search in Google")
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def color(self, ctx: commands.Context, hex_code: str):
        """Show a preview of a color"""
        # Validate hex code
        hex_code = hex_code.strip('#')
        if not (len(hex_code) == 6 and all(c in "0123456789ABCDEFabcdef" for c in hex_code)):
            return await ctx.send("Invalid hex color code. Use a 6-digit hex code (e.g. #FF0000 or FF0000).")
            
        # Convert to integer
        color_int = int(hex_code, 16)
        
        # Calculate brightness (luminance)
        r = int(hex_code[0:2], 16) / 255.0
        g = int(hex_code[2:4], 16) / 255.0
        b = int(hex_code[4:6], 16) / 255.0
        
        # Calculate luminance
        luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
        
        # Choose white or black text color based on brightness
        text_color = "black" if luminance > 0.5 else "white"
        
        # Create embed
        embed = discord.Embed(
            title=f"Color #{hex_code.upper()}",
            color=color_int
        )
        
        # Add RGB values
        r_dec = int(hex_code[0:2], 16)
        g_dec = int(hex_code[2:4], 16)
        b_dec = int(hex_code[4:6], 16)
        
        embed.add_field(name="Hex", value=f"#{hex_code.upper()}", inline=True)
        embed.add_field(name="RGB", value=f"rgb({r_dec}, {g_dec}, {b_dec})", inline=True)
        embed.add_field(name="Int", value=str(color_int), inline=True)
        
        # Create color preview
        embed.set_image(url=f"https://dummyimage.com/200x100/{hex_code}/{text_color}&text=+")
        
        await ctx.send(embed=embed)
        
    # Function to set up the cog
    async def setup(bot):
        await bot.add_cog(UtilityCommands(bot))