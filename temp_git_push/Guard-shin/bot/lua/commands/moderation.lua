--
-- Guard-shin Discord Bot - Lua Moderation Commands
-- A Wick clone implementing Lua moderation commands
--

local json = require("cjson")
local http = require("socket.http")
local ltn12 = require("ltn12")

-- Configuration
local config = {
  default_ban_days = 7,   -- Default number of days to delete messages when banning
  default_reason = "No reason provided",
  mute_roles = {},        -- Mute role IDs per guild
  timeout_defaults = {
    short = 5 * 60,      -- 5 minutes
    medium = 30 * 60,    -- 30 minutes
    long = 24 * 60 * 60, -- 24 hours
  }
}

-- Utility functions

-- Format time duration for humans
local function format_duration(seconds)
  if seconds < 60 then
    return seconds .. " second" .. (seconds == 1 and "" or "s")
  elseif seconds < 3600 then
    local minutes = math.floor(seconds / 60)
    return minutes .. " minute" .. (minutes == 1 and "" or "s")
  elseif seconds < 86400 then
    local hours = math.floor(seconds / 3600)
    return hours .. " hour" .. (hours == 1 and "" or "s")
  else
    local days = math.floor(seconds / 86400)
    return days .. " day" .. (days == 1 and "" or "s")
  end
end

-- Parse duration string to seconds
local function parse_duration(duration_str)
  -- Valid formats: 1d, 1h, 1m, 1s, 1d2h3m4s
  if not duration_str then return nil end
  
  local total_seconds = 0
  local days = duration_str:match("(%d+)d")
  local hours = duration_str:match("(%d+)h")
  local minutes = duration_str:match("(%d+)m")
  local seconds = duration_str:match("(%d+)s")
  
  if days then total_seconds = total_seconds + tonumber(days) * 86400 end
  if hours then total_seconds = total_seconds + tonumber(hours) * 3600 end
  if minutes then total_seconds = total_seconds + tonumber(minutes) * 60 end
  if seconds then total_seconds = total_seconds + tonumber(seconds) end
  
  if total_seconds == 0 then
    return nil
  end
  
  return total_seconds
end

-- Escape Discord markdown
local function escape_markdown(text)
  -- Escape common markdown characters
  return text:gsub("([\\`*_~<>|])", "\\%1")
end

-- Commands

-- Ban command
local function ban(args, message, guild)
  local target_id = args[1]
  local reason = args[2] or config.default_reason
  local delete_days = args[3] or config.default_ban_days
  
  if not target_id then
    return {
      success = false,
      message = "Please specify a user to ban."
    }
  end
  
  -- Additional logic like permission checks would go here,
  -- but in our bridge setup this is handled by the Python side
  
  return {
    success = true,
    action = "ban",
    target_id = target_id,
    reason = reason,
    delete_days = delete_days,
    message = string.format("**%s** has been banned\nReason: %s", target_id, reason)
  }
end

-- Kick command
local function kick(args, message, guild)
  local target_id = args[1]
  local reason = args[2] or config.default_reason
  
  if not target_id then
    return {
      success = false,
      message = "Please specify a user to kick."
    }
  end
  
  return {
    success = true,
    action = "kick",
    target_id = target_id,
    reason = reason,
    message = string.format("**%s** has been kicked\nReason: %s", target_id, reason)
  }
end

-- Mute/timeout command
local function mute(args, message, guild)
  local target_id = args[1]
  local duration_str = args[2]
  local reason = args[3] or config.default_reason
  
  if not target_id then
    return {
      success = false,
      message = "Please specify a user to mute."
    }
  end
  
  -- Parse duration or use default
  local duration = parse_duration(duration_str) or config.timeout_defaults.medium
  
  return {
    success = true,
    action = "mute",
    target_id = target_id,
    duration = duration,
    reason = reason,
    message = string.format("**%s** has been muted for %s\nReason: %s", 
      target_id, format_duration(duration), reason)
  }
end

-- Unmute command
local function unmute(args, message, guild)
  local target_id = args[1]
  
  if not target_id then
    return {
      success = false,
      message = "Please specify a user to unmute."
    }
  end
  
  return {
    success = true,
    action = "unmute",
    target_id = target_id,
    message = string.format("**%s** has been unmuted", target_id)
  }
end

-- Warn command
local function warn(args, message, guild)
  local target_id = args[1]
  local reason = args[2] or config.default_reason
  
  if not target_id then
    return {
      success = false,
      message = "Please specify a user to warn."
    }
  end
  
  -- Store the infraction to be later processed by Python
  local infraction = {
    type = "warning",
    user_id = target_id,
    guild_id = guild.id,
    moderator_id = message.author.id,
    reason = reason,
    timestamp = os.time()
  }
  
  return {
    success = true,
    action = "warn",
    target_id = target_id,
    reason = reason,
    infraction = infraction,
    message = string.format("**%s** has been warned\nReason: %s", target_id, reason)
  }
end

