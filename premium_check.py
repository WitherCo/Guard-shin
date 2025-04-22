import discord
from discord.ext import commands
import functools

def premium_only():
    """
    A check that verifies the guild has premium access.
    This is used as a decorator for commands that require premium.
    """
    async def predicate(ctx):
        # Make sure we're in a guild
        if not ctx.guild:
            # DMs don't have premium
            await ctx.send("This premium command can only be used in a server.")
            return False
            
        # If the guild is in premium_guilds, allow the command
        if hasattr(ctx.bot, 'is_premium') and ctx.bot.is_premium(ctx.guild.id):
            return True
            
        # Not premium, send message with pricing info
        await ctx.send(
            "⚠️ This command requires a premium subscription!\n\n"
            "Get premium at https://witherco.github.io/Guard-shin/modern_premium.html\n"
            "Pricing tiers:\n"
            "• Basic: $4.99/month\n"
            "• Standard: $9.99/month\n"
            "• Premium: $24.99/month"
        )
        return False
    
    return commands.check(predicate)
    
def premium_only_slash():
    """
    A check that verifies the guild has premium access.
    This is used for application commands (slash commands).
    """
    def predicate(interaction):
        # Make sure we're in a guild
        if not interaction.guild:
            # Will be caught by the error handler
            return False
            
        # If the guild is in premium_guilds, allow the command
        if hasattr(interaction.client, 'is_premium') and interaction.client.is_premium(interaction.guild.id):
            return True
            
        # Not premium, will be caught by the error handler
        return False
    
    return discord.app_commands.check(predicate)


async def premium_only_slash_error(interaction, error):
    """
    Error handler for premium_only_slash check failure.
    Add this to your cog setup with:
    
    @command_name.error
    async def command_name_error(interaction, error):
        if isinstance(error, discord.app_commands.errors.CheckFailure):
            return await premium_only_slash_error(interaction, error)
        # Handle other errors...
    """
    if not interaction.guild:
        await interaction.response.send_message("This premium command can only be used in a server.", ephemeral=True)
        return
        
    await interaction.response.send_message(
        "⚠️ This command requires a premium subscription!\n\n"
        "Get premium at https://witherco.github.io/Guard-shin/modern_premium.html\n"
        "Pricing tiers:\n"
        "• Basic: $4.99/month\n"
        "• Standard: $9.99/month\n"
        "• Premium: $24.99/month",
        ephemeral=True
    )