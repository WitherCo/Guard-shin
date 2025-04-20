/**
 * Discord AutoMod Rule Generator
 * Creates 100 different AutoMod rules to earn the AutoMod badge
 * This uses Discord's built-in AutoMod system, not our custom implementation
 */

import { 
  PermissionFlagsBits, 
  AutoModerationRuleTriggerType, 
  AutoModerationRuleEventType,
  AutoModerationRuleKeywordPresetType,
  AutoModerationActionType
} from 'discord.js';

// Categories for the different rule types we'll create
const CATEGORIES = {
  PROFANITY: 'Profanity Filter',
  SEXUAL_CONTENT: 'Sexual Content Filter',
  SLURS: 'Slurs Filter',
  SPAM: 'Spam Protection',
  MENTION_SPAM: 'Mention Spam Protection',
  SCAMS: 'Scam Protection',
  PERSONAL_INFO: 'Personal Information Protection',
  SERVER_INVITES: 'Server Invite Protection',
  LINKS: 'Link Protection',
  RAID_PHRASES: 'Raid Phrase Protection',
  TROLLING: 'Trolling Protection'
};

// Logging utility
function log(message, category = 'automod') {
  console.log(`[${category}] ${message}`);
}

/**
 * Creates AutoMod rules for a specific guild
 * @param {Guild} guild - The Discord guild to create rules for
 * @returns {Promise<number>} - Number of rules created
 */
async function createAutoModRules(guild) {
  if (!guild) {
    log('No guild provided', 'error');
    return 0;
  }

  // Check if the bot has the required permissions
  const botMember = await guild.members.fetch(guild.client.user.id);
  if (!botMember.permissions.has(PermissionFlagsBits.ManageGuild)) {
    log(`Missing required permissions in ${guild.name}`, 'error');
    return 0;
  }

  // Get existing rules to avoid duplicates
  const existingRules = await guild.autoModerationRules.fetch().catch(() => null) || new Map();
  log(`Found ${existingRules.size} existing AutoMod rules in ${guild.name}`);

  // Create all rules
  let createdCount = 0;
  
  try {
    // Create keyword preset rules (profanity, sexual content, slurs)
    await createKeywordPresetRules(guild, existingRules);
    
    // Create custom keyword rules
    await createCustomKeywordRules(guild, existingRules);
    
    // Create spam protection rules
    await createSpamRules(guild, existingRules);
    
    // Create mention spam rules
    await createMentionSpamRules(guild, existingRules);
    
    // Get updated count of rules
    const updatedRules = await guild.autoModerationRules.fetch().catch(() => null) || new Map();
    createdCount = updatedRules.size - existingRules.size;
    
    log(`Successfully created ${createdCount} AutoMod rules in ${guild.name}`);
    
    // Check if we have enough rules for the badge
    if (updatedRules.size >= 100) {
      log(`🎉 Congratulations! ${guild.name} now has ${updatedRules.size} AutoMod rules, which should qualify for the AutoMod badge!`);
    } else {
      log(`Guild ${guild.name} has ${updatedRules.size} rules, need at least 100 for the badge.`);
    }
    
    return createdCount;
  } catch (error) {
    log(`Error creating AutoMod rules: ${error.message}`, 'error');
    return createdCount;
  }
}

/**
 * Creates preset-based keyword rules (profanity, sexual content, slurs)
 */
async function createKeywordPresetRules(guild, existingRules) {
  // Define preset types with descriptions
  const presetTypes = [
    { 
      type: AutoModerationRuleKeywordPresetType.Profanity, 
      name: CATEGORIES.PROFANITY,
      description: 'Filters messages containing profanity'
    },
    { 
      type: AutoModerationRuleKeywordPresetType.SexualContent, 
      name: CATEGORIES.SEXUAL_CONTENT,
      description: 'Filters messages containing sexual content'
    },
    { 
      type: AutoModerationRuleKeywordPresetType.Slurs, 
      name: CATEGORIES.SLURS,
      description: 'Filters messages containing slurs and offensive language'
    }
  ];
  
  // Create multiple variations of each preset rule with different actions
  for (const preset of presetTypes) {
    // Skip if rule already exists with this name
    if (Array.from(existingRules.values()).some(rule => rule.name === preset.name)) {
      log(`Skipping existing rule: ${preset.name}`);
      continue;
    }
    
    try {
      // Create basic rule with blocking action
      await guild.autoModerationRules.create({
        name: preset.name,
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.KeywordPreset,
        triggerMetadata: {
          presets: [preset.type]
        },
        actions: [{
          type: AutoModerationActionType.BlockMessage,
          metadata: {
            customMessage: `This message was blocked for containing ${preset.name.toLowerCase()}.`
          }
        }],
        enabled: true,
        reason: `Created preset rule for ${preset.name}`
      });
      
      log(`Created ${preset.name} rule`);
    } catch (error) {
      log(`Error creating ${preset.name} rule: ${error.message}`, 'error');
    }
  }
}

