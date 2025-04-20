#!/usr/bin/env lua
--
-- Guard-shin Discord Bot - Lua Component
-- A Wick clone with Lua functionality working alongside Python
--

local json = require("cjson")
local http = require("socket.http")
local ltn12 = require("ltn12")
local socket = require("socket")

-- Configuration
local config = {
  -- Bot configuration
  prefix = ">",
  bot_name = "Guard-shin",
  version = "1.0.0",
  
  -- Communication with Python component
  ipc_file = "bot/ipc/commands.json",
  response_file = "bot/ipc/responses.json",
  
  -- Log file
  log_file = "bot/logs/lua_component.log"
}

-- Command modules
local commands = {}
local events = {}

-- Logger function
local function log(message, level)
  level = level or "INFO"
  local timestamp = os.date("%Y-%m-%d %H:%M:%S")
  local log_message = string.format("[%s] [%s] %s", timestamp, level, message)
  
  -- Print to console
  print(log_message)
  
  -- Write to log file
  local file = io.open(config.log_file, "a")
  if file then
    file:write(log_message .. "\n")
    file:close()
  end
end

-- Load command modules
local function load_commands()
  local command_files = {
    "bot/lua/commands/moderation.lua",
    "bot/lua/commands/utility.lua",
    "bot/lua/commands/fun.lua",
    "bot/lua/commands/admin.lua"
  }
  
  for _, file_path in ipairs(command_files) do
    local success, module = pcall(dofile, file_path)
    if success and type(module) == "table" then
      for cmd_name, cmd_func in pairs(module) do
        commands[cmd_name] = cmd_func
        log("Loaded command: " .. cmd_name)
      end
    else
      log("Failed to load module: " .. file_path, "ERROR")
    end
  end
  
  log("Loaded " .. #commands .. " commands")
end

-- Load event handlers
local function load_events()
  local event_files = {
    "bot/lua/events/message.lua",
    "bot/lua/events/member_join.lua",
    "bot/lua/events/member_leave.lua"
  }
  
  for _, file_path in ipairs(event_files) do
    local success, module = pcall(dofile, file_path)
    if success and type(module) == "table" then
      for event_name, event_func in pairs(module) do
        events[event_name] = event_func
        log("Loaded event handler: " .. event_name)
      end
    else
      log("Failed to load event module: " .. file_path, "ERROR")
    end
  end
end

-- Process commands from Python component
local function process_command(command_data)
  local cmd = command_data.command
  local args = command_data.args or {}
  local message = command_data.message or {}
  local guild = command_data.guild or {}
  
  if commands[cmd] then
    log("Executing command: " .. cmd)
    local success, result = pcall(commands[cmd], args, message, guild)
    
    if success then
      return {
        success = true,
        command = cmd,
        result = result
      }
    else
      log("Error executing command: " .. cmd .. " - " .. tostring(result), "ERROR")
      return {
        success = false,
        command = cmd,
        error = tostring(result)
      }
    end
  else
    return {
      success = false,
      command = cmd,
      error = "Command not found"
    }
  end
end

-- Process events from Python component
local function process_event(event_data)
  local event_type = event_data.event
  local event_args = event_data.data or {}
  
  if events[event_type] then
    log("Processing event: " .. event_type)
    local success, result = pcall(events[event_type], event_args)
    
    if success then
      return {
        success = true,
        event = event_type,
        result = result
      }
    else
      log("Error processing event: " .. event_type .. " - " .. tostring(result), "ERROR")
      return {
        success = false,
        event = event_type,
        error = tostring(result)
      }
    end
  else
    return {
      success = false,
      event = event_type,
      error = "Event handler not found"
    }
  end
end

-- Check for IPC commands from Python
local function check_ipc()
  local file = io.open(config.ipc_file, "r")
  if not file then
    return nil
  end
  
  local content = file:read("*all")
  file:close()
  
  -- Clear the file
  file = io.open(config.ipc_file, "w")
  file:close()
  
  if content and content ~= "" then
    local success, data = pcall(json.decode, content)
    if success then
      return data
    else
      log("Error parsing IPC data: " .. tostring(data), "ERROR")
    end
  end
  
  return nil
end

-- Write response to IPC file
local function write_response(response)
  local file = io.open(config.response_file, "w")
  if not file then
    log("Failed to open response file", "ERROR")
    return false
  end
  
  local success, encoded = pcall(json.encode, response)
  if not success then
    log("Failed to encode response: " .. tostring(encoded), "ERROR")
    file:close()
    return false
  end
  
  file:write(encoded)
  file:close()
  return true
end

-- IPC server using TCP socket
local function start_ipc_server()
  local server = assert(socket.bind("127.0.0.1", 7777))
  local timeout = 1 -- 1 second timeout
  server:settimeout(timeout)
  
  log("IPC server started on port 7777")
  
  while true do
    local client = server:accept()
    if client then
      client:settimeout(timeout)
      local request, err = client:receive()
      
      if request then
        local success, data = pcall(json.decode, request)
        if success then
          local response
          
          if data.type == "command" then
            response = process_command(data)
          elseif data.type == "event" then
            response = process_event(data)
          else
            response = {success = false, error = "Unknown request type"}
          end
          
          local response_json = json.encode(response)
          client:send(response_json .. "\n")
        else
          client:send(json.encode({success = false, error = "Invalid JSON"}) .. "\n")
        end
      end
      
      client:close()
    end
    
    -- Sleep to prevent CPU hogging
    socket.sleep(0.1)
  end
end

-- Main function
local function main()
  log("Starting Guard-shin Lua component...")
  
  -- Create necessary directories
  os.execute("mkdir -p bot/ipc")
  os.execute("mkdir -p bot/logs")
  os.execute("mkdir -p bot/lua/commands")
  os.execute("mkdir -p bot/lua/events")
  os.execute("mkdir -p bot/lua/moderation")
  
  -- Load commands and event handlers
  load_commands()
  load_events()
  
  -- Start IPC server
  start_ipc_server()
end

-- Start the bot
main()