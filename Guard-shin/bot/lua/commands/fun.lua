--
-- Guard-shin Discord Bot - Lua Fun Commands
-- A Wick clone implementing Lua fun commands
--

local json = require("cjson")
local http = require("socket.http")
local ltn12 = require("ltn12")
local math = require("math")

-- Configuration
local config = {
  -- 8ball responses
  eightball_responses = {
    -- Affirmative
    "It is certain.",
    "It is decidedly so.",
    "Without a doubt.",
    "Yes, definitely.",
    "You may rely on it.",
    "As I see it, yes.",
    "Most likely.",
    "Outlook good.",
    "Yes.",
    "Signs point to yes.",
    -- Non-committal
    "Reply hazy, try again.",
    "Ask again later.",
    "Better not tell you now.",
    "Cannot predict now.",
    "Concentrate and ask again.",
    -- Negative
    "Don't count on it.",
    "My reply is no.",
    "My sources say no.",
    "Outlook not so good.",
    "Very doubtful."
  },
  
  -- Coin flip options
  coin_sides = {"Heads", "Tails"},
  
  -- Dice roll regex pattern
  dice_pattern = "(%d+)d(%d+)"
}

-- Helper functions
local function random_choice(table)
  return table[math.random(1, #table)]
end

-- Initialize random seed
math.randomseed(os.time())

-- Commands

-- 8ball command
local function eightball(args, message, guild)
  local question = table.concat(args, " ")
  
  if not question or question == "" then
    return {
      success = false,
      message = "Please ask a question."
    }
  end
  
  local response = random_choice(config.eightball_responses)
  
  return {
    success = true,
    action = "eightball",
    question = question,
    answer = response,
    message = string.format("🎱 **Question:** %s\n**Answer:** %s", question, response)
  }
end

-- Coinflip command
local function coinflip(args, message, guild)
  local result = random_choice(config.coin_sides)
  
  return {
    success = true,
    action = "coinflip",
    result = result,
    message = string.format("🪙 The coin landed on **%s**!", result)
  }
end

-- Roll dice command
local function roll(args, message, guild)
  local dice_expression = args[1] or "1d6"
  
  -- Parse dice expression (e.g., 2d6, 1d20)
  local num_dice, dice_sides = dice_expression:match(config.dice_pattern)
  num_dice = tonumber(num_dice) or 1
  dice_sides = tonumber(dice_sides) or 6
  
  -- Validate input
  if num_dice < 1 or num_dice > 100 then
    return {
      success = false,
      message = "You can roll between 1 and 100 dice."
    }
  end
  
  if dice_sides < 2 or dice_sides > 1000 then
    return {
      success = false,
      message = "Dice must have between 2 and 1000 sides."
    }
  end
  
  -- Roll the dice
  local results = {}
  local sum = 0
  
  for i = 1, num_dice do
    local roll = math.random(1, dice_sides)
    table.insert(results, roll)
    sum = sum + roll
  end
  
  -- Format the response
  local response
  if num_dice == 1 then
    response = string.format("🎲 You rolled a **%d**", results[1])
  else
    response = string.format("🎲 You rolled %s for a total of **%d**", table.concat(results, ", "), sum)
  end
  
  return {
    success = true,
    action = "roll",
    dice_expression = dice_expression,
    results = results,
    total = sum,
    message = response
  }
end

-- Choose command
local function choose(args, message, guild)
  if #args < 2 then
    return {
      success = false,
      message = "Please provide at least two choices separated by spaces."
    }
  end
  
  local choice = random_choice(args)
  
  return {
    success = true,
    action = "choose",
    options = args,
    choice = choice,
    message = string.format("🤔 I choose: **%s**", choice)
  }
end

-- RPS (Rock Paper Scissors) command
local function rps(args, message, guild)
  local choices = {"rock", "paper", "scissors"}
  local user_choice = args[1] and args[1]:lower() or nil
  
  if not user_choice or not (user_choice == "rock" or user_choice == "paper" or user_choice == "scissors") then
    return {
      success = false,
      message = "Please choose rock, paper, or scissors."
    }
  end
  
  local bot_choice = random_choice(choices)
  
  -- Determine winner
  local result
  if user_choice == bot_choice then
    result = "It's a tie!"
  elseif (user_choice == "rock" and bot_choice == "scissors") or
         (user_choice == "paper" and bot_choice == "rock") or
         (user_choice == "scissors" and bot_choice == "paper") then
    result = "You win!"
  else
    result = "I win!"
  end
  
  -- Emoji mapping
  local emojis = {
    rock = "👊",
    paper = "✋",
    scissors = "✌️"
  }
  
  return {
    success = true,
    action = "rps",
    user_choice = user_choice,
    bot_choice = bot_choice,
    result = result,
    message = string.format("%s You chose **%s** %s\nI chose **%s** %s\n**%s**",
      emojis[user_choice], user_choice, emojis[user_choice],
      bot_choice, emojis[bot_choice],
      result)
  }
end

-- Poll command
local function poll(args, message, guild)
  if #args < 1 then
    return {
      success = false,
      message = "Please provide a question for the poll."
    }
  end
  
  local question = args[1]
  table.remove(args, 1)
  
  local options = {}
  if #args > 0 then
    options = args
  end
  
  return {
    success = true,
    action = "poll",
    question = question,
    options = options,
    message = "Creating a poll: " .. question
  }
end

-- Export the commands
return {
  ['8ball'] = eightball,
  coinflip = coinflip,
  roll = roll,
  choose = choose,
  rps = rps,
  poll = poll
}