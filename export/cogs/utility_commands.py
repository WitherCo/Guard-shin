import discord
from discord.ext import commands
import datetime
import asyncio
import platform
import psutil
import typing
import random

class UtilityCommands(commands.Cog):
    """Utility commands for Guard-shin bot that use prefix"""
    
    def __init__(self, bot):
        self.bot = bot
    
    @commands.command(name="userinfo", aliases=["whois"])
    async def user_info(self, ctx, member: typing.Optional[discord.Member] = None):
        """Get information about a user"""
        # If no member specified, use the command author
        target = member or ctx.author
        
        # Get member joined date
        joined_at = target.joined_at.strftime("%B %d, %Y, %I:%M %p") if target.joined_at else "Unknown"
        
        # Get account creation date
        created_at = target.created_at.strftime("%B %d, %Y, %I:%M %p")
        
        # Get user status
        status = str(target.status).title()
        
        # Get user roles (except @everyone)
        roles = [role.mention for role in target.roles if role.name != "@everyone"]
        roles_str = ", ".join(roles) if roles else "None"
        
        # Create embed
        embed = discord.Embed(
            title=f"User Information: {target}",
            color=target.color,
            timestamp=datetime.datetime.now()
        )
        
        # Set thumbnail to user avatar
        if target.avatar:
            embed.set_thumbnail(url=target.avatar.url)
        
        # Basic Info
        embed.add_field(name="ID", value=target.id, inline=True)
        embed.add_field(name="Nickname", value=target.nick or "None", inline=True)
        embed.add_field(name="Status", value=status, inline=True)
        
        # Dates
        embed.add_field(name="Account Created", value=f"{created_at}\n({discord.utils.format_dt(target.created_at, style='R')})", inline=False)
        embed.add_field(name="Joined Server", value=f"{joined_at}\n({discord.utils.format_dt(target.joined_at, style='R')})" if target.joined_at else "Unknown", inline=False)
        
        # Roles
        embed.add_field(name=f"Roles [{len(roles)}]", value=roles_str[:1024], inline=False)
        
        # Permissions
        key_permissions = []
        permissions = target.guild_permissions
        
        if permissions.administrator:
            key_permissions.append("Administrator")
        else:
            if permissions.manage_guild:
                key_permissions.append("Manage Server")
            if permissions.ban_members:
                key_permissions.append("Ban Members")
            if permissions.kick_members:
                key_permissions.append("Kick Members")
            if permissions.manage_channels:
                key_permissions.append("Manage Channels")
            if permissions.manage_messages:
                key_permissions.append("Manage Messages")
            if permissions.manage_roles:
                key_permissions.append("Manage Roles")
            if permissions.moderate_members:
                key_permissions.append("Timeout Members")
        
        if key_permissions:
            embed.add_field(name="Key Permissions", value=", ".join(key_permissions), inline=False)
        
        await ctx.send(embed=embed)
    
    @commands.command(name="avatar", aliases=["pfp"])
    async def avatar(self, ctx, member: typing.Optional[discord.Member] = None):
        """Get a user's avatar"""
        target = member or ctx.author
        
        if not target.avatar:
            return await ctx.send("This user doesn't have an avatar.")
            
        embed = discord.Embed(
            title=f"{target}'s Avatar",
            color=discord.Color.purple()
        )
        
        # Add avatar at different sizes
        embed.set_image(url=target.avatar.url)
        
        # Add links to different formats
        formats = []
        if target.avatar.is_animated():
            formats.append(f"[GIF]({target.avatar.with_format('gif').url})")
        formats.append(f"[PNG]({target.avatar.with_format('png').url})")
        formats.append(f"[JPG]({target.avatar.with_format('jpg').url})")
        formats.append(f"[WEBP]({target.avatar.with_format('webp').url})")
        
        embed.add_field(name="Links", value=" | ".join(formats), inline=False)
        
        await ctx.send(embed=embed)
    
    @commands.command(name="stats", aliases=["botstats"])
    async def stats(self, ctx):
        """Get statistics about the bot"""
        # Get memory usage
        memory = psutil.Process().memory_info().rss / 1024**2  # Convert to MB
        
        # Get uptime
        uptime = datetime.datetime.now() - datetime.datetime.fromtimestamp(psutil.Process().create_time())
        days, remainder = divmod(int(uptime.total_seconds()), 86400)
        hours, remainder = divmod(remainder, 3600)
        minutes, seconds = divmod(remainder, 60)
        uptime_str = f"{days}d, {hours}h, {minutes}m, {seconds}s"
        
        # Create embed
        embed = discord.Embed(
            title="Guard-shin Statistics",
            color=discord.Color.purple(),
            timestamp=datetime.datetime.now()
        )
        
        # Bot info
        embed.add_field(name="Version", value="1.0.0", inline=True)
        embed.add_field(name="Library", value=f"discord.py {discord.__version__}", inline=True)
        embed.add_field(name="Python", value=platform.python_version(), inline=True)
        
        # Stats
        embed.add_field(name="Servers", value=str(len(self.bot.guilds)), inline=True)
        embed.add_field(name="Users", value=str(sum(g.member_count for g in self.bot.guilds)), inline=True)
        embed.add_field(name="Commands", value=str(len(self.bot.commands)), inline=True)
        
        # System info
        embed.add_field(name="Memory Usage", value=f"{memory:.2f} MB", inline=True)
        embed.add_field(name="CPU", value=f"{psutil.cpu_percent()}%", inline=True)
        embed.add_field(name="Uptime", value=uptime_str, inline=True)
        
        await ctx.send(embed=embed)
    
    @commands.command(name="poll")
    async def poll(self, ctx, question, *options):
        """
        Create a poll with reactions.
        
        Examples:
        !poll "Do you like pizza?" "Yes" "No" "Maybe"
        !poll "Favorite color?" "Red" "Blue" "Green" "Yellow"
        """
        if len(options) < 2:
            return await ctx.send("You need at least 2 options for a poll.")
            
        if len(options) > 10:
            return await ctx.send("You can only have up to 10 options for a poll.")
            
        # Create embed for poll
        embed = discord.Embed(
            title=question,
            description="\n\n".join([f"{chr(127462 + i)} {option}" for i, option in enumerate(options)]),
            color=discord.Color.purple(),
            timestamp=datetime.datetime.now()
        )
        
        embed.set_footer(text=f"Poll created by {ctx.author}")
        
        # Send poll and add reactions
        poll_message = await ctx.send(embed=embed)
        
        for i in range(len(options)):
            await poll_message.add_reaction(chr(127462 + i))  # A, B, C, etc. emoji (🇦, 🇧, 🇨...)
    
    @commands.command(name="remind", aliases=["reminder"])
    async def remind(self, ctx, time, *, reminder):
        """
        Set a reminder for yourself
        
        Examples:
        !remind 1h Check the oven
        !remind 30m Go to meeting
        !remind 5m Take a break
        """
        # Parse the time
        time_units = {
            's': 1,
            'm': 60,
            'h': 3600,
            'd': 86400
        }
        
        # Extract the number and unit
        amount = ""
        unit = ""
        
        for char in time:
            if char.isdigit():
                amount += char
            else:
                unit = char
                break
                
        if not amount or unit not in time_units:
            return await ctx.send("Invalid time format. Use 1s, 2m, 3h, or 4d.")
            
        # Convert to seconds
        seconds = int(amount) * time_units[unit]
        
        # Limit to reasonable time (2 weeks max)
        if seconds > 1209600:  # 2 weeks in seconds
            return await ctx.send("Sorry, I can only remind you for up to 2 weeks.")
            
        # Calculate when the reminder will trigger
        future_time = datetime.datetime.now() + datetime.timedelta(seconds=seconds)
        
        # Send confirmation
        await ctx.send(f"I'll remind you about: **{reminder}** in **{amount}{unit}** "
                     f"({discord.utils.format_dt(future_time, style='R')})")
        
        # Wait for the specified time
        await asyncio.sleep(seconds)
        
        # Send the reminder
        try:
            embed = discord.Embed(
                title="Reminder",
                description=reminder,
                color=discord.Color.purple(),
                timestamp=datetime.datetime.now()
            )
            
            embed.add_field(
                name="Original Command",
                value=f"Set {discord.utils.format_dt(datetime.datetime.now() - datetime.timedelta(seconds=seconds), style='R')}",
                inline=False
            )
            
            embed.set_footer(text=f"Reminder set by {ctx.author}")
            
            await ctx.author.send(embed=embed)
            
            # If this is in a guild, also send a notice there
            if ctx.guild:
                await ctx.send(f"{ctx.author.mention} I've sent your reminder to your DMs!")
                
        except discord.Forbidden:
            # If we can't DM the user, send in the channel
            await ctx.send(f"{ctx.author.mention} **Reminder:** {reminder}")
    
    @commands.command(name="roll", aliases=["dice"])
    async def roll(self, ctx, dice: str = "1d6"):
        """
        Roll dice in NdN format
        
        Examples:
        !roll - Rolls 1d6
        !roll 2d6 - Rolls two 6-sided dice
        !roll 1d20 - Rolls a 20-sided die
        """
        try:
            # Parse the dice string (e.g., "2d6")
            rolls, limit = map(int, dice.split('d'))
        except ValueError:
            return await ctx.send("Invalid dice format. Use NdN format (e.g., 1d6, 2d20).")
            
        # Limit to reasonable values
        if rolls > 100:
            return await ctx.send("I can't roll more than 100 dice at once.")
            
        if limit > 1000:
            return await ctx.send("I can't roll dice with more than 1000 sides.")
            
        if rolls < 1 or limit < 1:
            return await ctx.send("Both the number of dice and sides must be at least 1.")
            
        # Roll the dice
        results = [random.randint(1, limit) for _ in range(rolls)]
        total = sum(results)
        
        # Format the results
        results_str = ", ".join(map(str, results))
        
        # Create the message based on the number of dice
        if rolls == 1:
            message = f"🎲 Rolled a {results[0]}"
        else:
            message = f"🎲 Rolled {rolls}d{limit}: {results_str} = **{total}**"
            
        await ctx.send(message)

async def setup(bot):
    await bot.add_cog(UtilityCommands(bot))