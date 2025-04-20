--
-- Guard-shin Discord Bot - Lua Member Join Event Handler
-- A Wick clone implementing Lua member join event handling
--

local json = require("cjson")

-- Configuration
local config = {
  welcome_messages = {}, -- Guild-specific welcome messages
  verification_settings = {}, -- Guild-specific verification settings
  raid_protection = {} -- Guild-specific raid protection settings
}

-- Process member join event
local function on_member_join(event_data)
  -- This is called when a member join event is passed from Python
  
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
  
  -- Check raid protection settings
  local raid_settings = config.raid_protection[guild_id]
  if raid_settings and raid_settings.enabled then
    -- Raid protection is handled primarily by Python, but we can add custom logic here
    -- This is just a placeholder for future raid detection algorithms
    table.insert(result.actions, {
      type = "raid_check",
      status = "passed" -- Assuming Python handles actual raid detection
    })
  end
  
  -- Check verification settings
  local verify_settings = config.verification_settings[guild_id]
  if verify_settings and verify_settings.enabled then
    -- Add verification action if needed
    table.insert(result.actions, {
      type = "verification",
      required = true,
      method = verify_settings.method or "reaction",
      channel_id = verify_settings.channel_id
    })
  end
  
  -- Check welcome message settings
  local welcome = config.welcome_messages[guild_id]
  if welcome and welcome.enabled then
    -- Add welcome message action
    table.insert(result.actions, {
      type = "welcome_message",
      channel_id = welcome.channel_id,
      message = welcome.message:gsub("{user}", "<@" .. member.id .. ">")
        :gsub("{server}", guild.name)
        :gsub("{count}", tostring(guild.member_count or "many"))
    })
  end
  
  -- Check for auto-role assignment
  if verify_settings and verify_settings.auto_role_id and not verify_settings.enabled then
    -- If verification is disabled but auto-role is set, add role assignment action
    table.insert(result.actions, {
      type = "add_role",
      role_id = verify_settings.auto_role_id
    })
  end
  
  return result
end

-- Event handlers
return {
  member_join = on_member_join
}