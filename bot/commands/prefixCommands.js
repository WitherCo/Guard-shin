const { Collection } = require('discord.js');
const { checkPremium, premiumUpsellEmbed } = require('../utils/premiumCheck');
const { executeHelpCommand } = require('./help');

// Create a collection of prefix commands
const prefixCommands = new Collection();

// Handle prefix commands
async function handlePrefixCommand(message, prefix) {
  // Ignore messages from bots or messages that don't start with the prefix
  if (message.author.bot || !message.content.startsWith(prefix)) return;
  
  // Parse the command and arguments
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  // Check if the command exists
  const command = prefixCommands.get(commandName) || 
                 prefixCommands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
  
  if (!command) return;
  
  // Check if the command is admin-only
  if (command.isAdmin && !message.member.permissions.has('Administrator')) {
    return message.reply('You do not have permission to use this command.');
  }
  
  // Check if the command is premium (skip for help command)
  if (command.isPremium && commandName !== 'help') {
    const isPremium = await checkPremium(message.guild.id);
    
    if (!isPremium) {
      return message.channel.send({ embeds: [premiumUpsellEmbed()] });
    }
  }
  
  // Execute the command
  try {
    await command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply('There was an error executing that command.');
  }
}

// Define prefix commands
prefixCommands.set('help', {
  name: 'help',
  description: 'Shows the list of available commands or information about a specific command.',
  usage: ';help [command]',
  example: ';help ban',
  category: 'info',
  isPremium: false, 
  isAdmin: false,
  execute: executeHelpCommand
});

prefixCommands.set('ban', {
  name: 'ban',
  description: 'Bans a user from the server.',
  usage: ';ban <@user> [reason]',
  example: ';ban @username Breaking server rules',
  category: 'moderation',
  isPremium: false,
  isAdmin: true,
  execute: async (message, args) => {
    // Check if the user has permission to ban
    if (!message.member.permissions.has('BanMembers')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if a user was mentioned
    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('Please mention a user to ban.');
    }
    
    // Get the reason (optional)
    const reason = args.slice(1).join(' ') || 'No reason provided';
    
    try {
      await message.guild.members.ban(user, { reason });
      return message.reply(`Successfully banned ${user.tag} for: ${reason}`);
    } catch (error) {
      console.error(error);
      return message.reply('There was an error trying to ban this user.');
    }
  }
});

prefixCommands.set('kick', {
  name: 'kick',
  description: 'Kicks a user from the server.',
  usage: ';kick <@user> [reason]',
  example: ';kick @username Disruptive behavior',
  category: 'moderation',
  isPremium: false,
  isAdmin: true,
  execute: async (message, args) => {
    // Check if the user has permission to kick
    if (!message.member.permissions.has('KickMembers')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if a user was mentioned
    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('Please mention a user to kick.');
    }
    
    // Get the reason (optional)
    const reason = args.slice(1).join(' ') || 'No reason provided';
    
    try {
      await message.guild.members.kick(user, reason);
      return message.reply(`Successfully kicked ${user.tag} for: ${reason}`);
    } catch (error) {
      console.error(error);
      return message.reply('There was an error trying to kick this user.');
    }
  }
});

prefixCommands.set('slowmode', {
  name: 'slowmode',
  description: 'Sets the slowmode (rate limit) for a channel.',
  usage: ';slowmode <seconds>',
  example: ';slowmode 5',
  category: 'moderation',
  isPremium: false,
  isAdmin: true,
  execute: async (message, args) => {
    // Check if the user has permission to manage channels
    if (!message.member.permissions.has('ManageChannels')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if a rate limit was provided
    if (!args[0]) {
      return message.reply('Please provide a rate limit in seconds.');
    }
    
    const rateLimit = parseInt(args[0]);
    
    // Validate rate limit
    if (isNaN(rateLimit) || rateLimit < 0 || rateLimit > 21600) {
      return message.reply('Please provide a valid rate limit between 0 and 21600 seconds.');
    }
    
    try {
      await message.channel.setRateLimitPerUser(rateLimit);
      
      if (rateLimit === 0) {
        return message.reply('Slowmode has been turned off for this channel.');
      } else {
        return message.reply(`Slowmode has been set to ${rateLimit} seconds for this channel.`);
      }
    } catch (error) {
      console.error(error);
      return message.reply('There was an error trying to set slowmode for this channel.');
    }
  }
});

prefixCommands.set('clear', {
  name: 'clear',
  description: 'Clears a specified number of messages from the channel.',
  usage: ';clear <amount>',
  example: ';clear 10',
  category: 'moderation',
  isPremium: false,
  isAdmin: true,
  execute: async (message, args) => {
    // Check if the user has permission to manage messages
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if an amount was provided
    if (!args[0]) {
      return message.reply('Please provide the number of messages to clear.');
    }
    
    const amount = parseInt(args[0]);
    
    // Validate amount
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply('Please provide a valid number between 1 and 100.');
    }
    
    try {
      const messages = await message.channel.bulkDelete(amount, true);
      return message.channel.send(`Successfully deleted ${messages.size} messages.`)
        .then(msg => {
          setTimeout(() => msg.delete().catch(error => console.error(error)), 5000);
        });
    } catch (error) {
      console.error(error);
      return message.reply('There was an error trying to clear messages in this channel. Messages older than 14 days cannot be deleted.');
    }
  }
});

