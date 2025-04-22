import discord
from discord.ext import commands
import asyncio
import random
import logging
import json
import os
from typing import Dict, List, Optional, Union, Any

logger = logging.getLogger('guard-shin.games')

class TicTacToeButton(discord.ui.Button):
    def __init__(self, x: int, y: int):
        super().__init__(style=discord.ButtonStyle.secondary, label='\u200b', row=y)
        self.x = x
        self.y = y
        
    async def callback(self, interaction: discord.Interaction):
        assert self.view is not None
        view: TicTacToeGame = self.view
        state = view.board[self.y][self.x]
        
        if state in (view.X, view.O):
            return
            
        if view.current_player == view.player1:
            self.style = discord.ButtonStyle.danger
            self.label = 'X'
            view.board[self.y][self.x] = view.X
            view.current_player = view.player2
            content = f"It is now {view.player2.mention}'s turn"
        else:
            self.style = discord.ButtonStyle.success
            self.label = 'O'
            view.board[self.y][self.x] = view.O
            view.current_player = view.player1
            content = f"It is now {view.player1.mention}'s turn"
            
        winner = view.check_board_winner()
        if winner is not None:
            if winner == view.X:
                content = f"{view.player1.mention} won!"
            elif winner == view.O:
                content = f"{view.player2.mention} won!"
            else:
                content = "It's a tie!"
                
            for child in view.children:
                child.disabled = True
                
            view.stop()
            
        await interaction.response.edit_message(content=content, view=view)
        
class TicTacToeGame(discord.ui.View):
    X = -1
    O = 1
    Tie = 2
    
    def __init__(self, player1: discord.Member, player2: discord.Member):
        super().__init__(timeout=300)  # 5 minute timeout
        self.player1 = player1
        self.player2 = player2
        self.current_player = player1
        self.board = [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
        ]
        
        # Add the buttons to the view
        for x in range(3):
            for y in range(3):
                self.add_item(TicTacToeButton(x, y))
                
    def check_board_winner(self):
        # Check rows
        for row in self.board:
            value = sum(row)
            if value == 3:
                return self.O
            elif value == -3:
                return self.X
                
        # Check columns
        for col in range(3):
            value = self.board[0][col] + self.board[1][col] + self.board[2][col]
            if value == 3:
                return self.O
            elif value == -3:
                return self.X
                
        # Check diagonals
        diag1 = self.board[0][0] + self.board[1][1] + self.board[2][2]
        diag2 = self.board[0][2] + self.board[1][1] + self.board[2][0]
        if diag1 == 3 or diag2 == 3:
            return self.O
        elif diag1 == -3 or diag2 == -3:
            return self.X
            
        # Check for a tie
        if all(cell != 0 for row in self.board for cell in row):
            return self.Tie
            
        # No winner yet
        return None
        
    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        # Check if it's the player's turn
        if interaction.user != self.current_player:
            await interaction.response.send_message("It's not your turn!", ephemeral=True)
            return False
        return True
        
    async def on_timeout(self):
        # Game timed out
        for child in self.children:
            child.disabled = True
            
class Connect4Button(discord.ui.Button):
    def __init__(self, x: int):
        super().__init__(style=discord.ButtonStyle.secondary, label=str(x+1), row=0)
        self.x = x
        
    async def callback(self, interaction: discord.Interaction):
        assert self.view is not None
        view: Connect4Game = self.view
        
        # Find the lowest empty row in this column
        for y in range(5, -1, -1):
            if view.board[y][self.x] == 0:
                break
        else:
            # Column is full
            await interaction.response.send_message("That column is full!", ephemeral=True)
            return
            
        # Make the move
        if view.current_player == view.player1:
            view.board[y][self.x] = view.RED
            view.current_player = view.player2
            content = f"It is now {view.player2.mention}'s turn"
        else:
            view.board[y][self.x] = view.YELLOW
            view.current_player = view.player1
            content = f"It is now {view.player1.mention}'s turn"
            
        # Render the board
        board_str = view.render_board()
        
        # Check for a winner
        winner = view.check_board_winner()
        if winner is not None:
            if winner == view.RED:
                content = f"{view.player1.mention} won!"
            elif winner == view.YELLOW:
                content = f"{view.player2.mention} won!"
            else:
                content = "It's a tie!"
                
            for child in view.children:
                child.disabled = True
                
            view.stop()
            
        await interaction.response.edit_message(content=f"{board_str}\n{content}", view=view)
        
