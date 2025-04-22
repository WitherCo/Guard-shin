import discord
from discord.ext import commands
import datetime
import random
import os

class BasicCommands(commands.Cog):
    """Basic commands for Guard-shin bot that use prefix"""
    
    def __init__(self, bot):
        self.bot = bot
        
    @commands.command(name="ping", aliases=["latency"])
    async def ping(self, ctx):
        """Check the bot's latency"""
        start_time = datetime.datetime.now()
        message = await ctx.send("Pinging...")
        end_time = datetime.datetime.now()
        
        # Calculate bot latency
        api_latency = round(self.bot.latency * 1000)
        response_time = (end_time - start_time).total_seconds() * 1000
        
        await message.edit(content=f"Pong! 🏓\n"
                                 f"Bot Latency: {api_latency}ms\n"
                                 f"Response Time: {round(response_time)}ms")
    
    @commands.command(name="help", aliases=["commands"])
    async def help_command(self, ctx, *, command=None):
        """Show help for commands"""
        prefix = self.bot.get_guild_prefix(ctx.guild.id) if ctx.guild else "g!"
        
        if command:
            # If a specific command was requested, show detailed help for it
            original_cmd = self.bot.get_command(command)
            if original_cmd:
                embed = discord.Embed(
                    title=f"Command: {prefix}{original_cmd.name}",
                    description=original_cmd.help or "No description available",
                    color=discord.Color.purple()
                )
                
                # Add aliases if available
                if original_cmd.aliases:
                    embed.add_field(
                        name="Aliases", 
                        value=", ".join([f"{prefix}{alias}" for alias in original_cmd.aliases]),
                        inline=False
                    )
                
                # Add usage info
                embed.add_field(
                    name="Usage",
                    value=f"{prefix}{original_cmd.name} {original_cmd.signature if original_cmd.signature else ''}",
                    inline=False
                )
                
                await ctx.send(embed=embed)
                return
            else:
                await ctx.send(f"Command `{command}` not found.")
                return
        
        # If no specific command was requested, show general help
        embed = discord.Embed(
            title="Guard-shin Help",
            description=f"Prefix: `{prefix}` | Use `{prefix}help <command>` for more information on a command.",
            color=discord.Color.purple()
        )
        
        # Add command categories based on cogs
        for cog_name, cog in self.bot.cogs.items():
            # Skip cogs with no commands
            commands_list = [cmd for cmd in cog.get_commands() if not cmd.hidden]
            if not commands_list:
                continue
                
            # Add field for each category
            commands_text = ", ".join([f"`{prefix}{cmd.name}`" for cmd in commands_list])
            embed.add_field(name=cog_name, value=commands_text, inline=False)
        
        # Add footer with additional info
        embed.set_footer(text="Use slash commands for a more interactive experience!")
        
        await ctx.send(embed=embed)
    
    @commands.command(name="info", aliases=["about"])
    async def info(self, ctx):
        """Get information about Guard-shin"""
        embed = discord.Embed(
            title="Guard-shin Discord Bot",
            description="Advanced Discord moderation and security platform with intelligent server management.",
            color=discord.Color.purple(),
            timestamp=datetime.datetime.now()
        )
        
        # Add general info
        embed.add_field(
            name="Features",
            value="• Advanced Moderation\n• Auto-Mod Systems\n• Raid Protection\n• Music Commands\n• Custom Welcome Images\n• And much more!",
            inline=False
        )
        
        # Add bot stats
        embed.add_field(name="Servers", value=f"{len(self.bot.guilds)}", inline=True)
        embed.add_field(name="Users", value=f"{sum(guild.member_count for guild in self.bot.guilds)}", inline=True)
        embed.add_field(name="Prefix", value=f"`{self.bot.get_guild_prefix(ctx.guild.id) if ctx.guild else 'g!'}`", inline=True)
        
        # Add links
        dashboard_url = "https://witherco.github.io/Guard-shin/"
        invite_url = f"https://discord.com/oauth2/authorize?client_id={self.bot.application_id}&permissions=8&scope=bot%20applications.commands"
        support_url = "https://discord.gg/g3rFbaW6gw"
        
        embed.add_field(
            name="Links",
            value=f"[Dashboard]({dashboard_url}) | [Invite]({invite_url}) | [Support]({support_url})",
            inline=False
        )
        
        # Set thumbnail to bot avatar or a default
        embed.set_thumbnail(url=self.bot.user.avatar.url if self.bot.user.avatar else discord.Embed.Empty)
        
        await ctx.send(embed=embed)
    
    @commands.command(name="invite")
    async def invite(self, ctx):
        """Get the invite link for Guard-shin"""
        invite_url = f"https://discord.com/oauth2/authorize?client_id={self.bot.application_id}&permissions=8&scope=bot%20applications.commands"
        
        embed = discord.Embed(
            title="Invite Guard-shin",
            description="Add Guard-shin to your Discord server for advanced moderation and security features!",
            color=discord.Color.purple()
        )
        
        embed.add_field(
            name="Invite Link",
            value=f"[Click here to invite Guard-shin]({invite_url})",
            inline=False
        )
        
        embed.set_thumbnail(url=self.bot.user.avatar.url if self.bot.user.avatar else discord.Embed.Empty)
        
        await ctx.send(embed=embed)
    
    @commands.command(name="premium")
    async def premium(self, ctx):
        """Get information about premium features"""
        premium_status = "✅ Active" if self.bot.is_premium(ctx.guild.id) else "❌ Inactive"
        
        embed = discord.Embed(
            title="Guard-shin Premium",
            description="Upgrade to premium for access to enhanced features and capabilities!",
            color=discord.Color.gold()
        )
        
        # Add premium status for the current server
        embed.add_field(
            name="Premium Status",
            value=f"{premium_status}",
            inline=False
        )
        
        # Add premium features
        embed.add_field(
            name="Premium Features",
            value="• Music Commands\n• Advanced Auto-Mod\n• Custom Welcome Images\n• Auto-Response System\n• Advanced Analytics\n• Reaction Roles\n• And much more!",
            inline=False
        )
        
        # Add pricing information
        embed.add_field(
            name="Pricing",
            value="• Basic: $4.99/month\n• Standard: $9.99/month\n• Premium: $24.99/month",
            inline=True
        )
        
        # Add upgrade link
        dashboard_url = "https://witherco.github.io/Guard-shin/"
        embed.add_field(
            name="Upgrade Now",
            value=f"[Visit our Dashboard]({dashboard_url})",
            inline=True
        )
        
        await ctx.send(embed=embed)
    
    @commands.command(name="prefix")
    @commands.has_permissions(administrator=True)
    async def prefix(self, ctx, new_prefix=None):
        """View or set a custom prefix for the bot"""
        current_prefix = self.bot.get_guild_prefix(ctx.guild.id)
        
        if new_prefix is None:
            await ctx.send(f"The current prefix is `{current_prefix}`\nUse `{current_prefix}prefix <new_prefix>` to change it.")
            return
        
        # Prevent excessively long prefixes
        if len(new_prefix) > 10:
            await ctx.send("Prefix must be 10 characters or less.")
            return
        
        # Update the prefix
        self.bot.set_guild_prefix(ctx.guild.id, new_prefix)
        await ctx.send(f"Prefix updated to `{new_prefix}`")
        
    @commands.command(name="serverinfo")
    async def server_info(self, ctx):
        """Get information about the server"""
        if not ctx.guild:
            await ctx.send("This command can only be used in a server.")
            return
            
        guild = ctx.guild
        
        # Count roles (excluding @everyone)
        role_count = len(guild.roles) - 1
        
        # Count channels by type
        text_channels = len(guild.text_channels)
        voice_channels = len(guild.voice_channels)
        categories = len(guild.categories)
        
        # Get creation date
        created_at = guild.created_at.strftime("%B %d, %Y")
        
        # Count members by status (may not be accurate with intents limitations)
        total_members = guild.member_count
        
        # Create the embed
        embed = discord.Embed(
            title=f"{guild.name} - Server Information",
            description=guild.description or "No description",
            color=discord.Color.purple(),
            timestamp=datetime.datetime.now()
        )
        
        # Add server icon if available
        if guild.icon:
            embed.set_thumbnail(url=guild.icon.url)
        
        # Add general info
        embed.add_field(name="Server ID", value=guild.id, inline=True)
        embed.add_field(name="Owner", value=guild.owner.mention if guild.owner else "Unknown", inline=True)
        embed.add_field(name="Created On", value=created_at, inline=True)
        
        # Add member info
        embed.add_field(name="Members", value=total_members, inline=True)
        
        # Add channel info
        embed.add_field(
            name="Channels",
            value=f"📝 Text: {text_channels}\n🔊 Voice: {voice_channels}\n📁 Categories: {categories}",
            inline=True
        )
        
        # Add role info
        embed.add_field(name="Roles", value=role_count, inline=True)
        
        # Add premium status
        is_premium = "✅ Active" if self.bot.is_premium(ctx.guild.id) else "❌ Inactive"
        embed.add_field(name="Premium Status", value=is_premium, inline=True)
        
        # Add server boost info
        embed.add_field(
            name="Boosts",
            value=f"Level {guild.premium_tier} (Boosts: {guild.premium_subscription_count})",
            inline=True
        )
        
        # Add verification level
        verification_level = str(guild.verification_level).title()
        embed.add_field(name="Verification", value=verification_level, inline=True)
        
        await ctx.send(embed=embed)

async def setup(bot):
    await bot.add_cog(BasicCommands(bot))