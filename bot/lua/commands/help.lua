--
-- Guard-shin Discord Bot - Lua Help Command
-- Help command implementation to display command information
--

local json = require("cjson")

-- Configuration
local config = {
  embed_color = 0x5865F2, -- Discord blurple color
  default_prefix = ">",
  bot_name = "Guard-shin",
  bot_version = "1.0.0",
  support_server = "https://discord.gg/guardshin",
  github_repo = "https://github.com/guardshin/guardshin"
}

-- Command Categories
local categories = {
  moderation = {
    name = "Moderation",
    emoji = "🛡️",
    description = "Commands for moderating your server and handling infractions."
  },
  administration = {
    name = "Administration",
    emoji = "⚙️",
    description = "Server setup and configuration commands."
  },
  utility = {
    name = "Utility",
    emoji = "🔧",
    description = "General purpose utility commands."
  },
  fun = {
    name = "Fun",
    emoji = "🎮",
    description = "Fun commands for everyone to enjoy."
  },
  information = {
    name = "Information",
    emoji = "ℹ️",
    description = "Commands to get information about users, servers, and more."
  },
  verification = {
    name = "Verification",
    emoji = "✅",
    description = "Commands for server verification systems."
  },
  raid_protection = {
    name = "Raid Protection",
    emoji = "🔒",
    description = "Commands to protect your server from raids."
  }
}

-- Command Metadata
local commands = {
  -- Moderation Commands
  ban = {
    name = "ban",
    category = "moderation",
    description = "Ban a user from the server.",
    usage = "ban <user> [reason] [delete_days]",
    examples = {
      {command = "ban @User", description = "Ban a user with no reason."},
      {command = "ban @User Spamming", description = "Ban a user with a reason."},
      {command = "ban @User Spamming 7", description = "Ban a user and delete their messages from the last 7 days."}
    },
    permissions = {"BAN_MEMBERS"}
  },
  kick = {
    name = "kick",
    category = "moderation",
    description = "Kick a user from the server.",
    usage = "kick <user> [reason]",
    examples = {
      {command = "kick @User", description = "Kick a user with no reason."},
      {command = "kick @User Disruptive behavior", description = "Kick a user with a reason."}
    },
    permissions = {"KICK_MEMBERS"}
  },
  mute = {
    name = "mute",
    category = "moderation",
    description = "Mute a user in the server.",
    usage = "mute <user> [duration] [reason]",
    examples = {
      {command = "mute @User", description = "Mute a user indefinitely."},
      {command = "mute @User 30m Spamming", description = "Mute a user for 30 minutes with a reason."}
    },
    permissions = {"MODERATE_MEMBERS"}
  },
  unmute = {
    name = "unmute",
    category = "moderation",
    description = "Unmute a user in the server.",
    usage = "unmute <user>",
    examples = {
      {command = "unmute @User", description = "Unmute a user."}
    },
    permissions = {"MODERATE_MEMBERS"}
  },
  warn = {
    name = "warn",
    category = "moderation",
    description = "Warn a user and add a record to their infractions.",
    usage = "warn <user> <reason>",
    examples = {
      {command = "warn @User Inappropriate language", description = "Warn a user with a reason."}
    },
    permissions = {"MANAGE_MESSAGES"}
  },
  softban = {
    name = "softban",
    category = "moderation",
    description = "Ban and immediately unban a user to clear their messages.",
    usage = "softban <user> [delete_days] [reason]",
    examples = {
      {command = "softban @User", description = "Softban a user with no reason."},
      {command = "softban @User 1 Spamming", description = "Softban a user and delete 1 day of messages."}
    },
    permissions = {"BAN_MEMBERS"}
  },
  tempban = {
    name = "tempban",
    category = "moderation",
    description = "Temporarily ban a user for a specified duration.",
    usage = "tempban <user> <duration> [reason] [delete_days]",
    examples = {
      {command = "tempban @User 7d", description = "Tempban a user for 7 days."},
      {command = "tempban @User 24h Raid participation", description = "Tempban a user for 24 hours with a reason."}
    },
    permissions = {"BAN_MEMBERS"}
  },
  infractions = {
    name = "infractions",
    category = "moderation",
    description = "View a user's infraction history.",
    usage = "infractions <user>",
    examples = {
      {command = "infractions @User", description = "View a user's infractions."}
    },
    permissions = {"MODERATE_MEMBERS"}
  },
  clearinfractions = {
    name = "clearinfractions",
    category = "moderation",
    description = "Clear a user's infractions or a specific infraction.",
    usage = "clearinfractions <user> [infraction_id]",
    examples = {
      {command = "clearinfractions @User", description = "Clear all infractions for a user."},
      {command = "clearinfractions @User 3", description = "Clear infraction #3 for a user."}
    },
    permissions = {"ADMINISTRATOR"}
  },
  clean = {
    name = "clean",
    category = "moderation",
    description = "Delete multiple messages from a channel.",
    usage = "clean <amount> [filter] [channel]",
    examples = {
      {command = "clean 10", description = "Delete the last 10 messages."},
      {command = "clean 50 bots", description = "Delete the last 50 messages from bots."},
      {command = "clean 20 links", description = "Delete the last 20 messages containing links."}
    },
    permissions = {"MANAGE_MESSAGES"}
  },
  -- Utility Commands
  help = {
    name = "help",
    category = "utility",
    description = "Display a list of commands or information about a specific command.",
    usage = "help [command]",
    examples = {
      {command = "help", description = "Display all command categories."},
      {command = "help ban", description = "Display information about the ban command."}
    },
    permissions = {}
  },
  ping = {
    name = "ping",
    category = "utility",
    description = "Check the bot's response time.",
    usage = "ping",
    examples = {
      {command = "ping", description = "Get the bot's latency."}
    },
    permissions = {}
  },
  info = {
    name = "info",
    category = "information",
    description = "Display information about the bot.",
    usage = "info",
    examples = {
      {command = "info", description = "Show bot information."}
    },
    permissions = {}
  },
  -- Fun Commands
  ['8ball'] = {
    name = "8ball",
    category = "fun",
    description = "Ask the magic 8-ball a question.",
    usage = "8ball <question>",
    examples = {
      {command = "8ball Will I win the lottery?", description = "Ask the 8-ball a question."}
    },
    permissions = {}
  },
  coinflip = {
    name = "coinflip",
    category = "fun",
    description = "Flip a coin.",
    usage = "coinflip",
    examples = {
      {command = "coinflip", description = "Flip a coin to get heads or tails."}
    },
    permissions = {}
  },
  -- Admin Commands
  setup = {
    name = "setup",
    category = "administration",
    description = "Set up the bot with recommended settings.",
    usage = "setup",
    examples = {
      {command = "setup", description = "Run the initial bot setup."}
    },
    permissions = {"ADMINISTRATOR"}
  },
  automod = {
    name = "automod",
    category = "administration",
    description = "Configure auto-moderation settings.",
    usage = "automod [subcommand] [value]",
    examples = {
      {command = "automod", description = "View current automod settings."},
      {command = "automod enable", description = "Enable automod."},
      {command = "automod profanity add badword", description = "Add a word to the profanity filter."}
    },
    permissions = {"MANAGE_GUILD"}
  }
}

