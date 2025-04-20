import { 
  Client, 
  ApplicationCommandType, 
  ChatInputCommandInteraction,
  Guild,
  GuildMember,
  REST,
  Routes
} from 'discord.js';
import { log } from '../vite';
import { PREMIUM_ROLE_ID, PREMIUM_PLUS_ROLE_ID } from '../../shared/premium';
import slashCommands from '../../bot/commands/slashCommands';

/**
 * Sets up slash commands for the bot
 */
export function setupCommands(client: Client) {
  // Register application command handlers
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    
    try {
      await handleCommand(interaction);
    } catch (error) {
      log(`Error handling command: ${error}`, 'discord');
      
      // Respond to the user if we haven't already
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          content: 'There was an error executing this command!', 
          ephemeral: true 
        });
      } else {
        await interaction.reply({ 
          content: 'There was an error executing this command!', 
          ephemeral: true 
        });
      }
    }
  });
  
  // Register commands when the bot is ready
  client.once('ready', async () => {
    try {
      log('Registering application commands...', 'discord');
      
      // Convert our slashCommands to the format expected by Discord.js
      const commands = slashCommands.map(cmd => cmd.data.toJSON());
      
      // Add existing custom commands
      commands.push({
        name: 'add_premium',
        description: '[DEV] Adds premium status to a server',
        options: [
          {
            name: 'server_id',
            type: 3, // STRING type
            description: 'The ID of the Discord server to add premium to',
            required: true
          },
          {
            name: 'tier',
            type: 3, // STRING type
            description: 'Premium tier to assign',
            required: false,
            choices: [
              { name: 'Premium', value: 'premium' },
              { name: 'Premium Plus', value: 'premium_plus' }
            ]
          },
          {
            name: 'days',
            type: 4, // INTEGER type
            description: 'Number of days to grant premium for',
            required: false
          }
        ]
      });
      
      // Register the commands
      try {
        log('Registering application commands globally...', 'discord');
        
        // We'll need a different approach for global commands due to the Entry Point limitation
        log('Using individual command registration approach for global commands', 'discord');
        
        // First get all existing global commands
        const existingCommands = await client.application?.commands.fetch();
        log(`Found ${existingCommands?.size || 0} existing global commands`, 'discord');
        
        // Map of existing command names to avoid duplicates
        const existingCommandNames = new Map();
        existingCommands?.forEach(cmd => {
          existingCommandNames.set(cmd.name, cmd.id);
          log(`Existing command: ${cmd.name} (${cmd.id})`, 'discord');
        });
        
        // Register each new command individually
        for (const command of commands) {
          try {
            const commandName = command.name;
            
            // Skip if it's an entry point command - we'll preserve these
            if (commandName.includes('entry') || commandName.includes('entry-point')) {
              log(`Skipping entry point command: ${commandName}`, 'discord');
              continue;
            }
            
            // If command already exists, update it
            if (existingCommandNames.has(commandName)) {
              const commandId = existingCommandNames.get(commandName);
              log(`Updating existing command: ${commandName} (${commandId})`, 'discord');
              await client.application?.commands.edit(commandId, command);
            } else {
              // Otherwise create a new command
              log(`Creating new command: ${commandName}`, 'discord');
              await client.application?.commands.create(command);
            }
          } catch (cmdError) {
            log(`Error registering command ${command.name}: ${cmdError}`, 'discord');
          }
        }
        
        log('Global commands registered individually to avoid Entry Point issue', 'discord');
        
        log('Application commands registered successfully', 'discord');
        
        // Also register to the support server for immediate testing
        const SUPPORT_SERVER_ID = '1233495879223345172';
        const guild = client.guilds.cache.get(SUPPORT_SERVER_ID);
        
        if (guild) {
          await guild.commands.set(commands);
          log(`Commands also registered to test guild ${SUPPORT_SERVER_ID}`, 'discord');
        }
      } catch (error) {
        log(`Error registering global commands: ${error}`, 'discord');
        
        // Fallback to registering to a specific test guild
        try {
          log('Falling back to registering commands to test guild only...', 'discord');
          
          // Use the support server as the test guild
          const SUPPORT_SERVER_ID = '1233495879223345172';
          
          // Register to the support server for immediate testing
          const guild = client.guilds.cache.get(SUPPORT_SERVER_ID);
          
          if (guild) {
            await guild.commands.set(commands);
            log(`Commands registered to test guild ${SUPPORT_SERVER_ID}`, 'discord');
          } else {
            log(`Bot is not in test guild ${SUPPORT_SERVER_ID}`, 'discord');
          }
        } catch (guildError) {
          log(`Error registering guild commands: ${guildError}`, 'discord');
        }
      }
    } catch (error) {
      log(`Error registering commands: ${error}`, 'discord');
    }
  });
}

