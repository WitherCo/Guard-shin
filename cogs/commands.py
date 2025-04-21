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

class Commands(commands.Cog):
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
            if os.path.exists("data/premium_servers.json"):
                with open("data/premium_servers.json", "r") as f:
                    return json.load(f)
            return []
        except Exception as e:
            logger.error(f"Error loading premium servers: {e}")
            return []
            
    def _load_config(self) -> Dict[str, Any]:
        """Load bot configuration"""
        try:
            if os.path.exists("data/config.json"):
                with open("data/config.json", "r") as f:
                    return json.load(f)
            return {}
        except Exception as e:
            logger.error(f"Error loading config: {e}")
            return {}

    def is_premium(self, guild_id: int) -> bool:
        """Check if a guild has premium status"""
        return guild_id in self.premium_servers
        
    def update_command_usage(self, command_name: str) -> None:
        """Update the usage count for a command"""
        if command_name in self.command_uses:
            self.command_uses[command_name] += 1
        else:
            self.command_uses[command_name] = 1
            
    async def handle_cooldown(self, ctx, command_name: str, cooldown_seconds: int = 3) -> bool:
        """Handle command cooldowns"""
        user_id = ctx.author.id
        current_time = time.time()
        
        cooldown_key = f"{user_id}:{command_name}"
        
        if cooldown_key in self.cooldowns:
            last_use = self.cooldowns[cooldown_key]
            if current_time - last_use < cooldown_seconds:
                remaining = round(cooldown_seconds - (current_time - last_use))
                await ctx.send(f"⏳ Please wait {remaining} seconds before using this command again.", delete_after=5)
                return False
                
        self.cooldowns[cooldown_key] = current_time
        return True

    @commands.Cog.listener()
    async def on_message(self, message):
        """Process messages for custom prefix commands"""
        if message.author.bot:
            return
            
        if not message.content.startswith(self.prefix):
            return
            
        # Get the command name and arguments
        parts = message.content[len(self.prefix):].strip().split(" ")
        command_name = parts[0].lower()
        args = parts[1:]
        
        # Check if we have a method for this command
        method_name = f"cmd_{command_name}"
        if hasattr(self, method_name):
            # Create a context-like object
            ctx = await self.bot.get_context(message)
            if ctx.valid:
                return  # Let the command framework handle it
                
            # Otherwise, manually invoke our command method
            method = getattr(self, method_name)
            try:
                await method(message, args)
                self.update_command_usage(command_name)
            except Exception as e:
                logger.error(f"Error executing command {command_name}: {e}")
                await message.channel.send(f"❌ An error occurred while executing the command: {e}")
                
    #####################
    # UTILITY COMMANDS  #
    #####################
    
    async def cmd_ping(self, message, args):
        """Check the bot's latency"""
        start_time = time.time()
        msg = await message.channel.send("Pinging...")
        end_time = time.time()
        
        latency = round((end_time - start_time) * 1000)
        api_latency = round(self.bot.latency * 1000)
        
        embed = discord.Embed(
            title="🏓 Pong!",
            color=discord.Color.green(),
            timestamp=discord.utils.utcnow()
        )
        
        embed.add_field(name="Bot Latency", value=f"{latency}ms", inline=True)
        embed.add_field(name="API Latency", value=f"{api_latency}ms", inline=True)
        
        await msg.edit(content=None, embed=embed)
        
    async def cmd_help(self, message, args):
        """Show help information"""
        # Basic help menu if no specific command is requested
        if not args:
            embed = discord.Embed(
                title="Guard-shin Help",
                description=f"Use `{self.prefix}help [command]` for detailed help on a command.",
                color=discord.Color.blue(),
                timestamp=discord.utils.utcnow()
            )
            
            # Add categories
            for category_id, category_name in CATEGORIES.items():
                # Get commands for this category
                category_commands = []
                for command_name in dir(self):
                    if command_name.startswith("cmd_"):
                        cmd_name = command_name[4:]  # Remove cmd_ prefix
                        cmd_method = getattr(self, command_name)
                        cmd_category = getattr(cmd_method, "category", "utility")
                        
                        if cmd_category == category_id:
                            category_commands.append(f"`{self.prefix}{cmd_name}`")
                
                if category_commands:
                    embed.add_field(
                        name=f"{category_name} ({len(category_commands)})",
                        value=", ".join(category_commands[:10]) + (f" and {len(category_commands) - 10} more..." if len(category_commands) > 10 else ""),
                        inline=False
                    )
            
            embed.set_footer(text=f"Guard-shin | {len(self.command_uses)} commands")
            await message.channel.send(embed=embed)
            return
            
        # Detailed help for a specific command
        command_name = args[0].lower()
        method_name = f"cmd_{command_name}"
        
        if hasattr(self, method_name):
            method = getattr(self, method_name)
            description = method.__doc__ or "No description available."
            usage = getattr(method, "usage", f"{self.prefix}{command_name}")
            examples = getattr(method, "examples", [])
            cooldown = getattr(method, "cooldown", 3)
            premium = getattr(method, "premium", False)
            
            embed = discord.Embed(
                title=f"Command: {self.prefix}{command_name}",
                description=description,
                color=discord.Color.blue()
            )
            
            embed.add_field(name="Usage", value=f"`{usage}`", inline=False)
            
            if examples:
                embed.add_field(
                    name="Examples", 
                    value="\n".join([f"`{ex}`" for ex in examples]),
                    inline=False
                )
                
            embed.add_field(name="Cooldown", value=f"{cooldown} seconds", inline=True)
            embed.add_field(name="Premium", value="Yes" if premium else "No", inline=True)
            embed.add_field(name="Usage Count", value=self.command_uses.get(command_name, 0), inline=True)
            
            await message.channel.send(embed=embed)
        else:
            await message.channel.send(f"❌ Command `{self.prefix}{command_name}` not found.")
            
    async def cmd_server(self, message, args):
        """Get information about the server"""
        guild = message.guild
        
        if not guild:
            await message.channel.send("❌ This command can only be used in a server.")
            return
            
        # Get member count statistics
        total_members = guild.member_count
        online_members = len([m for m in guild.members if m.status != discord.Status.offline])
        bot_count = len([m for m in guild.members if m.bot])
        
        # Get channel statistics
        text_channels = len(guild.text_channels)
        voice_channels = len(guild.voice_channels)
        categories = len(guild.categories)
        
        # Get guild information
        created_at = guild.created_at.strftime("%B %d, %Y")
        owner = guild.owner.mention if guild.owner else "Unknown"
        
        embed = discord.Embed(
            title=guild.name,
            description=guild.description or "No description",
            color=discord.Color.blue(),
            timestamp=discord.utils.utcnow()
        )
        
        if guild.icon:
            embed.set_thumbnail(url=guild.icon.url)
            
        embed.add_field(name="Owner", value=owner, inline=True)
        embed.add_field(name="Created", value=created_at, inline=True)
        embed.add_field(name="Server ID", value=guild.id, inline=True)
        
        embed.add_field(name="Members", value=f"Total: {total_members}\nOnline: {online_members}\nBots: {bot_count}", inline=True)
        embed.add_field(name="Channels", value=f"Text: {text_channels}\nVoice: {voice_channels}\nCategories: {categories}", inline=True)
        embed.add_field(name="Boost Tier", value=f"Level {guild.premium_tier}", inline=True)
        
        embed.add_field(name="Features", value=", ".join(guild.features) or "None", inline=False)
        
        await message.channel.send(embed=embed)
        
    async def cmd_avatar(self, message, args):
        """Get a user's avatar"""
        if not args:
            user = message.author
        else:
            # Try to find the user
            query = " ".join(args)
            try:
                user = await commands.MemberConverter().convert(await self.bot.get_context(message), query)
            except:
                await message.channel.send("❌ User not found.")
                return
                
        embed = discord.Embed(
            title=f"{user.name}'s Avatar",
            color=discord.Color.blue()
        )
        
        avatar_url = user.avatar.url if user.avatar else user.default_avatar.url
        embed.set_image(url=avatar_url)
        
        await message.channel.send(embed=embed)
        
    async def cmd_botinfo(self, message, args):
        """Get information about the bot"""
        guilds = len(self.bot.guilds)
        members = sum(g.member_count for g in self.bot.guilds)
        
        embed = discord.Embed(
            title="Guard-shin Bot Information",
            description="Advanced Discord moderation and security bot",
            color=discord.Color.blue(),
            timestamp=discord.utils.utcnow()
        )
        
        if self.bot.user.avatar:
            embed.set_thumbnail(url=self.bot.user.avatar.url)
            
        embed.add_field(name="Servers", value=guilds, inline=True)
        embed.add_field(name="Users", value=members, inline=True)
        embed.add_field(name="Commands", value=len(self.command_uses), inline=True)
        
        embed.add_field(name="Invite", value="[Add to Server](https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8)", inline=True)
        embed.add_field(name="Support", value="[Join Server](https://discord.gg/g3rFbaW6gw)", inline=True)
        embed.add_field(name="Dashboard", value="[Open](https://witherco.github.io/Guard-shin/)", inline=True)
        
        await message.channel.send(embed=embed)
        
    #####################
    # MODERATION COMMANDS #
    #####################
    
    async def cmd_ban(self, message, args):
        """Ban a user from the server"""
        # Check permissions
        if not message.author.guild_permissions.ban_members:
            await message.channel.send("❌ You don't have permission to ban members.")
            return
            
        if not args:
            await message.channel.send(f"❌ Usage: `{self.prefix}ban @user [reason]`")
            return
            
        # Try to find the user
        try:
            user = await commands.MemberConverter().convert(await self.bot.get_context(message), args[0])
        except:
            await message.channel.send("❌ User not found.")
            return
            
        # Check if we can ban the user
        if user.top_role >= message.author.top_role and message.author.id != message.guild.owner_id:
            await message.channel.send("❌ You can't ban someone with a higher or equal role.")
            return
            
        # Get reason if provided
        reason = " ".join(args[1:]) if len(args) > 1 else "No reason provided"
        
        try:
            await message.guild.ban(user, reason=reason)
            
            embed = discord.Embed(
                title="✅ User Banned",
                description=f"{user.mention} has been banned from the server.",
                color=discord.Color.red(),
                timestamp=discord.utils.utcnow()
            )
            
            embed.add_field(name="User", value=f"{user.name} ({user.id})", inline=True)
            embed.add_field(name="Moderator", value=message.author.mention, inline=True)
            embed.add_field(name="Reason", value=reason, inline=False)
            
            await message.channel.send(embed=embed)
            
            # DM the user
            try:
                embed = discord.Embed(
                    title="You've Been Banned",
                    description=f"You have been banned from {message.guild.name}",
                    color=discord.Color.red()
                )
                
                embed.add_field(name="Reason", value=reason, inline=False)
                embed.set_footer(text=f"Banned by {message.author.name}")
                
                await user.send(embed=embed)
            except:
                pass  # User might have DMs disabled
                
        except discord.errors.Forbidden:
            await message.channel.send("❌ I don't have permission to ban that user.")
        except Exception as e:
            await message.channel.send(f"❌ An error occurred: {e}")
    
    async def cmd_kick(self, message, args):
        """Kick a user from the server"""
        # Check permissions
        if not message.author.guild_permissions.kick_members:
            await message.channel.send("❌ You don't have permission to kick members.")
            return
            
        if not args:
            await message.channel.send(f"❌ Usage: `{self.prefix}kick @user [reason]`")
            return
            
        # Try to find the user
        try:
            user = await commands.MemberConverter().convert(await self.bot.get_context(message), args[0])
        except:
            await message.channel.send("❌ User not found.")
            return
            
        # Check if we can kick the user
        if user.top_role >= message.author.top_role and message.author.id != message.guild.owner_id:
            await message.channel.send("❌ You can't kick someone with a higher or equal role.")
            return
            
        # Get reason if provided
        reason = " ".join(args[1:]) if len(args) > 1 else "No reason provided"
        
        try:
            await message.guild.kick(user, reason=reason)
            
            embed = discord.Embed(
                title="✅ User Kicked",
                description=f"{user.mention} has been kicked from the server.",
                color=discord.Color.orange(),
                timestamp=discord.utils.utcnow()
            )
            
            embed.add_field(name="User", value=f"{user.name} ({user.id})", inline=True)
            embed.add_field(name="Moderator", value=message.author.mention, inline=True)
            embed.add_field(name="Reason", value=reason, inline=False)
            
            await message.channel.send(embed=embed)
            
            # DM the user
            try:
                embed = discord.Embed(
                    title="You've Been Kicked",
                    description=f"You have been kicked from {message.guild.name}",
                    color=discord.Color.orange()
                )
                
                embed.add_field(name="Reason", value=reason, inline=False)
                embed.set_footer(text=f"Kicked by {message.author.name}")
                
                await user.send(embed=embed)
            except:
                pass  # User might have DMs disabled
                
        except discord.errors.Forbidden:
            await message.channel.send("❌ I don't have permission to kick that user.")
        except Exception as e:
            await message.channel.send(f"❌ An error occurred: {e}")
            
    async def cmd_clear(self, message, args):
        """Clear messages from a channel"""
        # Check permissions
        if not message.author.guild_permissions.manage_messages:
            await message.channel.send("❌ You don't have permission to manage messages.")
            return
            
        if not args:
            await message.channel.send(f"❌ Usage: `{self.prefix}clear [amount]`")
            return
            
        try:
            amount = int(args[0])
            if amount < 1 or amount > 100:
                await message.channel.send("❌ You can only delete between 1 and 100 messages at a time.")
                return
                
            deleted = await message.channel.purge(limit=amount + 1)  # +1 to include the command message
            
            confirm_message = await message.channel.send(f"✅ Deleted {len(deleted) - 1} messages.")
            await asyncio.sleep(3)
            await confirm_message.delete()
            
        except ValueError:
            await message.channel.send("❌ Please provide a valid number.")
        except discord.errors.Forbidden:
            await message.channel.send("❌ I don't have permission to delete messages.")
        except Exception as e:
            await message.channel.send(f"❌ An error occurred: {e}")
            
    #####################
    # FUN COMMANDS      #
    #####################
    
    async def cmd_8ball(self, message, args):
        """Ask the magic 8-ball a question"""
        if not args:
            await message.channel.send("❌ You need to ask a question!")
            return
            
        responses = [
            "It is certain.",
            "It is decidedly so.",
            "Without a doubt.",
            "Yes, definitely.",
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
        
        question = " ".join(args)
        answer = random.choice(responses)
        
        embed = discord.Embed(
            title="🎱 Magic 8-Ball",
            color=discord.Color.purple(),
            timestamp=discord.utils.utcnow()
        )
        
        embed.add_field(name="Question", value=question, inline=False)
        embed.add_field(name="Answer", value=answer, inline=False)
        
        await message.channel.send(embed=embed)
        
    async def cmd_roll(self, message, args):
        """Roll a dice"""
        if not args:
            # Default to 6-sided dice
            sides = 6
        else:
            try:
                sides = int(args[0])
                if sides < 1:
                    await message.channel.send("❌ Number of sides must be at least 1.")
                    return
            except ValueError:
                await message.channel.send("❌ Please provide a valid number of sides.")
                return
                
        result = random.randint(1, sides)
        
        embed = discord.Embed(
            title=f"🎲 Dice Roll (d{sides})",
            description=f"Result: **{result}**",
            color=discord.Color.blue(),
            timestamp=discord.utils.utcnow()
        )
        
        await message.channel.send(embed=embed)
        
    async def cmd_coin(self, message, args):
        """Flip a coin"""
        result = random.choice(["Heads", "Tails"])
        
        embed = discord.Embed(
            title="🪙 Coin Flip",
            description=f"Result: **{result}**",
            color=discord.Color.gold(),
            timestamp=discord.utils.utcnow()
        )
        
        await message.channel.send(embed=embed)
        
    #####################
    # ADMIN COMMANDS    #
    #####################
    
    async def cmd_prefix(self, message, args):
        """Set the server's custom prefix"""
        # Check permissions
        if not message.author.guild_permissions.administrator:
            await message.channel.send("❌ You don't have permission to change the prefix.")
            return
            
        if not args:
            await message.channel.send(f"❌ Usage: `{self.prefix}prefix [new_prefix]`")
            return
            
        new_prefix = args[0]
        
        # Save the prefix to config
        guild_id = str(message.guild.id)
        if "prefixes" not in self.config:
            self.config["prefixes"] = {}
            
        self.config["prefixes"][guild_id] = new_prefix
        
        # Save the config
        try:
            os.makedirs("data", exist_ok=True)
            with open("data/config.json", "w") as f:
                json.dump(self.config, f)
        except Exception as e:
            logger.error(f"Error saving config: {e}")
            await message.channel.send(f"❌ An error occurred while saving the prefix: {e}")
            return
            
        await message.channel.send(f"✅ Server prefix set to `{new_prefix}`")
        
    async def cmd_setup(self, message, args):
        """Set up the bot for your server"""
        # Check permissions
        if not message.author.guild_permissions.administrator:
            await message.channel.send("❌ You don't have permission to set up the bot.")
            return
            
        embed = discord.Embed(
            title="🔧 Guard-shin Setup",
            description="Welcome to Guard-shin! Let's set up your server.",
            color=discord.Color.blue()
        )
        
        embed.add_field(
            name="Moderation",
            value="Configure moderation settings with `g!moderation`",
            inline=False
        )
        
        embed.add_field(
            name="Verification",
            value="Set up verification with `g!verification`",
            inline=False
        )
        
        embed.add_field(
            name="Logging",
            value="Configure logging with `g!logs`",
            inline=False
        )
        
        embed.add_field(
            name="Auto-mod",
            value="Set up auto-moderation with `g!automod`",
            inline=False
        )
        
        embed.add_field(
            name="Permissions",
            value="Make sure I have the necessary permissions to function properly!",
            inline=False
        )
        
        await message.channel.send(embed=embed)
        
    #####################
    # IMAGE COMMANDS    #
    #####################
    
    async def cmd_cat(self, message, args):
        """Get a random cat image"""
        # This would normally fetch from an API
        cat_images = [
            "https://i.imgur.com/843RWf3.jpg",
            "https://i.imgur.com/rYaiJ0N.jpg",
            "https://i.imgur.com/fHcZhwt.jpg",
            "https://i.imgur.com/lnIiAoT.jpg",
            "https://i.imgur.com/eOXZOQn.jpg"
        ]
        
        embed = discord.Embed(
            title="🐱 Random Cat",
            color=discord.Color.random()
        )
        
        embed.set_image(url=random.choice(cat_images))
        
        await message.channel.send(embed=embed)
        
    async def cmd_dog(self, message, args):
        """Get a random dog image"""
        # This would normally fetch from an API
        dog_images = [
            "https://i.imgur.com/UkBLjev.jpg",
            "https://i.imgur.com/O0PYGnz.jpg",
            "https://i.imgur.com/eZ2peEt.jpg",
            "https://i.imgur.com/JQXMuir.jpg",
            "https://i.imgur.com/2tLI0ly.jpg"
        ]
        
        embed = discord.Embed(
            title="🐶 Random Dog",
            color=discord.Color.random()
        )
        
        embed.set_image(url=random.choice(dog_images))
        
        await message.channel.send(embed=embed)
    
    #####################
    # ECONOMY COMMANDS  #
    #####################
    
    async def cmd_balance(self, message, args):
        """Check your economy balance"""
        # In a real implementation, this would fetch from a database
        balance = random.randint(100, 10000)  # Placeholder
        
        embed = discord.Embed(
            title="💰 Balance",
            description=f"{message.author.mention}, your balance is **${balance:,}**",
            color=discord.Color.gold()
        )
        
        await message.channel.send(embed=embed)
        
    async def cmd_daily(self, message, args):
        """Claim your daily reward"""
        # In a real implementation, this would update a database
        amount = random.randint(100, 500)
        
        embed = discord.Embed(
            title="💰 Daily Reward",
            description=f"{message.author.mention}, you claimed **${amount:,}** as your daily reward!",
            color=discord.Color.gold()
        )
        
        await message.channel.send(embed=embed)
    
    #####################
    # UTILITY COMMANDS  #
    #####################
    
    async def cmd_userinfo(self, message, args):
        """Get information about a user"""
        if not args:
            user = message.author
        else:
            # Try to find the user
            query = " ".join(args)
            try:
                user = await commands.MemberConverter().convert(await self.bot.get_context(message), query)
            except:
                await message.channel.send("❌ User not found.")
                return
                
        roles = [role.mention for role in user.roles if role.name != "@everyone"]
        roles_str = ", ".join(roles) if roles else "None"
        
        created_at = user.created_at.strftime("%B %d, %Y")
        joined_at = user.joined_at.strftime("%B %d, %Y") if user.joined_at else "Unknown"
        
        embed = discord.Embed(
            title=f"User Info: {user.name}",
            color=user.color,
            timestamp=discord.utils.utcnow()
        )
        
        embed.set_thumbnail(url=user.avatar.url if user.avatar else user.default_avatar.url)
        
        embed.add_field(name="ID", value=user.id, inline=True)
        embed.add_field(name="Nickname", value=user.nick or "None", inline=True)
        embed.add_field(name="Bot", value="Yes" if user.bot else "No", inline=True)
        
        embed.add_field(name="Created", value=created_at, inline=True)
        embed.add_field(name="Joined", value=joined_at, inline=True)
        embed.add_field(name="Boosting", value="Yes" if user.premium_since else "No", inline=True)
        
        if roles_str:
            embed.add_field(name=f"Roles [{len(roles)}]", value=roles_str, inline=False)
            
        permissions = []
        if user.guild_permissions.administrator:
            permissions.append("Administrator")
        if user.guild_permissions.ban_members:
            permissions.append("Ban Members")
        if user.guild_permissions.kick_members:
            permissions.append("Kick Members")
        if user.guild_permissions.manage_messages:
            permissions.append("Manage Messages")
        if user.guild_permissions.manage_guild:
            permissions.append("Manage Server")
            
        if permissions:
            embed.add_field(name="Key Permissions", value=", ".join(permissions), inline=False)
            
        await message.channel.send(embed=embed)
        
    async def cmd_servericon(self, message, args):
        """Get the server's icon"""
        if not message.guild or not message.guild.icon:
            await message.channel.send("❌ This server doesn't have an icon.")
            return
            
        embed = discord.Embed(
            title=f"{message.guild.name}'s Icon",
            color=discord.Color.blue()
        )
        
        embed.set_image(url=message.guild.icon.url)
        
        await message.channel.send(embed=embed)
        
    #####################
    # GAME COMMANDS     #
    #####################
    
    async def cmd_rps(self, message, args):
        """Play rock, paper, scissors"""
        if not args:
            await message.channel.send(f"❌ Usage: `{self.prefix}rps [rock/paper/scissors]`")
            return
            
        choices = ["rock", "paper", "scissors"]
        user_choice = args[0].lower()
        
        if user_choice not in choices:
            await message.channel.send(f"❌ Please choose one of: rock, paper, scissors")
            return
            
        bot_choice = random.choice(choices)
        
        # Determine winner
        if user_choice == bot_choice:
            result = "It's a tie!"
        elif (user_choice == "rock" and bot_choice == "scissors") or \
             (user_choice == "paper" and bot_choice == "rock") or \
             (user_choice == "scissors" and bot_choice == "paper"):
            result = "You win!"
        else:
            result = "I win!"
            
        # Emojis for choices
        emojis = {
            "rock": "🪨",
            "paper": "📄",
            "scissors": "✂️"
        }
        
        embed = discord.Embed(
            title="🎮 Rock, Paper, Scissors",
            color=discord.Color.blue()
        )
        
        embed.add_field(name="Your Choice", value=f"{emojis[user_choice]} {user_choice}", inline=True)
        embed.add_field(name="My Choice", value=f"{emojis[bot_choice]} {bot_choice}", inline=True)
        embed.add_field(name="Result", value=result, inline=False)
        
        await message.channel.send(embed=embed)
        
    #####################
    # MORE COMMANDS...  #
    #####################
    
    # The following commands would be implemented similarly to the ones above.
    # For a dashboard display, we'll define command metadata for all commands.
    
    # Command metadata for display in dashboard
    ALL_COMMANDS = [
        # Moderation Commands
        {"name": "ban", "category": "moderation", "description": "Ban a user from the server", "usage": "g!ban @user [reason]", "premium": False},
        {"name": "kick", "category": "moderation", "description": "Kick a user from the server", "usage": "g!kick @user [reason]", "premium": False},
        {"name": "clear", "category": "moderation", "description": "Clear messages from a channel", "usage": "g!clear [amount]", "premium": False},
        {"name": "warn", "category": "moderation", "description": "Warn a user", "usage": "g!warn @user [reason]", "premium": False},
        {"name": "mute", "category": "moderation", "description": "Mute a user", "usage": "g!mute @user [duration] [reason]", "premium": False},
        {"name": "unmute", "category": "moderation", "description": "Unmute a user", "usage": "g!unmute @user", "premium": False},
        {"name": "slowmode", "category": "moderation", "description": "Set slowmode for a channel", "usage": "g!slowmode [seconds]", "premium": False},
        {"name": "lock", "category": "moderation", "description": "Lock a channel", "usage": "g!lock [channel]", "premium": False},
        {"name": "unlock", "category": "moderation", "description": "Unlock a channel", "usage": "g!unlock [channel]", "premium": False},
        {"name": "tempban", "category": "moderation", "description": "Temporarily ban a user", "usage": "g!tempban @user [duration] [reason]", "premium": True},
        {"name": "unban", "category": "moderation", "description": "Unban a user", "usage": "g!unban [user_id/name]", "premium": False},
        {"name": "softban", "category": "moderation", "description": "Softban a user (ban + unban to clear messages)", "usage": "g!softban @user [reason]", "premium": True},
        {"name": "hackban", "category": "moderation", "description": "Ban a user who isn't in the server", "usage": "g!hackban [user_id] [reason]", "premium": True},
        {"name": "voicekick", "category": "moderation", "description": "Kick a user from voice channel", "usage": "g!voicekick @user", "premium": False},
        {"name": "warnings", "category": "moderation", "description": "View warnings for a user", "usage": "g!warnings @user", "premium": False},
        {"name": "clearwarns", "category": "moderation", "description": "Clear warnings for a user", "usage": "g!clearwarns @user", "premium": False},
        
        # Utility Commands
        {"name": "ping", "category": "utility", "description": "Check the bot's latency", "usage": "g!ping", "premium": False},
        {"name": "help", "category": "utility", "description": "Show help information", "usage": "g!help [command]", "premium": False},
        {"name": "server", "category": "utility", "description": "Get information about the server", "usage": "g!server", "premium": False},
        {"name": "avatar", "category": "utility", "description": "Get a user's avatar", "usage": "g!avatar [user]", "premium": False},
        {"name": "botinfo", "category": "utility", "description": "Get information about the bot", "usage": "g!botinfo", "premium": False},
        {"name": "userinfo", "category": "utility", "description": "Get information about a user", "usage": "g!userinfo [user]", "premium": False},
        {"name": "servericon", "category": "utility", "description": "Get the server's icon", "usage": "g!servericon", "premium": False},
        {"name": "roleinfo", "category": "utility", "description": "Get information about a role", "usage": "g!roleinfo [role]", "premium": False},
        {"name": "channelinfo", "category": "utility", "description": "Get information about a channel", "usage": "g!channelinfo [channel]", "premium": False},
        {"name": "invite", "category": "utility", "description": "Get the bot's invite link", "usage": "g!invite", "premium": False},
        {"name": "support", "category": "utility", "description": "Get a link to the support server", "usage": "g!support", "premium": False},
        {"name": "stats", "category": "utility", "description": "Get the bot's stats", "usage": "g!stats", "premium": False},
        {"name": "uptime", "category": "utility", "description": "Get the bot's uptime", "usage": "g!uptime", "premium": False},
        {"name": "channelstats", "category": "utility", "description": "Get statistics about a channel", "usage": "g!channelstats [channel]", "premium": True},
        
        # Admin Commands
        {"name": "prefix", "category": "admin", "description": "Set the server's custom prefix", "usage": "g!prefix [new_prefix]", "premium": False},
        {"name": "setup", "category": "admin", "description": "Set up the bot for your server", "usage": "g!setup", "premium": False},
        {"name": "settings", "category": "admin", "description": "View and edit bot settings", "usage": "g!settings [setting] [value]", "premium": False},
        {"name": "module", "category": "admin", "description": "Enable or disable modules", "usage": "g!module [enable/disable] [module]", "premium": False},
        {"name": "autorole", "category": "admin", "description": "Configure auto role for new members", "usage": "g!autorole [role]", "premium": True},
        {"name": "logs", "category": "admin", "description": "Configure logging channels", "usage": "g!logs [channel]", "premium": False},
        {"name": "welcome", "category": "admin", "description": "Configure welcome messages", "usage": "g!welcome [channel] [message]", "premium": True},
        {"name": "goodbye", "category": "admin", "description": "Configure goodbye messages", "usage": "g!goodbye [channel] [message]", "premium": True},
        {"name": "automod", "category": "admin", "description": "Configure auto-moderation", "usage": "g!automod [setting] [value]", "premium": False},
        {"name": "verification", "category": "admin", "description": "Configure verification system", "usage": "g!verification [setting] [value]", "premium": False},
        {"name": "config", "category": "admin", "description": "View the server's configuration", "usage": "g!config", "premium": False},
        {"name": "backup", "category": "admin", "description": "Create a server backup", "usage": "g!backup", "premium": True},
        {"name": "restore", "category": "admin", "description": "Restore a server backup", "usage": "g!restore [backup_id]", "premium": True},
        
        # Fun Commands
        {"name": "8ball", "category": "fun", "description": "Ask the magic 8-ball a question", "usage": "g!8ball [question]", "premium": False},
        {"name": "roll", "category": "fun", "description": "Roll a dice", "usage": "g!roll [sides]", "premium": False},
        {"name": "coin", "category": "fun", "description": "Flip a coin", "usage": "g!coin", "premium": False},
        {"name": "rps", "category": "fun", "description": "Play rock, paper, scissors", "usage": "g!rps [choice]", "premium": False},
        {"name": "joke", "category": "fun", "description": "Get a random joke", "usage": "g!joke", "premium": False},
        {"name": "meme", "category": "fun", "description": "Get a random meme", "usage": "g!meme", "premium": False},
        {"name": "quote", "category": "fun", "description": "Get a random quote", "usage": "g!quote", "premium": False},
        {"name": "fact", "category": "fun", "description": "Get a random fact", "usage": "g!fact", "premium": False},
        {"name": "ascii", "category": "fun", "description": "Convert text to ASCII art", "usage": "g!ascii [text]", "premium": True},
        {"name": "reverse", "category": "fun", "description": "Reverse text", "usage": "g!reverse [text]", "premium": False},
        {"name": "emojify", "category": "fun", "description": "Convert text to emojis", "usage": "g!emojify [text]", "premium": False},
        
        # Image Commands
        {"name": "cat", "category": "images", "description": "Get a random cat image", "usage": "g!cat", "premium": False},
        {"name": "dog", "category": "images", "description": "Get a random dog image", "usage": "g!dog", "premium": False},
        {"name": "bird", "category": "images", "description": "Get a random bird image", "usage": "g!bird", "premium": False},
        {"name": "fox", "category": "images", "description": "Get a random fox image", "usage": "g!fox", "premium": False},
        {"name": "panda", "category": "images", "description": "Get a random panda image", "usage": "g!panda", "premium": False},
        {"name": "koala", "category": "images", "description": "Get a random koala image", "usage": "g!koala", "premium": False},
        {"name": "captcha", "category": "images", "description": "Generate a captcha image", "usage": "g!captcha [text]", "premium": True},
        {"name": "pokemon", "category": "images", "description": "Get a Pokémon image", "usage": "g!pokemon [name]", "premium": False},
        {"name": "achievement", "category": "images", "description": "Create a Minecraft achievement", "usage": "g!achievement [text]", "premium": True},
        
        # Economy Commands
        {"name": "balance", "category": "economy", "description": "Check your economy balance", "usage": "g!balance", "premium": False},
        {"name": "daily", "category": "economy", "description": "Claim your daily reward", "usage": "g!daily", "premium": False},
        {"name": "work", "category": "economy", "description": "Work to earn money", "usage": "g!work", "premium": False},
        {"name": "transfer", "category": "economy", "description": "Transfer money to another user", "usage": "g!transfer @user [amount]", "premium": False},
        {"name": "shop", "category": "economy", "description": "View the economy shop", "usage": "g!shop", "premium": False},
        {"name": "buy", "category": "economy", "description": "Buy an item from the shop", "usage": "g!buy [item_id]", "premium": False},
        {"name": "inventory", "category": "economy", "description": "View your inventory", "usage": "g!inventory", "premium": False},
        {"name": "leaderboard", "category": "economy", "description": "View the money leaderboard", "usage": "g!leaderboard", "premium": False},
        {"name": "rob", "category": "economy", "description": "Rob another user", "usage": "g!rob @user", "premium": True},
        {"name": "slots", "category": "economy", "description": "Play slots", "usage": "g!slots [amount]", "premium": True},
        {"name": "gamble", "category": "economy", "description": "Gamble your money", "usage": "g!gamble [amount]", "premium": True},
        
        # Level Commands
        {"name": "rank", "category": "levels", "description": "Check your rank", "usage": "g!rank [user]", "premium": False},
        {"name": "levels", "category": "levels", "description": "View the server's leaderboard", "usage": "g!levels", "premium": False},
        {"name": "rewards", "category": "levels", "description": "View level rewards", "usage": "g!rewards", "premium": True},
        {"name": "setlevel", "category": "levels", "description": "Set a user's level", "usage": "g!setlevel @user [level]", "premium": True},
        {"name": "resetlevels", "category": "levels", "description": "Reset all levels", "usage": "g!resetlevels", "premium": True},
        
        # Music Commands (already implemented in the music.py cog, but listed here for the dashboard)
        {"name": "play", "category": "music", "description": "Play a song", "usage": "g!play [song]", "premium": False},
        {"name": "skip", "category": "music", "description": "Skip the current song", "usage": "g!skip", "premium": False},
        {"name": "stop", "category": "music", "description": "Stop playing music", "usage": "g!stop", "premium": False},
        {"name": "queue", "category": "music", "description": "View the music queue", "usage": "g!queue", "premium": False},
        {"name": "volume", "category": "music", "description": "Set the music volume", "usage": "g!volume [0-100]", "premium": False},
        {"name": "pause", "category": "music", "description": "Pause the current song", "usage": "g!pause", "premium": False},
        {"name": "resume", "category": "music", "description": "Resume the current song", "usage": "g!resume", "premium": False},
        {"name": "nowplaying", "category": "music", "description": "Show the current song", "usage": "g!nowplaying", "premium": False},
        {"name": "shuffle", "category": "music", "description": "Shuffle the queue", "usage": "g!shuffle", "premium": True},
        {"name": "loop", "category": "music", "description": "Loop the current song", "usage": "g!loop", "premium": True},
        {"name": "loopqueue", "category": "music", "description": "Loop the queue", "usage": "g!loopqueue", "premium": True},
        {"name": "lyrics", "category": "music", "description": "Get lyrics for a song", "usage": "g!lyrics [song]", "premium": True},
        {"name": "playlist", "category": "music", "description": "Load a playlist", "usage": "g!playlist [name]", "premium": True},
        {"name": "savequeue", "category": "music", "description": "Save the current queue as a playlist", "usage": "g!savequeue [name]", "premium": True},
        
        # Social Commands
        {"name": "hug", "category": "social", "description": "Hug a user", "usage": "g!hug @user", "premium": False},
        {"name": "slap", "category": "social", "description": "Slap a user", "usage": "g!slap @user", "premium": False},
        {"name": "kiss", "category": "social", "description": "Kiss a user", "usage": "g!kiss @user", "premium": False},
        {"name": "pat", "category": "social", "description": "Pat a user", "usage": "g!pat @user", "premium": False},
        {"name": "marry", "category": "social", "description": "Marry a user", "usage": "g!marry @user", "premium": True},
        {"name": "divorce", "category": "social", "description": "Divorce a user", "usage": "g!divorce", "premium": True},
        {"name": "profile", "category": "social", "description": "View your profile", "usage": "g!profile [user]", "premium": True},
        
        # Games
        {"name": "trivia", "category": "games", "description": "Play trivia", "usage": "g!trivia", "premium": False},
        {"name": "hangman", "category": "games", "description": "Play hangman", "usage": "g!hangman", "premium": True},
        {"name": "tictactoe", "category": "games", "description": "Play tic-tac-toe", "usage": "g!tictactoe @user", "premium": True},
        {"name": "connect4", "category": "games", "description": "Play Connect 4", "usage": "g!connect4 @user", "premium": True},
        {"name": "akinator", "category": "games", "description": "Play Akinator", "usage": "g!akinator", "premium": True},
        
        # Premium Commands
        {"name": "premium", "category": "premium", "description": "Check premium status", "usage": "g!premium", "premium": True},
        {"name": "redeem", "category": "premium", "description": "Redeem a premium code", "usage": "g!redeem [code]", "premium": True},
        {"name": "customize", "category": "premium", "description": "Customize bot responses", "usage": "g!customize [setting] [value]", "premium": True},
        {"name": "welcomeimage", "category": "premium", "description": "Set a custom welcome image", "usage": "g!welcomeimage [url]", "premium": True},
        {"name": "autorole", "category": "premium", "description": "Configure auto role for new members", "usage": "g!autorole [role]", "premium": True},
        {"name": "reactionroles", "category": "premium", "description": "Set up reaction roles", "usage": "g!reactionroles", "premium": True},
        
        # Configuration Commands
        {"name": "setup", "category": "config", "description": "Initial bot setup", "usage": "g!setup", "premium": False},
        {"name": "antiraid", "category": "config", "description": "Configure anti-raid protection", "usage": "g!antiraid [setting] [value]", "premium": False},
        {"name": "antispam", "category": "config", "description": "Configure anti-spam protection", "usage": "g!antispam [setting] [value]", "premium": False},
        {"name": "antiphishing", "category": "config", "description": "Configure anti-phishing protection", "usage": "g!antiphishing [on/off]", "premium": False},
        {"name": "mutesettings", "category": "config", "description": "Configure mute settings", "usage": "g!mutesettings [role]", "premium": False},
        {"name": "bansettings", "category": "config", "description": "Configure ban settings", "usage": "g!bansettings [setting] [value]", "premium": False},
        {"name": "kicksettings", "category": "config", "description": "Configure kick settings", "usage": "g!kicksettings [setting] [value]", "premium": False},
        {"name": "warnsettings", "category": "config", "description": "Configure warning settings", "usage": "g!warnsettings [setting] [value]", "premium": False},
        {"name": "joinrole", "category": "config", "description": "Set role for new members", "usage": "g!joinrole [role]", "premium": False},
        {"name": "joinmessage", "category": "config", "description": "Set message for new members", "usage": "g!joinmessage [message]", "premium": True},
        {"name": "leavemessage", "category": "config", "description": "Set message for leaving members", "usage": "g!leavemessage [message]", "premium": True},
        {"name": "levelup", "category": "config", "description": "Configure level-up messages", "usage": "g!levelup [channel/dm/off]", "premium": True},
        {"name": "levelrole", "category": "config", "description": "Set roles for specific levels", "usage": "g!levelrole [level] [role]", "premium": True},
        
        # Utility Commands (Second Page)
        {"name": "poll", "category": "utility", "description": "Create a poll", "usage": "g!poll [question] [options]", "premium": False},
        {"name": "remind", "category": "utility", "description": "Set a reminder", "usage": "g!remind [time] [message]", "premium": False},
        {"name": "urban", "category": "utility", "description": "Search Urban Dictionary", "usage": "g!urban [term]", "premium": False},
        {"name": "weather", "category": "utility", "description": "Get weather information", "usage": "g!weather [location]", "premium": False},
        {"name": "translate", "category": "utility", "description": "Translate text", "usage": "g!translate [language] [text]", "premium": True},
        {"name": "calculator", "category": "utility", "description": "Calculate an expression", "usage": "g!calculator [expression]", "premium": False},
        {"name": "shorturl", "category": "utility", "description": "Shorten a URL", "usage": "g!shorturl [url]", "premium": True},
        {"name": "qrcode", "category": "utility", "description": "Generate a QR code", "usage": "g!qrcode [text]", "premium": True},
        {"name": "ocr", "category": "utility", "description": "Extract text from an image", "usage": "g!ocr [image]", "premium": True},
        
        # ...more commands would be listed here
    ]
    
    # Generate command count stats
    @property
    def command_stats(self):
        """Get command count statistics"""
        categories = {}
        premium_count = 0
        free_count = 0
        
        for cmd in self.ALL_COMMANDS:
            # Count by category
            category = cmd["category"]
            if category in categories:
                categories[category] += 1
            else:
                categories[category] = 1
                
            # Count premium vs free
            if cmd["premium"]:
                premium_count += 1
            else:
                free_count += 1
                
        return {
            "total": len(self.ALL_COMMANDS),
            "categories": categories,
            "premium": premium_count,
            "free": free_count
        }
    
    # Export command list for the dashboard
    @commands.command()
    @commands.is_owner()
    async def exportcommands(self, ctx):
        """Export the command list for the dashboard"""
        try:
            os.makedirs("data", exist_ok=True)
            with open("data/commands.json", "w") as f:
                json.dump(self.ALL_COMMANDS, f)
                
            stats = self.command_stats
            await ctx.send(f"✅ Exported {stats['total']} commands ({stats['free']} free, {stats['premium']} premium)")
        except Exception as e:
            await ctx.send(f"❌ Error exporting commands: {e}")
    
async def setup(bot):
    """Add the Commands cog to the bot"""
    await bot.add_cog(Commands(bot))