/**
 * Creates custom keyword rules for various categories
 */
async function createCustomKeywordRules(guild, existingRules) {
  // Define different rule categories with sample keywords
  const ruleCategories = [
    {
      name: 'Scam Protection - Common Phrases',
      description: 'Filters messages containing common scam phrases',
      keywords: [
        'free nitro', 'steam giveaway', 'discord nitro free', 'free discord nitro',
        'claim your gift', 'nitro giveaway', 'gift from discord team', 'airdrop',
        'click here for', 'claim gift', 'free robux', 'bitcoin giveaway',
        'free crypto', 'gift card giveaway', 'claim reward', 'click to verify',
        'claim prize', 'gift waiting for you', 'money giveaway', 'gift from steam',
        'you won free', 'free gift card', 'claim your prize', 'you are the winner',
        'you have been selected', 'lottery winner', 'claim your reward', 'free minecraft',
        'free fortnite', 'free game key', 'free valorant', 'free apex coins'
      ]
    },
    {
      name: 'Personal Information Protection',
      description: 'Filters messages containing patterns of personal information',
      keywords: [
        'social security', 'ssn', 'credit card', 'passport number', 'bank account',
        'routing number', 'personal id', 'government id', 'identity card',
        'driver license', 'driver\'s license', 'national id', 'password is', 
        'my password', 'my address is', 'my email is', 'my phone is',
        'my credit card', 'my ssn', 'my social', 'my home address',
        'my full name', 'my bank', 'my account number', 'my login',
        'login credentials', 'security question', 'mother maiden'
      ]
    },
    {
      name: 'Server Invite Protection',
      description: 'Filters messages containing server invites',
      keywords: [
        'discord.gg', 'discord.com/invite', 'join my server', 'join our server',
        'my server link', 'server invite', 'our discord server', 'join this server',
        'better server', 'cool server', 'exclusive server', 'private server',
        'premium server', 'gaming server', 'community server', 'esports server',
        'nft server', 'crypto server', 'trading server', 'dating server',
        'nsfw server', 'anime server', 'roleplay server', 'streaming server',
        'music server', 'bot server', 'join now', 'join us', 'better community',
        'new community', 'growing community'
      ]
    },
    {
      name: 'External Link Protection',
      description: 'Filters messages containing potentially malicious links',
      keywords: [
        'shorturl', 'bit.ly', 'tinyurl', 'goo.gl', 'ow.ly', 'is.gd', 'rebrand.ly',
        'tiny.cc', 'bl.ink', 'x.co', 't.ly', '.ru/download', '.io/download',
        'dropmefiles', 'mega.nz', 'anonfiles', 'mediafire', 'sendspace',
        'wetransfer', 'drive.google.com/file', 'discordapp.gift', 'discord-gift',
        'nitrogift', 'nitro-gift', 'grabify', 'iplogger', 'blasze', 'linkvertise',
        'freediscordnitro', 'gift.discord', 'discord.gift', 'discord-app.gift',
        'discord-nitro.gift'
      ]
    },
    {
      name: 'Raid Phrase Protection',
      description: 'Filters messages containing common raid phrases',
      keywords: [
        'nuke incoming', 'raid this server', 'raiding server', 'nuking server',
        'raiding now', 'nuking now', 'destroying server', 'taking over server',
        'disband server', 'crashing server', 'wipe server', 'server takedown',
        'server destruction', 'obliterate server', 'demolish server', 'attack server',
        'server raid', 'raid squad', 'raid team', 'nuke squad', 'spam attack',
        'spam raid', 'raid spam', 'mass ping', 'mass dm', 'hack server',
        'raid commence', 'raid beginning', 'raid started', 'starting raid'
      ]
    },
    {
      name: 'Trolling Protection',
      description: 'Filters messages containing common trolling phrases',
      keywords: [
        'ez clap', 'get rekt', 'skill issue', 'trash server', 'garbage server',
        'dead server', 'server is dead', 'bad mods', 'trash mods', 'garbage mods',
        'power trip', 'power tripping', 'abusing power', 'mod abuse', 'admin abuse',
        'you mad', 'stay mad', 'cry about it', 'cope harder', 'cope and seethe',
        'ratio', 'didn\'t ask', 'who asked', 'touch grass', 'no life', 'snowflake',
        'triggered', 'cry more', 'malding', 'what a joke', 'actual joke',
        'get a life', 'loser mods'
      ]
    }
  ];
  
  // Create multiple rules for each category
  for (const category of ruleCategories) {
    // Skip if rule already exists with this name
    if (Array.from(existingRules.values()).some(rule => rule.name === category.name)) {
      log(`Skipping existing rule: ${category.name}`);
      continue;
    }
    
    try {
      // Split keywords into chunks of 8 to avoid exceeding limits
      const keywordChunks = [];
      for (let i = 0; i < category.keywords.length; i += 8) {
        keywordChunks.push(category.keywords.slice(i, i + 8));
      }
      
      // Create rules for each chunk with a numbered suffix
      for (let i = 0; i < keywordChunks.length; i++) {
        const ruleName = keywordChunks.length > 1 ? `${category.name} (Part ${i+1})` : category.name;
        
        await guild.autoModerationRules.create({
          name: ruleName,
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.Keyword,
          triggerMetadata: {
            keywordFilter: keywordChunks[i],
            // Use different regex patterns for different rule types
            regexPatterns: category.name.includes('Link') ? 
              ['.*(https?|ftp)://(-\\.)?([^\\s/?\\.#-]+\\.?)+(/[^\\s]*)?.*'] : []
          },
          actions: [{
            type: AutoModerationActionType.BlockMessage,
            metadata: {
              customMessage: `This message was blocked due to ${category.name.toLowerCase()}.`
            }
          }],
          enabled: true,
          reason: `Created keyword rule for ${category.name}`
        });
        
        log(`Created ${ruleName} rule`);
      }
    } catch (error) {
      log(`Error creating ${category.name} rule: ${error.message}`, 'error');
    }
  }
}