// Your support server ID and premium server cache
const SUPPORT_SERVER_ID = '1233495879223345172';  // Your support server ID
const PREMIUM_SERVERS = new Set<string>();  // Will hold IDs of premium servers
// Note: PREMIUM_ROLE_ID and PREMIUM_PLUS_ROLE_ID are imported from '../../shared/premium'

/**
 * Checks if a guild has premium subscription
 */
function isPremium(guild: Guild | null): boolean {
  if (!guild) return false;
  
  // Check our premium server cache first
  if (PREMIUM_SERVERS.has(guild.id)) {
    return true;
  }
  
  // Check if this is the support server (where roles are applied)
  if (guild.id === SUPPORT_SERVER_ID) {
    // Get the bot member to check its roles
    const botMember = guild.members.cache.get(guild.client.user?.id || '');
    if (!botMember) return false;
    
    // If bot has premium roles in support server, it's premium
    return botMember.roles.cache.has(PREMIUM_ROLE_ID) || 
           botMember.roles.cache.has(PREMIUM_PLUS_ROLE_ID);
  }
  
  // For other servers, needs to be manually added to premium list
  // This would typically be done through a database
  return false;
}

/**
 * Checks if a guild has premium plus subscription
 */
function isPremiumPlus(guild: Guild | null): boolean {
  if (!guild) return false;
  
  // Check if this is the support server (where roles are applied)
  if (guild.id === SUPPORT_SERVER_ID) {
    // Get the bot member to check its roles
    const botMember = guild.members.cache.get(guild.client.user?.id || '');
    if (!botMember) return false;
    
    // If bot has premium plus role in support server, it's premium plus
    return botMember.roles.cache.has(PREMIUM_PLUS_ROLE_ID);
  }
  
  // For other servers, check if it's in our premium plus list
  // This would typically be done through a database
  return false;
}

/**
 * Adds a server to the premium servers list (temporary runtime storage)
 */
function addPremiumServer(serverId: string, isPremiumPlus = false): void {
  PREMIUM_SERVERS.add(serverId);
  log(`Added server ${serverId} to premium servers list`, 'discord');
}

/**
 * Handles command interactions
 */
