import discord
from discord.ext import commands
import datetime
import logging
import platform
import psutil
import time

logger = logging.getLogger('guard-shin.utility')

class Utility(commands.Cog):
    """Utility commands for all users"""
    
    def __init__(self, bot):
        self.bot = bot
        self.start_time = time.time()
    
    @commands.command()
    async def serverinfo(self, ctx):
        """Display information about the server"""
        guild = ctx.guild
        
        # Get member counts
        total_members = guild.member_count
        online_members = sum(1 for member in guild.members if member.status != discord.Status.offline)
        bot_count = sum(1 for member in guild.members if member.bot)
        
        # Get channel counts
        text_channels = len(guild.text_channels)
        voice_channels = len(guild.voice_channels)
        categories = len(guild.categories)
        
        # Create embed
        embed = discord.Embed(
            title=f"{guild.name} Server Information",
            description=guild.description or "No description",
            color=discord.Color.blue()
        )
        
        # Add server icon if available
        if guild.icon:
            embed.set_thumbnail(url=guild.icon.url)
        
        # Add server details
        embed.add_field(name="Server ID", value=guild.id, inline=True)
        embed.add_field(name="Owner", value=guild.owner.mention if guild.owner else "Unknown", inline=True)
        embed.add_field(name="Region", value=str(guild.region) if hasattr(guild, 'region') else "N/A", inline=True)
        
        # Add member details
        embed.add_field(name="Members", value=f"Total: {total_members}\nOnline: {online_members}\nBots: {bot_count}", inline=True)
        
        # Add channel details
        embed.add_field(name="Channels", value=f"Text: {text_channels}\nVoice: {voice_channels}\nCategories: {categories}", inline=True)
        
        # Add role count
        embed.add_field(name="Roles", value=len(guild.roles), inline=True)
        
        # Add creation date
        created_at = guild.created_at.strftime("%Y-%m-%d %H:%M UTC")
        embed.add_field(name="Created", value=created_at, inline=True)
        
        # Add boost info if available
        if hasattr(guild, 'premium_subscription_count'):
            boost_level = guild.premium_tier
            boost_count = guild.premium_subscription_count
            embed.add_field(name="Boost Level", value=f"Level {boost_level} ({boost_count} boosts)", inline=True)
        
        # Add verification level
        embed.add_field(name="Verification Level", value=str(guild.verification_level).capitalize(), inline=True)
        
        await ctx.send(embed=embed)
    
    @commands.command()
    async def userinfo(self, ctx, member: discord.Member = None):
        """Display information about a user"""
        member = member or ctx.author
        
        # Create embed
        embed = discord.Embed(
            title=f"User Information: {member}",
            color=member.color
        )
        
        # Add user avatar if available
        if member.avatar:
            embed.set_thumbnail(url=member.avatar.url)
        
        # Add user details
        embed.add_field(name="User ID", value=member.id, inline=True)
        embed.add_field(name="Nickname", value=member.nick or "None", inline=True)
        embed.add_field(name="Bot", value="Yes" if member.bot else "No", inline=True)
        
        # Add join dates
        created_at = member.created_at.strftime("%Y-%m-%d %H:%M UTC")
        joined_at = member.joined_at.strftime("%Y-%m-%d %H:%M UTC") if member.joined_at else "Unknown"
        embed.add_field(name="Account Created", value=created_at, inline=True)
        embed.add_field(name="Joined Server", value=joined_at, inline=True)
        
        # Add status and activity
        status_emotes = {
            discord.Status.online: "🟢",
            discord.Status.idle: "🟡",
            discord.Status.dnd: "🔴",
            discord.Status.offline: "⚫"
        }
        status_text = f"{status_emotes.get(member.status, '⚪')} {str(member.status).capitalize()}"
        embed.add_field(name="Status", value=status_text, inline=True)
        
        # Add top role
        if len(member.roles) > 1:  # exclude @everyone
            top_role = member.top_role.mention
            embed.add_field(name="Top Role", value=top_role, inline=True)
        
        # Add role list (excluding @everyone)
        roles = [role.mention for role in reversed(member.roles) if role.name != "@everyone"]
        if roles:
            embed.add_field(name=f"Roles [{len(roles)}]", value=" ".join(roles) if len(" ".join(roles)) < 1024 else f"{len(roles)} roles", inline=False)
        
        await ctx.send(embed=embed)
    
    @commands.command()
    async def avatar(self, ctx, member: discord.Member = None):
        """Display a user's avatar"""
        member = member or ctx.author
        
        if not member.avatar:
            await ctx.send(f"{member} doesn't have a custom avatar.")
            return
        
        embed = discord.Embed(
            title=f"{member}'s Avatar",
            color=discord.Color.blue()
        )
        
        embed.set_image(url=member.avatar.url)
        
        await ctx.send(embed=embed)
    
    @commands.command()
    async def botinfo(self, ctx):
        """Display information about the bot"""
        # Calculate uptime
        uptime_seconds = int(time.time() - self.start_time)
        uptime = str(datetime.timedelta(seconds=uptime_seconds))
        
        # Get system info
        cpu_usage = psutil.cpu_percent()
        memory_usage = psutil.Process().memory_info().rss / 1024**2  # Convert to MB
        
        # Create embed
        embed = discord.Embed(
            title="Guard-shin Bot Information",
            description="Advanced moderation and security bot",
            color=discord.Color.purple()
        )
        
        # Add bot details
        embed.add_field(name="Bot ID", value=self.bot.user.id, inline=True)
        embed.add_field(name="Servers", value=len(self.bot.guilds), inline=True)
        embed.add_field(name="Users", value=sum(guild.member_count for guild in self.bot.guilds), inline=True)
        
        # Add uptime and performance
        embed.add_field(name="Uptime", value=uptime, inline=True)
        embed.add_field(name="CPU Usage", value=f"{cpu_usage:.1f}%", inline=True)
        embed.add_field(name="Memory Usage", value=f"{memory_usage:.1f} MB", inline=True)
        
        # Add versions
        embed.add_field(name="Python Version", value=platform.python_version(), inline=True)
        embed.add_field(name="Discord.py Version", value=discord.__version__, inline=True)
        
        # Add links
        embed.add_field(name="Invite Link", value="[Click Here](https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8)", inline=True)
        embed.add_field(name="Support Server", value="[Join Here](https://discord.gg/g3rFbaW6gw)", inline=True)
        
        await ctx.send(embed=embed)
    
    @commands.command()
    async def ping(self, ctx):
        """Check the bot's latency"""
        start_time = time.time()
        message = await ctx.send("Pinging...")
        end_time = time.time()
        
        api_latency = round(self.bot.latency * 1000)
        message_latency = round((end_time - start_time) * 1000)
        
        embed = discord.Embed(
            title="🏓 Pong!",
            color=discord.Color.green()
        )
        
        embed.add_field(name="API Latency", value=f"{api_latency} ms", inline=True)
        embed.add_field(name="Message Latency", value=f"{message_latency} ms", inline=True)
        
        await message.edit(content=None, embed=embed)
    
    @commands.command()
    async def invite(self, ctx):
        """Get the bot's invite link"""
        embed = discord.Embed(
            title="Invite Guard-shin Bot",
            description="Use the link below to add Guard-shin to your server:",
            color=discord.Color.blue()
        )
        
        embed.add_field(
            name="Invite Link", 
            value="[Click Here](https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8)",
            inline=False
        )
        
        embed.add_field(
            name="Support Server", 
            value="[Join Here](https://discord.gg/g3rFbaW6gw)",
            inline=False
        )
        
        await ctx.send(embed=embed)
    
    @commands.command()
    async def support(self, ctx):
        """Get support server information"""
        embed = discord.Embed(
            title="Guard-shin Support",
            description="Join our support server for help, updates, and discussions:",
            color=discord.Color.blue()
        )
        
        embed.add_field(
            name="Support Server", 
            value="[Join Here](https://discord.gg/g3rFbaW6gw)",
            inline=False
        )
        
        embed.add_field(
            name="Contact Email", 
            value="support@witherco.org",
            inline=False
        )
        
        await ctx.send(embed=embed)

def setup(bot):
    bot.add_cog(Utility(bot))