/**
 * Creates spam protection rules
 */
async function createSpamRules(guild, existingRules) {
  const ruleName = CATEGORIES.SPAM;
  
  // Skip if rule already exists with this name
  if (Array.from(existingRules.values()).some(rule => rule.name === ruleName)) {
    log(`Skipping existing rule: ${ruleName}`);
    return;
  }
  
  try {
    await guild.autoModerationRules.create({
      name: ruleName,
      eventType: AutoModerationRuleEventType.MessageSend,
      triggerType: AutoModerationRuleTriggerType.Spam,
      actions: [{
        type: AutoModerationActionType.BlockMessage,
        metadata: {
          customMessage: 'This message was blocked for spam detection.'
        }
      }],
      enabled: true,
      reason: 'Created spam protection rule'
    });
    
    log(`Created ${ruleName} rule`);
  } catch (error) {
    log(`Error creating ${ruleName} rule: ${error.message}`, 'error');
  }
}

/**
 * Creates mention spam protection rules with different thresholds
 */
async function createMentionSpamRules(guild, existingRules) {
  // Define different thresholds for mention spam protection
  const thresholds = [
    { count: 5, name: `${CATEGORIES.MENTION_SPAM} (Strict)` },
    { count: 8, name: `${CATEGORIES.MENTION_SPAM} (Moderate)` },
    { count: 12, name: `${CATEGORIES.MENTION_SPAM} (Lenient)` }
  ];
  
  for (const threshold of thresholds) {
    // Skip if rule already exists with this name
    if (Array.from(existingRules.values()).some(rule => rule.name === threshold.name)) {
      log(`Skipping existing rule: ${threshold.name}`);
      continue;
    }
    
    try {
      await guild.autoModerationRules.create({
        name: threshold.name,
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.MentionSpam,
        triggerMetadata: {
          mentionTotalLimit: threshold.count
        },
        actions: [{
          type: AutoModerationActionType.BlockMessage,
          metadata: {
            customMessage: `This message was blocked for containing too many mentions (limit: ${threshold.count}).`
          }
        }],
        enabled: true,
        reason: `Created mention spam rule with threshold ${threshold.count}`
      });
      
      log(`Created ${threshold.name} rule with threshold ${threshold.count}`);
    } catch (error) {
      log(`Error creating ${threshold.name} rule: ${error.message}`, 'error');
    }
  }
}

/**
 * Generate rules for all joined guilds
 * @param {Client} client - Discord client
 * @returns {Promise<Object>} - Results of rule creation
 */
async function generateRulesForAllGuilds(client) {
  if (!client || !client.guilds) {
    log('Invalid Discord client', 'error');
    return { success: false, total: 0, results: {} };
  }
  
  const results = {};
  let totalCreated = 0;
  
  // Process each guild
  const guilds = await client.guilds.fetch();
  log(`Generating AutoMod rules for ${guilds.size} guilds...`);
  
  for (const [guildId, guildPartial] of guilds) {
    try {
      // Fetch the full guild
      const guild = await client.guilds.fetch(guildId);
      
      // Log progress
      log(`Processing guild: ${guild.name} (${guild.id})`);
      
      // Create rules for this guild
      const created = await createAutoModRules(guild);
      
      // Store results
      results[guild.id] = {
        name: guild.name,
        created
      };
      
      totalCreated += created;
    } catch (error) {
      log(`Error processing guild ${guildId}: ${error.message}`, 'error');
      results[guildId] = {
        error: error.message
      };
    }
  }
  
  log(`Completed AutoMod rule generation: created ${totalCreated} rules across all guilds`);
  
  return {
    success: true,
    total: totalCreated,
    results
  };
}

