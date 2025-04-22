import discord
from discord.ext import commands
import random
import asyncio
import datetime

class FunCommands(commands.Cog):
    """Fun commands for Guard-shin bot that use prefix"""
    
    def __init__(self, bot):
        self.bot = bot
    
    @commands.command(name="8ball", aliases=["eightball", "8b"])
    async def eight_ball(self, ctx, *, question):
        """
        Ask the magic 8-ball a question
        
        Example:
        !8ball Will I win the lottery?
        """
        responses = [
            # Positive responses
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
            # Neutral responses
            "Reply hazy, try again.",
            "Ask again later.",
            "Better not tell you now.",
            "Cannot predict now.",
            "Concentrate and ask again.",
            # Negative responses
            "Don't count on it.",
            "My reply is no.",
            "My sources say no.",
            "Outlook not so good.",
            "Very doubtful."
        ]
        
        # Select a random response
        response = random.choice(responses)
        
        # Create embed
        embed = discord.Embed(
            title="🎱 Magic 8-Ball",
            color=discord.Color.purple(),
            timestamp=datetime.datetime.now()
        )
        
        embed.add_field(name="Question", value=question, inline=False)
        embed.add_field(name="Answer", value=response, inline=False)
        embed.set_footer(text=f"Asked by {ctx.author}")
        
        await ctx.send(embed=embed)
    
    @commands.command(name="coinflip", aliases=["flip", "coin"])
    async def coin_flip(self, ctx):
        """Flip a coin"""
        # Determine the result
        result = random.choice(["Heads", "Tails"])
        
        # Create a message
        message = await ctx.send("Flipping a coin...")
        
        # Add some suspense
        await asyncio.sleep(1)
        
        # Edit the message with the result
        await message.edit(content=f"The coin landed on: **{result}**")
    
    @commands.command(name="rps")
    async def rock_paper_scissors(self, ctx, choice=None):
        """
        Play rock, paper, scissors with the bot
        
        Example:
        !rps rock
        !rps paper
        !rps scissors
        """
        # Check if a valid choice was provided
        choices = ["rock", "paper", "scissors"]
        if not choice or choice.lower() not in choices:
            return await ctx.send("Please specify either 'rock', 'paper', or 'scissors'.")
            
        # Convert to lowercase for comparison
        user_choice = choice.lower()
        
        # Bot makes a choice
        bot_choice = random.choice(choices)
        
        # Emoji representations
        emoji_map = {
            "rock": "👊",
            "paper": "✋",
            "scissors": "✌️"
        }
        
        # Determine the winner
        if user_choice == bot_choice:
            result = "It's a tie!"
        elif (user_choice == "rock" and bot_choice == "scissors") or \
             (user_choice == "paper" and bot_choice == "rock") or \
             (user_choice == "scissors" and bot_choice == "paper"):
            result = "You win!"
        else:
            result = "I win!"
            
        # Create and send the message
        message = f"You chose: {emoji_map[user_choice]} **{user_choice}**\n" \
                  f"I chose: {emoji_map[bot_choice]} **{bot_choice}**\n\n" \
                  f"**{result}**"
                  
        await ctx.send(message)
    
    @commands.command(name="rate")
    async def rate(self, ctx, *, thing):
        """
        Rate something on a scale of 1-10
        
        Example:
        !rate pizza
        """
        # Special cases
        if thing.lower() in ["myself", "me", "i", "myself."]:
            # If user is rating themselves
            rating = 10
            comment = "You're amazing!"
        elif thing.lower() in ["yourself", "you", "guard-shin", "guard shin", "guardshin"]:
            # If user is rating the bot
            rating = 10
            comment = "I think I'm pretty great, thanks for asking!"
        elif thing.lower() in ["this server", "server"]:
            # If user is rating the server
            rating = 10
            comment = "This server is awesome!"
        else:
            # Regular rating
            rating = random.randint(1, 10)
            
            # Add a comment based on the rating
            if rating >= 8:
                comment = "That's pretty great!"
            elif rating >= 5:
                comment = "Not bad at all."
            else:
                comment = "Hmm, could be better."
        
        # Create message
        await ctx.send(f"I'd rate **{thing}** a **{rating}/10**. {comment}")
    
    @commands.command(name="choose", aliases=["pick", "decide"])
    async def choose(self, ctx, *options):
        """
        Choose between multiple options
        
        Example:
        !choose pizza pasta burger
        !choose "go to the movies" "stay home" "go to the park"
        """
        if len(options) < 2:
            return await ctx.send("Please provide at least 2 options to choose from.")
            
        # Pick a random option
        choice = random.choice(options)
        
        await ctx.send(f"I choose: **{choice}**")
    
    @commands.command(name="reverse")
    async def reverse(self, ctx, *, text):
        """
        Reverse the provided text
        
        Example:
        !reverse Hello world!
        """
        # Reverse the text
        reversed_text = text[::-1]
        
        await ctx.send(reversed_text)
    
    @commands.command(name="emojify")
    async def emojify(self, ctx, *, text):
        """
        Convert text to regional indicator emojis
        
        Example:
        !emojify Hello
        """
        # Define a mapping for characters to regional indicator emojis
        char_to_emoji = {
            'a': '🇦', 'b': '🇧', 'c': '🇨', 'd': '🇩', 'e': '🇪',
            'f': '🇫', 'g': '🇬', 'h': '🇭', 'i': '🇮', 'j': '🇯',
            'k': '🇰', 'l': '🇱', 'm': '🇲', 'n': '🇳', 'o': '🇴',
            'p': '🇵', 'q': '🇶', 'r': '🇷', 's': '🇸', 't': '🇹',
            'u': '🇺', 'v': '🇻', 'w': '🇼', 'x': '🇽', 'y': '🇾',
            'z': '🇿', ' ': '  '  # Double space for readability
        }
        
        # Convert each character to its emoji equivalent
        emojified = ""
        for char in text.lower():
            if char in char_to_emoji:
                emojified += char_to_emoji[char] + " "
            else:
                emojified += char + " "
        
        # Check if the result is within Discord's message length limit
        if len(emojified) > 2000:
            await ctx.send("The emojified message would be too long to send.")
        else:
            await ctx.send(emojified)

async def setup(bot):
    await bot.add_cog(FunCommands(bot))