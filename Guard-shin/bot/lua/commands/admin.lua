--
-- Guard-shin Discord Bot - Lua Admin Commands
-- A Wick clone implementing Lua admin commands
--

local json = require("cjson")
local http = require("socket.http")
local ltn12 = require("ltn12")

-- Configuration
local config = {
  modules = {
    "automod",
    "verification",
    "raidprotection",
    "logging"
  },
  default_prefix = ">",
  default_config_path = "bot/config"
}

-- Helper function to serialize table to JSON
local function serialize(data)
  local success, result = pcall(json.encode, data)
  if success then
    return result
  else
    return "{}"
  end
end

-- Helper function to deserialize JSON to table
local function deserialize(json_str)
  if not json_str or json_str == "" then
    return {}
  end
  
  local success, result = pcall(json.decode, json_str)
  if success then
    return result
  else
    return {}
  end
end

-- Commands

-- Setup command - initial server setup
local function setup(args, message, guild)
  return {
    success = true,
    action = "setup",
    guild_id = guild.id,
    message = "Setting up Guard-shin for your server with recommended settings..."
  }
end

-- Module command - enable/disable modules
local function module(args, message, guild)
  local subcommand = args[1] -- enable, disable, status
  local module_name = args[2]
  local channel_id = args[3]
  
  if not subcommand then
    return {
      success = false,
      message = "Please specify a subcommand: enable, disable, or status."
    }
  end
  
  if subcommand == "status" then
    return {
      success = true,
      action = "modulestatus",
      module = module_name, -- Optional specific module
      guild_id = guild.id
    }
  end
  
  if not module_name then
    return {
      success = false,
      message = "Please specify a module: " .. table.concat(config.modules, ", ")
    }
  end
  
  -- Check if module exists
  local valid_module = false
  for _, name in ipairs(config.modules) do
    if name == module_name:lower() then
      valid_module = true
      break
    end
  end
  
  if not valid_module then
    return {
      success = false,
      message = "Invalid module. Available modules: " .. table.concat(config.modules, ", ")
    }
  end
  
  if subcommand == "enable" then
    return {
      success = true,
      action = "enablemodule",
      module = module_name,
      channel_id = channel_id,
      guild_id = guild.id,
      message = string.format("Module `%s` has been enabled", module_name)
    }
  elseif subcommand == "disable" then
    return {
      success = true,
      action = "disablemodule",
      module = module_name,
      guild_id = guild.id,
      message = string.format("Module `%s` has been disabled", module_name)
    }
  else
    return {
      success = false,
      message = "Invalid subcommand. Use enable, disable, or status."
    }
  end
end

-- Logchannel command - set log channel
local function logchannel(args, message, guild)
  local channel_id = args[1]
  
  if not channel_id then
    return {
      success = false,
      message = "Please specify a channel ID or mention."
    }
  end
  
  return {
    success = true,
    action = "setlogchannel",
    channel_id = channel_id,
    guild_id = guild.id,
    message = string.format("Log channel has been set to <#%s>", channel_id)
  }
end

