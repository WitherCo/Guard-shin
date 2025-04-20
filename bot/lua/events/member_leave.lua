--
-- Guard-shin Discord Bot - Lua Member Leave Event Handler
-- A Wick clone implementing Lua member leave event handling
--

local json = require("cjson")

-- Configuration
local config = {
  farewell_messages = {}, -- Guild-specific farewell messages
  logging_settings = {} -- Guild-specific logging settings
}

-- Process member leave event
local function on_member_leave(event_data)
  -- This is called when a member leave event is passed from Python
  
  local member = event_data.member
  local guild = event_data.guild
  local guild_id = guild and guild.id
  
  if not guild_id then
    return { processed = false, reason = "no guild data" }
  end
  
  local result = {
    processed = true,
    actions = {},
    guild_id = guild_id,
    member_id = member.id
  }
  
  -- Check farewell message settings
  local farewell = config.farewell_messages[guild_id]
  if farewell and farewell.enabled then
    -- Add farewell message action
    table.insert(result.actions, {
      type = "farewell_message",
      channel_id = farewell.channel_id,
      message = farewell.message:gsub("{user}", member.username)
        :gsub("{server}", guild.name)
        :gsub("{count}", tostring((guild.member_count or 0) - 1))
    })
  end
  
  -- Check if this was a raid-related leave (handled by Python)
  -- Just a placeholder for future raid analysis algorithms
  if event_data.raid_related then
    table.insert(result.actions, {
      type = "raid_leave_tracking",
      status = "tracked"
    })
  end
  
  -- Check if user had active infractions
  if event_data.active_infractions and #event_data.active_infractions > 0 then
    -- Note the leave in the infraction system
    table.insert(result.actions, {
      type = "infraction_update",
      status = "left_server",
      infractions = event_data.active_infractions
    })
  end
  
  -- Add to logs if logging is enabled
  local logging = config.logging_settings[guild_id]
  if logging and logging.enabled and logging.leave_logs then
    table.insert(result.actions, {
      type = "log_event",
      channel_id = logging.channel_id,
      log_type = "member_leave",
      details = {
        username = member.username,
        id = member.id,
        joined_at = member.joined_at,
        roles = member.roles or {},
        time_in_server = event_data.time_in_server or "unknown"
      }
    })
  end
  
  return result
end

-- Process member ban event
local function on_member_ban(event_data)
  -- This is called when a member ban event is passed from Python
  
  local user = event_data.user
  local guild = event_data.guild
  local guild_id = guild and guild.id
  local moderator = event_data.moderator
  local reason = event_data.reason or "No reason provided"
  
  if not guild_id then
    return { processed = false, reason = "no guild data" }
  end
  
  local result = {
    processed = true,
    actions = {},
    guild_id = guild_id,
    user_id = user.id
  }
  
  -- Add to logs if logging is enabled
  local logging = config.logging_settings[guild_id]
  if logging and logging.enabled and logging.ban_logs then
    table.insert(result.actions, {
      type = "log_event",
      channel_id = logging.channel_id,
      log_type = "member_ban",
      details = {
        username = user.username,
        id = user.id,
        moderator = moderator and moderator.username or "Unknown",
        moderator_id = moderator and moderator.id or nil,
        reason = reason
      }
    })
  end
  
  -- Create infraction record if not already created
  if not event_data.infraction_created then
    table.insert(result.actions, {
      type = "create_infraction",
      user_id = user.id,
      guild_id = guild_id,
      moderator_id = moderator and moderator.id or nil,
      type = "ban",
      reason = reason,
      expires_at = event_data.expires_at -- For temporary bans
    })
  end
  
  return result
end

-- Process member unban event
local function on_member_unban(event_data)
  -- This is called when a member unban event is passed from Python
  
  local user = event_data.user
  local guild = event_data.guild
  local guild_id = guild and guild.id
  local moderator = event_data.moderator
  local reason = event_data.reason or "No reason provided"
  
  if not guild_id then
    return { processed = false, reason = "no guild data" }
  end
  
  local result = {
    processed = true,
    actions = {},
    guild_id = guild_id,
    user_id = user.id
  }
  
  -- Add to logs if logging is enabled
  local logging = config.logging_settings[guild_id]
  if logging and logging.enabled and logging.ban_logs then
    table.insert(result.actions, {
      type = "log_event",
      channel_id = logging.channel_id,
      log_type = "member_unban",
      details = {
        username = user.username,
        id = user.id,
        moderator = moderator and moderator.username or "Unknown",
        moderator_id = moderator and moderator.id or nil,
        reason = reason
      }
    })
  end
  
  -- Update infraction records
  table.insert(result.actions, {
    type = "update_infractions",
    user_id = user.id,
    guild_id = guild_id,
    update = {
      type = "ban",
      active = false,
      resolved_by = moderator and moderator.id or nil,
      resolved_reason = reason
    }
  })
  
  return result
end

-- Event handlers
return {
  member_leave = on_member_leave,
  member_ban = on_member_ban,
  member_unban = on_member_unban
}