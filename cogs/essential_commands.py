import discord
from discord.ext import commands
import asyncio
import datetime
import random
import time
import json
import os
import logging
from typing import Optional, Union, List, Dict, Any, Literal

logger = logging.getLogger('guard-shin.commands')

# Command categories for Help command
CATEGORIES = {
    "moderation": "🛡️ Moderation",
    "admin": "⚙️ Administration",
    "utility": "🔧 Utility",
    "fun": "🎮 Fun",
    "info": "ℹ️ Information",
    "economy": "💰 Economy",
    "levels": "📈 Levels",
    "music": "🎵 Music",
    "games": "🎲 Games",
    "images": "🖼️ Images",
    "social": "🤝 Social",
    "premium": "✨ Premium",
    "config": "🔧 Configuration"
}

class EssentialCommands(commands.Cog, name="EssentialCommands"):
    """Base commands system for Guard-shin"""

    def __init__(self, bot):
        self.bot = bot
        self.command_uses = {}
        self.prefix = "g!"
        self.premium_servers = self._load_premium_servers()
        self.config = self._load_config()
        self.cooldowns = {}
        
        # Initialize command stats
        for command in self.get_commands():
            self.command_uses[command.name] = 0
            
    def _load_premium_servers(self) -> List[int]:
        """Load premium server IDs"""
        try:
            if os.path.exists("premium_guilds.json"):
                with open("premium_guilds.json", "r") as f:
                    data = json.load(f)
                    return set([int(guild_id) for guild_id in data.get("guild_ids", [])])
        except Exception as e:
            logger.error(f"Error loading premium servers: {e}")
        
        # Default premium servers (can be an empty set)
        return set()
            
    def _load_config(self) -> Dict[str, Any]:
        """Load bot configuration"""
        try:
            if os.path.exists("config.json"):
                with open("config.json", "r") as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Error loading config: {e}")
        
        # Default config
        return {
            "disabled_commands": {},
            "disabled_categories": {},
            "command_channels": {},
            "prefix_overrides": {}
        }
        
    def is_premium(self, guild_id: int) -> bool:
        """Check if a guild has premium"""
        return guild_id in self.premium_servers
        
    # Helper methods
    async def check_permissions(self, ctx: commands.Context, perms: Dict[str, bool], *, check=all):
        """Check if user has permissions"""
        if ctx.author.id == ctx.guild.owner_id:
            return True
        
        resolved = ctx.author.guild_permissions
        return check(getattr(resolved, name, None) == value for name, value in perms.items())

    async def check_mod(self, ctx: commands.Context):
        """Check if user is a moderator"""
        if ctx.author.id == ctx.guild.owner_id:
            return True
            
        # Check for admin permissions
        if ctx.author.guild_permissions.administrator:
            return True
            
        # Check for moderator role (customize as needed)
        mod_roles = ["Moderator", "Mod", "mod", "moderator"]
        return any(role.name in mod_roles for role in ctx.author.roles)

    async def check_admin(self, ctx: commands.Context):
        """Check if user is an admin"""
        if ctx.author.id == ctx.guild.owner_id:
            return True
            
        # Check for admin permissions
        return ctx.author.guild_permissions.administrator
        
    # UTILITY COMMANDS
    
    @commands.command()
    async def ping(self, ctx: commands.Context):
        """Check the bot's latency"""
        start_time = time.time()
        message = await ctx.send("Pinging...")
        end_time = time.time()
        
        api_latency = round(self.bot.latency * 1000)
        message_latency = round((end_time - start_time) * 1000)
        
        embed = discord.Embed(title="Pong! 🏓", color=0x8249F0)
        embed.add_field(name="API Latency", value=f"{api_latency}ms", inline=True)
        embed.add_field(name="Message Latency", value=f"{message_latency}ms", inline=True)
        
        await message.edit(content=None, embed=embed)
        
    @commands.command()
    async def uptime(self, ctx: commands.Context):
        """Show the bot's uptime"""
        current_time = datetime.datetime.utcnow()
        delta = current_time - self.bot.uptime
        
        days, remainder = divmod(int(delta.total_seconds()), 86400)
        hours, remainder = divmod(remainder, 3600)
        minutes, seconds = divmod(remainder, 60)
        
        uptime_str = f"{days}d {hours}h {minutes}m {seconds}s"
        
        embed = discord.Embed(
            title="Bot Uptime",
            description=f"I've been online for {uptime_str}",
            color=0x8249F0
        )
        embed.set_footer(text=f"Started at {self.bot.uptime.strftime('%Y-%m-%d %H:%M:%S')} UTC")
        
        await ctx.send(embed=embed)
        
    @commands.command(name="commandhelp")
    async def command_help(self, ctx: commands.Context, *, command_or_category: str = None):
        """Show help for commands or categories"""
        if command_or_category is None:
            # Show main help menu with categories
            embed = discord.Embed(
                title="Guard-shin Help",
                description="Here are all the command categories. Use `g!help <category>` for more info about a category.",
                color=0x8249F0
            )
            
            for cat_id, cat_name in CATEGORIES.items():
                # Get number of commands in each category
                cat_commands = [cmd for cmd in self.get_commands() if getattr(cmd, "category", None) == cat_id]
                embed.add_field(
                    name=cat_name,
                    value=f"`g!help {cat_id}` - {len(cat_commands)} commands",
                    inline=True
                )
                
            embed.set_footer(text=f"Use g!help <command> for more info on a command.")
            await ctx.send(embed=embed)
            return
            
        # Check if input is a command
        cmd = self.bot.get_command(command_or_category)
        if cmd is not None:
            # Show help for specific command
            embed = discord.Embed(
                title=f"Command: {cmd.name}",
                description=cmd.help or "No description available",
                color=0x8249F0
            )
            
            if cmd.aliases:
                embed.add_field(
                    name="Aliases",
                    value=", ".join(f"`{alias}`" for alias in cmd.aliases),
                    inline=False
                )
                
            usage = getattr(cmd, "usage", f"{ctx.prefix}{cmd.name}")
            embed.add_field(name="Usage", value=f"`{usage}`", inline=False)
            
            if hasattr(cmd, "examples") and cmd.examples:
                embed.add_field(
                    name="Examples",
                    value="\n".join(f"`{ex}`" for ex in cmd.examples),
                    inline=False
                )
                
            # Show if command is premium-only
            if getattr(cmd, "premium", False):
                embed.add_field(
                    name="Premium",
                    value="This command requires a premium subscription.",
                    inline=False
                )
                
            await ctx.send(embed=embed)
            return
            
        # Check if input is a category
        if command_or_category.lower() in CATEGORIES:
            cat_id = command_or_category.lower()
            cat_name = CATEGORIES[cat_id]
            
            # Get commands in this category
            cat_commands = [cmd for cmd in self.get_commands() if getattr(cmd, "category", None) == cat_id]
            
            if not cat_commands:
                await ctx.send(f"No commands found in the {cat_name} category.")
                return
                
            embed = discord.Embed(
                title=f"{cat_name} Commands",
                description=f"Here are all the commands in the {cat_name} category.",
                color=0x8249F0
            )
            
            for cmd in sorted(cat_commands, key=lambda x: x.name):
                premium_badge = "✨ " if getattr(cmd, "premium", False) else ""
                value = cmd.help.split('\n')[0] if cmd.help else "No description"
                embed.add_field(
                    name=f"{premium_badge}{ctx.prefix}{cmd.name}",
                    value=value,
                    inline=True
                )
                
            embed.set_footer(text=f"Use g!help <command> for more info on a command.")
            await ctx.send(embed=embed)
            return
            
        # If input is neither a command nor a category
        await ctx.send(f"No command or category named '{command_or_category}' found.")
        
    @commands.command(name="useravatar")
    async def user_avatar(self, ctx: commands.Context, *, member: discord.Member = None):
        """Display a user's avatar"""
        member = member or ctx.author
        
        embed = discord.Embed(
            title=f"{member.name}'s Avatar",
            color=0x8249F0
        )
        
        # Add both PNG and webp formats
        embed.description = f"[PNG]({member.avatar.url}) | [WebP]({member.avatar.with_format('webp').url})"
        embed.set_image(url=member.avatar.url)
        
        await ctx.send(embed=embed)
        
    # MODERATION COMMANDS
    
    @commands.command(name="ban_member")
    @commands.has_permissions(ban_members=True)
    async def ban_member(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        """Ban a user from the server with an optional reason"""
        if member.id == ctx.author.id:
            return await ctx.send("You cannot ban yourself.")
            
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            return await ctx.send("You cannot ban someone with a higher or equal role.")
            
        try:
            # Send DM to the user being banned
            try:
                embed = discord.Embed(
                    title=f"You've been banned from {ctx.guild.name}",
                    description=f"Reason: {reason}",
                    color=0xFF0000
                )
                await member.send(embed=embed)
            except discord.HTTPException:
                # Can't send DM to the user
                pass
                
            # Ban the user
            await ctx.guild.ban(member, reason=f"{reason} - Banned by {ctx.author}")
            
            # Send confirmation message
            embed = discord.Embed(
                title="User Banned",
                description=f"**{member}** has been banned from the server.",
                color=0x8249F0
            )
            embed.add_field(name="Reason", value=reason)
            embed.set_footer(text=f"Banned by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to ban that user.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred: {e}")
            
    @commands.command(name="kick_member")
    @commands.has_permissions(kick_members=True)
    async def kick_member(self, ctx: commands.Context, member: discord.Member, *, reason: str = "No reason provided"):
        """Kick a user from the server with an optional reason"""
        if member.id == ctx.author.id:
            return await ctx.send("You cannot kick yourself.")
            
        if member.top_role >= ctx.author.top_role and ctx.author.id != ctx.guild.owner_id:
            return await ctx.send("You cannot kick someone with a higher or equal role.")
            
        try:
            # Send DM to the user being kicked
            try:
                embed = discord.Embed(
                    title=f"You've been kicked from {ctx.guild.name}",
                    description=f"Reason: {reason}",
                    color=0xFF0000
                )
                await member.send(embed=embed)
            except discord.HTTPException:
                # Can't send DM to the user
                pass
                
            # Kick the user
            await member.kick(reason=f"{reason} - Kicked by {ctx.author}")
            
            # Send confirmation message
            embed = discord.Embed(
                title="User Kicked",
                description=f"**{member}** has been kicked from the server.",
                color=0x8249F0
            )
            embed.add_field(name="Reason", value=reason)
            embed.set_footer(text=f"Kicked by {ctx.author}")
            
            await ctx.send(embed=embed)
            
        except discord.Forbidden:
            await ctx.send("I don't have permission to kick that user.")
        except discord.HTTPException as e:
            await ctx.send(f"An error occurred: {e}")
            
    @commands.command(name="essentialclear")
    @commands.has_permissions(manage_messages=True)
    async def clear_messages(self, ctx: commands.Context, amount: int, member: discord.Member = None):
        """Clear a specified number of messages"""
        if amount <= 0:
            return await ctx.send("The amount must be greater than 0.")
            
        if amount > 100:
            return await ctx.send("You cannot delete more than 100 messages at once.")
            
        # Delete the command message
        await ctx.message.delete()
        
        # Check if we're filtering by user
        if member:
            # We need to fetch more messages to filter by user
            messages = []
            async for msg in ctx.channel.history(limit=amount * 5):
                if msg.author.id == member.id:
                    messages.append(msg)
                    if len(messages) >= amount:
                        break
                        
            # Slice to the requested amount
            messages = messages[:amount]
        else:
            # Just get the requested amount of messages
            messages = await ctx.channel.history(limit=amount).flatten()
            
        if not messages:
            return await ctx.send("No messages found to delete.", delete_after=5)
            
        # Delete the messages
        try:
            await ctx.channel.delete_messages(messages)
            
            # Send confirmation message
            msg = await ctx.send(
                f"Deleted {len(messages)} message{'s' if len(messages) != 1 else ''}"
                + (f" from {member.mention}" if member else "")
            )
            
            # Delete confirmation after a few seconds
            await asyncio.sleep(5)
            await msg.delete()
            
        except discord.HTTPException as e:
            await ctx.send(f"Error deleting messages: {e}")
            
    # ADMINISTRATION COMMANDS
    
    @commands.command(name="setprefix2")
    @commands.has_permissions(administrator=True)
    async def set_prefix(self, ctx: commands.Context, new_prefix: str = None):
        """Change the bot's prefix for this server"""
        if new_prefix is None:
            # Show current prefix
            current_prefix = self.bot.get_guild_prefix(str(ctx.guild.id))
            return await ctx.send(f"Current prefix is `{current_prefix}`")
            
        if len(new_prefix) > 5:
            return await ctx.send("Prefix cannot be longer than 5 characters.")
            
        # Update prefix
        self.bot.set_guild_prefix(str(ctx.guild.id), new_prefix)
        
        await ctx.send(f"Prefix updated to `{new_prefix}`")
        
    @commands.command()
    @commands.has_permissions(administrator=True)
    async def setup(self, ctx: commands.Context):
        """Set up the basic bot configuration"""
        # Create a welcome message
        embed = discord.Embed(
            title="🎉 Guard-shin Setup",
            description="Let's configure the basic settings for Guard-shin!",
            color=0x8249F0
        )
        
        embed.add_field(
            name="📋 Available Options",
            value="1️⃣ Set up welcome messages\n2️⃣ Set up logging\n3️⃣ Set up moderation\n4️⃣ Set up prefix\n❌ Cancel setup",
            inline=False
        )
        
        setup_msg = await ctx.send(embed=embed)
        
        # Add reactions for options
        options = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "❌"]
        for option in options:
            await setup_msg.add_reaction(option)
            
        # Wait for reaction
        def check(reaction, user):
            return user == ctx.author and str(reaction.emoji) in options and reaction.message.id == setup_msg.id
            
        try:
            reaction, user = await self.bot.wait_for('reaction_add', timeout=60.0, check=check)
            
            # Remove all reactions
            await setup_msg.clear_reactions()
            
            if str(reaction.emoji) == "1️⃣":
                # Welcome setup
                welcome_embed = discord.Embed(
                    title="Welcome Message Setup",
                    description="Please mention the channel where welcome messages should be sent.",
                    color=0x8249F0
                )
                await setup_msg.edit(embed=welcome_embed)
                
                # Wait for channel mention
                def channel_check(m):
                    return m.author == ctx.author and m.channel == ctx.channel and len(m.channel_mentions) > 0
                    
                try:
                    channel_msg = await self.bot.wait_for('message', timeout=60.0, check=channel_check)
                    welcome_channel = channel_msg.channel_mentions[0]
                    
                    # Save welcome channel
                    # Code to save welcome channel goes here
                    
                    # Ask for custom message
                    custom_msg_embed = discord.Embed(
                        title="Welcome Message",
                        description="Now enter the welcome message. You can use these placeholders:\n"
                                    "{user} - User mention\n"
                                    "{username} - Username\n"
                                    "{server} - Server name\n"
                                    "{count} - Member count",
                        color=0x8249F0
                    )
                    await setup_msg.edit(embed=custom_msg_embed)
                    
                    # Wait for custom message
                    def msg_check(m):
                        return m.author == ctx.author and m.channel == ctx.channel
                        
                    custom_msg = await self.bot.wait_for('message', timeout=120.0, check=msg_check)
                    
                    # Save welcome message
                    # Code to save welcome message goes here
                    
                    # Show success
                    success_embed = discord.Embed(
                        title="✅ Welcome Setup Complete",
                        description=f"Welcome messages will be sent to {welcome_channel.mention}\n"
                                    f"With the message: {custom_msg.content}",
                        color=0x00FF00
                    )
                    await setup_msg.edit(embed=success_embed)
                    
                except asyncio.TimeoutError:
                    await setup_msg.edit(embed=discord.Embed(
                        title="Setup Timed Out",
                        description="You took too long to respond.",
                        color=0xFF0000
                    ))
                    
            elif str(reaction.emoji) == "2️⃣":
                # Logging setup
                pass
                
            elif str(reaction.emoji) == "3️⃣":
                # Moderation setup
                pass
                
            elif str(reaction.emoji) == "4️⃣":
                # Prefix setup
                prefix_embed = discord.Embed(
                    title="Prefix Setup",
                    description="What would you like to set as the bot's prefix for this server?",
                    color=0x8249F0
                )
                await setup_msg.edit(embed=prefix_embed)
                
                # Wait for prefix
                def prefix_check(m):
                    return m.author == ctx.author and m.channel == ctx.channel and len(m.content) <= 5
                    
                try:
                    prefix_msg = await self.bot.wait_for('message', timeout=60.0, check=prefix_check)
                    new_prefix = prefix_msg.content
                    
                    # Update prefix
                    self.bot.set_guild_prefix(str(ctx.guild.id), new_prefix)
                    
                    # Show success
                    success_embed = discord.Embed(
                        title="✅ Prefix Setup Complete",
                        description=f"The bot's prefix has been set to `{new_prefix}`",
                        color=0x00FF00
                    )
                    await setup_msg.edit(embed=success_embed)
                    
                except asyncio.TimeoutError:
                    await setup_msg.edit(embed=discord.Embed(
                        title="Setup Timed Out",
                        description="You took too long to respond.",
                        color=0xFF0000
                    ))
                
            elif str(reaction.emoji) == "❌":
                # Cancel setup
                await setup_msg.edit(embed=discord.Embed(
                    title="Setup Cancelled",
                    description="Setup has been cancelled.",
                    color=0xFF0000
                ))
                
        except asyncio.TimeoutError:
            await setup_msg.clear_reactions()
            await setup_msg.edit(embed=discord.Embed(
                title="Setup Timed Out",
                description="You took too long to respond.",
                color=0xFF0000
            ))
            
    # FUN COMMANDS
    
    @commands.command()
    async def say(self, ctx: commands.Context, *, message: str):
        """Make the bot say something"""
        # Delete the command message
        await ctx.message.delete()
        
        # Send the message as the bot
        await ctx.send(message)
        
    @commands.command(name="8ballask", aliases=["magicball"])
    async def magic_eightball(self, ctx: commands.Context, *, question: str):
        """Ask the magic 8-ball a question"""
        responses = [
            "It is certain.",
            "It is decidedly so.",
            "Without a doubt.",
            "Yes - definitely.",
            "You may rely on it.",
            "As I see it, yes.",
            "Most likely.",
            "Outlook good.",
            "Yes.",
            "Signs point to yes.",
            "Reply hazy, try again.",
            "Ask again later.",
            "Better not tell you now.",
            "Cannot predict now.",
            "Concentrate and ask again.",
            "Don't count on it.",
            "My reply is no.",
            "My sources say no.",
            "Outlook not so good.",
            "Very doubtful."
        ]
        
        response = random.choice(responses)
        
        embed = discord.Embed(
            title="🎱 Magic 8-Ball",
            color=0x8249F0
        )
        embed.add_field(name="Question", value=question, inline=False)
        embed.add_field(name="Answer", value=response, inline=False)
        
        await ctx.send(embed=embed)
        
    @commands.command(name="essentialcoinflip")
    async def coinflip_command(self, ctx: commands.Context):
        """Flip a coin"""
        result = random.choice(["Heads", "Tails"])
        
        embed = discord.Embed(
            title="Coin Flip",
            description=f"The coin landed on **{result}**!",
            color=0x8249F0
        )
        
        # Add an appropriate image
        if result == "Heads":
            embed.set_thumbnail(url="https://i.imgur.com/HAvGDXy.png")
        else:
            embed.set_thumbnail(url="https://i.imgur.com/uQBhgHu.png")
            
        await ctx.send(embed=embed)
        
    # INFORMATION COMMANDS
    
    @commands.command(name="essentialserverinfo")
    async def server_info(self, ctx: commands.Context):
        """Display information about the server"""
        guild = ctx.guild
        
        # Get additional information
        text_channels = len(guild.text_channels)
        voice_channels = len(guild.voice_channels)
        categories = len(guild.categories)
        total_members = guild.member_count
        online_members = sum(1 for m in guild.members if m.status != discord.Status.offline)
        bot_count = sum(1 for m in guild.members if m.bot)
        human_count = total_members - bot_count
        role_count = len(guild.roles) - 1  # Exclude @everyone
        
        embed = discord.Embed(
            title=f"{guild.name} Server Information",
            description=guild.description or "No description",
            color=0x8249F0
        )
        
        # Add server icon if available
        if guild.icon:
            embed.set_thumbnail(url=guild.icon.url)
            
        # General information
        embed.add_field(name="Owner", value=guild.owner.mention, inline=True)
        embed.add_field(name="Server ID", value=guild.id, inline=True)
        embed.add_field(name="Created", value=f"<t:{int(guild.created_at.timestamp())}:R>", inline=True)
        embed.add_field(name="Region", value=str(guild.region).title() if hasattr(guild, "region") else "Unknown", inline=True)
        
        # Channel information
        embed.add_field(
            name="Channels",
            value=f"Text: {text_channels}\nVoice: {voice_channels}\nCategories: {categories}",
            inline=True
        )
        
        # Member information
        embed.add_field(
            name="Members",
            value=f"Total: {total_members}\nHumans: {human_count}\nBots: {bot_count}\nOnline: {online_members}",
            inline=True
        )
        
        # Server features
        if guild.features:
            embed.add_field(
                name="Features",
                value=", ".join(f.replace("_", " ").title() for f in guild.features),
                inline=False
            )
            
        # Server boost information
        embed.add_field(
            name="Boost Status",
            value=f"Level {guild.premium_tier}\n{guild.premium_subscription_count} Boosts",
            inline=True
        )
        
        # Role information
        embed.add_field(
            name="Roles",
            value=f"{role_count} roles",
            inline=True
        )
        
        # Security verification level
        embed.add_field(
            name="Verification Level",
            value=str(guild.verification_level).title(),
            inline=True
        )
        
        await ctx.send(embed=embed)
        
    @commands.command(name="essentialuserinfo")
    async def user_info(self, ctx: commands.Context, *, member: discord.Member = None):
        """Display information about a user"""
        member = member or ctx.author
        
        # Get additional information
        joined_at = member.joined_at
        created_at = member.created_at
        roles = [role.mention for role in member.roles if role.name != "@everyone"]
        roles.reverse()  # Highest role first
        
        embed = discord.Embed(
            title=f"User Information - {member.name}",
            color=member.color if member.color != discord.Color.default() else 0x8249F0
        )
        
        # Add user avatar
        embed.set_thumbnail(url=member.avatar.url if member.avatar else member.default_avatar.url)
        
        # General information
        embed.add_field(name="Username", value=member.name, inline=True)
        embed.add_field(name="Display Name", value=member.display_name, inline=True)
        embed.add_field(name="ID", value=member.id, inline=True)
        
        # Timestamps
        embed.add_field(
            name="Account Created",
            value=f"<t:{int(created_at.timestamp())}:F>\n<t:{int(created_at.timestamp())}:R>",
            inline=True
        )
        
        embed.add_field(
            name="Joined Server",
            value=f"<t:{int(joined_at.timestamp())}:F>\n<t:{int(joined_at.timestamp())}:R>" if joined_at else "Unknown",
            inline=True
        )
        
        # Status and activity
        status_map = {
            discord.Status.online: "🟢 Online",
            discord.Status.idle: "🟡 Idle",
            discord.Status.dnd: "🔴 Do Not Disturb",
            discord.Status.offline: "⚫ Offline"
        }
        
        embed.add_field(
            name="Status",
            value=status_map.get(member.status, "Unknown"),
            inline=True
        )
        
        # Check if user is on mobile
        if hasattr(member, 'is_on_mobile') and member.is_on_mobile():
            embed.add_field(name="Client", value="📱 Mobile", inline=True)
            
        # Activity
        if member.activity:
            if isinstance(member.activity, discord.Game):
                activity = f"Playing {member.activity.name}"
            elif isinstance(member.activity, discord.Streaming):
                activity = f"Streaming {member.activity.name}"
            elif isinstance(member.activity, discord.Spotify):
                activity = f"Listening to {member.activity.title} by {member.activity.artist}"
            elif isinstance(member.activity, discord.CustomActivity):
                activity = f"{member.activity.emoji} {member.activity.name}" if member.activity.emoji else member.activity.name
            else:
                activity = str(member.activity)
                
            embed.add_field(name="Activity", value=activity, inline=False)
            
        # Roles
        if roles:
            embed.add_field(
                name=f"Roles [{len(roles)}]",
                value=" ".join(roles[:10]) + (f" and {len(roles) - 10} more" if len(roles) > 10 else ""),
                inline=False
            )
            
        # Badges
        if hasattr(member, 'public_flags') and member.public_flags.value:
            badges = []
            flags = member.public_flags
            
            if flags.staff:
                badges.append("Discord Staff")
            if flags.partner:
                badges.append("Discord Partner")
            if flags.hypesquad:
                badges.append("HypeSquad Events")
            if flags.bug_hunter:
                badges.append("Bug Hunter")
            if flags.bug_hunter_level_2:
                badges.append("Bug Hunter Level 2")
            if flags.hypesquad_bravery:
                badges.append("HypeSquad Bravery")
            if flags.hypesquad_brilliance:
                badges.append("HypeSquad Brilliance")
            if flags.hypesquad_balance:
                badges.append("HypeSquad Balance")
            if flags.early_supporter:
                badges.append("Early Supporter")
            if flags.verified_bot_developer:
                badges.append("Verified Bot Developer")
                
            if badges:
                embed.add_field(name="Badges", value=", ".join(badges), inline=False)
                
        # Check if user is a bot
        if member.bot:
            embed.set_footer(text="This user is a bot")
            
        await ctx.send(embed=embed)

# Proper setup function for Discord.py extension loading
async def setup(bot):
    await bot.add_cog(EssentialCommands(bot))