-- AutoMod configuration commands
local function automod(args, message, guild)
  local subcommand = args[1] -- filters, profanity, links, spam, emoji, etc.
  local action = args[2] -- enable, disable, add, remove, etc.
  local value = args[3] -- specific value if needed
  
  if not subcommand then
    return {
      success = true,
      action = "automodstatus",
      guild_id = guild.id
    }
  end
  
  -- Add/remove profanity filters
  if subcommand == "profanity" then
    if action == "add" and value then
      return {
        success = true,
        action = "automod_profanity_add",
        word = value,
        guild_id = guild.id,
        message = string.format("Added `%s` to profanity filter", value)
      }
    elseif action == "remove" and value then
      return {
        success = true,
        action = "automod_profanity_remove",
        word = value,
        guild_id = guild.id,
        message = string.format("Removed `%s` from profanity filter", value)
      }
    elseif action == "enable" then
      return {
        success = true,
        action = "automod_profanity_enable",
        guild_id = guild.id,
        message = "Profanity filter enabled"
      }
    elseif action == "disable" then
      return {
        success = true,
        action = "automod_profanity_disable",
        guild_id = guild.id,
        message = "Profanity filter disabled"
      }
    else
      return {
        success = true,
        action = "automod_profanity_status",
        guild_id = guild.id
      }
    end
  end
  
  -- Configure link filter
  if subcommand == "links" then
    if action == "whitelist" and value then
      return {
        success = true,
        action = "automod_links_whitelist",
        domain = value,
        guild_id = guild.id,
        message = string.format("Added `%s` to link whitelist", value)
      }
    elseif action == "blacklist" and value then
      return {
        success = true,
        action = "automod_links_blacklist",
        domain = value,
        guild_id = guild.id,
        message = string.format("Added `%s` to link blacklist", value)
      }
    elseif action == "enable" then
      return {
        success = true,
        action = "automod_links_enable",
        guild_id = guild.id,
        message = "Link filter enabled"
      }
    elseif action == "disable" then
      return {
        success = true,
        action = "automod_links_disable",
        guild_id = guild.id,
        message = "Link filter disabled"
      }
    else
      return {
        success = true,
        action = "automod_links_status",
        guild_id = guild.id
      }
    end
  end
  
  -- Configure spam protection
  if subcommand == "spam" then
    if action == "threshold" and value then
      local threshold = tonumber(value)
      if not threshold or threshold < 1 then
        return {
          success = false,
          message = "Please provide a valid threshold (minimum 1)."
        }
      end
      
      return {
        success = true,
        action = "automod_spam_threshold",
        threshold = threshold,
        guild_id = guild.id,
        message = string.format("Spam threshold set to %d messages", threshold)
      }
    elseif action == "enable" then
      return {
        success = true,
        action = "automod_spam_enable",
        guild_id = guild.id,
        message = "Spam protection enabled"
      }
    elseif action == "disable" then
      return {
        success = true,
        action = "automod_spam_disable",
        guild_id = guild.id,
        message = "Spam protection disabled"
      }
    else
      return {
        success = true,
        action = "automod_spam_status",
        guild_id = guild.id
      }
    end
  end
  
  -- General automod control
  if subcommand == "enable" then
    return {
      success = true,
      action = "automod_enable",
      guild_id = guild.id,
      message = "AutoMod has been enabled"
    }
  elseif subcommand == "disable" then
    return {
      success = true,
      action = "automod_disable",
      guild_id = guild.id,
      message = "AutoMod has been disabled"
    }
  end
  
  -- Default response for invalid commands
  return {
    success = false,
    message = "Invalid automod subcommand. Available subcommands: enable, disable, profanity, links, spam"
  }
end

-- Raid protection configuration
local function raidprotection(args, message, guild)
  local subcommand = args[1] -- threshold, action, status, etc.
  local value = args[2]
  
  if not subcommand then
    return {
      success = true,
      action = "raidprotection_status",
      guild_id = guild.id
    }
  end
  
  if subcommand == "threshold" and value then
    local threshold = tonumber(value)
    if not threshold or threshold < 1 then
      return {
        success = false,
        message = "Please provide a valid threshold (minimum 1)."
      }
    end
    
    return {
      success = true,
      action = "raidprotection_threshold",
      threshold = threshold,
      guild_id = guild.id,
      message = string.format("Raid protection threshold set to %d joins per minute", threshold)
    }
  elseif subcommand == "action" and value then
    if value ~= "lockdown" and value ~= "verification" and value ~= "kick" and value ~= "notify" then
      return {
        success = false,
        message = "Valid actions are: lockdown, verification, kick, notify"
      }
    end
    
    return {
      success = true,
      action = "raidprotection_action",
      raid_action = value,
      guild_id = guild.id,
      message = string.format("Raid protection action set to '%s'", value)
    }
  elseif subcommand == "enable" then
    return {
      success = true,
      action = "raidprotection_enable",
      guild_id = guild.id,
      message = "Raid protection enabled"
    }
  elseif subcommand == "disable" then
    return {
      success = true,
      action = "raidprotection_disable",
      guild_id = guild.id,
      message = "Raid protection disabled"
    }
  elseif subcommand == "status" then
    return {
      success = true,
      action = "raidprotection_status",
      guild_id = guild.id
    }
  else
    return {
      success = false,
      message = "Invalid raid protection subcommand. Available subcommands: threshold, action, enable, disable, status"
    }
  end
