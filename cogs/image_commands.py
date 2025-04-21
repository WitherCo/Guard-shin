import discord
from discord.ext import commands
import aiohttp
import io
import random
import logging
import os
from typing import Optional, Union

logger = logging.getLogger('guard-shin.images')

class ImageCommands(commands.Cog):
    """Image manipulation commands for Guard-shin"""

    def __init__(self, bot):
        self.bot = bot
        
    @commands.command()
    async def avatar(self, ctx: commands.Context, *, member: discord.Member = None):
        """Show a user's avatar"""
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
        """Show the server icon"""
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
    async def banner(self, ctx: commands.Context, *, member: discord.Member = None):
        """Show a user's banner"""
        member = member or ctx.author
        
        # Fetch the full user to get banner information
        user = await self.bot.fetch_user(member.id)
        
        if not user.banner:
            return await ctx.send(f"{member.display_name} doesn't have a banner.")
            
        formats = ["png", "jpg", "webp"]
        if user.banner.is_animated():
            formats.append("gif")
            
        format_links = []
        for fmt in formats:
            format_links.append(f"[{fmt.upper()}]({user.banner.with_format(fmt).url})")
            
        embed = discord.Embed(
            title=f"{member.name}'s Banner",
            description=" | ".join(format_links),
            color=0x8249F0
        )
        
        embed.set_image(url=user.banner.url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def achievement(self, ctx: commands.Context, *, text: str):
        """Generate a Minecraft achievement"""
        if len(text) > 50:
            return await ctx.send("Achievement text must be 50 characters or less.")
            
        # URL encode the text
        encoded_text = text.replace(" ", "+")
        
        embed = discord.Embed(
            title="Minecraft Achievement",
            color=0x8249F0
        )
        
        # Use an API to generate the achievement image
        image_url = f"https://minecraftskinstealer.com/achievement/1/Achievement+Get%21/{encoded_text}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def captcha(self, ctx: commands.Context, *, text: str):
        """Generate a captcha image"""
        if len(text) > 20:
            return await ctx.send("Captcha text must be 20 characters or less.")
            
        # URL encode the text
        encoded_text = text.replace(" ", "+")
        
        embed = discord.Embed(
            title="Captcha",
            color=0x8249F0
        )
        
        # Use an API to generate the captcha image
        image_url = f"https://api.alexflipnote.dev/captcha?text={encoded_text}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def changemymind(self, ctx: commands.Context, *, text: str):
        """Generate a 'Change My Mind' meme"""
        if len(text) > 100:
            return await ctx.send("Text must be 100 characters or less.")
            
        # URL encode the text
        encoded_text = text.replace(" ", "%20")
        
        embed = discord.Embed(
            title="Change My Mind",
            color=0x8249F0
        )
        
        # Use an API to generate the image
        image_url = f"https://vacefron.nl/api/changemymind?text={encoded_text}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def tweet(self, ctx: commands.Context, username: str, *, text: str):
        """Generate a fake tweet"""
        if len(text) > 280:
            return await ctx.send("Tweet text must be 280 characters or less.")
            
        if len(username) > 15:
            return await ctx.send("Twitter username must be 15 characters or less.")
            
        # URL encode the text and username
        encoded_text = text.replace(" ", "%20")
        encoded_username = username.replace(" ", "%20")
        
        embed = discord.Embed(
            title=f"Tweet by @{username}",
            color=0x8249F0
        )
        
        # Use an API to generate the tweet image
        image_url = f"https://api.popcat.xyz/tweet?displayname={encoded_username}&username={encoded_username}&text={encoded_text}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def wanted(self, ctx: commands.Context, *, member: discord.Member = None):
        """Generate a wanted poster"""
        member = member or ctx.author
        
        embed = discord.Embed(
            title="Wanted",
            color=0x8249F0
        )
        
        # Use an API to generate the wanted poster
        image_url = f"https://api.popcat.xyz/wanted?image={member.avatar.url}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def qrcode(self, ctx: commands.Context, *, text: str):
        """Generate a QR code"""
        # URL encode the text
        encoded_text = text.replace(" ", "%20")
        
        embed = discord.Embed(
            title="QR Code",
            description=f"QR Code for: {text}",
            color=0x8249F0
        )
        
        # Use an API to generate the QR code
        image_url = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encoded_text}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def triggered(self, ctx: commands.Context, *, member: discord.Member = None):
        """Generate a 'triggered' GIF"""
        member = member or ctx.author
        
        embed = discord.Embed(
            title="Triggered",
            color=0x8249F0
        )
        
        # Use an API to generate the triggered GIF
        image_url = f"https://some-random-api.ml/canvas/triggered?avatar={member.avatar.url}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def jail(self, ctx: commands.Context, *, member: discord.Member = None):
        """Put someone in jail"""
        member = member or ctx.author
        
        embed = discord.Embed(
            title="Jail",
            color=0x8249F0
        )
        
        # Use an API to generate the jail image
        image_url = f"https://api.popcat.xyz/jail?image={member.avatar.url}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def trash(self, ctx: commands.Context, *, member: discord.Member = None):
        """Put someone in the trash"""
        member = member or ctx.author
        
        embed = discord.Embed(
            title="Trash",
            color=0x8249F0
        )
        
        # Use an API to generate the trash image
        image_url = f"https://api.popcat.xyz/trash?image={member.avatar.url}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def beautiful(self, ctx: commands.Context, *, member: discord.Member = None):
        """Generate a 'this is beautiful' meme"""
        member = member or ctx.author
        
        embed = discord.Embed(
            title="Beautiful",
            color=0x8249F0
        )
        
        # Use an API to generate the beautiful image
        image_url = f"https://api.popcat.xyz/beautiful?image={member.avatar.url}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def clyde(self, ctx: commands.Context, *, text: str):
        """Generate a Clyde message"""
        if len(text) > 100:
            return await ctx.send("Text must be 100 characters or less.")
            
        # URL encode the text
        encoded_text = text.replace(" ", "%20")
        
        embed = discord.Embed(
            title="Clyde",
            color=0x8249F0
        )
        
        # Use an API to generate the Clyde image
        image_url = f"https://api.popcat.xyz/clyde?text={encoded_text}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def facepalm(self, ctx: commands.Context, *, member: discord.Member = None):
        """Generate a facepalm image"""
        member = member or ctx.author
        
        embed = discord.Embed(
            title="Facepalm",
            color=0x8249F0
        )
        
        # Use an API to generate the facepalm image
        image_url = f"https://api.popcat.xyz/facepalm?image={member.avatar.url}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def meme(self, ctx: commands.Context, template: str = None, *, text: str = None):
        """Generate a custom meme"""
        # Check if this is a premium command
        cog = self.bot.get_cog("Commands")
        is_premium = False
        if cog:
            is_premium = cog.is_premium(ctx.guild.id)
            
        if not is_premium:
            return await ctx.send("⭐ This is a premium command. Use `g!premium` to learn more about premium access.")
            
        if not template:
            # List available templates
            embed = discord.Embed(
                title="Available Meme Templates",
                description="Use `g!meme <template> <top text>|<bottom text>` to create a meme.",
                color=0x8249F0
            )
            
            templates = [
                "drake", "distracted", "twobuttons", "change", "scroll", "brain", 
                "think", "bad", "spiderman", "they", "hard", "amithejoke", "bandwagon"
            ]
            
            template_text = "\n".join([f"• `{t}`" for t in templates])
            embed.add_field(name="Templates", value=template_text, inline=False)
            
            await ctx.send(embed=embed)
            return
            
        if not text:
            return await ctx.send("Please provide text for the meme. Format: `g!meme <template> <top text>|<bottom text>`")
            
        # Split text for top and bottom
        if "|" in text:
            top_text, bottom_text = text.split("|", 1)
        else:
            top_text = text
            bottom_text = ""
            
        # URL encode the texts
        encoded_top = top_text.strip().replace(" ", "%20")
        encoded_bottom = bottom_text.strip().replace(" ", "%20")
        
        embed = discord.Embed(
            title="Custom Meme",
            color=0x8249F0
        )
        
        # Use an API to generate the meme
        image_url = f"https://api.memegen.link/images/{template}/{encoded_top}/{encoded_bottom}.png"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def colorify(self, ctx: commands.Context, color: str, *, member: discord.Member = None):
        """Apply a color filter to an image"""
        # Check if this is a premium command
        cog = self.bot.get_cog("Commands")
        is_premium = False
        if cog:
            is_premium = cog.is_premium(ctx.guild.id)
            
        if not is_premium:
            return await ctx.send("⭐ This is a premium command. Use `g!premium` to learn more about premium access.")
            
        member = member or ctx.author
        
        # Validate color
        valid_colors = ["red", "green", "blue", "purple", "yellow", "orange", "pink", "black", "white"]
        if color.lower() not in valid_colors:
            return await ctx.send(f"Invalid color. Please choose from: {', '.join(valid_colors)}")
            
        embed = discord.Embed(
            title=f"{color.capitalize()} Filter",
            color=0x8249F0
        )
        
        # Use an API to generate the filtered image
        image_url = f"https://some-random-api.ml/canvas/color?avatar={member.avatar.url}&color={color.lower()}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def invert(self, ctx: commands.Context, *, member: discord.Member = None):
        """Invert an image's colors"""
        # Check if this is a premium command
        cog = self.bot.get_cog("Commands")
        is_premium = False
        if cog:
            is_premium = cog.is_premium(ctx.guild.id)
            
        if not is_premium:
            return await ctx.send("⭐ This is a premium command. Use `g!premium` to learn more about premium access.")
            
        member = member or ctx.author
        
        embed = discord.Embed(
            title="Inverted Colors",
            color=0x8249F0
        )
        
        # Use an API to generate the inverted image
        image_url = f"https://some-random-api.ml/canvas/invert?avatar={member.avatar.url}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def grayscale(self, ctx: commands.Context, *, member: discord.Member = None):
        """Convert an image to grayscale"""
        # Check if this is a premium command
        cog = self.bot.get_cog("Commands")
        is_premium = False
        if cog:
            is_premium = cog.is_premium(ctx.guild.id)
            
        if not is_premium:
            return await ctx.send("⭐ This is a premium command. Use `g!premium` to learn more about premium access.")
            
        member = member or ctx.author
        
        embed = discord.Embed(
            title="Grayscale",
            color=0x8249F0
        )
        
        # Use an API to generate the grayscale image
        image_url = f"https://some-random-api.ml/canvas/greyscale?avatar={member.avatar.url}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def blur(self, ctx: commands.Context, intensity: int = 5, *, member: discord.Member = None):
        """Apply blur to an image"""
        # Check if this is a premium command
        cog = self.bot.get_cog("Commands")
        is_premium = False
        if cog:
            is_premium = cog.is_premium(ctx.guild.id)
            
        if not is_premium:
            return await ctx.send("⭐ This is a premium command. Use `g!premium` to learn more about premium access.")
            
        member = member or ctx.author
        
        # Validate intensity
        if intensity < 1 or intensity > 10:
            return await ctx.send("Intensity must be between 1 and 10.")
            
        embed = discord.Embed(
            title=f"Blur (Intensity: {intensity})",
            color=0x8249F0
        )
        
        # Use an API to generate the blurred image
        image_url = f"https://some-random-api.ml/canvas/blur?avatar={member.avatar.url}&blur={intensity}"
        embed.set_image(url=image_url)
        
        await ctx.send(embed=embed)
        
    # Function to set up the cog
    async def setup(bot):
        await bot.add_cog(ImageCommands(bot))
# Proper setup function for Discord.py extension loading
def setup(bot):
    bot.add_cog(ImageCommands(bot))

# Proper setup function for Discord.py extension loading
def setup(bot):
    # This is a regular function, not async
    cog = ImageCommands(bot)
    bot.add_cog(cog)
