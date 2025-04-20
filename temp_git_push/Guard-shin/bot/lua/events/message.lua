--
-- Guard-shin Discord Bot - Lua Message Event Handler
-- A Wick clone implementing Lua message event handling
--

local json = require("cjson")

-- Configuration
local config = {
  prefixes = {}, -- Guild-specific prefixes
  default_prefix = ">"
}

-- Process message event
local function on_message(message_data)
  -- This is called when a message event is passed from Python
  
  local message = message_data
  local guild_id = message.guild and message.guild.id or nil
  
  -- Don't process bot messages
  if message.author.bot then
    return { processed = false, reason = "author is bot" }
  end
  
  -- Get the prefix for this guild
  local prefix = config.prefixes[guild_id] or config.default_prefix
  
  -- Check if the message starts with the prefix
  if not message.content:sub(1, #prefix) == prefix then
    return { processed = false, reason = "not a command" }
  end
  
  -- Parse command and arguments
  local content = message.content:sub(#prefix + 1)
  local args = {}
  for arg in content:gmatch("%S+") do
    table.insert(args, arg)
  end
  
  if #args == 0 then
    return { processed = false, reason = "empty command" }
  end
  
  local command = table.remove(args, 1):lower()
  
  -- Return the command for processing
  return {
    processed = true,
    command = command,
    args = args,
    guild_id = guild_id,
    channel_id = message.channel.id,
    author_id = message.author.id
  }
end

-- Event handlers
return {
  message = on_message
}