class Connect4Game(discord.ui.View):
    RED = 1
    YELLOW = 2
    Tie = 3
    
    def __init__(self, player1: discord.Member, player2: discord.Member):
        super().__init__(timeout=300)  # 5 minute timeout
        self.player1 = player1
        self.player2 = player2
        self.current_player = player1
        self.board = [
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0],
        ]
        
        # Add the buttons to the view
        for x in range(7):
            self.add_item(Connect4Button(x))
            
    def render_board(self):
        result = []
        for row in self.board:
            line = []
            for cell in row:
                if cell == 0:
                    line.append("⚫")  # Empty
                elif cell == self.RED:
                    line.append("🔴")  # Player 1 (Red)
                elif cell == self.YELLOW:
                    line.append("🟡")  # Player 2 (Yellow)
            result.append("".join(line))
        
        # Add column numbers at the bottom
        result.append("1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣")
        return "\n".join(result)
        
    def check_board_winner(self):
        # Check for horizontal wins
        for y in range(6):
            for x in range(4):
                if (self.board[y][x] != 0 and
                    self.board[y][x] == self.board[y][x+1] == self.board[y][x+2] == self.board[y][x+3]):
                    return self.board[y][x]
                    
        # Check for vertical wins
        for x in range(7):
            for y in range(3):
                if (self.board[y][x] != 0 and
                    self.board[y][x] == self.board[y+1][x] == self.board[y+2][x] == self.board[y+3][x]):
                    return self.board[y][x]
                    
        # Check for diagonal wins (top-left to bottom-right)
        for y in range(3):
            for x in range(4):
                if (self.board[y][x] != 0 and
                    self.board[y][x] == self.board[y+1][x+1] == self.board[y+2][x+2] == self.board[y+3][x+3]):
                    return self.board[y][x]
                    
        # Check for diagonal wins (bottom-left to top-right)
        for y in range(3, 6):
            for x in range(4):
                if (self.board[y][x] != 0 and
                    self.board[y][x] == self.board[y-1][x+1] == self.board[y-2][x+2] == self.board[y-3][x+3]):
                    return self.board[y][x]
                    
        # Check for a tie
        if all(cell != 0 for row in self.board for cell in row):
            return self.Tie
            
        # No winner yet
        return None
        
    async def interaction_check(self, interaction: discord.Interaction) -> bool:
        # Check if it's the player's turn
        if interaction.user != self.current_player:
            await interaction.response.send_message("It's not your turn!", ephemeral=True)
            return False
        return True
        
    async def on_timeout(self):
        # Game timed out
        for child in self.children:
            child.disabled = True