-- Softban command (ban and unban to clear messages)
local function softban(args, message, guild)
  local target_id = args[1]
  local delete_days = args[2] or 1
  local reason = args[3] or config.default_reason
  
  if not target_id then
    return {
      success = false,
      message = "Please specify a user to softban."
    }
  end
  
  -- Additional logic like permission checks would go here,
  -- but in our bridge setup this is handled by the Python side
  
  return {
    success = true,
    action = "softban",
    target_id = target_id,
    delete_days = delete_days,
    reason = reason,
    message = string.format("**%s** has been softbanned (banned and unbanned to clear messages)\nReason: %s", 
      target_id, reason)
  }
end

-- Tempban command
local function tempban(args, message, guild)
  local target_id = args[1]
  local duration_str = args[2]
  local reason = args[3] or config.default_reason
  local delete_days = args[4] or config.default_ban_days
  
  if not target_id then
    return {
      success = false,
      message = "Please specify a user to tempban."
    }
  end
  
  if not duration_str then
    return {
      success = false,
      message = "Please specify a duration for the temporary ban (e.g., 1d, 7d, 2h)."
    }
  end
  
  -- Parse duration
  local duration = parse_duration(duration_str)
  if not duration then
    return {
      success = false,
      message = "Invalid duration format. Examples: 1d, 7d, 2h, 30m"
    }
  end
  
  return {
    success = true,
    action = "tempban",
    target_id = target_id,
    duration = duration,
    delete_days = delete_days,
    reason = reason,
    message = string.format("**%s** has been temporarily banned for %s\nReason: %s", 
      target_id, format_duration(duration), reason)
  }
end

-- Infractions command - to view user infractions
local function infractions(args, message, guild)
  local target_id = args[1]
  
  if not target_id then
    return {
      success = false,
      message = "Please specify a user to view infractions for."
    }
  end
  
  -- This will be handled by the Python component to pull data from the database
  return {
    success = true,
    action = "getinfractions",
    target_id = target_id,
    guild_id = guild.id
  }
end

-- Clearinfractions command
local function clearinfractions(args, message, guild)
  local target_id = args[1]
  local infraction_id = args[2] -- Optional specific infraction ID to clear
  
  if not target_id then
    return {
      success = false,
      message = "Please specify a user to clear infractions for."
    }
  end
  
  if infraction_id then
    return {
      success = true,
      action = "clearinfraction",
      target_id = target_id,
      infraction_id = infraction_id,
      guild_id = guild.id,
      message = string.format("Cleared infraction #%s for **%s**", infraction_id, target_id)
    }
  else
    return {
      success = true,
      action = "clearallinfractions",
      target_id = target_id,
      guild_id = guild.id,
      message = string.format("Cleared all infractions for **%s**", target_id)
    }
  }
end

-- Lock/Unlock channel commands
local function lock(args, message, guild)
  local channel_id = args[1] or message.channel.id
  local reason = args[2] or config.default_reason
  
  return {
    success = true,
    action = "lock",
    channel_id = channel_id,
    reason = reason,
    message = string.format("Channel <#%s> has been locked.", channel_id)
  }
end

local function unlock(args, message, guild)
  local channel_id = args[1] or message.channel.id
  
  return {
    success = true,
    action = "unlock",
    channel_id = channel_id,
    message = string.format("Channel <#%s> has been unlocked.", channel_id)
  }
end

-- Slowmode command
local function slowmode(args, message, guild)
  local seconds = tonumber(args[1]) or 0
  local channel_id = args[2] or message.channel.id
  
  -- Validate slowmode duration
  if seconds < 0 or seconds > 21600 then -- Max 6 hours
    return {
      success = false,
      message = "Slowmode rate must be between 0 and 21600 seconds (6 hours)."
    }
  end
  
  local status_message
  if seconds == 0 then
    status_message = string.format("Slowmode has been disabled in <#%s>.", channel_id)
  else
    status_message = string.format("Slowmode has been set to %s in <#%s>.", 
      format_duration(seconds), channel_id)
  end
  
  return {
    success = true,
    action = "slowmode",
    channel_id = channel_id,
    seconds = seconds,
    message = status_message
  }
end

-- Clean/purge command
local function clean(args, message, guild)
  local amount = tonumber(args[1]) or 10
  local filter_type = args[2] -- Optional: "bots", "links", "attachments", "user:ID"
  local channel_id = args[3] or message.channel.id
  
  -- Validate amount
  if amount < 1 or amount > 1000 then
    return {
      success = false,
      message = "Please specify a number between 1 and 1000."
    }
  end
  
  return {
    success = true,
    action = "clean",
    channel_id = channel_id,
    amount = amount,
    filter_type = filter_type,
    message = string.format("Cleaning %d messages in <#%s>%s...", 
      amount, channel_id, filter_type and (" with filter: " .. filter_type) or "")
  }
end

-- Export the commands
return {
  ban = ban,
  kick = kick,
  mute = mute,
  unmute = unmute,
  warn = warn,
  softban = softban,
  tempban = tempban,
  infractions = infractions,
  clearinfractions = clearinfractions,
  lock = lock,
  unlock = unlock,
  slowmode = slowmode,
  clean = clean
}