async function handleCommand(interaction: ChatInputCommandInteraction) {
  const { commandName } = interaction;
  
  // First try to find the command in our new slash commands
  const slashCommand = slashCommands.find(cmd => cmd.data.name === commandName);
  if (slashCommand) {
    try {
      // Check if premium required
      if (slashCommand.premiumRequired) {
        const hasPremium = isPremium(interaction.guild);
        if (!hasPremium) {
          const premiumEmbed = {
            title: '✨ Premium Feature',
            description: 'This command requires Guard-shin Premium.',
            color: 0xF4D03F,
            fields: [
              {
                name: 'How to Get Premium',
                value: 'Join our [support server](https://discord.gg/g3rFbaW6gw) to purchase premium.'
              }
            ],
            footer: {
              text: 'Unlock advanced features with Guard-shin Premium!'
            }
          };
          
          return await interaction.reply({ embeds: [premiumEmbed], ephemeral: true });
        }
      }
      
      // Check if admin only
      if (slashCommand.adminOnly && !interaction.memberPermissions?.has('Administrator')) {
        return await interaction.reply({ 
          content: '❌ This command requires Administrator permission.', 
          ephemeral: true 
        });
      }
      
      // Execute the command
      await slashCommand.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${commandName} command:`, error);
      await interaction.reply({ 
        content: 'There was an error while executing this command!', 
        ephemeral: true 
      });
    }
    return;
  }
  
  // Fall back to the old command handler for legacy commands
  switch (commandName) {
    case 'ping':
      await interaction.reply({ content: 'Pong! 🏓', ephemeral: true });
      break;
      
    case 'info':
      const infoGuild = interaction.guild;
      if (!infoGuild) {
        await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
        return;
      }
      
      await interaction.reply({
        embeds: [{
          title: `${infoGuild.name} Information`,
          description: 'Server information and statistics',
          fields: [
            { name: 'Members', value: `${infoGuild.memberCount}`, inline: true },
            { name: 'Created At', value: `<t:${Math.floor(infoGuild.createdTimestamp / 1000)}:R>`, inline: true },
            { name: 'Owner', value: `<@${infoGuild.ownerId}>`, inline: true },
            { name: 'Boost Level', value: `${infoGuild.premiumTier}`, inline: true },
            { name: 'Boost Count', value: `${infoGuild.premiumSubscriptionCount || 0}`, inline: true },
          ],
          thumbnail: { url: infoGuild.iconURL() || '' },
          color: 0x5865F2,
          footer: { text: `Server ID: ${infoGuild.id}` }
        }]
      });
      break;
      
    case 'ban':
      if (!interaction.memberPermissions?.has('BanMembers')) {
        await interaction.reply({ content: 'You don\'t have permission to use this command!', ephemeral: true });
        return;
      }
      
      const userToBan = interaction.options.getUser('user');
      const banReason = interaction.options.getString('reason') || 'No reason provided';
      
      if (!userToBan) {
        await interaction.reply({ content: 'Please specify a user to ban!', ephemeral: true });
        return;
      }
      
      await interaction.deferReply({ ephemeral: true });
      
      try {
        await interaction.guild?.members.ban(userToBan, { reason: banReason });
        await interaction.followUp({ content: `Successfully banned ${userToBan.tag} (ID: ${userToBan.id})`, ephemeral: true });
        
        // For demo purposes, we'll log this to the console
        log(`[Ban] User ${userToBan.tag} (${userToBan.id}) was banned by ${interaction.user.tag} (${interaction.user.id}) for: ${banReason}`, 'discord');
        
        // In a real implementation, you would:
        // 1. Record this in a database
        // 2. Potentially log to a logging channel
        // 3. Update dashboard infractions
      } catch (error) {
        await interaction.followUp({ 
          content: `Failed to ban ${userToBan.tag}. Error: ${error}`, 
          ephemeral: true 
        });
      }
      break;
      
    case 'warn':
      if (!interaction.memberPermissions?.has('ModerateMembers')) {
        await interaction.reply({ content: 'You don\'t have permission to use this command!', ephemeral: true });
        return;
      }
      
      const userToWarn = interaction.options.getUser('user');
      const warnReason = interaction.options.getString('reason') || 'No reason provided';
      
      if (!userToWarn) {
        await interaction.reply({ content: 'Please specify a user to warn!', ephemeral: true });
        return;
      }
      
      await interaction.deferReply({ ephemeral: true });
      
      try {
        // For demo purposes, we'll just log this
        log(`[Warn] User ${userToWarn.tag} (${userToWarn.id}) was warned by ${interaction.user.tag} (${interaction.user.id}) for: ${warnReason}`, 'discord');
        
        await interaction.followUp({ 
          content: `Successfully warned ${userToWarn.tag} (ID: ${userToWarn.id}) for: ${warnReason}`, 
          ephemeral: true 
        });
        
        // In a real implementation, you would:
        // 1. Record this in a database
        // 2. Potentially log to a logging channel
        // 3. Update dashboard infractions
        // 4. DM the user about the warning
      } catch (error) {
        await interaction.followUp({ 
          content: `Failed to warn ${userToWarn.tag}. Error: ${error}`, 
          ephemeral: true 
        });
      }
      break;
      
    case 'infractions':
      if (!interaction.memberPermissions?.has('ModerateMembers')) {
        await interaction.reply({ content: 'You don\'t have permission to use this command!', ephemeral: true });
        return;
      }
      
      const userToCheck = interaction.options.getUser('user');
      
      if (!userToCheck) {
        await interaction.reply({ content: 'Please specify a user to check!', ephemeral: true });
        return;
      }
      
      await interaction.deferReply({ ephemeral: true });
      
      try {
        // For demo purposes, we'll return mock data
        // In a real implementation, you would fetch from your database
        await interaction.followUp({ 
          embeds: [{
            title: `Infractions for ${userToCheck.tag}`,
            description: `User ID: ${userToCheck.id}`,
            fields: [
              { 
                name: 'Warning', 
                value: `Issued by: <@${interaction.user.id}>\nReason: Spamming in channels\nDate: <t:${Math.floor((Date.now() - 3600000) / 1000)}:R>`,
                inline: false 
              },
              { 
                name: 'Timeout', 
                value: `Issued by: <@${interaction.user.id}>\nReason: Inappropriate language\nDate: <t:${Math.floor((Date.now() - 86400000) / 1000)}:R>`,
                inline: false 
              }
            ],
            color: 0xFFCC00,
            thumbnail: { url: userToCheck.displayAvatarURL() }
          }],
          ephemeral: true 
        });
      } catch (error) {
        await interaction.followUp({ 
          content: `Failed to fetch infractions for ${userToCheck.tag}. Error: ${error}`, 
          ephemeral: true 
        });
      }
      break;
      
    case 'premium_status':
      const premiumGuild = interaction.guild;
      if (!premiumGuild) {
        await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
        return;
      }
      
      const hasPremium = isPremium(premiumGuild);
      const hasPremiumPlus = isPremiumPlus(premiumGuild);
      
      let statusMessage;
      let color;
      
      if (hasPremiumPlus) {
        statusMessage = '⭐⭐ **Premium Plus Activated**\nThis server has all premium features unlocked!';
        color = 0xFFA500; // Gold color
      } else if (hasPremium) {
        statusMessage = '⭐ **Premium Activated**\nThis server has premium features unlocked!';
        color = 0x00BFFF; // Blue color
      } else {
        statusMessage = '❌ **No Premium Subscription**\nThis server is using the free plan.';
        color = 0x808080; // Gray color
      }
      
      await interaction.reply({
        embeds: [{
          title: `Premium Status for ${premiumGuild.name}`,
          description: statusMessage,
          fields: [
            { 
              name: 'Subscription Tier', 
              value: hasPremiumPlus ? 'Premium Plus' : (hasPremium ? 'Premium' : 'Free'), 
              inline: true 
            },
            { 
              name: 'Upgrade', 
              value: '[View Pricing](https://witherco.org/premium)', 
              inline: true 
            }
          ],
          color: color,
          footer: { text: 'For support, contact our team at support@witherco.org' }
        }]
      });
      break;
      
    case 'anti_alt':
      if (!interaction.memberPermissions?.has('Administrator')) {
        await interaction.reply({ content: 'You need Administrator permission to use this command!', ephemeral: true });
        return;
      }
      
      const altGuild = interaction.guild;
      if (!altGuild) {
        await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
        return;
      }
      
      // Check for premium status
      if (!isPremium(altGuild)) {
        await interaction.reply({
          embeds: [{
            title: '⭐ Premium Required',
            description: 'The Anti-Alt command requires a premium subscription.',
            fields: [
              { 
                name: 'How to Upgrade', 
                value: 'Visit our dashboard to upgrade your server and unlock this feature.', 
                inline: false 
              },
              { 
                name: 'Premium Benefits', 
                value: '• Anti-alt protection\n• Advanced raid detection\n• Custom auto-moderation\n• And much more!', 
                inline: false 
              }
            ],
            color: 0xFF5555,
            footer: { text: "Visit https://witherco.org/premium to upgrade" }
          }]
        });
        return;
      }
      
      const minAge = interaction.options.getInteger('min_age');
      const action = interaction.options.getString('action');
      
      if (!minAge || !action) {
        await interaction.reply({ content: 'Please provide all required parameters!', ephemeral: true });
        return;
      }
      
      if (minAge < 1 || minAge > 90) {
        await interaction.reply({ content: 'Minimum account age must be between 1 and 90 days!', ephemeral: true });
        return;
      }
      
      // Implementation would go here
      await interaction.reply({
        embeds: [{
          title: '✅ Anti-Alt Protection Configured',
          description: 'Your server is now protected against alt accounts.',
          fields: [
            { name: 'Minimum Account Age', value: `${minAge} days`, inline: true },
            { name: 'Action on Detection', value: action.charAt(0).toUpperCase() + action.slice(1), inline: true }
          ],
          color: 0x55FF55
        }]
      });
      break;
      
    case 'advanced_raid':
      if (!interaction.memberPermissions?.has('Administrator')) {
        await interaction.reply({ content: 'You need Administrator permission to use this command!', ephemeral: true });
        return;
      }
      
      const raidGuild = interaction.guild;
      if (!raidGuild) {
        await interaction.reply({ content: 'This command can only be used in a server!', ephemeral: true });
        return;
      }
      
      // Check for premium plus status
      if (!isPremiumPlus(raidGuild)) {
        await interaction.reply({
          embeds: [{
            title: '⭐⭐ Premium Plus Required',
            description: 'The Advanced Raid Protection command requires a premium plus subscription.',
            fields: [
              { 
                name: 'How to Upgrade', 
                value: 'Visit our dashboard to upgrade your server to Premium Plus and unlock this feature.', 
                inline: false 
              },
              { 
                name: 'Premium Plus Benefits', 
                value: '• Advanced raid detection with ML\n• Custom verification system\n• Priority support\n• And much more!', 
                inline: false 
              }
            ],
            color: 0xFF5555,
            footer: { text: "Visit https://witherco.org/premium to upgrade" }
          }]
        });
        return;
      }
      
      const joinRate = interaction.options.getInteger('join_rate');
      const lockdown = interaction.options.getBoolean('lockdown');
      
      if (joinRate === null || lockdown === null) {
        await interaction.reply({ content: 'Please provide all required parameters!', ephemeral: true });
        return;
      }
      
      if (joinRate < 5 || joinRate > 50) {
        await interaction.reply({ content: 'Join rate must be between 5 and 50 joins per minute!', ephemeral: true });
        return;
      }
      
      // Implementation would go here
      await interaction.reply({
        embeds: [{
          title: '✅ Advanced Raid Protection Configured',
          description: 'Your server now has machine learning powered raid protection.',
          fields: [
            { name: 'Join Rate Threshold', value: `${joinRate} per minute`, inline: true },
            { name: 'Auto-Lockdown', value: lockdown ? 'Enabled' : 'Disabled', inline: true },
            { name: 'Analytics', value: 'View raid statistics on your [dashboard](https://witherco.org)', inline: false }
          ],
          color: 0x55FF55
        }]
      });
      break;
    
    case 'welcome_setup':
      // Check if user has permission to manage the server
      if (!interaction.memberPermissions?.has('ManageGuild')) {
        await interaction.reply({ content: 'You don\'t have permission to use this command!', ephemeral: true });
        return;
      }
      
      // Check if the guild has premium status
      if (!isPremium(interaction.guild)) {
        await interaction.reply({
          embeds: [{
            color: 0xFFD700, // Gold
            title: '⭐ Premium Feature',
            description: 'This command requires a Premium subscription.',
            fields: [
              {
                name: 'Upgrade Now',
                value: '[Click here](https://witherco.org/premium) to view Premium plans.'
              }
            ],
            footer: { text: "Visit https://witherco.org/premium to upgrade" }
          }]
        });
        return;
      }
      
      const welcomeAction = interaction.options.getString('action');
      
      if (welcomeAction === 'enable') {
        const channel = interaction.options.getChannel('channel');
        const message = interaction.options.getString('message');
        
        if (!channel || !message) {
          await interaction.reply({ content: 'Please provide both a channel and welcome message!', ephemeral: true });
          return;
        }
        
        // In a real implementation, store this in the database
        await interaction.reply({ 
          content: `Welcome messages enabled in ${channel}. Message: "${message}"`, 
          ephemeral: true 
        });
      } 
      else if (welcomeAction === 'disable') {
        // In a real implementation, disable this in the database
        await interaction.reply({ 
          content: 'Welcome messages have been disabled for this server.', 
          ephemeral: true 
        });
      }
      else if (welcomeAction === 'settings') {
        // In a real implementation, fetch this from the database
        const timestamp = new Date().toISOString();
        await interaction.reply({
          embeds: [{
            color: 0x5865F2, // Discord Blurple
            title: 'Welcome Message Settings',
            fields: [
              { name: 'Status', value: 'Enabled', inline: true },
              { name: 'Channel', value: '#welcome', inline: true },
              { name: 'Message', value: 'Welcome to our server, {user}!', inline: false }
            ],
            footer: { text: 'Guard-shin Bot' }
            // Discord.js requires timestamp to be a number or ISO string
            // timestamp: timestamp
          }]
        });
      }
      break;

    case 'setup_logs':
      // Check if user has permission to manage the server
      if (!interaction.memberPermissions?.has('ManageGuild')) {
        await interaction.reply({ content: 'You don\'t have permission to use this command!', ephemeral: true });
        return;
      }
      
      // Check if the guild has premium status
      if (!isPremium(interaction.guild)) {
        await interaction.reply({
          embeds: [{
            color: 0xFFD700, // Gold
            title: '⭐ Premium Feature',
            description: 'This command requires a Premium subscription.',
            fields: [
              {
                name: 'Upgrade Now',
                value: '[Click here](https://witherco.org/premium) to view Premium plans.'
              }
            ],
            footer: { text: "Visit https://witherco.org/premium to upgrade" }
          }]
        });
        return;
      }
      
      const eventType = interaction.options.getString('event_type');
      const logChannel = interaction.options.getChannel('channel');
      const enabled = interaction.options.getBoolean('enabled');
      
      if (!eventType || !logChannel || enabled === null) {
        await interaction.reply({ content: 'Please provide all required parameters!', ephemeral: true });
        return;
      }
      
      // In a real implementation, store this in the database
      await interaction.reply({ 
        content: `${eventType} logs have been ${enabled ? 'enabled' : 'disabled'} in ${logChannel}.`, 
        ephemeral: true 
      });
      break;
      
    case 'auto_response':
      // Check if user has permission to manage the server
      if (!interaction.memberPermissions?.has('ManageGuild')) {
        await interaction.reply({ content: 'You don\'t have permission to use this command!', ephemeral: true });
        return;
      }
      
      // Check if the guild has premium status
      if (!isPremium(interaction.guild)) {
        await interaction.reply({
          embeds: [{
            color: 0xFFD700, // Gold
            title: '⭐ Premium Feature',
            description: 'This command requires a Premium subscription.',
            fields: [
              {
                name: 'Upgrade Now',
                value: '[Click here](https://witherco.org/premium) to view Premium plans.'
              }
            ],
            footer: { text: "Visit https://witherco.org/premium to upgrade" }
          }]
        });
        return;
      }
      
      const responseAction = interaction.options.getString('action');
      const trigger = interaction.options.getString('trigger');
      const response = interaction.options.getString('response');
      
      if (responseAction === 'add') {
        if (!trigger || !response) {
          await interaction.reply({ content: 'Please provide both a trigger and response!', ephemeral: true });
          return;
        }
        
        // In a real implementation, store this in the database
        await interaction.reply({ 
          content: `Added auto-response: When someone says "${trigger}", I'll respond with "${response}"`, 
          ephemeral: true 
        });
      } 
      else if (responseAction === 'remove') {
        if (!trigger) {
          await interaction.reply({ content: 'Please provide a trigger to remove!', ephemeral: true });
          return;
        }
        
        // In a real implementation, remove this from the database
        await interaction.reply({ 
          content: `Removed auto-response for trigger: "${trigger}"`, 
          ephemeral: true 
        });
      }
      else if (responseAction === 'list') {
        // In a real implementation, fetch these from the database
        const listTimestamp = new Date().toISOString();
        await interaction.reply({
          embeds: [{
            color: 0x5865F2, // Discord Blurple
            title: 'Custom Auto-Responses',
            description: 'Here are all the custom auto-responses for this server:',
            fields: [
              { name: 'hello', value: 'Hello there!', inline: false },
              { name: 'welcome', value: 'Welcome to our server!', inline: false },
              { name: 'rules', value: 'Please check the rules in the #rules channel.', inline: false }
            ],
            footer: { text: 'Guard-shin Bot' }
            // Discord.js requires timestamp to be a number or ISO string
            // timestamp: listTimestamp
          }]
        });
      }
      break;
      
    case 'add_premium':
      // This command is for developers only
      const DEVELOPER_USER_ID = '1259367203346841725'; // Your developer ID
      
      if (interaction.user.id !== DEVELOPER_USER_ID) {
        await interaction.reply({ 
          content: 'This command can only be used by the bot developer.', 
          ephemeral: true 
        });
        return;
      }
      
      const serverId = interaction.options.getString('server_id');
      const tier = interaction.options.getString('tier') || 'premium';
      const days = interaction.options.getInteger('days') || 30;
      
      if (!serverId) {
        await interaction.reply({ content: 'Please provide a server ID!', ephemeral: true });
        return;
      }
      
      // Add the server to our premium servers list
      addPremiumServer(serverId, tier === 'premium_plus');
      
      // In a real implementation, this would be stored in a database
      await interaction.reply({ 
        content: `Added ${tier} status to server ${serverId} for ${days} days.`, 
        ephemeral: true 
      });
      
      log(`[Premium] ${interaction.user.tag} (${interaction.user.id}) added ${tier} status to server ${serverId} for ${days} days.`, 'discord');
      break;
            
    default:
      await interaction.reply({ content: 'Unknown command!', ephemeral: true });
  }
}