-- Help command implementation
local function help(args, message, guild)
  local command_name = args[1]
  
  -- If a specific command was requested
  if command_name then
    local cmd = commands[command_name:lower()]
    if not cmd then
      return {
        success = false,
        message = "Command not found: " .. command_name
      }
    end
    
    -- Build detailed help for the specific command
    local prefix = config.default_prefix
    
    -- Format the embed fields
    local fields = {
      {name = "Description", value = cmd.description or "No description available."},
      {name = "Usage", value = "`" .. prefix .. (cmd.usage or cmd.name) .. "`"},
      {name = "Category", value = (categories[cmd.category] and categories[cmd.category].emoji or "")
             .. " " .. (categories[cmd.category] and categories[cmd.category].name or cmd.category or "Uncategorized")}
    }
    
    -- Add examples if available
    if cmd.examples and #cmd.examples > 0 then
      local examples_text = ""
      for _, example in ipairs(cmd.examples) do
        examples_text = examples_text .. "`" .. prefix .. example.command .. "` - " .. example.description .. "\n"
      end
      table.insert(fields, {name = "Examples", value = examples_text})
    end
    
    -- Add permissions if available
    if cmd.permissions and #cmd.permissions > 0 then
      local permissions_text = ""
      for _, perm in ipairs(cmd.permissions) do
        permissions_text = permissions_text .. "• " .. perm .. "\n"
      end
      table.insert(fields, {name = "Required Permissions", value = permissions_text})
    end
    
    return {
      success = true,
      action = "help_command",
      command = cmd.name,
      title = prefix .. cmd.name,
      description = cmd.description,
      fields = fields,
      color = config.embed_color
    }
  else
    -- General help menu - show categories and commands
    local categorized_commands = {}
    
    -- Sort commands into categories
    for cmd_name, cmd_data in pairs(commands) do
      local category = cmd_data.category or "uncategorized"
      if not categorized_commands[category] then
        categorized_commands[category] = {}
      end
      table.insert(categorized_commands[category], cmd_name)
    end
    
    -- Build the help embed
    local fields = {}
    
    -- Add a field for each category
    for category_id, category_data in pairs(categories) do
      if categorized_commands[category_id] and #categorized_commands[category_id] > 0 then
        local cmds = categorized_commands[category_id]
        table.sort(cmds) -- Sort commands alphabetically
        
        local cmd_list = ""
        for _, cmd_name in ipairs(cmds) do
          cmd_list = cmd_list .. "`" .. cmd_name .. "` "
        end
        
        table.insert(fields, {
          name = category_data.emoji .. " " .. category_data.name,
          value = cmd_list .. "\n" .. category_data.description
        })
      end
    end
    
    -- Add any uncategorized commands
    if categorized_commands["uncategorized"] and #categorized_commands["uncategorized"] > 0 then
      local cmds = categorized_commands["uncategorized"]
      table.sort(cmds)
      
      local cmd_list = ""
      for _, cmd_name in ipairs(cmds) do
        cmd_list = cmd_list .. "`" .. cmd_name .. "` "
      end
      
      table.insert(fields, {
        name = "📋 Uncategorized",
        value = cmd_list
      })
    end
    
    return {
      success = true,
      action = "help_menu",
      title = config.bot_name .. " Help",
      description = "Below is a list of all available commands. You can use `" .. config.default_prefix .. "help <command>` to get more information about a specific command.",
      fields = fields,
      color = config.embed_color,
      footer = "Bot Version: " .. config.bot_version .. " | Prefix: " .. config.default_prefix
    }
  end
end

-- Export the help command
return {
  help = help
}