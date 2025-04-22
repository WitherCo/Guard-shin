import discord
from discord.ext import commands
import asyncio
import datetime
import random
import os
import json
import typing

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

class PremiumCommands(commands.Cog):
    """Premium commands for Guard-shin bot that require subscription"""
    
    def __init__(self, bot):
        self.bot = bot
        self.welcome_messages = {
            "regular": [
                "Welcome {user} to {server}!",
                "Hey {user}! Welcome to {server}.",
                "{user} just joined {server}. Welcome!",
                "A wild {user} appeared in {server}!",
                "Everyone welcome {user} to {server}!"
            ],
            "special": [
                "{user} just landed in {server}! Prepare the welcome cake!",
                "Breaking news: {user} has joined {server}!",
                "{server} has a new member! Welcome, {user}!",
                "Welcome, {user}! We hope you brought pizza to {server}!",
                "Ladies and gentlemen, please welcome {user} to {server}!"
            ]
        }
        
        # Initialize custom welcome settings storage
        self.welcome_settings = {}
        self.load_welcome_settings()
    
    def load_welcome_settings(self):
        """Load welcome settings from file"""
        try:
            if os.path.exists('welcome_settings.json'):
                with open('welcome_settings.json', 'r') as f:
                    self.welcome_settings = json.load(f)
        except Exception as e:
            print(f"Error loading welcome settings: {e}")
    
    def save_welcome_settings(self):
        """Save welcome settings to file"""
        try:
            with open('welcome_settings.json', 'w') as f:
                json.dump(self.welcome_settings, f)
        except Exception as e:
            print(f"Error saving welcome settings: {e}")
    
    @commands.command(name="autoreact")
    @premium_only()
    @commands.has_permissions(manage_messages=True)
    async def auto_react(self, ctx, emoji, *, trigger_words):
        """
        Set up automatic reactions when trigger words are used
        
        Examples:
        !autoreact 👍 good great awesome
        !autoreact 🎉 congratulations congrats
        """
        # Format trigger words for storage
        guild_id = str(ctx.guild.id)
        words = [word.lower().strip() for word in trigger_words.split()]
        
        # Create autoreactions entry if doesn't exist
        if guild_id not in self.welcome_settings:
            self.welcome_settings[guild_id] = {"autoreactions": {}}
        elif "autoreactions" not in self.welcome_settings[guild_id]:
            self.welcome_settings[guild_id]["autoreactions"] = {}
        
        # Save the auto-reaction configuration
        for word in words:
            self.welcome_settings[guild_id]["autoreactions"][word] = emoji
        
        # Save to file
        self.save_welcome_settings()
        
        # Send confirmation
        await ctx.send(f"Auto-reaction set up. I'll react with {emoji} when these words are used: {', '.join(words)}")
    
    @commands.command(name="listautoreact")
    @premium_only()
    @commands.has_permissions(manage_messages=True)
    async def list_auto_react(self, ctx):
        """List all auto-reactions set up in this server"""
        guild_id = str(ctx.guild.id)
        
        # Check if any auto-reactions are set up
        if (guild_id not in self.welcome_settings or 
            "autoreactions" not in self.welcome_settings[guild_id] or 
            not self.welcome_settings[guild_id]["autoreactions"]):
            return await ctx.send("No auto-reactions are set up in this server.")
        
        # Create an embed to list the auto-reactions
        embed = discord.Embed(
            title="Auto-Reactions",
            description="These words will trigger automatic reactions:",
            color=discord.Color.gold(),
            timestamp=datetime.datetime.now()
        )
        
        # Group by emoji for cleaner display
        emoji_to_words = {}
        for word, emoji in self.welcome_settings[guild_id]["autoreactions"].items():
            if emoji not in emoji_to_words:
                emoji_to_words[emoji] = []
            emoji_to_words[emoji].append(word)
        
        # Add fields for each emoji
        for emoji, words in emoji_to_words.items():
            embed.add_field(
                name=f"Reaction: {emoji}",
                value=", ".join(words),
                inline=False
            )
        
        await ctx.send(embed=embed)
    
    @commands.command(name="clearautoreact")
    @premium_only()
    @commands.has_permissions(manage_messages=True)
    async def clear_auto_react(self, ctx, word=None):
        """
        Clear auto-reactions for a specific word or all
        
        Examples:
        !clearautoreact good - Clear auto-reaction for 'good'
        !clearautoreact - Clear all auto-reactions
        """
        guild_id = str(ctx.guild.id)
        
        # Check if any auto-reactions are set up
        if (guild_id not in self.welcome_settings or 
            "autoreactions" not in self.welcome_settings[guild_id] or 
            not self.welcome_settings[guild_id]["autoreactions"]):
            return await ctx.send("No auto-reactions are set up in this server.")
        
        # Clear a specific word
        if word:
            word = word.lower()
            if word in self.welcome_settings[guild_id]["autoreactions"]:
                del self.welcome_settings[guild_id]["autoreactions"][word]
                self.save_welcome_settings()
                await ctx.send(f"Auto-reaction for '{word}' has been removed.")
            else:
                await ctx.send(f"No auto-reaction was found for '{word}'.")
        # Clear all auto-reactions
        else:
            self.welcome_settings[guild_id]["autoreactions"] = {}
            self.save_welcome_settings()
            await ctx.send("All auto-reactions have been cleared.")
    
    @commands.command(name="welcomemessage")
    @premium_only()
    @commands.has_permissions(manage_guild=True)
    async def welcome_message(self, ctx, channel: typing.Optional[discord.TextChannel] = None, *, message=None):
        """
        Set a custom welcome message for new members
        
        Use {user} for the member's mention and {server} for the server name.
        
        Examples:
        !welcomemessage #welcome Welcome {user} to {server}!
        !welcomemessage #general Hey {user}, thanks for joining!
        !welcomemessage - Show current welcome message
        """
        guild_id = str(ctx.guild.id)
        
        # If no parameters, show current configuration
        if not channel and not message:
            if (guild_id in self.welcome_settings and 
                "welcome" in self.welcome_settings[guild_id]):
                    
                welcome_config = self.welcome_settings[guild_id]["welcome"]
                channel_id = welcome_config.get("channel_id")
                welcome_msg = welcome_config.get("message", "Default welcome message")
                
                channel_mention = f"<#{channel_id}>" if channel_id else "No channel set"
                
                embed = discord.Embed(
                    title="Welcome Message Configuration",
                    color=discord.Color.gold()
                )
                
                embed.add_field(name="Channel", value=channel_mention, inline=False)
                embed.add_field(name="Message", value=welcome_msg, inline=False)
                
                await ctx.send(embed=embed)
            else:
                await ctx.send("No welcome message is configured for this server.")
            return
        
        # Create entry for this guild if not exists
        if guild_id not in self.welcome_settings:
            self.welcome_settings[guild_id] = {}
        
        # If only channel provided, use default message
        if channel and not message:
            message = random.choice(self.welcome_messages["special"])
        
        # Save the welcome message configuration
        self.welcome_settings[guild_id]["welcome"] = {
            "channel_id": channel.id if channel else None,
            "message": message
        }
        
        # Save to file
        self.save_welcome_settings()
        
        # Preview the message (if message is not None)
        if message:
            preview = message.replace("{user}", ctx.author.mention).replace("{server}", ctx.guild.name)
            
            embed = discord.Embed(
                title="Welcome Message Set",
                description=f"The welcome message has been configured.",
                color=discord.Color.gold()
            )
            
            embed.add_field(name="Channel", value=channel.mention if channel else "Not set", inline=False)
            embed.add_field(name="Message", value=message, inline=False)
            embed.add_field(name="Preview", value=preview, inline=False)
        else:
            embed = discord.Embed(
                title="Welcome Message Configuration",
                description="Welcome message configuration has been updated.",
                color=discord.Color.gold()
            )
            
            embed.add_field(name="Channel", value=channel.mention if channel else "Not set", inline=False)
        
        await ctx.send(embed=embed)
    
    @commands.command(name="autorole")
    @premium_only()
    @commands.has_permissions(manage_roles=True)
    async def auto_role(self, ctx, role: discord.Role = None):
        """
        Set a role to be automatically assigned to new members
        
        Examples:
        !autorole @Member - Set the auto-role to Member
        !autorole - Show or disable current auto-role
        """
        guild_id = str(ctx.guild.id)
        
        # If no role provided, show current auto-role or disable
        if not role:
            if (guild_id in self.welcome_settings and 
                "autorole" in self.welcome_settings[guild_id]):
                
                role_id = self.welcome_settings[guild_id]["autorole"]
                current_role = ctx.guild.get_role(role_id)
                
                # Ask if user wants to disable auto-role
                embed = discord.Embed(
                    title="Auto-Role Configuration",
                    description="Auto-role is currently enabled.",
                    color=discord.Color.gold()
                )
                
                if current_role:
                    embed.add_field(name="Current Auto-Role", value=current_role.mention, inline=False)
                else:
                    embed.add_field(name="Current Auto-Role", value=f"<@&{role_id}> (Role not found)", inline=False)
                
                embed.add_field(name="Disable", value="Type 'disable' to turn off auto-role, or 'cancel' to keep it.", inline=False)
                
                await ctx.send(embed=embed)
                
                # Wait for response
                try:
                    def check(m):
                        return m.author == ctx.author and m.channel == ctx.channel
                    
                    response = await self.bot.wait_for('message', check=check, timeout=30.0)
                    
                    if response.content.lower() == 'disable':
                        if guild_id in self.welcome_settings:
                            if "autorole" in self.welcome_settings[guild_id]:
                                del self.welcome_settings[guild_id]["autorole"]
                                self.save_welcome_settings()
                        await ctx.send("Auto-role has been disabled.")
                    elif response.content.lower() == 'cancel':
                        await ctx.send("Auto-role remains unchanged.")
                    else:
                        await ctx.send("Invalid response. Auto-role remains unchanged.")
                    
                except asyncio.TimeoutError:
                    await ctx.send("Response timed out. Auto-role remains unchanged.")
            else:
                # No auto-role configured
                await ctx.send("No auto-role is currently configured. Provide a role to set one up.")
            return
        
        # Check for permission issues
        if role.position >= ctx.guild.me.top_role.position:
            return await ctx.send("I cannot assign this role as it's higher than or equal to my highest role.")
        
        # Create entry for this guild if not exists
        if guild_id not in self.welcome_settings:
            self.welcome_settings[guild_id] = {}
        
        # Save the role ID
        self.welcome_settings[guild_id]["autorole"] = role.id
        
        # Save to file
        self.save_welcome_settings()
        
        await ctx.send(f"Auto-role set to {role.mention}. New members will automatically receive this role.")

    @commands.command(name="autorespond")
    @premium_only()
    @commands.has_permissions(manage_messages=True)
    async def auto_respond(self, ctx, trigger, *, response):
        """
        Set an automatic response when trigger words are used
        
        Examples:
        !autorespond help Here are the helpful resources: [website link]
        !autorespond serverinfo Check out our rules in #rules
        """
        guild_id = str(ctx.guild.id)
        trigger = trigger.lower()
        
        # Create autoresponses entry if doesn't exist
        if guild_id not in self.welcome_settings:
            self.welcome_settings[guild_id] = {"autoresponses": {}}
        elif "autoresponses" not in self.welcome_settings[guild_id]:
            self.welcome_settings[guild_id]["autoresponses"] = {}
        
        # Save the auto-response
        self.welcome_settings[guild_id]["autoresponses"][trigger] = response
        
        # Save to file
        self.save_welcome_settings()
        
        # Send confirmation
        await ctx.send(f"Auto-response set up. I'll respond with your message when '{trigger}' is used.")
    
    @commands.command(name="listautorespond")
    @premium_only()
    @commands.has_permissions(manage_messages=True)
    async def list_auto_respond(self, ctx):
        """List all auto-responses set up in this server"""
        guild_id = str(ctx.guild.id)
        
        # Check if any auto-responses are set up
        if (guild_id not in self.welcome_settings or 
            "autoresponses" not in self.welcome_settings[guild_id] or 
            not self.welcome_settings[guild_id]["autoresponses"]):
            return await ctx.send("No auto-responses are set up in this server.")
        
        # Create an embed to list the auto-responses
        embed = discord.Embed(
            title="Auto-Responses",
            description="These triggers will prompt automatic responses:",
            color=discord.Color.gold(),
            timestamp=datetime.datetime.now()
        )
        
        # Add each trigger and a snippet of its response
        for trigger, response in self.welcome_settings[guild_id]["autoresponses"].items():
            # Truncate long responses
            if len(response) > 100:
                response_snippet = response[:97] + "..."
            else:
                response_snippet = response
                
            embed.add_field(
                name=f"Trigger: {trigger}",
                value=response_snippet,
                inline=False
            )
        
        await ctx.send(embed=embed)
    
    @commands.command(name="removeautorespond")
    @premium_only()
    @commands.has_permissions(manage_messages=True)
    async def remove_auto_respond(self, ctx, trigger=None):
        """
        Remove an auto-response for a specific trigger or all
        
        Examples:
        !removeautorespond help - Remove auto-response for 'help'
        !removeautorespond - Remove all auto-responses
        """
        guild_id = str(ctx.guild.id)
        
        # Check if any auto-responses are set up
        if (guild_id not in self.welcome_settings or 
            "autoresponses" not in self.welcome_settings[guild_id] or 
            not self.welcome_settings[guild_id]["autoresponses"]):
            return await ctx.send("No auto-responses are set up in this server.")
        
        # Remove a specific trigger
        if trigger:
            trigger = trigger.lower()
            if trigger in self.welcome_settings[guild_id]["autoresponses"]:
                del self.welcome_settings[guild_id]["autoresponses"][trigger]
                self.save_welcome_settings()
                await ctx.send(f"Auto-response for '{trigger}' has been removed.")
            else:
                await ctx.send(f"No auto-response was found for '{trigger}'.")
        # Remove all auto-responses
        else:
            self.welcome_settings[guild_id]["autoresponses"] = {}
            self.save_welcome_settings()
            await ctx.send("All auto-responses have been cleared.")
    
    @commands.command(name="ticket")
    @premium_only()
    @commands.has_permissions(manage_channels=True)
    async def setup_ticket(self, ctx, channel: discord.TextChannel = None):
        """
        Set up a ticket system in the specified channel
        
        Examples:
        !ticket #support - Set up ticket system in #support
        !ticket - Set up ticket system in the current channel
        """
        # Use current channel if none specified
        channel = channel or ctx.channel
        
        # Create embed for ticket message
        embed = discord.Embed(
            title="🎫 Support Tickets",
            description="React with 🎟️ to open a support ticket.",
            color=discord.Color.gold()
        )
        
        # Send the message and add the reaction
        ticket_msg = await channel.send(embed=embed)
        await ticket_msg.add_reaction("🎟️")
        
        # Store the ticket configuration
        guild_id = str(ctx.guild.id)
        
        if guild_id not in self.welcome_settings:
            self.welcome_settings[guild_id] = {}
            
        if "tickets" not in self.welcome_settings[guild_id]:
            self.welcome_settings[guild_id]["tickets"] = {}
            
        self.welcome_settings[guild_id]["tickets"][str(ticket_msg.id)] = {
            "channel_id": channel.id,
            "message_id": ticket_msg.id
        }
        
        self.save_welcome_settings()
        
        await ctx.send(f"Ticket system has been set up in {channel.mention}.")

    @commands.Cog.listener()
    async def on_message(self, message):
        """Event listener for messages to handle auto-responses and auto-reactions"""
        # Ignore messages from bots
        if message.author.bot or not message.guild:
            return
            
        guild_id = str(message.guild.id)
        
        # Check if guild has premium
        if not self.bot.is_premium(message.guild.id):
            return
            
        # Check if guild has auto-responses or auto-reactions
        if guild_id not in self.welcome_settings:
            return
            
        # Process auto-responses
        if "autoresponses" in self.welcome_settings[guild_id]:
            auto_responses = self.welcome_settings[guild_id]["autoresponses"]
            for trigger, response in auto_responses.items():
                if trigger.lower() in message.content.lower():
                    await message.channel.send(response)
                    break  # Only trigger one auto-response per message
        
        # Process auto-reactions
        if "autoreactions" in self.welcome_settings[guild_id]:
            auto_reactions = self.welcome_settings[guild_id]["autoreactions"]
            for word, emoji in auto_reactions.items():
                if word.lower() in message.content.lower():
                    try:
                        await message.add_reaction(emoji)
                    except discord.errors.HTTPException:
                        # If emoji is invalid or not found, continue
                        continue
    
    @commands.Cog.listener()
    async def on_member_join(self, member):
        """Event listener for members joining to handle welcome messages and auto-roles"""
        # Ignore if DM
        if not member.guild:
            return
            
        guild_id = str(member.guild.id)
        
        # Check if guild has premium
        if not self.bot.is_premium(member.guild.id):
            return
            
        # Check if guild has welcome configuration
        if guild_id not in self.welcome_settings:
            return
            
        # Process welcome message
        if "welcome" in self.welcome_settings[guild_id]:
            welcome_config = self.welcome_settings[guild_id]["welcome"]
            
            if "channel_id" in welcome_config and "message" in welcome_config:
                channel = member.guild.get_channel(welcome_config["channel_id"])
                
                if channel:
                    # Format the welcome message
                    message = welcome_config["message"]
                    formatted_message = message.replace("{user}", member.mention).replace("{server}", member.guild.name)
                    
                    try:
                        await channel.send(formatted_message)
                    except discord.errors.Forbidden:
                        # If bot doesn't have permission to send messages
                        pass
        
        # Process auto-role
        if "autorole" in self.welcome_settings[guild_id]:
            role_id = self.welcome_settings[guild_id]["autorole"]
            role = member.guild.get_role(role_id)
            
            if role and role < member.guild.me.top_role:
                try:
                    await member.add_roles(role, reason="Auto-role")
                except discord.errors.Forbidden:
                    # If bot doesn't have permission to assign roles
                    pass
    
    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload):
        """Event listener for reactions to handle ticket system"""
        # Ignore bot reactions
        if payload.user_id == self.bot.user.id:
            return
            
        # Check if it's a ticket reaction
        guild_id = str(payload.guild_id) if payload.guild_id else None
        if not guild_id:
            return
            
        # Check if guild has premium
        guild = self.bot.get_guild(payload.guild_id)
        if not guild or not self.bot.is_premium(guild.id):
            return
            
        # Check if this is a ticket message
        if (guild_id in self.welcome_settings and 
            "tickets" in self.welcome_settings[guild_id] and
            str(payload.message_id) in self.welcome_settings[guild_id]["tickets"]):
            
            # Only process ticket emoji
            if str(payload.emoji) != "🎟️":
                return
                
            # Get the user who reacted
            user = self.bot.get_user(payload.user_id)
            if not user:
                return
                
            # Get the channel to send ticket confirmation
            channel = self.bot.get_channel(payload.channel_id)
            if not channel:
                return
                
            # Create a ticket channel
            member = guild.get_member(payload.user_id)
            ticket_channel = await guild.create_text_channel(
                f"ticket-{user.name}",
                category=channel.category,
                reason=f"Support ticket opened by {user.name}"
            )
            
            # Set permissions
            await ticket_channel.set_permissions(guild.default_role, read_messages=False)
            await ticket_channel.set_permissions(member, read_messages=True, send_messages=True)
            
            # Get roles with manage channels permissions
            staff_roles = [role for role in guild.roles if role.permissions.manage_channels]
            for role in staff_roles:
                await ticket_channel.set_permissions(role, read_messages=True, send_messages=True)
            
            # Create ticket message
            embed = discord.Embed(
                title=f"Ticket: {user.name}",
                description=f"Support ticket opened by {user.mention}.\nStaff will be with you shortly.\n\nTo close this ticket, type `close`.",
                color=discord.Color.gold(),
                timestamp=datetime.datetime.now()
            )
            
            await ticket_channel.send(embed=embed)
            await ticket_channel.send(f"{user.mention}")
            
            # Send confirmation to user
            try:
                confirm_embed = discord.Embed(
                    title="Ticket Opened",
                    description=f"Your ticket has been opened in {ticket_channel.mention}",
                    color=discord.Color.green()
                )
                await member.send(embed=confirm_embed)
            except discord.errors.Forbidden:
                # If DMs are closed
                pass

async def setup(bot):
    await bot.add_cog(PremiumCommands(bot))