end

-- Verification configuration
local function verification(args, message, guild)
  local subcommand = args[1] -- setup, requirement, etc.
  local value = args[2]
  
  if not subcommand then
    return {
      success = true,
      action = "verification_status",
      guild_id = guild.id
    }
  end
  
  if subcommand == "setup" then
    local channel_id = value or message.channel.id
    
    return {
      success = true,
      action = "verification_setup",
      channel_id = channel_id,
      guild_id = guild.id,
      message = string.format("Verification system set up in <#%s>", channel_id)
    }
  elseif subcommand == "role" and value then
    return {
      success = true,
      action = "verification_role",
      role_id = value,
      guild_id = guild.id,
      message = string.format("Verification will assign role <@&%s>", value)
    }
  elseif subcommand == "type" and value then
    if value ~= "button" and value ~= "captcha" and value ~= "reaction" then
      return {
        success = false,
        message = "Valid verification types are: button, captcha, reaction"
      }
    end
    
    return {
      success = true,
      action = "verification_type",
      verification_type = value,
      guild_id = guild.id,
      message = string.format("Verification type set to '%s'", value)
    }
  elseif subcommand == "enable" then
    return {
      success = true,
      action = "verification_enable",
      guild_id = guild.id,
      message = "Verification system enabled"
    }
  elseif subcommand == "disable" then
    return {
      success = true,
      action = "verification_disable",
      guild_id = guild.id,
      message = "Verification system disabled"
    }
  else
    return {
      success = false,
      message = "Invalid verification subcommand. Available subcommands: setup, role, type, enable, disable"
    }
  end
end

-- Config command - manage bot configuration
local function config(args, message, guild)
  local subcommand = args[1] -- get, set, reset
  local setting = args[2]
  local value = args[3]
  
  if not subcommand then
    return {
      success = false,
      message = "Please specify a subcommand: get, set, or reset."
    }
  end
  
  if subcommand == "get" then
    if setting then
      return {
        success = true,
        action = "config_get",
        setting = setting,
        guild_id = guild.id
      }
    else
      return {
        success = true,
        action = "config_get_all",
        guild_id = guild.id
      }
    end
  elseif subcommand == "set" then
    if not setting or not value then
      return {
        success = false,
        message = "Please specify both a setting and a value."
      }
    end
    
    return {
      success = true,
      action = "config_set",
      setting = setting,
      value = value,
      guild_id = guild.id,
      message = string.format("Configuration for `%s` updated", setting)
    }
  elseif subcommand == "reset" then
    if setting then
      return {
        success = true,
        action = "config_reset",
        setting = setting,
        guild_id = guild.id,
        message = string.format("Configuration for `%s` reset to default", setting)
      }
    else
      return {
        success = true,
        action = "config_reset_all",
        guild_id = guild.id,
        message = "All configuration reset to defaults"
      }
    end
  else
    return {
      success = false,
      message = "Invalid subcommand. Use get, set, or reset."
    }
  end
end

-- Export the commands
return {
  setup = setup,
  module = module,
  logchannel = logchannel,
  automod = automod,
  raidprotection = raidprotection,
  verification = verification,
  config = config
}