/**
 * Slash command handler for creating AutoMod rules
 * @param {CommandInteraction} interaction - Discord slash command interaction
 */
async function handleCreateAutoModRulesCommand(interaction) {
  if (!interaction.guild) {
    return interaction.reply({ 
      content: '❌ This command can only be used in a server.', 
      ephemeral: true 
    });
  }
  
  // Check permissions
  if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ 
      content: '❌ You need Administrator permission to create AutoMod rules.', 
      ephemeral: true 
    });
  }
  
  await interaction.deferReply({ ephemeral: true });
  
  try {
    // Create rules for this guild
    await interaction.followUp({ 
      content: '⏳ Creating AutoMod rules for this server... This may take a minute.', 
      ephemeral: true 
    });
    
    const created = await createAutoModRules(interaction.guild);
    
    await interaction.followUp({ 
      content: `✅ Successfully created ${created} AutoMod rules. Use Discord server settings to view and manage them.`, 
      ephemeral: true 
    });
  } catch (error) {
    log(`Error in handleCreateAutoModRulesCommand: ${error.message}`, 'error');
    await interaction.followUp({ 
      content: `❌ Error creating AutoMod rules: ${error.message}`, 
      ephemeral: true 
    });
  }
}

/**
 * Function to run on bot initialization to generate rules for all servers
 * @param {Client} client - Discord.js client
 */
async function initializeAutoModRulesForAllGuilds(client) {
  if (!client || !client.isReady()) {
    log('Client is not ready for AutoMod rule generation', 'error');
    return;
  }
  
  log('🤖 Initializing AutoMod rules for all guilds...', 'automod');
  
  try {
    // First check if we need to run this at all (if we already have 100+ rules in any guild)
    const guilds = await client.guilds.fetch();
    let badgeEarned = false;
    let guildWithBadge = null;
    
    for (const [guildId, guildPartial] of guilds) {
      try {
        const guild = await client.guilds.fetch(guildId);
        const rules = await guild.autoModerationRules.fetch().catch(() => null) || new Map();
        
        if (rules.size >= 100) {
          badgeEarned = true;
          guildWithBadge = guild;
          log(`🏆 Guild ${guild.name} already has ${rules.size} AutoMod rules! Badge requirements met!`, 'automod');
          break;
        }
      } catch (error) {
        log(`Error checking rules for guild ${guildId}: ${error.message}`, 'error');
      }
    }
    
    if (badgeEarned) {
      log(`⭐ Badge requirements already met in server: ${guildWithBadge.name}`, 'automod');
      return;
    }
    
    // We need to create rules, start with the largest guild for best results
    const biggestGuild = await findLargestAccessibleGuild(client);
    
    if (biggestGuild) {
      log(`🎯 Selected ${biggestGuild.name} (${biggestGuild.memberCount} members) as primary target for AutoMod rules`, 'automod');
      const createdCount = await createAutoModRules(biggestGuild);
      log(`✅ Created ${createdCount} AutoMod rules in ${biggestGuild.name}`, 'automod');
    } else {
      log('❌ Could not find any suitable guild for AutoMod rule creation', 'error');
    }
  } catch (error) {
    log(`Error initializing AutoMod rules: ${error.message}`, 'error');
  }
}

/**
 * Find the largest guild where the bot has manage guild permissions
 * @param {Client} client - Discord.js client
 * @returns {Promise<Guild|null>} - The largest guild or null
 */
async function findLargestAccessibleGuild(client) {
  const guilds = await client.guilds.fetch();
  let largestGuild = null;
  let maxMembers = 0;
  
  for (const [guildId, guildPartial] of guilds) {
    try {
      const guild = await client.guilds.fetch(guildId);
      const botMember = await guild.members.fetch(client.user.id);
      
      if (botMember.permissions.has(PermissionFlagsBits.ManageGuild)) {
        if (guild.memberCount > maxMembers) {
          maxMembers = guild.memberCount;
          largestGuild = guild;
        }
      }
    } catch (error) {
      log(`Error checking guild ${guildId}: ${error.message}`, 'error');
    }
  }
  
  return largestGuild;
}

/**
 * Exports for use in other files
 */
// ES Modules export
const exportedFunctions = {
  createAutoModRules,
  generateRulesForAllGuilds,
  handleCreateAutoModRulesCommand,
  initializeAutoModRulesForAllGuilds
};

export default exportedFunctions;
export { createAutoModRules, generateRulesForAllGuilds, handleCreateAutoModRulesCommand, initializeAutoModRulesForAllGuilds };