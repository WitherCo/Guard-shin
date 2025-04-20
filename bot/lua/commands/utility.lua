--
-- Guard-shin Discord Bot - Lua Utility Commands
-- A Wick clone implementing Lua utility commands
--

local json = require("cjson")
local http = require("socket.http")
local ltn12 = require("ltn12")

-- Configuration
local config = {
  embed_color = 0x5865F2, -- Discord blurple color
  bot_version = "1.0.0",
  bot_name = "Guard-shin",
  invite_permissions = "8",  -- Administrator permissions
  default_prefix = ">"
}

-- Helper function to get timestamp
local function get_timestamp()
  return os.date("!%Y-%m-%dT%H:%M:%S") .. "Z"
end

-- Helper function to format uptime
local function format_uptime(seconds)
  local days = math.floor(seconds / 86400)
  seconds = seconds % 86400
  local hours = math.floor(seconds / 3600)
  seconds = seconds % 3600
  local minutes = math.floor(seconds / 60)
  seconds = seconds % 60
  
  local parts = {}
  if days > 0 then table.insert(parts, days .. "d") end
  if hours > 0 then table.insert(parts, hours .. "h") end
  if minutes > 0 then table.insert(parts, minutes .. "m") end
  if seconds > 0 or #parts == 0 then table.insert(parts, seconds .. "s") end
  
  return table.concat(parts, " ")
end

-- Commands

-- Help command
local function help(args, message, guild)
  local command = args[1] -- Specific command to get help for
  
  if command then
    -- Help for specific command
    -- This would be populated with data from a command registry
    -- but for now we'll just return a message that will be handled by Python
    return {
      success = true,
      action = "help",
      command = command,
      request_type = "specific"
    }
  else
    -- General help menu
    return {
      success = true,
      action = "help",
      request_type = "general"
    }
  end
end

-- Ping command
local function ping(args, message, guild)
  return {
    success = true,
    action = "ping",
    timestamp = os.time(),
    message = "Pong!"
  }
end

-- Info command - bot information
local function info(args, message, guild)
  return {
    success = true,
    action = "info",
    type = "bot",
    message = "Guard-shin is an advanced Discord moderation and security bot designed to protect server environments through intelligent auto-moderation and comprehensive security features."
  }
end

-- Serverinfo command
local function serverinfo(args, message, guild)
  return {
    success = true,
    action = "serverinfo",
    guild_id = guild.id
  }
end

-- Userinfo command
local function userinfo(args, message, guild)
  local target_id = args[1] or message.author.id
  
  return {
    success = true,
    action = "userinfo",
    target_id = target_id,
    guild_id = guild.id
  }
end

-- Avatar command
local function avatar(args, message, guild)
  local target_id = args[1] or message.author.id
  
  return {
    success = true,
    action = "avatar",
    target_id = target_id
  }
end

-- Invite command
local function invite(args, message, guild)
  -- Generate invite link - this is a placeholder, actual link would be based on client ID
  local invite_link = "https://discord.com/oauth2/authorize?client_id={CLIENT_ID}&scope=bot&permissions=" .. config.invite_permissions
  
  return {
    success = true,
    action = "invite",
    invite_link = "placeholder", -- The Python side will replace this with the actual link
    message = "You can invite me to your server with this link: " .. invite_link
  }
end

-- Stats command
local function stats(args, message, guild)
  return {
    success = true,
    action = "stats",
    message = "Bot statistics will be provided by the Python component"
  }
end

-- Prefix command - get or set server prefix
local function prefix(args, message, guild)
  local new_prefix = args[1]
  
  if new_prefix then
    -- Set new prefix
    return {
      success = true,
      action = "setprefix",
      guild_id = guild.id,
      prefix = new_prefix,
      message = string.format("Prefix has been set to `%s`", new_prefix)
    }
  else
    -- Get current prefix
    return {
      success = true,
      action = "getprefix",
      guild_id = guild.id
    }
  end
end

-- Role command - show role info
local function role(args, message, guild)
  local role_id = args[1]
  
  if not role_id then
    return {
      success = false,
      message = "Please specify a role."
    }
  end
  
  return {
    success = true,
    action = "roleinfo",
    role_id = role_id,
    guild_id = guild.id
  }
end

-- Roles command - list all server roles
local function roles(args, message, guild)
  return {
    success = true,
    action = "listroles",
    guild_id = guild.id
  }
end

-- Channelinfo command
local function channelinfo(args, message, guild)
  local channel_id = args[1] or message.channel.id
  
  return {
    success = true,
    action = "channelinfo",
    channel_id = channel_id,
    guild_id = guild.id
  }
end

-- Emojis command - list server emojis
local function emojis(args, message, guild)
  return {
    success = true,
    action = "listemojis",
    guild_id = guild.id
  }
end

-- Permissions command - check user permissions
local function permissions(args, message, guild)
  local target_id = args[1] or message.author.id
  local channel_id = args[2] or message.channel.id
  
  return {
    success = true,
    action = "checkpermissions",
    target_id = target_id,
    channel_id = channel_id,
    guild_id = guild.id
  }
end

-- Export the commands
return {
  help = help,
  ping = ping,
  info = info,
  serverinfo = serverinfo,
  userinfo = userinfo,
  avatar = avatar,
  invite = invite,
  stats = stats,
  prefix = prefix,
  role = role,
  roles = roles,
  channelinfo = channelinfo,
  emojis = emojis,
  permissions = permissions
}