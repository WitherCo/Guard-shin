import discord
from discord.ext import commands
import datetime
import logging

logger = logging.getLogger('guard-shin.utility')

class Utility(commands.Cog):
    """Utility commands for everyone"""
    
    def __init__(self, bot):
        self.bot = bot
        
    @commands.command(name="ping")
    async def ping(self, ctx):
        """Check the bot's latency"""
        start_time = datetime.datetime.utcnow()
        message = await ctx.send("Pinging...")
        end_time = datetime.datetime.utcnow()
        
        duration = (end_time - start_time).total_seconds() * 1000
        heartbeat = round(self.bot.latency * 1000)
        
        embed = discord.Embed(
            title="🏓 Pong!",
            color=discord.Color.green()
        )
        embed.add_field(name="API Latency", value=f"{heartbeat}ms", inline=True)
        embed.add_field(name="Message Latency", value=f"{round(duration)}ms", inline=True)
        
        await message.edit(content=None, embed=embed)
        
    @commands.command(name="info")
    async def info(self, ctx):
        """Get information about the bot"""
        embed = discord.Embed(
            title="Guard-shin Bot",
            description="Advanced Discord moderation and security bot with premium features.",
            color=discord.Color.purple(),
            timestamp=datetime.datetime.utcnow()
        )
        
        embed.add_field(name="Servers", value=f"{len(self.bot.guilds)}", inline=True)
        embed.add_field(name="Users", value=f"{sum(g.member_count for g in self.bot.guilds)}", inline=True)
        embed.add_field(name="Commands", value=f"{len(self.bot.commands)}", inline=True)
        
        # Add links
        embed.add_field(name="Links", value="[Add to Server](https://discord.com/oauth2/authorize?client_id=1361873604882731008&permissions=8&scope=bot)\n[Dashboard](https://witherco.github.io/Guard-shin/)\n[Support Server](https://discord.gg/YourInviteCode)", inline=False)
        
        embed.set_footer(text=f"Requested by {ctx.author}", icon_url=ctx.author.avatar.url if ctx.author.avatar else None)
        
        await ctx.send(embed=embed)
        
    @commands.command(name="invite")
    async def invite(self, ctx):
        """Get the bot's invite link"""
        embed = discord.Embed(
            title="Add Guard-shin to your server",
            description="Click the link below to add Guard-shin to your server:",
            color=discord.Color.blue()
        )
        embed.add_field(name="Invite Link", value="[Click Here](https://discord.com/oauth2/authorize?client_id=1361873604882731008&permissions=8&scope=bot)")
        embed.add_field(name="Support Server", value="[Join Here](https://discord.gg/YourInviteCode)")
        
        await ctx.send(embed=embed)
        
    @commands.command(name="help")
    async def help_command(self, ctx, *, command=None):
        """Show help for commands"""
        embed = discord.Embed(
            title="Guard-shin Help",
            description="Here are the available commands:",
            color=discord.Color.blue()
        )
        
        if command is None:
            # Group commands by cog
            cogs = {}
            for cmd in self.bot.commands:
                if cmd.hidden:
                    continue
                    
                cog_name = cmd.cog_name or "No Category"
                if cog_name not in cogs:
                    cogs[cog_name] = []
                cogs[cog_name].append(cmd)
            
            # Add fields for each cog
            for cog_name, cmds in cogs.items():
                commands_text = ", ".join(f"`{cmd.name}`" for cmd in cmds)
                embed.add_field(name=cog_name, value=commands_text, inline=False)
                
            embed.set_footer(text="Type g!help <command> for more information on a command.")
        else:
            # Find the command
            cmd = self.bot.get_command(command)
            if cmd is None:
                return await ctx.send(f"Command `{command}` not found.")
                
            # Show detailed help for the command
            embed.title = f"Help: {cmd.name}"
            embed.description = cmd.help or "No description provided."
            
            if cmd.aliases:
                embed.add_field(name="Aliases", value=", ".join(f"`{alias}`" for alias in cmd.aliases), inline=False)
                
            usage = f"{ctx.prefix}{cmd.name}"
            if cmd.signature:
                usage += f" {cmd.signature}"
            embed.add_field(name="Usage", value=f"`{usage}`", inline=False)
            
        await ctx.send(embed=embed)
    
async def setup(bot):
    await bot.add_cog(Utility(bot))