class GameCommands(commands.Cog):
    """Game commands for playing with other server members"""

    def __init__(self, bot):
        self.bot = bot
        self.hangman_games = {}
        self.trivia_games = {}
        
    @commands.command()
    async def tictactoe(self, ctx: commands.Context, member: discord.Member):
        """Play Tic-Tac-Toe with another member"""
        if member.bot:
            return await ctx.send("You can't play with a bot!")
            
        if member == ctx.author:
            return await ctx.send("You can't play against yourself!")
            
        # Create a new game
        game = TicTacToeGame(ctx.author, member)
        await ctx.send(f"{ctx.author.mention} has challenged {member.mention} to a game of Tic-Tac-Toe!\n{ctx.author.mention} goes first.", view=game)
        
    @commands.command()
    async def connect4(self, ctx: commands.Context, member: discord.Member):
        """Play Connect 4 with another member"""
        if member.bot:
            return await ctx.send("You can't play with a bot!")
            
        if member == ctx.author:
            return await ctx.send("You can't play against yourself!")
            
        # Create a new game
        game = Connect4Game(ctx.author, member)
        board_str = game.render_board()
        await ctx.send(f"{ctx.author.mention} has challenged {member.mention} to a game of Connect 4!\n{board_str}\n{ctx.author.mention} goes first.", view=game)
        
    @commands.command()
    async def hangman(self, ctx: commands.Context, category: str = None):
        """Play Hangman"""
        # Check if there's already a game in this channel
        if ctx.channel.id in self.hangman_games:
            return await ctx.send("There's already a hangman game in progress in this channel.")
            
        # Categories and word lists
        word_lists = {
            "animals": ["elephant", "giraffe", "zebra", "lion", "tiger", "monkey", "penguin", "dolphin", "koala", "kangaroo"],
            "countries": ["canada", "germany", "japan", "brazil", "australia", "france", "spain", "mexico", "egypt", "india"],
            "fruits": ["apple", "banana", "orange", "strawberry", "watermelon", "pineapple", "grape", "kiwi", "mango", "peach"],
            "movies": ["avatar", "titanic", "inception", "interstellar", "frozen", "matrix", "terminator", "ghostbusters", "jaws", "psycho"],
            "sports": ["soccer", "basketball", "tennis", "volleyball", "baseball", "cricket", "hockey", "golf", "swimming", "boxing"]
        }
        
        # Choose category
        if category and category.lower() in word_lists:
            chosen_category = category.lower()
        else:
            # If category not specified or invalid, choose a random one
            categories = list(word_lists.keys())
            if category and category.lower() not in word_lists:
                await ctx.send(f"Invalid category. Choosing a random category from: {', '.join(categories)}")
            chosen_category = random.choice(categories)
            
        # Choose a random word from the category
        chosen_word = random.choice(word_lists[chosen_category])
        
        # Initialize game state
        attempts_left = 6
        guessed_letters = set()
        game_state = {
            "word": chosen_word,
            "category": chosen_category,
            "guessed": guessed_letters,
            "attempts": attempts_left,
            "started_by": ctx.author.id
        }
        
        self.hangman_games[ctx.channel.id] = game_state
        
        # Display initial state
        word_display = "".join([letter if letter in guessed_letters else "\_" for letter in chosen_word])
        
        embed = discord.Embed(
            title="Hangman Game",
            description=f"Category: **{chosen_category.capitalize()}**",
            color=0x8249F0
        )
        embed.add_field(name="Word", value=f"`{word_display}`", inline=False)
        embed.add_field(name="Attempts Left", value=f"{attempts_left}/6", inline=True)
        embed.add_field(name="Guessed Letters", value="None", inline=True)
        embed.set_footer(text=f"Started by {ctx.author.name} | Use g!guess <letter> to guess a letter")
        
        # Add hangman ASCII art
        hangman_states = [
            "```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```",  # 6 attempts left
            "```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```",  # 5 attempts left
            "```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```",  # 4 attempts left
            "```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```",  # 3 attempts left
            "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```",  # 2 attempts left
            "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```",  # 1 attempt left
            "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```"   # 0 attempts left
        ]
        
        embed.add_field(name="Hangman", value=hangman_states[6 - attempts_left], inline=False)
        
        await ctx.send(embed=embed)
        
    @commands.command()
    async def guess(self, ctx: commands.Context, letter: str):
        """Guess a letter in the hangman game"""
        # Check if there's a hangman game in this channel
        if ctx.channel.id not in self.hangman_games:
            return await ctx.send("There's no hangman game in progress in this channel. Start one with `g!hangman`.")
            
        game = self.hangman_games[ctx.channel.id]
        
        # Make sure the letter is valid
        if len(letter) != 1 or not letter.isalpha():
            return await ctx.send("Please enter a single letter.")
            
        letter = letter.lower()
        
        # Check if the letter has already been guessed
        if letter in game["guessed"]:
            return await ctx.send(f"The letter '{letter}' has already been guessed.")
            
        # Add the letter to guessed letters
        game["guessed"].add(letter)
        
        # Check if the letter is in the word
        if letter in game["word"]:
            message = f"Good guess! The letter '{letter}' is in the word."
        else:
            game["attempts"] -= 1
            message = f"Sorry, the letter '{letter}' is not in the word. {game['attempts']} attempts left."
            
        # Generate word display
        word_display = "".join([char if char in game["guessed"] else "\_" for char in game["word"]])
        
        # Check if the player has won
        won = "_" not in word_display
        
        # Check if the player has lost
        lost = game["attempts"] <= 0
        
        embed = discord.Embed(
            title=("Hangman - Game Over" if won or lost else "Hangman Game"),
            description=f"Category: **{game['category'].capitalize()}**",
            color=(0x00FF00 if won else 0xFF0000 if lost else 0x8249F0)
        )
        
        # Add game result message if game is over
        if won:
            embed.add_field(name="Result", value=f"🎉 Congratulations! You guessed the word: **{game['word']}**", inline=False)
        elif lost:
            embed.add_field(name="Result", value=f"💀 Game over! The word was: **{game['word']}**", inline=False)
        else:
            embed.add_field(name="Status", value=message, inline=False)
            
        embed.add_field(name="Word", value=f"`{word_display}`", inline=False)
        embed.add_field(name="Attempts Left", value=f"{game['attempts']}/6", inline=True)
        embed.add_field(name="Guessed Letters", value=", ".join(sorted(game["guessed"])) or "None", inline=True)
        
        # Add hangman ASCII art
        hangman_states = [
            "```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```",  # 6 attempts left
            "```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```",  # 5 attempts left
            "```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```",  # 4 attempts left
            "```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```",  # 3 attempts left
            "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```",  # 2 attempts left
            "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```",  # 1 attempt left
            "```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```"   # 0 attempts left
        ]
        
        embed.add_field(name="Hangman", value=hangman_states[6 - game["attempts"]], inline=False)
        
        embed.set_footer(text=f"Started by {ctx.guild.get_member(game['started_by']).name if ctx.guild.get_member(game['started_by']) else 'Unknown'}")
        
        await ctx.send(embed=embed)
        
        # End the game if won or lost
        if won or lost:
            del self.hangman_games[ctx.channel.id]
            
    @commands.command()
    async def akinator(self, ctx: commands.Context):
        """Play Akinator"""
        # Check if the user has premium
        cog = self.bot.get_cog("Commands")
        is_premium = False
        if cog:
            is_premium = cog.is_premium(ctx.guild.id)
            
        if not is_premium:
            return await ctx.send("⭐ This is a premium command. Use `g!premium` to learn more about premium access.")
            
        await ctx.send("Akinator game would be implemented here for premium users.")
        
    @commands.command()
    async def wordle(self, ctx: commands.Context):
        """Play Wordle"""
        # Word list for Wordle
        wordle_words = [
            "apple", "beach", "chair", "dance", "eagle", "flame", "giant", "horse", "igloo", "juice",
            "kite", "lemon", "music", "noble", "ocean", "piano", "queen", "river", "snake", "tiger",
            "uncle", "virus", "witch", "xylophone", "youth", "zebra", "album", "brain", "cloud", "dream"
        ]
        
        # Choose a random word
        chosen_word = random.choice(wordle_words)
        
        # Send initial message
        embed = discord.Embed(
            title="Wordle Game",
            description="I've chosen a 5-letter word. You have 6 attempts to guess it.",
            color=0x8249F0
        )
        embed.add_field(name="How to Play", value="Type your 5-letter guess in the chat. I'll show you which letters are correct and in the right position (🟩), which letters are in the word but in the wrong position (🟨), and which letters are not in the word (⬛).", inline=False)
        embed.add_field(name="Attempts", value="0/6", inline=True)
        embed.add_field(name="Word Length", value="5 letters", inline=True)
        embed.set_footer(text="Game will time out after 3 minutes of inactivity")
        
        await ctx.send(embed=embed)
        
        attempts = 0
        guesses = []
        max_attempts = 6
        
        # Function to display the game state
        def create_game_embed():
            embed = discord.Embed(
                title="Wordle Game",
                color=0x8249F0
            )
            
            # Add the guesses
            for guess, result in guesses:
                embed.add_field(name=f"Guess {guesses.index((guess, result)) + 1}", value=result, inline=False)
                
            embed.add_field(name="Attempts", value=f"{attempts}/{max_attempts}", inline=True)
            embed.set_footer(text="Game will time out after 3 minutes of inactivity")
            
            return embed
            
        # Process guesses
        while attempts < max_attempts:
            try:
                # Wait for a guess
                def check(m):
                    return m.author == ctx.author and m.channel == ctx.channel and len(m.content) == 5 and m.content.isalpha()
                    
                guess_msg = await self.bot.wait_for('message', check=check, timeout=180)
                guess = guess_msg.content.lower()
                
                # Increment attempts
                attempts += 1
                
                # Check the guess
                result = ""
                for i, letter in enumerate(guess):
                    if letter == chosen_word[i]:
                        result += "🟩"  # Correct letter, correct position
                    elif letter in chosen_word:
                        result += "🟨"  # Correct letter, wrong position
                    else:
                        result += "⬛"  # Wrong letter
                        
                # Add the guess to the list
                guesses.append((guess, result))
                
                # Check if the player won
                if guess == chosen_word:
                    # Create the final embed
                    embed = discord.Embed(
                        title="Wordle - You Win! 🎉",
                        description=f"Congratulations! You guessed the word **{chosen_word}** in {attempts} attempts.",
                        color=0x00FF00
                    )
                    
                    # Add the guesses
                    for g, r in guesses:
                        embed.add_field(name=f"Guess {guesses.index((g, r)) + 1}", value=r, inline=False)
                        
                    await ctx.send(embed=embed)
                    return
                    
                # Send current game state
                await ctx.send(embed=create_game_embed())
                
                # Check if player lost
                if attempts >= max_attempts:
                    # Create the final embed
                    embed = discord.Embed(
                        title="Wordle - Game Over",
                        description=f"You've used all your attempts! The word was **{chosen_word}**.",
                        color=0xFF0000
                    )
                    
                    # Add the guesses
                    for g, r in guesses:
                        embed.add_field(name=f"Guess {guesses.index((g, r)) + 1}", value=r, inline=False)
                        
                    await ctx.send(embed=embed)
                    return
                    
            except asyncio.TimeoutError:
                await ctx.send(f"Game timed out! The word was **{chosen_word}**.")
                return
                
    @commands.command()
    async def minesweeper(self, ctx: commands.Context, difficulty: str = "medium"):
        """Play Minesweeper"""
        # Set up difficulties
        difficulties = {
            "easy": {"size": 5, "mines": 3},
            "medium": {"size": 8, "mines": 10},
            "hard": {"size": 8, "mines": 15}
        }
        
        # Validate difficulty
        if difficulty.lower() not in difficulties:
            return await ctx.send(f"Invalid difficulty. Choose from: {', '.join(difficulties.keys())}")
            
        # Get the difficulty settings
        settings = difficulties[difficulty.lower()]
        size = settings["size"]
        mines = settings["mines"]
        
        # Create the board
        # 0 = empty, 1-8 = number of adjacent mines, 9 = mine
        board = [[0 for _ in range(size)] for _ in range(size)]
        
        # Place mines randomly
        mine_coords = []
        while len(mine_coords) < mines:
            x, y = random.randint(0, size-1), random.randint(0, size-1)
            if (x, y) not in mine_coords:
                mine_coords.append((x, y))
                board[y][x] = 9
                
        # Calculate numbers
        for y in range(size):
            for x in range(size):
                if board[y][x] == 9:  # Skip mines
                    continue
                    
                # Count adjacent mines
                count = 0
                for dx in [-1, 0, 1]:
                    for dy in [-1, 0, 1]:
                        nx, ny = x + dx, y + dy
                        if 0 <= nx < size and 0 <= ny < size and board[ny][nx] == 9:
                            count += 1
                            
                board[y][x] = count
                
        # Create the output message with spoiler tags
        emojis = {
            0: "||:zero:||",
            1: "||:one:||",
            2: "||:two:||",
            3: "||:three:||",
            4: "||:four:||",
            5: "||:five:||",
            6: "||:six:||",
            7: "||:seven:||",
            8: "||:eight:||",
            9: "||:boom:||"
        }
        
        output = []
        for row in board:
            output.append("".join(emojis[cell] for cell in row))
            
        embed = discord.Embed(
            title="Minesweeper",
            description=f"Difficulty: **{difficulty.capitalize()}**\nMines: **{mines}**\nClick on the spoilers to reveal tiles. Don't hit a mine!",
            color=0x8249F0
        )
        
        # Send the board in chunks if necessary
        message = "\n".join(output)
        if len(message) <= 2000:
            await ctx.send(embed=embed)
            await ctx.send(message)
        else:
            await ctx.send(embed=embed)
            
            # Split into multiple messages if needed
            for i in range(0, len(output), size // 2):
                chunk = "\n".join(output[i:i + size // 2])
                await ctx.send(chunk)
                
    @commands.command()
    async def quiz(self, ctx: commands.Context, category: str = None):
        """Start a quiz"""
        # Quiz categories
        categories = ["general", "science", "history", "geography", "entertainment", "sports"]
        
        if category and category.lower() not in categories:
            return await ctx.send(f"Invalid category. Available categories: {', '.join(categories)}")
            
        if not category:
            category = random.choice(categories)
        else:
            category = category.lower()
            
        # Sample questions by category
        questions = {
            "general": [
                {"question": "What is the capital of France?", "options": ["London", "Paris", "Berlin", "Madrid"], "answer": 1},
                {"question": "How many sides does a hexagon have?", "options": ["5", "6", "7", "8"], "answer": 1},
                {"question": "What is the largest ocean on Earth?", "options": ["Atlantic", "Indian", "Pacific", "Arctic"], "answer": 2},
                {"question": "How many teeth does an adult human have?", "options": ["28", "30", "32", "36"], "answer": 2}
            ],
            "science": [
                {"question": "What is the chemical symbol for gold?", "options": ["Ag", "Au", "Fe", "Cu"], "answer": 1},
                {"question": "What is the nearest planet to the Sun?", "options": ["Venus", "Mercury", "Earth", "Mars"], "answer": 1},
                {"question": "What gas do plants absorb from the atmosphere?", "options": ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], "answer": 2},
                {"question": "What is the hardest natural substance on Earth?", "options": ["Gold", "Titanium", "Diamond", "Iron"], "answer": 2}
            ],
            "history": [
                {"question": "In what year did World War I begin?", "options": ["1905", "1914", "1918", "1921"], "answer": 1},
                {"question": "Who was the first President of the United States?", "options": ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"], "answer": 2},
                {"question": "Which ancient civilization built the Great Pyramid of Giza?", "options": ["Romans", "Greeks", "Egyptians", "Mayans"], "answer": 2},
                {"question": "In what year did the Titanic sink?", "options": ["1905", "1912", "1920", "1931"], "answer": 1}
            ],
            "geography": [
                {"question": "What is the largest country by land area?", "options": ["China", "United States", "Russia", "Canada"], "answer": 2},
                {"question": "Which mountain is the tallest in the world?", "options": ["K2", "Mount Everest", "Mount Kilimanjaro", "Mont Blanc"], "answer": 1},
                {"question": "What is the longest river in the world?", "options": ["Amazon", "Nile", "Mississippi", "Yangtze"], "answer": 1},
                {"question": "What is the largest desert in the world?", "options": ["Sahara", "Arabian", "Antarctic", "Gobi"], "answer": 2}
            ],
            "entertainment": [
                {"question": "Who played Iron Man in the Marvel Cinematic Universe?", "options": ["Chris Evans", "Robert Downey Jr.", "Chris Hemsworth", "Mark Ruffalo"], "answer": 1},
                {"question": "What is the highest-grossing film of all time?", "options": ["Avengers: Endgame", "Titanic", "Avatar", "Star Wars: The Force Awakens"], "answer": 2},
                {"question": "Who wrote the Harry Potter series?", "options": ["Stephen King", "J.R.R. Tolkien", "J.K. Rowling", "George R.R. Martin"], "answer": 2},
                {"question": "Which band released the album 'The Dark Side of the Moon'?", "options": ["The Beatles", "Led Zeppelin", "Pink Floyd", "The Rolling Stones"], "answer": 2}
            ],
            "sports": [
                {"question": "In which sport would you perform a slam dunk?", "options": ["Football", "Basketball", "Tennis", "Golf"], "answer": 1},
                {"question": "How many players are there in a standard soccer team?", "options": ["9", "10", "11", "12"], "answer": 2},
                {"question": "Which country won the 2018 FIFA World Cup?", "options": ["Germany", "Brazil", "France", "Argentina"], "answer": 2},
                {"question": "In which Olympic sport would you perform a vault?", "options": ["Swimming", "Gymnastics", "Diving", "Athletics"], "answer": 1}
            ]
        }
        
        # Choose a random question from the selected category
        question_data = random.choice(questions[category])
        
        # Create embed for the question
        embed = discord.Embed(
            title=f"Quiz - {category.capitalize()}",
            description=question_data["question"],
            color=0x8249F0
        )
        
        # Add options with letters
        option_letters = ["A", "B", "C", "D"]
        options_text = ""
        for i, option in enumerate(question_data["options"]):
            options_text += f"{option_letters[i]}. {option}\n"
            
        embed.add_field(name="Options", value=options_text, inline=False)
        embed.set_footer(text="Reply with the letter of your answer (A, B, C, or D)")
        
        await ctx.send(embed=embed)
        
        # Wait for the user's answer
        def check(m):
            return m.author == ctx.author and m.channel == ctx.channel and m.content.upper() in option_letters
            
        try:
            answer_msg = await self.bot.wait_for('message', check=check, timeout=30.0)
            user_answer = option_letters.index(answer_msg.content.upper())
            
            # Check if the answer is correct
            if user_answer == question_data["answer"]:
                result_embed = discord.Embed(
                    title="✅ Correct!",
                    description=f"The answer is indeed **{question_data['options'][question_data['answer']]}**.",
                    color=0x00FF00
                )
            else:
                result_embed = discord.Embed(
                    title="❌ Incorrect!",
                    description=f"The correct answer is **{question_data['options'][question_data['answer']]}**.",
                    color=0xFF0000
                )
                
            await ctx.send(embed=result_embed)
            
        except asyncio.TimeoutError:
            timeout_embed = discord.Embed(
                title="⏰ Time's Up!",
                description=f"The correct answer was **{question_data['options'][question_data['answer']]}**.",
                color=0xFF0000
            )
            await ctx.send(embed=timeout_embed)
            
    @commands.command()
    async def rps(self, ctx: commands.Context, choice: str):
        """Play Rock-Paper-Scissors"""
        # Check if the choice is valid
        valid_choices = ["rock", "paper", "scissors", "r", "p", "s"]
        if choice.lower() not in valid_choices:
            return await ctx.send("Invalid choice. Please choose rock, paper, or scissors (or r, p, s).")
            
        # Convert shorthand to full choice
        if choice.lower() == "r":
            choice = "rock"
        elif choice.lower() == "p":
            choice = "paper"
        elif choice.lower() == "s":
            choice = "scissors"
            
        # Bot's choice
        bot_choice = random.choice(["rock", "paper", "scissors"])
        
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
    async def memory(self, ctx: commands.Context):
        """Play a memory card game"""
        # Check if the user has premium
        cog = self.bot.get_cog("Commands")
        is_premium = False
        if cog:
            is_premium = cog.is_premium(ctx.guild.id)
            
        if not is_premium:
            return await ctx.send("⭐ This is a premium command. Use `g!premium` to learn more about premium access.")
            
        await ctx.send("Memory card game would be implemented here for premium users.")
        
    @commands.command()
    async def typerace(self, ctx: commands.Context):
        """Start a typing race"""
        # Sample sentences for the typing race
        sentences = [
            "The quick brown fox jumps over the lazy dog.",
            "Pack my box with five dozen liquor jugs.",
            "How vexingly quick daft zebras jump!",
            "Sphinx of black quartz, judge my vow.",
            "Jackdaws love my big sphinx of quartz.",
            "The five boxing wizards jump quickly.",
            "How razorback-jumping frogs can level six piqued gymnasts!",
            "Crazy Fredrick bought many very exquisite opal jewels.",
            "We promptly judged antique ivory buckles for the next prize.",
            "A mad boxer shot a quick, gloved jab to the jaw of his dizzy opponent."
        ]
        
        # Choose a random sentence
        sentence = random.choice(sentences)
        
        embed = discord.Embed(
            title="Typing Race",
            description="Get ready to type the following sentence as fast as you can!",
            color=0x8249F0
        )
        embed.add_field(name="Sentence", value=f"```{sentence}```", inline=False)
        embed.set_footer(text="The race will begin in 5 seconds...")
        
        await ctx.send(embed=embed)
        
        # Wait 5 seconds before starting
        await asyncio.sleep(5)
        
        # Start the race
        start_embed = discord.Embed(
            title="Typing Race",
            description="GO! Type the sentence as quickly and accurately as possible!",
            color=0x00FF00
        )
        start_embed.add_field(name="Sentence", value=f"```{sentence}```", inline=False)
        
        start_message = await ctx.send(embed=start_embed)
        start_time = datetime.datetime.utcnow()
        
        # Wait for the first correct response
        def check(m):
            return m.channel == ctx.channel and m.content.strip() == sentence
            
        try:
            response = await self.bot.wait_for('message', check=check, timeout=60.0)
            
            # Calculate time taken
            end_time = datetime.datetime.utcnow()
            time_taken = (end_time - start_time).total_seconds()
            
            # Calculate words per minute (WPM)
            words = len(sentence.split())
            wpm = round((words / time_taken) * 60, 2)
            
            # Create results embed
            result_embed = discord.Embed(
                title="Typing Race Results",
                description=f"🏆 {response.author.mention} wins!",
                color=0x00FF00
            )
            result_embed.add_field(name="Time", value=f"{time_taken:.2f} seconds", inline=True)
            result_embed.add_field(name="Speed", value=f"{wpm} WPM", inline=True)
            result_embed.add_field(name="Sentence", value=f"```{sentence}```", inline=False)
            
            await ctx.send(embed=result_embed)
            
        except asyncio.TimeoutError:
            # No one typed the sentence correctly within the time limit
            timeout_embed = discord.Embed(
                title="Typing Race",
                description="Time's up! No one completed the sentence correctly.",
                color=0xFF0000
            )
            await ctx.send(embed=timeout_embed)
            
    @commands.command()
    async def chess(self, ctx: commands.Context, member: discord.Member):
        """Start a chess game"""
        # Check if the user has premium
        cog = self.bot.get_cog("Commands")
        is_premium = False
        if cog:
            is_premium = cog.is_premium(ctx.guild.id)
            
        if not is_premium:
            return await ctx.send("⭐ This is a premium command. Use `g!premium` to learn more about premium access.")
            
        await ctx.send(f"A chess game between {ctx.author.mention} and {member.mention} would be implemented here for premium users.")
        
    @commands.command()
    async def guess(self, ctx: commands.Context):
        """Guess the number game"""
        # Generate a random number between 1 and 100
        number = random.randint(1, 100)
        attempts = 0
        max_attempts = 10
        
        embed = discord.Embed(
            title="Guess the Number",
            description="I'm thinking of a number between 1 and 100. Can you guess it?",
            color=0x8249F0
        )
        embed.add_field(name="Attempts", value=f"0/{max_attempts}", inline=True)
        embed.set_footer(text="Type your guess in the chat. The game will time out after 60 seconds of inactivity.")
        
        await ctx.send(embed=embed)
        
        # Wait for guesses
        while attempts < max_attempts:
            try:
                def check(m):
                    return m.author == ctx.author and m.channel == ctx.channel and m.content.isdigit() and 1 <= int(m.content) <= 100
                    
                guess_msg = await self.bot.wait_for('message', check=check, timeout=60.0)
                guess = int(guess_msg.content)
                attempts += 1
                
                if guess == number:
                    # Player wins
                    win_embed = discord.Embed(
                        title="🎉 You Win!",
                        description=f"Congratulations! The number was indeed **{number}**!",
                        color=0x00FF00
                    )
                    win_embed.add_field(name="Attempts", value=f"{attempts}/{max_attempts}", inline=True)
                    await ctx.send(embed=win_embed)
                    return
                    
                # Provide feedback
                if guess < number:
                    hint = "higher"
                else:
                    hint = "lower"
                    
                feedback_embed = discord.Embed(
                    title="Guess the Number",
                    description=f"Your guess: **{guess}**\nMy number is **{hint}** than that.",
                    color=0x8249F0
                )
                feedback_embed.add_field(name="Attempts", value=f"{attempts}/{max_attempts}", inline=True)
                
                await ctx.send(embed=feedback_embed)
                
                # Check if player has used all attempts
                if attempts >= max_attempts:
                    lose_embed = discord.Embed(
                        title="Game Over",
                        description=f"You've used all your attempts! The number was **{number}**.",
                        color=0xFF0000
                    )
                    await ctx.send(embed=lose_embed)
                    return
                    
            except asyncio.TimeoutError:
                await ctx.send(f"Game timed out! The number was **{number}**.")
                return
                
    @commands.command()
    async def scramble(self, ctx: commands.Context):
        """Word scramble game"""
        # Word list for scramble
        words = [
            {"word": "python", "hint": "A programming language"},
            {"word": "discord", "hint": "A chat platform"},
            {"word": "gaming", "hint": "Playing video games"},
            {"word": "keyboard", "hint": "Used for typing"},
            {"word": "internet", "hint": "Global network"},
            {"word": "computer", "hint": "Electronic device"},
            {"word": "friend", "hint": "A person you like"},
            {"word": "music", "hint": "Something you listen to"},
            {"word": "pizza", "hint": "A popular food"},
            {"word": "coffee", "hint": "A caffeinated drink"}
        ]
        
        # Choose a random word
        word_data = random.choice(words)
        original_word = word_data["word"]
        hint = word_data["hint"]
        
        # Scramble the word
        letters = list(original_word)
        random.shuffle(letters)
        scrambled = ''.join(letters)
        
        # Make sure the scrambled word isn't the same as the original
        while scrambled == original_word:
            random.shuffle(letters)
            scrambled = ''.join(letters)
            
        embed = discord.Embed(
            title="Word Scramble",
            description="Unscramble the following word:",
            color=0x8249F0
        )
        embed.add_field(name="Scrambled Word", value=f"**{scrambled}**", inline=False)
        embed.add_field(name="Hint", value=hint, inline=False)
        embed.set_footer(text="Type your answer in the chat. You have 30 seconds.")
        
        await ctx.send(embed=embed)
        
        # Wait for the correct answer
        def check(m):
            return m.author == ctx.author and m.channel == ctx.channel and m.content.lower() == original_word.lower()
            
        try:
            await self.bot.wait_for('message', check=check, timeout=30.0)
            
            # Player wins
            win_embed = discord.Embed(
                title="🎉 Correct!",
                description=f"Congratulations! You unscrambled the word **{original_word}** correctly!",
                color=0x00FF00
            )
            await ctx.send(embed=win_embed)
            
        except asyncio.TimeoutError:
            # Time's up
            timeout_embed = discord.Embed(
                title="⏰ Time's Up!",
                description=f"The correct word was **{original_word}**.",
                color=0xFF0000
            )
            await ctx.send(embed=timeout_embed)))

# Proper setup function for Discord.py extension loading
def setup(bot):
    # For Discord.py 2.0, we need to manually register the cog
    # without using the async add_cog method
    bot._BotBase__cogs[GameCommands.__name__] = GameCommands(bot)