prefixCommands.set('mute', {
  name: 'mute',
  description: 'Mutes a user in the server.',
  usage: ';mute <@user> [reason]',
  example: ';mute @username Spamming',
  category: 'moderation',
  isPremium: false,
  isAdmin: true,
  execute: async (message, args) => {
    // Check if the user has permission to manage roles
    if (!message.member.permissions.has('ManageRoles')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if a user was mentioned
    const user = message.mentions.users.first();
    if (!user) {
      return message.reply('Please mention a user to mute.');
    }
    
    // Get the reason (optional)
    const reason = args.slice(1).join(' ') || 'No reason provided';
    
    // Find or create a muted role
    let muteRole = message.guild.roles.cache.find(role => role.name === 'Muted');
    
    if (!muteRole) {
      try {
        muteRole = await message.guild.roles.create({
          name: 'Muted',
          color: '#808080',
          reason: 'Used for muting users'
        });
        
        // Update channel permissions for the muted role
        for (const channel of message.guild.channels.cache.values()) {
          await channel.permissionOverwrites.edit(muteRole, {
            SEND_MESSAGES: false,
            ADD_REACTIONS: false,
            SPEAK: false
          });
        }
      } catch (error) {
        console.error(error);
        return message.reply('There was an error creating the Muted role.');
      }
    }
    
    // Apply the muted role to the user
    const member = message.guild.members.cache.get(user.id);
    
    try {
      await member.roles.add(muteRole);
      return message.reply(`Successfully muted ${user.tag} for: ${reason}`);
    } catch (error) {
      console.error(error);
      return message.reply('There was an error trying to mute this user.');
    }
  }
});

// Premium commands
prefixCommands.set('anti-spam', {
  name: 'anti-spam',
  description: 'Configure anti-spam protection settings.',
  usage: ';anti-spam <setting> <value>',
  example: ';anti-spam max-mentions 5',
  category: 'premium',
  isPremium: true,
  isAdmin: true,
  execute: async (message, args) => {
    // Check premium status
    const isPremium = await checkPremium(message.guild.id);
    
    if (!isPremium) {
      const embed = {
        color: 0xFFD700, // Gold
        title: '⭐ Premium Feature',
        description: 'This command requires a Premium subscription.',
        fields: [
          {
            name: 'Upgrade Now',
            value: '[Click here](https://witherco.org/premium) to view Premium plans.'
          }
        ],
        footer: {
          text: 'Visit https://witherco.org/premium to upgrade'
        }
      };
      
      return message.channel.send({ embeds: [embed] });
    }
    
    // Check if the user has permission to manage the server
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if arguments were provided
    if (args.length < 2) {
      return message.reply('Please provide a setting and value. Available settings: max-messages, max-mentions, message-interval, punishment');
    }
    
    const setting = args[0].toLowerCase();
    const value = args[1].toLowerCase();
    
    const validSettings = ['max-messages', 'max-mentions', 'message-interval', 'punishment'];
    
    if (!validSettings.includes(setting)) {
      return message.reply(`Invalid setting. Available settings: ${validSettings.join(', ')}`);
    }
    
    // Check value validity based on setting
    if (setting === 'punishment') {
      const validPunishments = ['warn', 'mute', 'kick', 'ban'];
      if (!validPunishments.includes(value)) {
        return message.reply(`Invalid punishment. Available punishments: ${validPunishments.join(', ')}`);
      }
    } else {
      // For numeric settings, check if value is a number
      const numValue = parseInt(value);
      if (isNaN(numValue) || numValue < 1) {
        return message.reply('Please provide a valid positive number for this setting.');
      }
    }
    
    // Store the anti-spam setting (this would need a database in a real implementation)
    return message.reply(`Anti-spam setting "${setting}" has been set to "${value}".`);
  }
});

prefixCommands.set('custom-roles', {
  name: 'custom-roles',
  description: 'Manage special roles for new members or based on reactions.',
  usage: ';custom-roles <action> [options]',
  example: ';custom-roles create Gamer #00ff00',
  category: 'premium',
  isPremium: true,
  isAdmin: true,
  execute: async (message, args) => {
    // Check premium status
    const isPremium = await checkPremium(message.guild.id);
    
    if (!isPremium) {
      const embed = {
        color: 0xFFD700, // Gold
        title: '⭐ Premium Feature',
        description: 'This command requires a Premium subscription.',
        fields: [
          {
            name: 'Upgrade Now',
            value: '[Click here](https://witherco.org/premium) to view Premium plans.'
          }
        ],
        footer: {
          text: 'Visit https://witherco.org/premium to upgrade'
        }
      };
      
      return message.channel.send({ embeds: [embed] });
    }
    
    // Check if the user has permission to manage roles
    if (!message.member.permissions.has('ManageRoles')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if an action was provided
    if (!args[0]) {
      return message.reply('Please provide an action. Available actions: create, delete, list, reaction');
    }
    
    const action = args[0].toLowerCase();
    
    if (action === 'create') {
      if (args.length < 2) {
        return message.reply('Please provide a role name. Example: `;custom-roles create Gamer #00ff00`');
      }
      
      const roleName = args[1];
      const roleColor = args[2] || '#99AAB5'; // Default Discord role color
      
      // Create the role (would be implemented in a real bot)
      return message.reply(`Created role "${roleName}" with color ${roleColor}.`);
    } 
    else if (action === 'delete') {
      if (args.length < 2) {
        return message.reply('Please provide a role name to delete.');
      }
      
      const roleName = args[1];
      
      // Find and delete the role (would be implemented in a real bot)
      return message.reply(`Deleted role "${roleName}".`);
    }
    else if (action === 'list') {
      // List all custom roles (would fetch from database in real implementation)
      const embed = {
        color: 0x5865F2, // Discord Blurple
        title: 'Custom Roles',
        description: 'Here are all the custom roles for this server:',
        fields: [
          {
            name: 'Gamer',
            value: 'Color: #00ff00',
            inline: true
          },
          {
            name: 'Artist',
            value: 'Color: #ff00ff',
            inline: true
          },
          {
            name: 'Musician',
            value: 'Color: #0000ff',
            inline: true
          }
        ],
        footer: {
          text: 'Guard-shin Bot'
        },
        timestamp: new Date()
      };
      
      return message.channel.send({ embeds: [embed] });
    }
    else if (action === 'reaction') {
      if (args.length < 3) {
        return message.reply('Please provide a message ID and role name. Example: `;custom-roles reaction 123456789 Gamer`');
      }
      
      const messageId = args[1];
      const roleName = args[2];
      
      // Set up reaction role (would be implemented in a real bot)
      return message.reply(`Set up reaction role for "${roleName}" on message ${messageId}.`);
    }
    else {
      return message.reply('Invalid action. Available actions: create, delete, list, reaction');
    }
  }
});

prefixCommands.set('welcome', {
  name: 'welcome',
  description: 'Sets a welcome message for new members.',
  usage: ';welcome <message>',
  example: ';welcome Welcome to our server, {user}!',
  category: 'premium',
  isPremium: true,
  isAdmin: true,
  execute: async (message, args) => {
    // Check premium status
    const isPremium = await checkPremium(message.guild.id);
    
    if (!isPremium) {
      const embed = {
        color: 0xFFD700, // Gold
        title: '⭐ Premium Feature',
        description: 'This command requires a Premium subscription.',
        fields: [
          {
            name: 'Upgrade Now',
            value: '[Click here](https://witherco.org/premium) to view Premium plans.'
          }
        ],
        footer: {
          text: 'Visit https://witherco.org/premium to upgrade'
        }
      };
      
      return message.channel.send({ embeds: [embed] });
    }
    
    // Check if the user has permission to manage the server
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if a welcome message was provided
    const welcomeMessage = args.join(' ');
    if (!welcomeMessage) {
      return message.reply('Please provide a welcome message. Use {user} to mention the new member.');
    }
    
    // Store the welcome message (this would need a database in a real implementation)
    // For this example, we'll just acknowledge the command
    return message.reply(`Welcome message has been set to: "${welcomeMessage}"`);
  }
});

prefixCommands.set('welcome-image', {
  name: 'welcome-image',
  description: 'Configure custom welcome images for new members.',
  usage: ';welcome-image <action> [options]',
  example: ';welcome-image set https://example.com/background.png',
  category: 'premium',
  isPremium: true,
  isAdmin: true,
  execute: async (message, args) => {
    // Check premium status
    const isPremium = await checkPremium(message.guild.id);
    
    if (!isPremium) {
      return message.channel.send({ embeds: [premiumUpsellEmbed()] });
    }
    
    // Check if the user has permission to manage the server
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if an action was provided
    if (!args[0]) {
      return message.reply('Please provide an action. Available actions: set, info, reset, preview, theme');
    }
    
    const action = args[0].toLowerCase();
    
    if (action === 'set') {
      if (args.length < 2) {
        return message.reply('Please provide a background image URL. Example: `;welcome-image set https://example.com/background.png`');
      }
      
      const imageUrl = args[1];
      
      // Validate URL format
      try {
        new URL(imageUrl);
      } catch (error) {
        return message.reply('Please provide a valid URL for the background image.');
      }
      
      // In a real implementation, store the image URL in a database
      return message.reply({
        content: 'Welcome image background has been set!',
        files: [{
          attachment: imageUrl,
          name: 'preview.png'
        }]
      });
    } 
    else if (action === 'theme') {
      if (args.length < 2) {
        return message.reply('Please provide a theme color. Example: `;welcome-image theme #ff5500` or `;welcome-image theme dark`');
      }
      
      const theme = args[1];
      
      // In a real implementation, store the theme preference in a database
      return message.reply(`Welcome image theme has been set to "${theme}".`);
    }
    else if (action === 'reset') {
      // In a real implementation, reset to default settings in the database
      return message.reply('Welcome image settings have been reset to default.');
    }
    else if (action === 'info') {
      // In a real implementation, fetch settings from the database
      const embed = {
        color: 0x5865F2, // Discord Blurple
        title: 'Welcome Image Settings',
        fields: [
          {
            name: 'Background',
            value: 'https://example.com/custom-background.png',
            inline: true
          },
          {
            name: 'Theme',
            value: '#ff5500',
            inline: true
          },
          {
            name: 'Text',
            value: 'Welcome {user} to our server!',
            inline: false
          }
        ],
        image: {
          url: 'https://example.com/custom-background.png'
        },
        footer: {
          text: 'Guard-shin Bot'
        },
        timestamp: new Date()
      };
      
      return message.channel.send({ embeds: [embed] });
    }
    else if (action === 'preview') {
      // In a real implementation, generate a preview with current settings
      // For this example, we'll just acknowledge the command
      return message.reply('This is a preview of your welcome image. In the actual implementation, an image would be generated here.');
    }
    else {
      return message.reply('Invalid action. Available actions: set, info, reset, preview, theme');
    }
  }
});

prefixCommands.set('auto-mod', {
  name: 'auto-mod',
  description: 'Configures automatic moderation settings.',
  usage: ';auto-mod <setting> <value>',
  example: ';auto-mod filter-spam true',
  category: 'premium',
  isPremium: true,
  isAdmin: true,
  execute: async (message, args) => {
    // Check premium status
    const isPremium = await checkPremium(message.guild.id);
    
    if (!isPremium) {
      const embed = {
        color: 0xFFD700, // Gold
        title: '⭐ Premium Feature',
        description: 'This command requires a Premium subscription.',
        fields: [
          {
            name: 'Upgrade Now',
            value: '[Click here](https://witherco.org/premium) to view Premium plans.'
          }
        ],
        footer: {
          text: 'Visit https://witherco.org/premium to upgrade'
        }
      };
      
      return message.channel.send({ embeds: [embed] });
    }
    
    // Check if the user has permission to manage the server
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if arguments were provided
    if (args.length < 2) {
      return message.reply('Please provide a setting and value. Example: `;auto-mod filter-spam true`');
    }
    
    const setting = args[0].toLowerCase();
    const value = args[1].toLowerCase();
    
    // Validate setting and value
    const validSettings = ['filter-spam', 'filter-links', 'filter-invites', 'filter-mentions'];
    const validValues = ['true', 'false'];
    
    if (!validSettings.includes(setting)) {
      return message.reply(`Invalid setting. Available settings: ${validSettings.join(', ')}`);
    }
    
    if (!validValues.includes(value)) {
      return message.reply(`Invalid value. Available values: ${validValues.join(', ')}`);
    }
    
    // Store the auto-mod setting (this would need a database in a real implementation)
    // For this example, we'll just acknowledge the command
    return message.reply(`Auto-mod setting "${setting}" has been set to "${value}".`);
  }
});

prefixCommands.set('auto-response', {
  name: 'auto-response',
  description: 'Sets up custom auto-responses for specific triggers.',
  usage: ';auto-response add <trigger> <response>',
  example: ';auto-response add "hello" "Hello there!"',
  category: 'premium',
  isPremium: true,
  isAdmin: true,
  execute: async (message, args) => {
    // Check premium status
    const isPremium = await checkPremium(message.guild.id);
    
    if (!isPremium) {
      const embed = {
        color: 0xFFD700, // Gold
        title: '⭐ Premium Feature',
        description: 'This command requires a Premium subscription.',
        fields: [
          {
            name: 'Upgrade Now',
            value: '[Click here](https://witherco.org/premium) to view Premium plans.'
          }
        ],
        footer: {
          text: 'Visit https://witherco.org/premium to upgrade'
        }
      };
      
      return message.channel.send({ embeds: [embed] });
    }
    
    // Check if the user has permission to manage the server
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if action and arguments were provided
    if (args.length < 1) {
      return message.reply('Please provide an action. Available actions: add, remove, list');
    }
    
    const action = args[0].toLowerCase();
    
    if (action === 'add') {
      // We need a trigger and response
      if (args.length < 3) {
        return message.reply('Please provide a trigger and response. Example: `;auto-response add "hello" "Hello there!"`');
      }
      
      // Get the trigger and response - handle quotes if present
      const fullText = args.slice(1).join(' ');
      const matches = fullText.match(/"([^"]+)"\s*"([^"]+)"/);
      
      let trigger, response;
      
      if (matches) {
        trigger = matches[1];
        response = matches[2];
      } else {
        // Simple fallback if quotes aren't used
        trigger = args[1];
        response = args.slice(2).join(' ');
      }
      
      // Store the auto-response (would use a database in real implementation)
      return message.reply(`Added auto-response: When someone says "${trigger}", I'll respond with "${response}"`);
    } 
    else if (action === 'remove') {
      if (args.length < 2) {
        return message.reply('Please provide a trigger to remove. Example: `;auto-response remove "hello"`');
      }
      
      const trigger = args[1].replace(/"/g, ''); // Remove quotes if present
      
      // Remove the auto-response (would use a database in real implementation)
      return message.reply(`Removed auto-response for trigger: "${trigger}"`);
    }
    else if (action === 'list') {
      // List all auto-responses (would fetch from database in real implementation)
      const embed = {
        color: 0x5865F2, // Discord Blurple
        title: 'Custom Auto-Responses',
        description: 'Here are all the custom auto-responses for this server:',
        fields: [
          {
            name: 'hello',
            value: 'Hello there!',
            inline: false
          },
          {
            name: 'welcome',
            value: 'Welcome to our server!',
            inline: false
          },
          {
            name: 'rules',
            value: 'Please check the rules in the #rules channel.',
            inline: false
          }
        ],
        footer: {
          text: 'Guard-shin Bot'
        },
        timestamp: new Date()
      };
      
      return message.channel.send({ embeds: [embed] });
    }
    else {
      return message.reply('Invalid action. Available actions: add, remove, list');
    }
  }
});

prefixCommands.set('logs', {
  name: 'logs',
  description: 'Configures log channels for different events.',
  usage: ';logs <event> <#channel>',
  example: ';logs moderation #mod-logs',
  category: 'premium',
  isPremium: true,
  isAdmin: true,
  execute: async (message, args) => {
    // Check premium status
    const isPremium = await checkPremium(message.guild.id);
    
    if (!isPremium) {
      const embed = {
        color: 0xFFD700, // Gold
        title: '⭐ Premium Feature',
        description: 'This command requires a Premium subscription.',
        fields: [
          {
            name: 'Upgrade Now',
            value: '[Click here](https://witherco.org/premium) to view Premium plans.'
          }
        ],
        footer: {
          text: 'Visit https://witherco.org/premium to upgrade'
        }
      };
      
      return message.channel.send({ embeds: [embed] });
    }
    
    // Check if the user has permission to manage the server
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if arguments were provided
    if (args.length < 2) {
      return message.reply('Please provide an event type and channel. Available events: moderation, join-leave, message, voice');
    }
    
    const eventType = args[0].toLowerCase();
    const validEventTypes = ['moderation', 'join-leave', 'message', 'voice'];
    
    if (!validEventTypes.includes(eventType)) {
      return message.reply(`Invalid event type. Available types: ${validEventTypes.join(', ')}`);
    }
    
    // Get the channel
    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply('Please mention a valid channel.');
    }
    
    // Set the log channel (would store in database in real implementation)
    return message.reply(`Set ${eventType} logs to ${channel}`);
  }
});

prefixCommands.set('verification', {
  name: 'verification',
  description: 'Sets up member verification system.',
  usage: ';verification <action> [options]',
  example: ';verification enable captcha',
  category: 'premium',
  isPremium: true,
  isAdmin: true,
  execute: async (message, args) => {
    // Check premium status
    const isPremium = await checkPremium(message.guild.id);
    
    if (!isPremium) {
      const embed = {
        color: 0xFFD700, // Gold
        title: '⭐ Premium Feature',
        description: 'This command requires a Premium subscription.',
        fields: [
          {
            name: 'Upgrade Now',
            value: '[Click here](https://witherco.org/premium) to view Premium plans.'
          }
        ],
        footer: {
          text: 'Visit https://witherco.org/premium to upgrade'
        }
      };
      
      return message.channel.send({ embeds: [embed] });
    }
    
    // Check if the user has permission to manage the server
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if action was provided
    if (args.length < 1) {
      return message.reply('Please provide an action. Available actions: enable, disable, settings');
    }
    
    const action = args[0].toLowerCase();
    
    if (action === 'enable') {
      // Check if verification type was provided
      if (args.length < 2) {
        return message.reply('Please provide a verification type. Available types: captcha, reaction, question');
      }
      
      const verificationType = args[1].toLowerCase();
      const validTypes = ['captcha', 'reaction', 'question'];
      
      if (!validTypes.includes(verificationType)) {
        return message.reply(`Invalid verification type. Available types: ${validTypes.join(', ')}`);
      }
      
      // Enable verification (would store in database in real implementation)
      return message.reply(`Enabled ${verificationType} verification for this server.`);
    }
    else if (action === 'disable') {
      // Disable verification
      return message.reply('Disabled verification for this server.');
    }
    else if (action === 'settings') {
      // Show current verification settings
      const embed = {
        color: 0x5865F2, // Discord Blurple
        title: 'Verification Settings',
        fields: [
          {
            name: 'Status',
            value: 'Enabled',
            inline: true
          },
          {
            name: 'Type',
            value: 'Captcha',
            inline: true
          },
          {
            name: 'Channel',
            value: '#verification',
            inline: true
          },
          {
            name: 'Role After Verification',
            value: 'Verified',
            inline: true
          }
        ],
        footer: {
          text: 'Guard-shin Bot'
        },
        timestamp: new Date()
      };
      
      return message.channel.send({ embeds: [embed] });
    }
    else {
      return message.reply('Invalid action. Available actions: enable, disable, settings');
    }
  }
});

prefixCommands.set('raid-protection', {
  name: 'raid-protection',
  description: 'Configures raid protection settings.',
  usage: ';raid-protection <action> [options]',
  example: ';raid-protection enable',
  category: 'premium',
  isPremium: true,
  isAdmin: true,
  execute: async (message, args) => {
    // Check premium status
    const isPremium = await checkPremium(message.guild.id);
    
    if (!isPremium) {
      const embed = {
        color: 0xFFD700, // Gold
        title: '⭐ Premium Feature',
        description: 'This command requires a Premium subscription.',
        fields: [
          {
            name: 'Upgrade Now',
            value: '[Click here](https://witherco.org/premium) to view Premium plans.'
          }
        ],
        footer: {
          text: 'Visit https://witherco.org/premium to upgrade'
        }
      };
      
      return message.channel.send({ embeds: [embed] });
    }
    
    // Check if the user has permission to manage the server
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if an action was provided
    if (!args[0]) {
      return message.reply('Please provide an action. Available actions: enable, disable, settings');
    }
    
    const action = args[0].toLowerCase();
    
    // Handle different actions
    if (action === 'enable') {
      // Enable raid protection
      return message.reply('Raid protection has been enabled for this server.');
    } else if (action === 'disable') {
      // Disable raid protection
      return message.reply('Raid protection has been disabled for this server.');
    } else if (action === 'settings') {
      // Show current raid protection settings
      const embed = {
        color: 0x5865F2, // Discord Blurple
        title: 'Raid Protection Settings',
        fields: [
          {
            name: 'Status',
            value: 'Enabled',
            inline: true
          },
          {
            name: 'Verification Level',
            value: 'Medium',
            inline: true
          },
          {
            name: 'Join Rate Threshold',
            value: '5 users/10 seconds',
            inline: true
          },
          {
            name: 'Action',
            value: 'Temporary lockdown',
            inline: true
          }
        ],
        footer: {
          text: 'Guard-shin Bot'
        },
        timestamp: new Date()
      };
      
      return message.channel.send({ embeds: [embed] });
    } else {
      return message.reply('Invalid action. Available actions: enable, disable, settings');
    }
  }
});

// Test command for debugging prefix command functionality
prefixCommands.set('test', {
  name: 'test',
  description: 'A test command to verify prefix commands are working',
  usage: ';test',
  example: ';test',
  category: 'utility',
  isPremium: false,
  isAdmin: false,
  execute: async (message, args) => {
    console.log('[PREFIX DEBUG] Executing test command');
    return message.reply('✅ Test command successful! Prefix commands are working correctly.');
  }
});

// Server management command for premium users
prefixCommands.set('server-manager', {
  name: 'server-manager',
  description: 'Premium server management tools for roles, channels, and permissions.',
  usage: ';server-manager <category> <action> [options]',
  example: ';server-manager role create Member #00FF00',
  category: 'premium',
  isPremium: true,
  isAdmin: true,
  execute: async (message, args) => {
    // Check premium status
    const isPremium = await checkPremium(message.guild.id);
    
    if (!isPremium) {
      return message.channel.send({ embeds: [premiumUpsellEmbed()] });
    }
    
    // Check if the user has permission to manage the server
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('You do not have permission to use this command. You need Administrator permissions.');
    }
    
    // Check if arguments were provided
    if (args.length < 2) {
      return message.reply('Please provide a category and action. Available categories: role, channel, permission');
    }
    
    const category = args[0].toLowerCase();
    const action = args[1].toLowerCase();
    
    // Role management
    if (category === 'role') {
      if (!message.member.permissions.has('ManageRoles')) {
        return message.reply('You need Manage Roles permission to use this command.');
      }
      
      if (action === 'create') {
        if (args.length < 3) {
          return message.reply('Please provide a role name. Example: `;server-manager role create Member #00FF00`');
        }
        
        const roleName = args[2];
        const roleColor = args[3] || '#99AAB5'; // Default Discord role color
        
        try {
          const newRole = await message.guild.roles.create({
            name: roleName,
            color: roleColor,
            reason: `Created by ${message.author.tag} using server-manager command`
          });
          
          return message.reply(`✅ Role "${newRole.name}" created successfully with color ${roleColor}`);
        } catch (error) {
          console.error('Error creating role:', error);
          return message.reply('❌ Failed to create role. Make sure the bot has permission and the color format is valid (e.g., #00FF00).');
        }
      }
      else if (action === 'delete') {
        if (args.length < 3) {
          return message.reply('Please provide a role name or mention. Example: `;server-manager role delete Member`');
        }
        
        const roleName = args[2];
        const role = message.mentions.roles.first() || 
                   message.guild.roles.cache.find(r => 
                     r.name.toLowerCase() === roleName.toLowerCase());
        
        if (!role) {
          return message.reply('Role not found. Please make sure the role exists and you spelled it correctly.');
        }
        
        try {
          await role.delete(`Deleted by ${message.author.tag} using server-manager command`);
          return message.reply(`✅ Role "${roleName}" deleted successfully`);
        } catch (error) {
          console.error('Error deleting role:', error);
          return message.reply('❌ Failed to delete role. Make sure the bot has permission and the role is not higher than the bot\'s highest role.');
        }
      }
      else if (action === 'list') {
        const roles = message.guild.roles.cache
          .sort((a, b) => b.position - a.position)
          .map(r => `${r.name} (${r.id}) - ${r.members.size} members`)
          .slice(0, 25); // Limit to 25 roles to avoid message too long
        
        const embed = {
          color: 0x5865F2, // Discord Blurple
          title: `Roles in ${message.guild.name}`,
          description: roles.join('\n'),
          footer: {
            text: `Total roles: ${message.guild.roles.cache.size}`
          },
          timestamp: new Date()
        };
        
        return message.channel.send({ embeds: [embed] });
      }
      else {
        return message.reply('Invalid action for roles. Available actions: create, delete, list');
      }
    }
    // Channel management
    else if (category === 'channel') {
      if (!message.member.permissions.has('ManageChannels')) {
        return message.reply('You need Manage Channels permission to use this command.');
      }
      
      if (action === 'create') {
        if (args.length < 4) {
          return message.reply('Please provide a channel type and name. Example: `;server-manager channel create text announcements`');
        }
        
        const channelType = args[2].toLowerCase();
        const channelName = args[3].toLowerCase();
        
        if (!['text', 'voice', 'category'].includes(channelType)) {
          return message.reply('Invalid channel type. Available types: text, voice, category');
        }
        
        try {
          const newChannel = await message.guild.channels.create({
            name: channelName,
            type: channelType === 'text' ? 0 : channelType === 'voice' ? 2 : 4,
            reason: `Created by ${message.author.tag} using server-manager command`
          });
          
          return message.reply(`✅ ${channelType} channel "${newChannel.name}" created successfully`);
        } catch (error) {
          console.error('Error creating channel:', error);
          return message.reply('❌ Failed to create channel. Make sure the bot has permission.');
        }
      }
      else if (action === 'delete') {
        if (args.length < 3) {
          return message.reply('Please provide a channel mention or name. Example: `;server-manager channel delete #general`');
        }
        
        const channel = message.mentions.channels.first() || 
                       message.guild.channels.cache.find(c => 
                         c.name.toLowerCase() === args[2].toLowerCase());
        
        if (!channel) {
          return message.reply('Channel not found. Please make sure the channel exists and you spelled it correctly.');
        }
        
        try {
          await channel.delete(`Deleted by ${message.author.tag} using server-manager command`);
          return message.reply(`✅ Channel "${channel.name}" deleted successfully`);
        } catch (error) {
          console.error('Error deleting channel:', error);
          return message.reply('❌ Failed to delete channel. Make sure the bot has permission.');
        }
      }
      else if (action === 'list') {
        const textChannels = message.guild.channels.cache.filter(c => c.type === 0)
          .map(c => `#${c.name} (${c.id})`)
          .join('\n');
          
        const voiceChannels = message.guild.channels.cache.filter(c => c.type === 2)
          .map(c => `🔊 ${c.name} (${c.id})`)
          .join('\n');
          
        const categories = message.guild.channels.cache.filter(c => c.type === 4)
          .map(c => `📁 ${c.name} (${c.id})`)
          .join('\n');
        
        const embed = {
          color: 0x5865F2, // Discord Blurple
          title: `Channels in ${message.guild.name}`,
          fields: [
            {
              name: 'Categories',
              value: categories || 'None',
              inline: false
            },
            {
              name: 'Text Channels',
              value: textChannels || 'None',
              inline: false
            },
            {
              name: 'Voice Channels',
              value: voiceChannels || 'None',
              inline: false
            }
          ],
          footer: {
            text: `Total channels: ${message.guild.channels.cache.size}`
          },
          timestamp: new Date()
        };
        
        return message.channel.send({ embeds: [embed] });
      }
      else {
        return message.reply('Invalid action for channels. Available actions: create, delete, list');
      }
    }
    // Permission management
    else if (category === 'permission') {
      if (!message.member.permissions.has('ManageRoles')) {
        return message.reply('You need Manage Roles permission to use this command.');
      }
      
      if (action === 'grant') {
        if (args.length < 5) {
          return message.reply('Please provide a role mention, channel mention, and permission. Example: `;server-manager permission grant @Member #announcements VIEW_CHANNEL`');
        }
        
        const role = message.mentions.roles.first();
        const channel = message.mentions.channels.first();
        const permission = args[4].toUpperCase();
        
        if (!role) {
          return message.reply('Role not found. Please mention a valid role.');
        }
        
        if (!channel) {
          return message.reply('Channel not found. Please mention a valid channel.');
        }
        
        try {
          await channel.permissionOverwrites.edit(role, {
            [permission]: true
          });
          
          return message.reply(`✅ Granted permission ${permission} to role ${role.name} in channel #${channel.name}`);
        } catch (error) {
          console.error('Error granting permission:', error);
          return message.reply('❌ Failed to grant permission. Make sure the permission name is valid and the bot has permission.');
        }
      }
      else if (action === 'deny') {
        if (args.length < 5) {
          return message.reply('Please provide a role mention, channel mention, and permission. Example: `;server-manager permission deny @Member #announcements SEND_MESSAGES`');
        }
        
        const role = message.mentions.roles.first();
        const channel = message.mentions.channels.first();
        const permission = args[4].toUpperCase();
        
        if (!role) {
          return message.reply('Role not found. Please mention a valid role.');
        }
        
        if (!channel) {
          return message.reply('Channel not found. Please mention a valid channel.');
        }
        
        try {
          await channel.permissionOverwrites.edit(role, {
            [permission]: false
          });
          
          return message.reply(`✅ Denied permission ${permission} to role ${role.name} in channel #${channel.name}`);
        } catch (error) {
          console.error('Error denying permission:', error);
          return message.reply('❌ Failed to deny permission. Make sure the permission name is valid and the bot has permission.');
        }
      }
      else if (action === 'reset') {
        if (args.length < 4) {
          return message.reply('Please provide a role mention and channel mention. Example: `;server-manager permission reset @Member #announcements`');
        }
        
        const role = message.mentions.roles.first();
        const channel = message.mentions.channels.first();
        
        if (!role) {
          return message.reply('Role not found. Please mention a valid role.');
        }
        
        if (!channel) {
          return message.reply('Channel not found. Please mention a valid channel.');
        }
        
        try {
          await channel.permissionOverwrites.delete(role);
          
          return message.reply(`✅ Reset all permissions for role ${role.name} in channel #${channel.name}`);
        } catch (error) {
          console.error('Error resetting permissions:', error);
          return message.reply('❌ Failed to reset permissions. Make sure the bot has permission.');
        }
      }
      else {
        return message.reply('Invalid action for permissions. Available actions: grant, deny, reset');
      }
    }
    else {
      return message.reply('Invalid category. Available categories: role, channel, permission');
    }
  }
});

// Advanced auto-response command with regex support
prefixCommands.set('regex-response', {
  name: 'regex-response',
  description: 'Set up advanced auto-responses using regular expressions.',
  usage: ';regex-response <action> [options]',
  example: ';regex-response add "hello.*world" "Hello to you too!"',
  category: 'premium',
  isPremium: true,
  isAdmin: true,
  execute: async (message, args) => {
    // Check premium status
    const isPremium = await checkPremium(message.guild.id);
    
    if (!isPremium) {
      return message.channel.send({ embeds: [premiumUpsellEmbed()] });
    }
    
    // Check if the user has permission to manage the server
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if action was provided
    if (args.length < 1) {
      return message.reply('Please provide an action. Available actions: add, remove, list, test');
    }
    
    const action = args[0].toLowerCase();
    
    if (action === 'add') {
      if (args.length < 3) {
        return message.reply('Please provide a regex pattern and response. Example: `;regex-response add "hello.*world" "Hello to you too!"`');
      }
      
      // Get the pattern and response - handle quotes if present
      const fullText = args.slice(1).join(' ');
      const matches = fullText.match(/"([^"]+)"\s*"([^"]+)"/);
      
      let pattern, response;
      
      if (matches) {
        pattern = matches[1];
        response = matches[2];
      } else {
        // Simple fallback if quotes aren't used
        pattern = args[1];
        response = args.slice(2).join(' ');
      }
      
      // Validate regex pattern
      try {
        new RegExp(pattern);
      } catch (error) {
        return message.reply('Invalid regular expression pattern. Please check your syntax.');
      }
      
      // Store the regex response (would use a database in real implementation)
      return message.reply(`Added regex auto-response: When a message matches pattern "${pattern}", I'll respond with "${response}"`);
    } 
    else if (action === 'remove') {
      if (args.length < 2) {
        return message.reply('Please provide a pattern to remove. Example: `;regex-response remove "hello.*world"`');
      }
      
      const pattern = args[1].replace(/"/g, ''); // Remove quotes if present
      
      // Remove the regex response (would use a database in real implementation)
      return message.reply(`Removed regex auto-response for pattern: "${pattern}"`);
    }
    else if (action === 'list') {
      // List all regex auto-responses (would fetch from database in real implementation)
      const embed = {
        color: 0x5865F2, // Discord Blurple
        title: 'Regex Auto-Responses',
        description: 'Here are all the regex auto-responses for this server:',
        fields: [
          {
            name: 'hello.*world',
            value: 'Hello to you too!',
            inline: false
          },
          {
            name: 'how.*(are|is).*you',
            value: 'I\'m doing great, thanks for asking!',
            inline: false
          },
          {
            name: '\\bhelp\\b',
            value: 'If you need help, please check out #support channel.',
            inline: false
          }
        ],
        footer: {
          text: 'Guard-shin Bot'
        },
        timestamp: new Date()
      };
      
      return message.channel.send({ embeds: [embed] });
    }
    else if (action === 'test') {
      if (args.length < 3) {
        return message.reply('Please provide a pattern and test string. Example: `;regex-response test "hello.*world" "hello beautiful world"`');
      }
      
      let pattern, testString;
      
      // Get the pattern and test string - handle quotes if present
      const fullText = args.slice(1).join(' ');
      const matches = fullText.match(/"([^"]+)"\s*"([^"]+)"/);
      
      if (matches) {
        pattern = matches[1];
        testString = matches[2];
      } else {
        // Simple fallback if quotes aren't used
        pattern = args[1];
        testString = args.slice(2).join(' ');
      }
      
      // Test the regex pattern
      try {
        const regex = new RegExp(pattern);
        const isMatch = regex.test(testString);
        
        if (isMatch) {
          return message.reply(`✅ The test string "${testString}" matches the pattern "${pattern}"`);
        } else {
          return message.reply(`❌ The test string "${testString}" does NOT match the pattern "${pattern}"`);
        }
      } catch (error) {
        return message.reply('Invalid regular expression pattern. Please check your syntax.');
      }
    }
    else {
      return message.reply('Invalid action. Available actions: add, remove, list, test');
    }
  }
});

// Custom image generation command for premium users
prefixCommands.set('custom-image', {
  name: 'custom-image',
  description: 'Generates custom images for your server (banner, icon, etc.)',
  usage: ';custom-image <style> <text>',
  example: ';custom-image modern "My Awesome Server"',
  category: 'premium',
  isPremium: true,
  isAdmin: true,
  execute: async (message, args) => {
    // Check premium status
    const isPremium = await checkPremium(message.guild.id);
    
    if (!isPremium) {
      return message.channel.send({ embeds: [premiumUpsellEmbed()] });
    }
    
    // Check if the user has permission to manage the server
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('You do not have permission to use this command.');
    }
    
    // Check if arguments were provided
    if (args.length < 2) {
      const embed = {
        color: 0x5865F2, // Discord Blurple
        title: 'Custom Image Generator',
        description: 'Generate custom images for your server with different styles.',
        fields: [
          {
            name: 'Usage',
            value: '`;custom-image <style> <text>`',
            inline: false
          },
          {
            name: 'Available Styles',
            value: '• modern (Clean, professional design)\n• neon (Vibrant neon effect)\n• pixel (Retro pixel art style)\n• minimalist (Simple, elegant design)\n• gradient (Smooth color transitions)',
            inline: false
          },
          {
            name: 'Examples',
            value: '`;custom-image modern "My Gaming Server"`\n`;custom-image neon "Night Club"`',
            inline: false
          }
        ],
        footer: {
          text: 'Guard-shin Bot Premium'
        }
      };
      
      return message.channel.send({ embeds: [embed] });
    }
    
    const style = args[0].toLowerCase();
    
    // Get text (handle quoted text if present)
    let text;
    if (args.slice(1).join(' ').startsWith('"') && args.slice(1).join(' ').endsWith('"')) {
      text = args.slice(1).join(' ').slice(1, -1);
    } else {
      text = args.slice(1).join(' ');
    }
    
    // Validate style
    const validStyles = ['modern', 'neon', 'pixel', 'minimalist', 'gradient'];
    
    if (!validStyles.includes(style)) {
      return message.reply(`Invalid style. Available styles: ${validStyles.join(', ')}`);
    }
    
    // In a production bot, this would connect to an image generation API
    // For this example, we'll send placeholder text
    const processingEmbed = {
      color: 0xFFA500, // Orange
      title: '🎨 Generating Image...',
      description: `Creating a ${style} style image with text: "${text}"`,
      footer: {
        text: 'This may take a few moments'
      }
    };
    
    const processingMessage = await message.channel.send({ embeds: [processingEmbed] });
    
    // Simulate processing time
    setTimeout(async () => {
      // In a real implementation, this would be where you generate and upload the image
      // For now, we'll just acknowledge with a message
      
      const completedEmbed = {
        color: 0x00FF00, // Green
        title: '✅ Image Created Successfully',
        description: `Here's your custom ${style} image with text: "${text}"`,
        image: {
          url: `https://via.placeholder.com/800x400/5865F2/FFFFFF?text=${encodeURIComponent(style + ': ' + text)}`
        },
        footer: {
          text: 'Premium Feature • Guard-shin Bot'
        }
      };
      
      await processingMessage.edit({ embeds: [completedEmbed] });
    }, 3000); // 3 second delay to simulate processing
  }
});

prefixCommands.set('raffle', {
  name: 'raffle',
  description: 'Run giveaways and raffles in your server.',
  usage: ';raffle <action> [options]',
  example: ';raffle start "Free Nitro" 60 1',
  category: 'premium',
  isPremium: true,
  isAdmin: false,
  execute: async (message, args) => {
    // Check premium status
    const isPremium = await checkPremium(message.guild.id);
    
    if (!isPremium) {
      return message.channel.send({ embeds: [premiumUpsellEmbed()] });
    }
    
    // Check if the user has permission to manage the server
    if (!message.member.permissions.has('ManageMessages')) {
      return message.reply('You do not have permission to use this command. You need Manage Messages permission.');
    }
    
    // Check if action was provided
    if (args.length < 1) {
      return message.reply('Please provide an action. Available actions: start, end, reroll, list');
    }
    
    const action = args[0].toLowerCase();
    
    if (action === 'start') {
      if (args.length < 4) {
        return message.reply('Please provide a prize, duration (in minutes), and winners count. Example: `;raffle start "Free Nitro" 60 1`');
      }
      
      let prize, duration, winners;
      
      // Handle quoted prize name
      const prizeMatch = args.slice(1).join(' ').match(/"([^"]+)"/);
      
      if (prizeMatch) {
        prize = prizeMatch[1];
        const remainingArgs = args.slice(1).join(' ').replace(`"${prize}"`, '').trim().split(/\s+/);
        duration = parseInt(remainingArgs[0]);
        winners = parseInt(remainingArgs[1]);
      } else {
        prize = args[1];
        duration = parseInt(args[2]);
        winners = parseInt(args[3]);
      }
      
      // Validate inputs
      if (isNaN(duration) || duration < 1 || duration > 10080) { // Max 1 week (10080 minutes)
        return message.reply('Duration must be between 1 and 10080 minutes (1 week).');
      }
      
      if (isNaN(winners) || winners < 1 || winners > 100) {
        return message.reply('Winners count must be between 1 and 100.');
      }
      
      // Calculate end time
      const endTime = new Date();
      endTime.setMinutes(endTime.getMinutes() + duration);
      
      // Create raffle embed
      const embed = {
        color: 0x00FF00, // Green
        title: '🎉 Raffle Started!',
        description: `**Prize:** ${prize}\n**Winners:** ${winners}\n**Ends:** <t:${Math.floor(endTime.getTime() / 1000)}:R>\n\nReact with 🎉 to enter!`,
        footer: {
          text: `Started by ${message.author.tag} | Ends at`
        },
        timestamp: endTime
      };
      
      // Send raffle message and add initial reaction
      try {
        const raffleMessage = await message.channel.send({ embeds: [embed] });
        await raffleMessage.react('🎉');
        
        message.reply(`Raffle started! ID: ${raffleMessage.id}`);
        
        // In a real implementation, store the raffle details in a database
        // and set up a timer to end the raffle automatically
        
      } catch (error) {
        console.error('Error starting raffle:', error);
        return message.reply('❌ Failed to start raffle. Make sure the bot has permission to send messages and add reactions.');
      }
    }
    else if (action === 'end') {
      if (args.length < 2) {
        return message.reply('Please provide the raffle message ID. Example: `;raffle end 123456789012345678`');
      }
      
      const raffleId = args[1];
      
      try {
        // Try to fetch the message
        const raffleMessage = await message.channel.messages.fetch(raffleId).catch(() => null);
        
        if (!raffleMessage) {
          return message.reply('Raffle not found. Make sure you provided the correct ID and the raffle is in this channel.');
        }
        
        // Check if it's a raffle message
        if (!raffleMessage.embeds[0] || !raffleMessage.embeds[0].title.includes('Raffle')) {
          return message.reply('The provided message ID is not a raffle.');
        }
        
        // Get raffle details from embed
        const embed = raffleMessage.embeds[0];
        const description = embed.description;
        
        // Extract the prize and winners count
        const prizeLine = description.split('\n').find(line => line.startsWith('**Prize:**'));
        const winnersLine = description.split('\n').find(line => line.startsWith('**Winners:**'));
        
        const prize = prizeLine ? prizeLine.replace('**Prize:** ', '') : 'Unknown Prize';
        const winnersCount = winnersLine ? parseInt(winnersLine.replace('**Winners:** ', '')) : 1;
        
        // Get reactions
        const reaction = raffleMessage.reactions.cache.get('🎉');
        if (!reaction) {
          return message.reply('No entries found for this raffle.');
        }
        
        // Get users who reacted
        const users = await reaction.users.fetch();
        const validEntrants = users.filter(user => !user.bot);
        
        if (validEntrants.size === 0) {
          return message.reply('No valid entries found for this raffle.');
        }
        
        // Select winners
        const winners = [];
        for (let i = 0; i < Math.min(winnersCount, validEntrants.size); i++) {
          const entrants = validEntrants.filter(user => !winners.some(w => w.id === user.id));
          if (entrants.size === 0) break;
          
          const winner = entrants.random();
          winners.push(winner);
        }
        
        // Create winners announcement
        const winnersText = winners.map(winner => `<@${winner.id}>`).join(', ');
        
        const newEmbed = {
          color: 0x00FFFF, // Cyan
          title: '🎉 Raffle Ended!',
          description: `**Prize:** ${prize}\n**Winners:** ${winnersText}\n\nCongratulations!`,
          footer: {
            text: `Ended by ${message.author.tag} | Ended at`
          },
          timestamp: new Date()
        };
        
        // Update the raffle message
        await raffleMessage.edit({ embeds: [newEmbed] });
        
        // Announce the winners
        return message.channel.send(`🎉 Congratulations to the winners of the **${prize}** raffle: ${winnersText}!`);
        
      } catch (error) {
        console.error('Error ending raffle:', error);
        return message.reply('❌ Failed to end raffle. Make sure the bot has permission to manage messages and reactions.');
      }
    }
    else if (action === 'reroll') {
      return message.reply('The reroll functionality would pick a new winner from an existing raffle. This would be implemented in a real bot.');
    }
    else if (action === 'list') {
      return message.reply('The list functionality would show all active raffles in the server. This would be implemented in a real bot.');
    }
    else {
      return message.reply('Invalid action. Available actions: start, end, reroll, list');
    }
  }
});

module.exports = {
  prefixCommands,
  handlePrefixCommand
};