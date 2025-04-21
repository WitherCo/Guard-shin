import discord
from discord.ext import commands
import asyncio
import random
import aiohttp
import io
import logging
from typing import Optional, Union, List, Dict, Any

logger = logging.getLogger('guard-shin.fun')

class FunCommands(commands.Cog):
    """Fun commands for Guard-shin"""

    def __init__(self, bot):
        self.bot = bot
        
    @commands.command(aliases=["8b"])
    async def eightball(self, ctx: commands.Context, *, question: str):
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
        
    @commands.command()
    async def joke(self, ctx: commands.Context):
        """Tell a random joke"""
        jokes = [
            "Why don't scientists trust atoms? Because they make up everything!",
            "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them!",
            "Why don't we tell secrets on a farm? Because the potatoes have eyes, the corn has ears, and the beans stalk!",
            "I told my wife she was drawing her eyebrows too high. She looked surprised.",
            "What do you call a fake noodle? An impasta!",
            "Why did the scarecrow win an award? Because he was outstanding in his field!",
            "I'm reading a book about anti-gravity. It's impossible to put down!",
            "What do you call a parade of rabbits hopping backwards? A receding hare-line!",
            "Why did the bicycle fall over? Because it was two-tired!",
            "How do you organize a space party? You planet!",
            "Why don't eggs tell jokes? They'd crack each other up!",
            "What's the best thing about Switzerland? I don't know, but the flag is a big plus!",
            "Did you hear about the claustrophobic astronaut? He just needed a little space!",
            "Why don't skeletons fight each other? They don't have the guts!",
            "What do you call a fish wearing a crown? King of the sea!",
            "How do you catch a squirrel? Climb a tree and act like a nut!",
            "What did one wall say to the other wall? I'll meet you at the corner!",
            "Why did the tomato turn red? Because it saw the salad dressing!",
            "What has ears but cannot hear? A cornfield!",
            "Why did the golfer bring two pairs of pants? In case he got a hole in one!"
        ]
        
        joke = random.choice(jokes)
        
        embed = discord.Embed(
            title="😄 Random Joke",
            description=joke,
            color=0x8249F0
        )
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def dadjoke(self, ctx: commands.Context):
        """Tell a random dad joke"""
        dad_jokes = [
            "I'm afraid for the calendar. Its days are numbered.",
            "I used to be addicted to soap, but I'm clean now.",
            "A bear walks into a bar and says, 'I'll have a beer and ... ... ... a packet of peanuts.' The bartender asks, 'Why the big pause?'",
            "What do you call a factory that makes okay products? A satisfactory.",
            "What did the ocean say to the beach? Nothing, it just waved.",
            "Why do seagulls fly over the sea? Because if they flew over the bay, they'd be bagels.",
            "I only know 25 letters of the alphabet. I don't know y.",
            "What does a lemon say when it answers the phone? Yellow!",
            "I don't trust stairs. They're always up to something.",
            "What did one hat say to the other? You stay here. I'll go on ahead.",
            "Why did the invisible man turn down the job offer? He couldn't see himself doing it.",
            "I used to hate facial hair, but then it grew on me.",
            "I'm so good at sleeping, I can do it with my eyes closed!",
            "I used to play piano by ear, but now I use my hands.",
            "Why don't eggs tell jokes? They'd crack each other up!",
            "Did you hear about the guy who invented the knock-knock joke? He won the 'no-bell' prize.",
            "Why don't scientists trust atoms? Because they make up everything!",
            "How do you organize a space party? You planet!",
            "Why don't skeletons fight each other? They don't have the guts!",
            "What did the janitor say when he jumped out of the closet? Supplies!"
        ]
        
        joke = random.choice(dad_jokes)
        
        embed = discord.Embed(
            title="👨 Dad Joke",
            description=joke,
            color=0x8249F0
        )
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def meme(self, ctx: commands.Context):
        """Show a random meme"""
        # This would typically use an API to fetch random memes
        # For simplicity, we'll use a fixed set of meme descriptions and URLs
        
        memes = [
            {
                "title": "When you finally fix that bug in your code",
                "url": "https://i.imgur.com/gDe0Ni9.jpg"
            },
            {
                "title": "When someone asks if you tested your code",
                "url": "https://i.imgur.com/nzTg99H.jpg"
            },
            {
                "title": "When you write code at 3 AM",
                "url": "https://i.imgur.com/zYbJ8Fp.jpg"
            },
            {
                "title": "That feeling when your code works on the first try",
                "url": "https://i.imgur.com/9X1gQvQ.jpg"
            },
            {
                "title": "Trying to explain your code to others",
                "url": "https://i.imgur.com/N7I9Dpw.jpg"
            }
        ]
        
        meme = random.choice(memes)
        
        embed = discord.Embed(
            title=meme["title"],
            color=0x8249F0
        )
        embed.set_image(url=meme["url"])
        embed.set_footer(text="Random Meme | If URLs don't work, use g!premium for access to updated meme API!")
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def fact(self, ctx: commands.Context):
        """Share a random fact"""
        facts = [
            "A day on Venus is longer than a year on Venus. It takes 243 Earth days to rotate once on its axis, but only 225 Earth days to go around the Sun.",
            "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still perfectly good to eat.",
            "The shortest war in history was between Britain and Zanzibar on August 27, 1896. Zanzibar surrendered after 38 minutes.",
            "A group of flamingos is called a 'flamboyance'.",
            "The average person walks the equivalent of three times around the world in a lifetime.",
            "The world's oldest piece of chewing gum is 9,000 years old.",
            "A bolt of lightning is five times hotter than the surface of the sun.",
            "Cows have best friends and get stressed when they're separated.",
            "A day on Mercury lasts about 176 Earth days, while a year on Mercury takes only 88 Earth days.",
            "The Hawaiian alphabet has only 12 letters.",
            "Octopuses have three hearts, nine brains, and blue blood.",
            "The Eiffel Tower can be 15 cm taller during the summer due to thermal expansion.",
            "There are more possible iterations of a game of chess than there are atoms in the observable universe.",
            "A hummingbird's heart beats up to 1,260 times per minute.",
            "Bananas are berries, but strawberries aren't.",
            "The smallest bone in the human body is in the middle ear and is only 2.8 millimeters long.",
            "Oxford University is older than the Aztec Empire.",
            "A group of crows is called a murder.",
            "There are more possible iterations of a game of chess than there are atoms in the known universe.",
            "The fingerprints of koalas are so similar to humans that they have on occasion been confused at crime scenes."
        ]
        
        fact = random.choice(facts)
        
        embed = discord.Embed(
            title="🧠 Random Fact",
            description=fact,
            color=0x8249F0
        )
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def coinflip(self, ctx: commands.Context):
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
        
    @commands.command()
    async def rps(self, ctx: commands.Context, choice: str):
        """Play rock-paper-scissors"""
        choice = choice.lower()
        choices = ["rock", "paper", "scissors"]
        
        if choice not in choices:
            return await ctx.send("Invalid choice. Please choose rock, paper, or scissors.")
            
        bot_choice = random.choice(choices)
        
        # Determine the winner
        if choice == bot_choice:
            result = "It's a tie!"
            color = 0xFFFF00
        elif (choice == "rock" and bot_choice == "scissors") or \
             (choice == "paper" and bot_choice == "rock") or \
             (choice == "scissors" and bot_choice == "paper"):
            result = "You win!"
            color = 0x00FF00
        else:
            result = "I win!"
            color = 0xFF0000
            
        # Create emoji representations
        emoji_map = {
            "rock": "👊",
            "paper": "🖐️",
            "scissors": "✌️"
        }
        
        embed = discord.Embed(
            title="Rock, Paper, Scissors",
            description=f"You chose {emoji_map[choice]} **{choice}**\nI chose {emoji_map[bot_choice]} **{bot_choice}**",
            color=color
        )
        embed.add_field(name="Result", value=result, inline=False)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def say(self, ctx: commands.Context, *, message: str):
        """Make the bot say something"""
        # Delete the command message
        await ctx.message.delete()
        
        # Send the message as the bot
        await ctx.send(message)
        
    @commands.command()
    async def emojify(self, ctx: commands.Context, *, text: str):
        """Convert text to emoji letters"""
        # Map for converting letters to emoji
        emoji_map = {
            'a': '🇦', 'b': '🇧', 'c': '🇨', 'd': '🇩', 'e': '🇪',
            'f': '🇫', 'g': '🇬', 'h': '🇭', 'i': '🇮', 'j': '🇯',
            'k': '🇰', 'l': '🇱', 'm': '🇲', 'n': '🇳', 'o': '🇴',
            'p': '🇵', 'q': '🇶', 'r': '🇷', 's': '🇸', 't': '🇹',
            'u': '🇺', 'v': '🇻', 'w': '🇼', 'x': '🇽', 'y': '🇾',
            'z': '🇿', '0': '0️⃣', '1': '1️⃣', '2': '2️⃣', '3': '3️⃣',
            '4': '4️⃣', '5': '5️⃣', '6': '6️⃣', '7': '7️⃣', '8': '8️⃣',
            '9': '9️⃣', ' ': '  '
        }
        
        emojified = ""
        for char in text.lower():
            if char in emoji_map:
                emojified += emoji_map[char] + " "
            else:
                emojified += char + " "
                
        # Check if message is too long
        if len(emojified) > 2000:
            return await ctx.send("The emojified text is too long to display!")
            
        await ctx.send(emojified)
        
    @commands.command()
    async def reverse(self, ctx: commands.Context, *, text: str):
        """Reverse a message"""
        reversed_text = text[::-1]
        
        embed = discord.Embed(
            title="Reversed Text",
            description=reversed_text,
            color=0x8249F0
        )
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def cat(self, ctx: commands.Context):
        """Show a random cat picture"""
        # This would typically use an API to fetch cat pictures
        # For simplicity, we'll use a fixed set of cat image URLs
        
        cats = [
            "https://i.imgur.com/843RdX3.jpg",
            "https://i.imgur.com/P0m5UTs.jpg",
            "https://i.imgur.com/RYIakVW.jpg",
            "https://i.imgur.com/d0DGEBs.jpg",
            "https://i.imgur.com/AjH5Bvl.jpg"
        ]
        
        cat_url = random.choice(cats)
        
        embed = discord.Embed(
            title="🐱 Random Cat",
            color=0x8249F0
        )
        embed.set_image(url=cat_url)
        embed.set_footer(text="Random Cat | If URLs don't work, use g!premium for access to updated cat API!")
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def dog(self, ctx: commands.Context):
        """Show a random dog picture"""
        # This would typically use an API to fetch dog pictures
        # For simplicity, we'll use a fixed set of dog image URLs
        
        dogs = [
            "https://i.imgur.com/fvQUUQv.jpg",
            "https://i.imgur.com/9PJUVwS.jpg",
            "https://i.imgur.com/X269vHa.jpg",
            "https://i.imgur.com/8J08fAv.jpg",
            "https://i.imgur.com/Xnz5t5T.jpg"
        ]
        
        dog_url = random.choice(dogs)
        
        embed = discord.Embed(
            title="🐶 Random Dog",
            color=0x8249F0
        )
        embed.set_image(url=dog_url)
        embed.set_footer(text="Random Dog | If URLs don't work, use g!premium for access to updated dog API!")
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def trivia(self, ctx: commands.Context, category: str = None):
        """Answer a trivia question"""
        categories = ["general", "science", "history", "geography", "entertainment", "sports"]
        
        if category and category.lower() not in categories:
            return await ctx.send(f"Invalid category. Available categories: {', '.join(categories)}")
            
        if not category:
            category = random.choice(categories)
        else:
            category = category.lower()
            
        # Sample trivia questions by category
        trivia_questions = {
            "general": [
                {"question": "What is the capital of France?", "answer": "Paris", "options": ["London", "Paris", "Berlin", "Madrid"]},
                {"question": "How many sides does a hexagon have?", "answer": "Six", "options": ["Five", "Six", "Seven", "Eight"]},
                {"question": "What is the largest ocean on Earth?", "answer": "Pacific Ocean", "options": ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"]},
                {"question": "How many teeth does an adult human have?", "answer": "32", "options": ["28", "30", "32", "36"]}
            ],
            "science": [
                {"question": "What is the chemical symbol for gold?", "answer": "Au", "options": ["Ag", "Au", "Fe", "Cu"]},
                {"question": "What is the nearest planet to the Sun?", "answer": "Mercury", "options": ["Venus", "Mercury", "Earth", "Mars"]},
                {"question": "What gas do plants absorb from the atmosphere?", "answer": "Carbon dioxide", "options": ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"]},
                {"question": "What is the hardest natural substance on Earth?", "answer": "Diamond", "options": ["Gold", "Titanium", "Diamond", "Iron"]}
            ],
            "history": [
                {"question": "In what year did World War I begin?", "answer": "1914", "options": ["1905", "1914", "1918", "1921"]},
                {"question": "Who was the first President of the United States?", "answer": "George Washington", "options": ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"]},
                {"question": "What ancient civilization built the Great Pyramid of Giza?", "answer": "Egyptians", "options": ["Romans", "Greeks", "Egyptians", "Mayans"]},
                {"question": "In what year did the Titanic sink?", "answer": "1912", "options": ["1905", "1912", "1920", "1931"]}
            ],
            "geography": [
                {"question": "What is the largest country by land area?", "answer": "Russia", "options": ["China", "United States", "Russia", "Canada"]},
                {"question": "Which mountain is the tallest in the world?", "answer": "Mount Everest", "options": ["K2", "Mount Everest", "Mount Kilimanjaro", "Mont Blanc"]},
                {"question": "What is the longest river in the world?", "answer": "Nile", "options": ["Amazon", "Nile", "Mississippi", "Yangtze"]},
                {"question": "What is the largest desert in the world?", "answer": "Antarctic Desert", "options": ["Sahara Desert", "Arabian Desert", "Antarctic Desert", "Gobi Desert"]}
            ],
            "entertainment": [
                {"question": "Who played Iron Man in the Marvel Cinematic Universe?", "answer": "Robert Downey Jr.", "options": ["Chris Evans", "Robert Downey Jr.", "Chris Hemsworth", "Mark Ruffalo"]},
                {"question": "What is the highest-grossing film of all time?", "answer": "Avatar", "options": ["Avengers: Endgame", "Titanic", "Avatar", "Star Wars: The Force Awakens"]},
                {"question": "Who wrote the Harry Potter series?", "answer": "J.K. Rowling", "options": ["Stephen King", "J.R.R. Tolkien", "J.K. Rowling", "George R.R. Martin"]},
                {"question": "Which band released the album 'The Dark Side of the Moon'?", "answer": "Pink Floyd", "options": ["The Beatles", "Led Zeppelin", "Pink Floyd", "The Rolling Stones"]}
            ],
            "sports": [
                {"question": "In which sport would you perform a slam dunk?", "answer": "Basketball", "options": ["Football", "Basketball", "Tennis", "Golf"]},
                {"question": "How many players are there in a standard soccer team?", "answer": "11", "options": ["9", "10", "11", "12"]},
                {"question": "Which country won the 2018 FIFA World Cup?", "answer": "France", "options": ["Germany", "Brazil", "France", "Argentina"]},
                {"question": "In which Olympic sport would you perform a vault?", "answer": "Gymnastics", "options": ["Swimming", "Gymnastics", "Diving", "Athletics"]}
            ]
        }
        
        # Select a random question from the chosen category
        question_data = random.choice(trivia_questions[category])
        
        # Create embed
        embed = discord.Embed(
            title=f"📝 Trivia Question - {category.capitalize()}",
            description=question_data["question"],
            color=0x8249F0
        )
        
        # Randomize the order of options
        options = question_data["options"].copy()
        random.shuffle(options)
        
        # Create a mapping of reactions to options
        reactions = ["🇦", "🇧", "🇨", "🇩"]
        reaction_options = {}
        
        options_text = ""
        for i, option in enumerate(options):
            options_text += f"{reactions[i]} {option}\n"
            reaction_options[reactions[i]] = option
            
        embed.add_field(name="Options", value=options_text, inline=False)
        embed.set_footer(text="You have 30 seconds to answer.")
        
        # Send the question
        question_message = await ctx.send(embed=embed)
        
        # Add reaction options
        for reaction in reactions:
            await question_message.add_reaction(reaction)
            
        # Wait for a reaction from the user
        def check(reaction, user):
            return user == ctx.author and str(reaction.emoji) in reactions and reaction.message.id == question_message.id
            
        try:
            reaction, user = await self.bot.wait_for('reaction_add', timeout=30.0, check=check)
            
            # Get the selected option
            selected_option = reaction_options[str(reaction.emoji)]
            
            # Check if the answer is correct
            if selected_option == question_data["answer"]:
                result_embed = discord.Embed(
                    title="✅ Correct!",
                    description=f"The answer is **{question_data['answer']}**.",
                    color=0x00FF00
                )
            else:
                result_embed = discord.Embed(
                    title="❌ Incorrect!",
                    description=f"The correct answer is **{question_data['answer']}**.",
                    color=0xFF0000
                )
                
            await question_message.edit(embed=result_embed)
            
        except asyncio.TimeoutError:
            # User didn't answer in time
            timeout_embed = discord.Embed(
                title="⏰ Time's Up!",
                description=f"The correct answer was **{question_data['answer']}**.",
                color=0xFF0000
            )
            await question_message.edit(embed=timeout_embed)
            
    @commands.command()
    async def cookie(self, ctx: commands.Context, member: discord.Member):
        """Give someone a cookie"""
        if member.id == ctx.author.id:
            return await ctx.send("You can't give a cookie to yourself!")
            
        embed = discord.Embed(
            title="🍪 Cookie Gift",
            description=f"{ctx.author.mention} has given {member.mention} a cookie!",
            color=0x8249F0
        )
        embed.set_image(url="https://i.imgur.com/Rye3KC3.gif")
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def hug(self, ctx: commands.Context, member: discord.Member):
        """Hug someone"""
        hug_gifs = [
            "https://i.imgur.com/R9sYxCN.gif",
            "https://i.imgur.com/wOmoeF8.gif",
            "https://i.imgur.com/ntqYLGl.gif",
            "https://i.imgur.com/4oLIrwj.gif",
            "https://i.imgur.com/6qYOUQF.gif"
        ]
        
        if member.id == ctx.author.id:
            embed = discord.Embed(
                title="🤗 Self Hug",
                description=f"{ctx.author.mention} hugs themselves. (Do you need someone to talk to?)",
                color=0x8249F0
            )
        else:
            embed = discord.Embed(
                title="🤗 Hug",
                description=f"{ctx.author.mention} hugs {member.mention}!",
                color=0x8249F0
            )
            
        embed.set_image(url=random.choice(hug_gifs))
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def slap(self, ctx: commands.Context, member: discord.Member):
        """Slap someone"""
        slap_gifs = [
            "https://i.imgur.com/fm49srQ.gif",
            "https://i.imgur.com/CwbYjBX.gif",
            "https://i.imgur.com/oYClV5g.gif",
            "https://i.imgur.com/EO8udG1.gif",
            "https://i.imgur.com/VW0cOyL.gif"
        ]
        
        if member.id == ctx.author.id:
            embed = discord.Embed(
                title="👋 Self Slap",
                description=f"{ctx.author.mention} slaps themselves. But why?",
                color=0x8249F0
            )
        else:
            embed = discord.Embed(
                title="👋 Slap",
                description=f"{ctx.author.mention} slaps {member.mention}!",
                color=0x8249F0
            )
            
        embed.set_image(url=random.choice(slap_gifs))
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def pat(self, ctx: commands.Context, member: discord.Member):
        """Pat someone"""
        pat_gifs = [
            "https://i.imgur.com/2lacG7l.gif",
            "https://i.imgur.com/UWbKpx8.gif",
            "https://i.imgur.com/4ssddEQ.gif",
            "https://i.imgur.com/2k0MFIr.gif",
            "https://i.imgur.com/LUypjw3.gif"
        ]
        
        if member.id == ctx.author.id:
            embed = discord.Embed(
                title="✋ Self Pat",
                description=f"{ctx.author.mention} pats themselves. Self-care is important!",
                color=0x8249F0
            )
        else:
            embed = discord.Embed(
                title="✋ Pat",
                description=f"{ctx.author.mention} pats {member.mention}!",
                color=0x8249F0
            )
            
        embed.set_image(url=random.choice(pat_gifs))
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def ship(self, ctx: commands.Context, member1: discord.Member, member2: discord.Member = None):
        """Ship two users together"""
        if member2 is None:
            member2 = ctx.author
            
        # Calculate ship percentage (consistent for the same pair)
        pair_id = sorted([member1.id, member2.id])
        random.seed(''.join(map(str, pair_id)))
        percentage = random.randint(0, 100)
        random.seed()  # Reset the seed
        
        # Get ship name (first half of first name + second half of second name)
        name1 = member1.display_name
        name2 = member2.display_name
        
        half1 = name1[:len(name1)//2]
        half2 = name2[len(name2)//2:]
        ship_name = half1 + half2
        
        # Determine relationship level
        if percentage <= 20:
            status = "Barely compatible 💔"
            color = 0xFF0000
        elif percentage <= 40:
            status = "Friends at best 👥"
            color = 0xFF8800
        elif percentage <= 60:
            status = "Could work with effort 🤔"
            color = 0xFFFF00
        elif percentage <= 80:
            status = "Great match! 💕"
            color = 0x00FF00
        else:
            status = "Perfect couple! 💘"
            color = 0xFF66FF
            
        # Create progress bar
        progress = "▬" * 10
        progress = progress[:int(percentage/10)] + "💗" + progress[int(percentage/10)+1:]
        
        embed = discord.Embed(
            title="💞 Shipping",
            description=f"Shipping {member1.mention} and {member2.mention}",
            color=color
        )
        embed.add_field(name="Ship Name", value=ship_name, inline=False)
        embed.add_field(name="Compatibility", value=f"{percentage}%", inline=True)
        embed.add_field(name="Status", value=status, inline=True)
        embed.add_field(name="Love Meter", value=progress, inline=False)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def rate(self, ctx: commands.Context, *, thing: str):
        """Rate something out of 10"""
        # Use a hash of the thing to get a consistent rating
        hash_value = 0
        for char in thing:
            hash_value += ord(char)
            
        # Use the hash to seed the random number generator (for consistent ratings)
        random.seed(hash_value)
        rating = random.randint(0, 10)
        random.seed()  # Reset the seed
        
        # Create a star display
        stars = "⭐" * rating + "☆" * (10 - rating)
        
        # Determine color based on rating
        if rating <= 3:
            color = 0xFF0000  # Red
        elif rating <= 6:
            color = 0xFFFF00  # Yellow
        else:
            color = 0x00FF00  # Green
            
        embed = discord.Embed(
            title=f"Rating for {thing}",
            description=f"{rating}/10",
            color=color
        )
        embed.add_field(name="Stars", value=stars, inline=False)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def ascii(self, ctx: commands.Context, *, text: str):
        """Convert text to ASCII art"""
        # This would typically use an API or library for ASCII art
        # For simplicity, we'll just create a basic monospace representation
        
        if len(text) > 10:
            return await ctx.send("Text too long. Please use 10 characters or less for ASCII art.")
            
        art = "```\n"
        
        # Simple ASCII patterns for each letter
        for char in text.upper():
            if char == "A":
                art += "  /\\  \n /  \\ \n/----\\\n/    \\\n\n"
            elif char == "B":
                art += "+----.\n|    |\n+----.\n|    |\n+----.\n\n"
            elif char == "C":
                art += " ----.\n/     \n|     \n\\     \n ----.\n\n"
            elif char == "D":
                art += "+----.\n|    \\\n|    |\n|    /\n+----.\n\n"
            elif char == "E":
                art += "+----.\n|     \n+---. \n|     \n+----.\n\n"
            else:
                art += " --- \n|   |\n|   |\n|   |\n --- \n\n"
                
        art += "```"
        
        await ctx.send(art)
        
    @commands.command()
    async def uwu(self, ctx: commands.Context, *, text: str):
        """UwU-ify a message"""
        # UwU conversion rules
        text = text.replace("r", "w").replace("l", "w")
        text = text.replace("R", "W").replace("L", "W")
        text = text.replace("n", "ny").replace("N", "NY")
        text = text.replace("ove", "uv").replace("OVE", "UV")
        
        # Add random UwU-isms
        uwu_additions = ["UwU", "OwO", "uwu", "owo", ":3", "~", "nya~", "*nuzzles*"]
        
        if random.random() < 0.3:  # 30% chance to add something at the start
            text = random.choice(uwu_additions) + " " + text
            
        if random.random() < 0.4:  # 40% chance to add something at the end
            text = text + " " + random.choice(uwu_additions)
            
        await ctx.send(text)
        
    @commands.command()
    async def mock(self, ctx: commands.Context, *, text: str):
        """SpOnGeBoB mOcK text"""
        mocked = ""
        
        for i, char in enumerate(text):
            if i % 2 == 0:
                mocked += char.lower()
            else:
                mocked += char.upper()
                
        embed = discord.Embed(
            title="Mocking Text",
            description=mocked,
            color=0x8249F0
        )
        # Add spongebob meme reference
        embed.set_thumbnail(url="https://i.imgur.com/dTwPZys.jpg")
        
        await ctx.send(embed=embed)
        
    # Function to set up the cog
    async def setup(bot):
        await bot.add_cog(FunCommands(bot))
# Proper setup function for Discord.py extension loading
def setup(bot):
    bot.add_cog(FunCommands(bot))
