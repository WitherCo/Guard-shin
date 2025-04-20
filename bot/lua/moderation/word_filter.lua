-- Word Filter Module for Guard-shin (Wick Clone)
-- This module handles word filtering functionality in Lua

local WordFilter = {}

-- Configuration
local config = {
    default_action = "warn",  -- warn, delete, mute, kick, ban
    default_warn_threshold = 3,  -- Warnings before stronger action
    case_sensitive = false,  -- Should matching be case sensitive
    use_pattern_matching = true,  -- Use Lua pattern matching instead of exact matches
    filter_evasion_check = true  -- Check for attempts to evade filter (e.g., substituting characters)
}

-- Filter categories
local categories = {
    profanity = {
        enabled = true,
        action = "warn",
        warn_threshold = 3,
        patterns = {
            "badword1", "badword2", "badword3", "offensive1", "offensive2"
        }
    },
    discrimination = {
        enabled = true,
        action = "mute",
        warn_threshold = 2,
        patterns = {
            "discriminatory1", "discriminatory2", "discriminatory3"
        }
    },
    threats = {
        enabled = true,
        action = "ban",
        warn_threshold = 1,
        patterns = {
            "threat1", "threat2", "threat3"
        }
    }
}

-- User warning tracking
local user_warnings = {}  -- guild_id -> user_id -> category -> count

-- Evasion characters map (for filter evasion detection)
local evasion_map = {
    ["0"] = "o",
    ["1"] = "i",
    ["3"] = "e",
    ["4"] = "a",
    ["5"] = "s",
    ["$"] = "s",
    ["@"] = "a",
    ["+"] = "t"
    -- Add more substitutions as needed
}

-- Normalize text to detect filter evasion attempts
local function normalize_text(text)
    if not config.filter_evasion_check then
        return text
    end
    
    local normalized = text:lower()
    
    -- Replace common substitution characters
    for char, replacement in pairs(evasion_map) do
        normalized = normalized:gsub(char, replacement)
    end
    
    -- Remove repeated characters (e.g., "baaad" -> "bad")
    normalized = normalized:gsub("([%a])%1+", "%1")
    
    -- Remove non-alphanumeric characters
    normalized = normalized:gsub("[^%a%d ]", "")
    
    return normalized
end

-- Check if a message contains filtered words
function WordFilter.check_message(guild_id, user_id, message)
    local content = message
    local results = {}
    
    -- Normalize text for checking
    local check_text = config.case_sensitive and content or content:lower()
    local normalized_text = normalize_text(check_text)
    
    -- Check against each category
    for category, settings in pairs(categories) do
        if settings.enabled then
            local matches = {}
            
            for _, pattern in ipairs(settings.patterns) do
                local check_pattern = config.case_sensitive and pattern or pattern:lower()
                
                -- Check in original text
                if config.use_pattern_matching then
                    if check_text:match(check_pattern) then
                        table.insert(matches, pattern)
                    end
                else
                    if check_text:find(check_pattern, 1, true) then
                        table.insert(matches, pattern)
                    end
                end
                
                -- Also check in normalized text if evasion detection is enabled
                if config.filter_evasion_check and normalized_text ~= check_text then
                    if config.use_pattern_matching then
                        if normalized_text:match(check_pattern) then
                            table.insert(matches, pattern .. " (evasion attempt)")
                        end
                    else
                        if normalized_text:find(check_pattern, 1, true) then
                            table.insert(matches, pattern .. " (evasion attempt)")
                        end
                    end
                end
            end
            
            if #matches > 0 then
                table.insert(results, {
                    category = category,
                    action = settings.action,
                    warn_threshold = settings.warn_threshold,
                    matches = matches
                })
            end
        end
    end
    
    return results
end

-- Process a warning for a user
function WordFilter.add_warning(guild_id, user_id, category)
    -- Initialize tables if needed
    user_warnings[guild_id] = user_warnings[guild_id] or {}
    user_warnings[guild_id][user_id] = user_warnings[guild_id][user_id] or {}
    user_warnings[guild_id][user_id][category] = (user_warnings[guild_id][user_id][category] or 0) + 1
    
    return user_warnings[guild_id][user_id][category]
end

-- Get warning count for a user
function WordFilter.get_warnings(guild_id, user_id, category)
    if not user_warnings[guild_id] or not user_warnings[guild_id][user_id] then
        return 0
    end
    
    return user_warnings[guild_id][user_id][category] or 0
end

-- Reset warnings for a user
function WordFilter.reset_warnings(guild_id, user_id, category)
    if user_warnings[guild_id] and user_warnings[guild_id][user_id] then
        if category then
            user_warnings[guild_id][user_id][category] = 0
        else
            user_warnings[guild_id][user_id] = {}
        end
    end
end

-- Add a filter pattern
function WordFilter.add_filter(category, pattern)
    if categories[category] then
        table.insert(categories[category].patterns, pattern)
        return true
    end
    return false
end

-- Remove a filter pattern
function WordFilter.remove_filter(category, pattern)
    if categories[category] then
        for i, p in ipairs(categories[category].patterns) do
            if p == pattern then
                table.remove(categories[category].patterns, i)
                return true
            end
        end
    end
    return false
end

-- Get all filter patterns
function WordFilter.get_filters()
    local result = {}
    for category, settings in pairs(categories) do
        result[category] = {
            enabled = settings.enabled,
            action = settings.action,
            patterns = settings.patterns
        }
    end
    return result
end

-- Enable or disable a category
function WordFilter.set_category_enabled(category, enabled)
    if categories[category] then
        categories[category].enabled = enabled
        return true
    end
    return false
end

-- Set action for a category
function WordFilter.set_category_action(category, action)
    local valid_actions = {warn = true, delete = true, mute = true, kick = true, ban = true}
    
    if categories[category] and valid_actions[action] then
        categories[category].action = action
        return true
    end
    return false
end

-- Export the module
return WordFilter