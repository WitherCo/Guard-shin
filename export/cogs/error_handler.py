import discord
from discord.ext import commands
import traceback
import sys
import logging

# Set up logging
logger = logging.getLogger('guard-shin')

class ErrorHandler(commands.Cog):
    """Handle errors for Guard-shin bot commands"""
    
    def __init__(self, bot):
        self.bot = bot
    
    @commands.Cog.listener()
    async def on_command_error(self, ctx, error):
        """The event triggered when a command encounters an error"""
        # If command has local error handler, return
        if hasattr(ctx.command, 'on_error'):
            return
            
        # Get the original exception
        error = getattr(error, 'original', error)
        
        # Command not found - ignore
        if isinstance(error, commands.CommandNotFound):
            return
            
        # Handle missing permissions or checks
        if isinstance(error, commands.MissingPermissions):
            missing_perms = ", ".join(error.missing_permissions)
            await ctx.send(f"You need the following permissions to use this command: `{missing_perms}`")
            return
            
        if isinstance(error, commands.BotMissingPermissions):
            missing_perms = ", ".join(error.missing_permissions)
            await ctx.send(f"I need the following permissions to execute this command: `{missing_perms}`")
            return
            
        if isinstance(error, commands.MissingRequiredArgument):
            await ctx.send(f"Missing required argument: `{error.param.name}`\n"
                          f"Usage: `{ctx.prefix}{ctx.command.name} {ctx.command.signature}`")
            return
            
        if isinstance(error, commands.BadArgument):
            await ctx.send(f"Invalid argument provided. Please check the command syntax.")
            return
            
        if isinstance(error, commands.NoPrivateMessage):
            await ctx.send("This command cannot be used in private messages.")
            return
            
        if isinstance(error, commands.CheckFailure):
            # Generic check failure - could be premium checks
            if "premium guild" in str(error).lower():
                await ctx.send("This command requires a premium subscription.\n"
                              "Visit our dashboard to upgrade: https://witherco.github.io/Guard-shin/")
            else:
                await ctx.send("You do not have permission to use this command.")
            return
            
        # Handle cooldowns
        if isinstance(error, commands.CommandOnCooldown):
            await ctx.send(f"This command is on cooldown. Try again in {error.retry_after:.1f} seconds.")
            return
            
        # All other errors - log them
        logger.error(f'Ignoring exception in command {ctx.command}:')
        logger.error(''.join(traceback.format_exception(type(error), error, error.__traceback__)))
        
        # Send a message to the user
        await ctx.send(f"An error occurred while executing the command: `{error}`")

async def setup(bot):
    await bot.add_cog(ErrorHandler(bot))