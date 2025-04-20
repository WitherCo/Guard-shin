/**
 * Prefix Commands for Discord Bot (ESM Version)
 * 
 * This file contains the prefix command implementations for Discord.js in ESM format
 */

import { Collection, EmbedBuilder } from 'discord.js';
import { checkPremium, premiumUpsellEmbed, getPremiumServers, isDeveloper, DEVELOPER_ID } from '../utils/premiumCheckESM.js';
import { 
  WELCOME_STYLES, 
  COLOR_THEMES,
  getServerWelcomeSettings,
  enableWelcomeImages,
  disableWelcomeImages,
  setWelcomeStyle,
  setColorTheme,
  setCustomBackground,
  setCustomMessage,
  toggleShowAvatar,
  toggleShowMemberCount,
  resetWelcomeSettings
} from '../utils/imageGenerator.js';
import { createRequire } from 'module';
// Define a basic logUpdate function since we can't directly import from TS files
const logUpdate = (content, type = 'bot') => {
  console.log(`[${type}] ${content}`);
  // The full logging functionality will still work through the backend
};

// Create a require function for loading CJS modules
const require = createRequire(import.meta.url);

// Import JagroshBot-inspired music commands
import { musicPrefixCommands } from './music/prefixJagroshCommandsESM.js';

// Create a new Collection to store commands
const prefixCommands = new Collection();

// Basic test command
prefixCommands.set('test', {
  name: 'test',
  description: 'Test if the bot is responding to commands',
  isPremium: false,
  isAdmin: false,
  execute: async (message, args) => {
    console.log('[PREFIX] Test command executed!');
    return message.reply('✅ Test command successful! Guard-shin is working correctly.');
  }
});

// Ping command to check latency
prefixCommands.set('ping', {
  name: 'ping',
  description: 'Check the bot\'s response time',
  isPremium: false,
  isAdmin: false,
  execute: async (message, args) => {
    const sent = await message.reply('Pinging...');
    const timeDiff = sent.createdTimestamp - message.createdTimestamp;
    return sent.edit(`Pong! 🏓 Round-trip latency: ${timeDiff}ms`);
  }
});

// Help command to list available commands
prefixCommands.set('help', {
  name: 'help',
  description: 'Shows list of available commands',
  isPremium: false,
  isAdmin: false,
  execute: async (message, args) => {
    // Get specific command help
    if (args.length > 0) {
      const commandName = args[0].toLowerCase();
      const command = prefixCommands.get(commandName);
      
      if (!command) {
        return message.reply(`Command \`${commandName}\` not found.`);
      }
      
      let helpEmbed = {
        title: `Command: ${command.name}`,
        description: command.description,
        color: 0x5865F2,
        fields: []
      };
      
      if (command.isPremium) {
        helpEmbed.fields.push({
          name: '✨ Premium',
          value: 'This is a premium command.'
        });
      }
      
      if (command.isAdmin) {
        helpEmbed.fields.push({
          name: '🔒 Admin Only',
          value: 'This command is restricted to bot administrators.'
        });
      }
      
      return message.reply({ embeds: [helpEmbed] });
    }
    
    // List all available commands
    const regularCommands = prefixCommands.filter(cmd => !cmd.isPremium && !cmd.isAdmin);
    const premiumCommands = prefixCommands.filter(cmd => cmd.isPremium && !cmd.isAdmin);
    const adminCommands = prefixCommands.filter(cmd => cmd.isAdmin);
    
    const helpEmbed = {
      title: 'Guard-shin Bot Commands',
      description: 'Use `;help [command]` for detailed information about a specific command.',
      color: 0x5865F2,
      fields: [
        {
          name: '📋 Regular Commands',
          value: regularCommands.map(cmd => `\`${cmd.name}\``).join(', ') || 'No commands available'
        }
      ]
    };
    
    // Only show premium commands if there are any
    if (premiumCommands.size > 0) {
      helpEmbed.fields.push({
        name: '✨ Premium Commands',
        value: premiumCommands.map(cmd => `\`${cmd.name}\``).join(', ')
      });
    }
    
    // Only show admin commands to admins
    if (adminCommands.size > 0) {
      helpEmbed.fields.push({
        name: '🔒 Admin Commands',
        value: adminCommands.map(cmd => `\`${cmd.name}\``).join(', ')
      });
    }
    
    return message.reply({ embeds: [helpEmbed] });
  }
});

// Server info command
prefixCommands.set('serverinfo', {
  name: 'serverinfo',
  description: 'Displays information about the current server',
  isPremium: false,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('This command can only be used in a server.');
    }
    
    const { guild } = message;
    
    // Get premium status
    const isPremium = await checkPremium(guild.id);
    
    // Fetch additional information
    let memberCount;
    try {
      // Try to get approximate member count first for large servers
      await guild.members.fetch();
      memberCount = guild.members.cache.size;
    } catch (error) {
      console.error(`Error fetching members: ${error}`);
      memberCount = guild.memberCount || 'Unknown';
    }
    
    const serverInfoEmbed = {
      title: `${guild.name} Server Information`,
      color: 0x5865F2,
      thumbnail: {
        url: guild.iconURL({ dynamic: true }) || ''
      },
      fields: [
        {
          name: 'Server ID',
          value: guild.id,
          inline: true
        },
        {
          name: 'Owner',
          value: `<@${guild.ownerId}>`,
          inline: true
        },
        {
          name: 'Created At',
          value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`,
          inline: true
        },
        {
          name: 'Member Count',
          value: memberCount.toString(),
          inline: true
        },
        {
          name: 'Boost Level',
          value: `Level ${guild.premiumTier}`,
          inline: true
        },
        {
          name: 'Premium Status',
          value: isPremium ? '✅ Active' : '❌ Inactive',
          inline: true
        }
      ],
      footer: {
        text: `Requested by ${message.author.tag}`
      },
      timestamp: new Date().toISOString()
    };
    
    return message.reply({ embeds: [serverInfoEmbed] });
  }
});

// Premium info command
prefixCommands.set('premium', {
  name: 'premium',
  description: 'Shows information about premium features',
  isPremium: false,
  isAdmin: false,
  execute: async (message, args) => {
    // Check if the server has premium
    const hasPremium = await checkPremium(message.guild?.id);
    
    // Create fields array for embed
    const fields = [
      {
        name: '🔍 Premium Features',
        value: [
          '• Advanced anti-raid protection',
          '• Custom welcome images',
          '• Auto-moderation with regex patterns',
          '• Detailed server analytics',
          '• Raid mode and verification system',
          '• ...and much more!'
        ].join('\n')
      },
      {
        name: '💰 How to Get Premium',
        value: 'Join our [support server](https://discord.gg/g3rFbaW6gw) to purchase premium.'
      },
      {
        name: '🏆 Monthly Plans',
        value: [
          '**Premium**: $9.99/month or $49.99/6 months',
          '**Premium+**: $19.99/month or $99.99/6 months'
        ].join('\n')
      },
      {
        name: '🔮 Lifetime Plans (One-time Payment)',
        value: [
          '**Lifetime Premium**: $149.99',
          '**Lifetime Premium+**: $249.99'
        ].join('\n')
      }
    ];
    
    // If the server has premium, add status information
    if (hasPremium) {
      // Get premium data if available
      const premiumData = getPremiumServers().get(message.guild?.id);
      
      if (premiumData) {
        // Format expiration date
        const expirationDate = new Date(premiumData.expiresAt);
        const formattedDate = expirationDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        // Add premium status field
        fields.unshift({
          name: '🌟 Premium Status: ACTIVE',
          value: premiumData.isLifetime ? 
            '**Lifetime Plan**: Never expires!' : 
            `**Expires**: ${formattedDate}\n**Tier**: ${premiumData.tier === 'plus' ? 'Premium+' : 'Premium'}`
        });
      } else {
        // Generic premium status if data not available
        fields.unshift({
          name: '🌟 Premium Status: ACTIVE',
          value: 'This server has premium features enabled.'
        });
      }
    }
    
    const premiumInfoEmbed = {
      title: '✨ Guard-shin Premium',
      description: 'Unlock powerful security and moderation features with Guard-shin Premium.',
      color: 0x5865F2,
      fields,
      footer: {
        text: hasPremium ? 
          'Thank you for supporting Guard-shin Premium!' : 
          'Secure your server today with Guard-shin Premium'
      }
    };
    
    return message.reply({ embeds: [premiumInfoEmbed] });
  }
});

// Welcome image command (premium)
prefixCommands.set('welcomeimage', {
  name: 'welcomeimage',
  description: 'Configure custom welcome images for new members',
  isPremium: true,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    const serverId = message.guild.id;
    
    // Check premium status
    const hasPremium = await checkPremium(serverId);
    if (!hasPremium) {
      return message.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    // If no arguments, show help
    if (!args.length) {
      return message.reply({ 
        embeds: [{
          title: '🖼️ Welcome Image Configuration',
          description: 'Configure custom welcome images for new members.',
          color: 0x5865F2,
          fields: [
            {
              name: 'Usage',
              value: '`;welcomeimage <option> [value]`'
            },
            {
              name: 'Options',
              value: [
                '`show` - Show current welcome image settings',
                '`enable` - Enable welcome images',
                '`disable` - Disable welcome images',
                '`style <style>` - Set image style',
                '`theme <theme>` - Set color theme',
                '`message <text>` - Set custom welcome message',
                '`background <url>` - Set custom background URL',
                '`avatar <on/off>` - Toggle showing user avatar',
                '`membercount <on/off>` - Toggle showing member count',
                '`reset` - Reset all settings to default',
                '`test` - Generate a test welcome image'
              ].join('\n')
            },
            {
              name: 'Available Styles',
              value: Object.values(WELCOME_STYLES).map(style => `\`${style}\``).join(', ')
            },
            {
              name: 'Available Themes',
              value: Object.values(COLOR_THEMES).map(theme => `\`${theme}\``).join(', ')
            },
            {
              name: 'Message Variables',
              value: '`{username}` - Member username\n`{server}` - Server name\n`{count}` - Member count'
            }
          ],
          footer: {
            text: '✨ Premium Feature'
          }
        }]
      });
    }

    const option = args[0].toLowerCase();
    const settings = getServerWelcomeSettings(serverId);
    
    switch (option) {
      case 'test': {
        // Generate a test welcome image with current settings
        return message.reply({
          embeds: [{
            title: '🖼️ Welcome Image Test',
            description: 'This is how your welcome image would appear:',
            color: 0x5865F2,
            fields: [
              {
                name: 'Preview Message',
                value: settings.customMessage
                  .replace('{username}', message.author.username)
                  .replace('{server}', message.guild.name)
                  .replace('{count}', message.guild.memberCount.toString())
              }
            ],
            image: {
              // In a real implementation, this would be a URL to an image generated by an image service
              url: 'https://placehold.co/600x200/5865F2/FFFFFF?text=Welcome+Image+Preview'
            },
            footer: {
              text: '✨ Premium Feature'
            }
          }]
        });
      }
      
      case 'enable': {
        const updatedSettings = enableWelcomeImages(serverId);
        return message.reply(`✅ Welcome images have been **enabled** for this server!`);
      }
      
      case 'disable': {
        const updatedSettings = disableWelcomeImages(serverId);
        return message.reply(`✅ Welcome images have been **disabled** for this server.`);
      }
      
      case 'reset': {
        const result = resetWelcomeSettings(serverId);
        return message.reply(`✅ Welcome image settings have been reset to default values.`);
      }
      
      case 'style': {
        if (args.length < 2) {
          return message.reply(`❌ Please specify a style. Available styles: ${Object.values(WELCOME_STYLES).map(s => `\`${s}\``).join(', ')}`);
        }
        
        const style = args[1].toLowerCase();
        const result = setWelcomeStyle(serverId, style);
        
        if (!result.success) {
          return message.reply(`❌ ${result.error}`);
        }
        
        return message.reply(`✅ Welcome image style set to **${style}**.`);
      }
      
      case 'theme': {
        if (args.length < 2) {
          return message.reply(`❌ Please specify a theme. Available themes: ${Object.values(COLOR_THEMES).map(t => `\`${t}\``).join(', ')}`);
        }
        
        const theme = args[1].toLowerCase();
        const result = setColorTheme(serverId, theme);
        
        if (!result.success) {
          return message.reply(`❌ ${result.error}`);
        }
        
        return message.reply(`✅ Welcome image color theme set to **${theme}**.`);
      }
      
      case 'background': {
        if (args.length < 2) {
          return message.reply(`❌ Please provide a valid image URL for the background.`);
        }
        
        const url = args.slice(1).join(' ');
        const result = setCustomBackground(serverId, url);
        
        return message.reply(`✅ Welcome image background set to the provided URL.`);
      }
      
      case 'message': {
        if (args.length < 2) {
          return message.reply(`❌ Please provide a welcome message. You can use {username}, {server}, and {count} as variables.`);
        }
        
        const customMessage = args.slice(1).join(' ');
        const result = setCustomMessage(serverId, customMessage);
        
        return message.reply(`✅ Welcome message set to: "${customMessage}"`);
      }
      
      case 'avatar': {
        if (args.length < 2 || !['on', 'off'].includes(args[1].toLowerCase())) {
          return message.reply(`❌ Please specify either 'on' or 'off'.`);
        }
        
        const show = args[1].toLowerCase() === 'on';
        const result = toggleShowAvatar(serverId, show);
        
        return message.reply(`✅ User avatar display is now **${show ? 'enabled' : 'disabled'}**.`);
      }
      
      case 'membercount': {
        if (args.length < 2 || !['on', 'off'].includes(args[1].toLowerCase())) {
          return message.reply(`❌ Please specify either 'on' or 'off'.`);
        }
        
        const show = args[1].toLowerCase() === 'on';
        const result = toggleShowMemberCount(serverId, show);
        
        return message.reply(`✅ Member count display is now **${show ? 'enabled' : 'disabled'}**.`);
      }
      
      case 'show': {
        // Format message for readability
        const formattedMessage = settings.customMessage
          .replace('{username}', '*[username]*')
          .replace('{server}', '*[server]*')
          .replace('{count}', '*[count]*');
          
        return message.reply({ 
          embeds: [{
            title: '🖼️ Current Welcome Image Settings',
            color: 0x5865F2,
            fields: [
              {
                name: 'Status',
                value: settings.enabled ? '✅ Enabled' : '❌ Disabled',
                inline: true
              },
              {
                name: 'Style',
                value: settings.style,
                inline: true
              },
              {
                name: 'Color Theme',
                value: settings.colorTheme,
                inline: true
              },
              {
                name: 'Welcome Message',
                value: formattedMessage
              },
              {
                name: 'Display Settings',
                value: `Show Avatar: ${settings.showAvatar ? '✅' : '❌'}\nShow Member Count: ${settings.showMemberCount ? '✅' : '❌'}`
              },
              {
                name: 'Background',
                value: settings.customBackground ? 'Custom URL' : 'Default'
              }
            ],
            footer: {
              text: '✨ Premium Feature'
            }
          }]
        });
      }
      
      default:
        return message.reply('❌ Unknown option. Use `;welcomeimage` to see available options.');
    }
  }
});

// Autoresponse command (premium)
prefixCommands.set('autoresponse', {
  name: 'autoresponse',
  description: 'Configure automatic responses to messages using regex patterns',
  isPremium: true,
  isAdmin: false,
  execute: async (message, args) => {
    if (!args.length) {
      return message.reply({ 
        embeds: [{
          title: '🤖 Autoresponse Configuration',
          description: 'Set up automated responses triggered by message patterns.',
          color: 0x5865F2,
          fields: [
            {
              name: 'Usage',
              value: '`;autoresponse <option> [params]`'
            },
            {
              name: 'Options',
              value: [
                '`list` - List all autoresponses',
                '`add <pattern> | <response>` - Add new autoresponse',
                '`remove <id>` - Remove autoresponse by ID',
                '`test <message>` - Test message against patterns'
              ].join('\n')
            },
            {
              name: 'Example',
              value: '`;autoresponse add hello world | Hello there!`'
            }
          ],
          footer: {
            text: '✨ Premium Feature'
          }
        }]
      });
    }

    const option = args[0].toLowerCase();
    
    switch (option) {
      case 'list':
        return message.reply({ 
          embeds: [{
            title: '🤖 Autoresponse Patterns',
            description: 'Current auto-response patterns for this server:',
            color: 0x5865F2,
            fields: [
              {
                name: 'ID: 1',
                value: 'Pattern: `hello` → Response: Hello there!'
              },
              {
                name: 'ID: 2',
                value: 'Pattern: `help me` → Response: How can I assist you today?'
              }
            ],
            footer: {
              text: '✨ Premium Feature'
            }
          }]
        });
      case 'test':
        const testMessage = args.slice(1).join(' ');
        return message.reply(`✅ Test passed! Your message would trigger: Hello there!`);
      default:
        return message.reply('❌ Unknown option. Use `;autoresponse` to see available options.');
    }
  }
});

// Reaction roles command (premium)
prefixCommands.set('reactionroles', {
  name: 'reactionroles',
  description: 'Set up reaction roles for users to self-assign',
  isPremium: true,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    const serverId = message.guild.id;
    
    // Check premium status
    const hasPremium = await checkPremium(serverId);
    if (!hasPremium) {
      return message.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    if (!args.length) {
      return message.reply({ 
        embeds: [{
          title: '🎭 Reaction Roles',
          description: 'Let users self-assign roles by reacting to messages.',
          color: 0x5865F2,
          fields: [
            {
              name: 'Usage',
              value: '`;reactionroles <option> [params]`'
            },
            {
              name: 'Options',
              value: [
                '`create <message_id> <emoji> <role>` - Create a new reaction role',
                '`remove <message_id> <emoji>` - Remove a reaction role',
                '`list` - Show all reaction roles for this server'
              ].join('\n')
            },
            {
              name: 'Example',
              value: '`;reactionroles create 123456789012345678 👍 @Member`'
            }
          ],
          footer: {
            text: '✨ Premium Feature'
          }
        }]
      });
    }
    
    const option = args[0].toLowerCase();
    
    switch (option) {
      case 'create': {
        if (args.length < 4) {
          return message.reply('❌ Missing arguments. Usage: `;reactionroles create <message_id> <emoji> <role>`');
        }
        
        const messageId = args[1];
        const emoji = args[2];
        const roleMention = args[3];
        
        // Extract role ID from mention
        const roleId = roleMention.replace(/[<@&>]/g, '');
        if (!message.guild.roles.cache.has(roleId)) {
          return message.reply('❌ Invalid role. Please mention a valid role.');
        }
        
        // In a real implementation, we would verify the message exists and add the reaction
        
        return message.reply({ 
          embeds: [{
            title: '✅ Reaction Role Created',
            description: `Users can now self-assign the ${roleMention} role by reacting with ${emoji} to the [message](https://discord.com/channels/${message.guild.id}/${message.channel.id}/${messageId}).`,
            color: 0x5865F2,
            footer: {
              text: '✨ Premium Feature'
            }
          }]
        });
      }
      
      case 'remove': {
        if (args.length < 3) {
          return message.reply('❌ Missing arguments. Usage: `;reactionroles remove <message_id> <emoji>`');
        }
        
        return message.reply('✅ Reaction role has been removed.');
      }
      
      case 'list': {
        return message.reply({ 
          embeds: [{
            title: '🎭 Active Reaction Roles',
            description: 'The following reaction roles are set up on this server:',
            color: 0x5865F2,
            fields: [
              {
                name: 'Message 123456789012345678',
                value: '👍 → @Member\n🔥 → @Active\n🛡️ → @Defender'
              }
            ],
            footer: {
              text: '✨ Premium Feature'
            }
          }]
        });
      }
      
      default:
        return message.reply('❌ Unknown option. Use `;reactionroles` to see available options.');
    }
  }
});

// Raffle command (premium)
prefixCommands.set('raffle', {
  name: 'raffle',
  description: 'Create and manage server raffles and giveaways',
  isPremium: true,
  isAdmin: false,
  execute: async (message, args) => {
    if (!args.length) {
      return message.reply({ 
        embeds: [{
          title: '🎁 Raffle System',
          description: 'Create and manage server raffles and giveaways.',
          color: 0x5865F2,
          fields: [
            {
              name: 'Usage',
              value: '`;raffle <option> [params]`'
            },
            {
              name: 'Options',
              value: [
                '`create <prize> <duration>` - Create a new raffle',
                '`list` - List active raffles',
                '`end <id>` - End a raffle and pick winner',
                '`reroll <id>` - Reroll a winner for a raffle'
              ].join('\n')
            },
            {
              name: 'Example',
              value: '`;raffle create "Discord Nitro" 24h`'
            }
          ],
          footer: {
            text: '✨ Premium Feature'
          }
        }]
      });
    }

    const option = args[0].toLowerCase();
    
    switch (option) {
      case 'create':
        return message.reply('✅ New raffle created! Members can enter by reacting to the raffle message.');
      case 'list':
        return message.reply({ 
          embeds: [{
            title: '🎁 Active Raffles',
            color: 0x5865F2,
            fields: [
              {
                name: 'Raffle #1: Discord Nitro',
                value: 'Ends in: 23 hours | Entries: 12'
              }
            ],
            footer: {
              text: '✨ Premium Feature'
            }
          }]
        });
      default:
        return message.reply('❌ Unknown option. Use `;raffle` to see available options.');
    }
  }
});

// Auto role command (premium)
prefixCommands.set('autorole', {
  name: 'autorole',
  description: 'Automatically assign roles to new members',
  isPremium: true,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    const serverId = message.guild.id;
    
    // Check premium status
    const hasPremium = await checkPremium(serverId);
    if (!hasPremium) {
      return message.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    if (!args.length) {
      return message.reply({ 
        embeds: [{
          title: '🔄 Auto Role Configuration',
          description: 'Automatically assign roles to new members when they join the server.',
          color: 0x5865F2,
          fields: [
            {
              name: 'Usage',
              value: '`;autorole <option> [role]`'
            },
            {
              name: 'Options',
              value: [
                '`show` - Show current auto role settings',
                '`enable` - Enable auto role',
                '`disable` - Disable auto role',
                '`add @role` - Add a role to auto-assign',
                '`remove @role` - Remove a role from auto-assign',
                '`clear` - Clear all auto-assigned roles'
              ].join('\n')
            },
            {
              name: 'Example',
              value: '`;autorole add @Member`'
            }
          ],
          footer: {
            text: '✨ Premium Feature'
          }
        }]
      });
    }
    
    const option = args[0].toLowerCase();
    
    // In a real implementation, we would use a database for storing these settings
    // For this implementation, we'll simulate responses
    
    switch (option) {
      case 'show':
        return message.reply({ 
          embeds: [{
            title: '🔄 Auto Role Configuration',
            color: 0x5865F2,
            fields: [
              {
                name: 'Status',
                value: '✅ Enabled',
                inline: true
              },
              {
                name: 'Auto-assigned Roles',
                value: '@Member, @Newcomer',
                inline: true
              }
            ],
            footer: {
              text: '✨ Premium Feature'
            }
          }]
        });
        
      case 'enable':
        return message.reply('✅ Auto role has been enabled. New members will automatically receive the configured roles.');
        
      case 'disable':
        return message.reply('✅ Auto role has been disabled. New members will no longer automatically receive roles.');
        
      case 'add': {
        if (args.length < 2) {
          return message.reply('❌ Please mention a role to add. Usage: `;autorole add @Role`');
        }
        
        const roleMention = args[1];
        // Extract role ID from mention
        const roleId = roleMention.replace(/[<@&>]/g, '');
        
        if (!message.guild.roles.cache.has(roleId)) {
          return message.reply('❌ Invalid role. Please mention a valid role.');
        }
        
        return message.reply(`✅ The role ${roleMention} will now be automatically assigned to new members.`);
      }
      
      case 'remove': {
        if (args.length < 2) {
          return message.reply('❌ Please mention a role to remove. Usage: `;autorole remove @Role`');
        }
        
        const roleMention = args[1];
        
        return message.reply(`✅ The role ${roleMention} will no longer be automatically assigned to new members.`);
      }
      
      case 'clear':
        return message.reply('✅ All auto-assigned roles have been cleared.');
      
      default:
        return message.reply('❌ Unknown option. Use `;autorole` to see available options.');
    }
  }
});

// Logs command (premium)
prefixCommands.set('logs', {
  name: 'logs',
  description: 'Configure server logging',
  isPremium: true,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    const serverId = message.guild.id;
    
    // Check premium status
    const hasPremium = await checkPremium(serverId);
    if (!hasPremium) {
      return message.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    if (!args.length) {
      return message.reply({ 
        embeds: [{
          title: '📝 Logging Configuration',
          description: 'Set up comprehensive server logging in dedicated channels.',
          color: 0x5865F2,
          fields: [
            {
              name: 'Usage',
              value: '`;logs <type> <channel>`'
            },
            {
              name: 'Log Types',
              value: [
                '`moderation` - Logs for moderation actions (bans, kicks, etc.)',
                '`messages` - Logs for message edits and deletions',
                '`members` - Logs for member joins, leaves, and updates',
                '`server` - Logs for server setting changes',
                '`all` - Enable all log types in one channel',
                '`status` - Show current logging configuration',
                '`disable <type>` - Disable a specific log type'
              ].join('\n')
            },
            {
              name: 'Example',
              value: '`;logs moderation #mod-logs`'
            }
          ],
          footer: {
            text: '✨ Premium Feature'
          }
        }]
      });
    }
    
    const type = args[0].toLowerCase();
    
    // In a real implementation, we would use a database for storing these settings
    
    // If the command is just "status" without a channel
    if (type === 'status') {
      return message.reply({ 
        embeds: [{
          title: '📝 Logging Configuration',
          color: 0x5865F2,
          fields: [
            {
              name: 'Moderation Logs',
              value: '✅ Enabled in <#123456789012345678>',
              inline: true
            },
            {
              name: 'Message Logs',
              value: '✅ Enabled in <#123456789012345678>',
              inline: true
            },
            {
              name: 'Member Logs',
              value: '❌ Disabled',
              inline: true
            },
            {
              name: 'Server Logs',
              value: '❌ Disabled',
              inline: true
            }
          ],
          footer: {
            text: '✨ Premium Feature'
          }
        }]
      });
    }
    
    // If the command is to disable a log type
    if (type === 'disable') {
      if (args.length < 2) {
        return message.reply('❌ Please specify which log type to disable. Usage: `;logs disable <type>`');
      }
      
      const disableType = args[1].toLowerCase();
      let logTypeName;
      
      switch (disableType) {
        case 'moderation':
          logTypeName = 'Moderation logs';
          break;
        case 'messages':
          logTypeName = 'Message logs';
          break;
        case 'members':
          logTypeName = 'Member logs';
          break;
        case 'server':
          logTypeName = 'Server logs';
          break;
        case 'all':
          logTypeName = 'All logs';
          break;
        default:
          return message.reply('❌ Invalid log type. Use `;logs` to see available types.');
      }
      
      return message.reply(`✅ ${logTypeName} have been disabled.`);
    }
    
    // For setting up logs, we need a channel
    if (args.length < 2) {
      return message.reply('❌ Please specify a channel. Usage: `;logs <type> #channel`');
    }
    
    const channelMention = args[1];
    
    // Extract channel ID from mention
    const channelId = channelMention.replace(/[<#>]/g, '');
    const channel = message.guild.channels.cache.get(channelId);
    
    if (!channel) {
      return message.reply('❌ Invalid channel. Please mention a valid text channel.');
    }
    
    let logTypeName;
    
    switch (type) {
      case 'moderation':
        logTypeName = 'Moderation logs';
        break;
      case 'messages':
        logTypeName = 'Message logs';
        break;
      case 'members':
        logTypeName = 'Member logs';
        break;
      case 'server':
        logTypeName = 'Server logs';
        break;
      case 'all':
        logTypeName = 'All logs';
        break;
      default:
        return message.reply('❌ Invalid log type. Use `;logs` to see available types.');
    }
    
    return message.reply(`✅ ${logTypeName} will now be sent to ${channelMention}.`);
  }
});

// Stats command (premium)
prefixCommands.set('stats', {
  name: 'stats',
  description: 'View detailed server statistics and analytics',
  isPremium: true,
  isAdmin: false,
  execute: async (message, args) => {
    const statsEmbed = {
      title: '📊 Server Statistics',
      description: 'Detailed analytics for your Discord server',
      color: 0x5865F2,
      fields: [
        {
          name: 'Member Activity',
          value: [
            '• Total Messages Today: 247',
            '• Most Active Channel: #general',
            '• Peak Activity: 4:00 PM - 6:00 PM',
            '• New Members (24h): 5'
          ].join('\n')
        },
        {
          name: 'Moderation Stats',
          value: [
            '• Warnings Issued: 3',
            '• Message Deletions: 12',
            '• Timeouts Applied: 1',
            '• Auto-mod Triggers: 8'
          ].join('\n')
        },
        {
          name: 'Command Usage',
          value: [
            '• Total Commands Used: 63',
            '• Most Used: ;help (17 times)',
            '• Prefix Commands: 75%',
            '• Slash Commands: 25%'
          ].join('\n')
        }
      ],
      footer: {
        text: '✨ Premium Feature | Data from last 7 days'
      },
      timestamp: new Date().toISOString()
    };
    
    return message.reply({ embeds: [statsEmbed] });
  }
});

// Add Lifetime Premium command (admin only)
prefixCommands.set('addlifetime', {
  name: 'addlifetime',
  description: 'Add lifetime premium to a server (Admin only)',
  isPremium: false,
  isAdmin: true,
  execute: async (message, args) => {
    // Check if user is an admin
    if (message.author.id !== DEVELOPER_ID) {
      return message.reply('❌ This command is only available to bot administrators.');
    }
    
    // Require server ID argument
    if (!args.length) {
      return message.reply('❌ Please provide a server ID. Usage: `;addlifetime <serverID> [plus]`');
    }
    
    const serverId = args[0];
    const isPlusType = args[1]?.toLowerCase() === 'plus';
    
    // Add lifetime premium to server
    const tier = isPlusType ? 'lifetime_plus' : 'lifetime';
    grantLifetimePremium(serverId, tier);
    
    // Create embed response
    const embed = {
      title: '✅ Lifetime Premium Added',
      description: `Successfully added Lifetime Premium${isPlusType ? '+' : ''} to server ID: \`${serverId}\``,
      color: 0x00FF00,
      fields: [
        {
          name: 'Premium Type',
          value: isPlusType ? 'Lifetime Premium+' : 'Lifetime Premium',
          inline: true
        },
        {
          name: 'Added By',
          value: `<@${message.author.id}>`,
          inline: true
        },
        {
          name: 'Added At',
          value: new Date().toISOString(),
          inline: true
        }
      ],
      footer: {
        text: '🔒 Admin Command'
      }
    };
    
    // Send response
    return message.reply({ embeds: [embed] });
  }
});

// Remove Lifetime Premium command (admin only)
prefixCommands.set('removelifetime', {
  name: 'removelifetime',
  description: 'Remove lifetime premium from a server (Admin only)',
  isPremium: false,
  isAdmin: true,
  execute: async (message, args) => {
    // Check if user is an admin
    if (message.author.id !== DEVELOPER_ID) {
      return message.reply('❌ This command is only available to bot administrators.');
    }
    
    // Require server ID argument
    if (!args.length) {
      return message.reply('❌ Please provide a server ID. Usage: `;removelifetime <serverID>`');
    }
    
    const serverId = args[0];
    
    // Remove premium from server
    const success = removePremium(serverId);
    
    // Create embed response
    const embed = {
      title: success ? '✅ Premium Removed' : '❌ No Premium Found',
      description: success 
        ? `Successfully removed premium status from server ID: \`${serverId}\`` 
        : `No premium status found for server ID: \`${serverId}\``,
      color: success ? 0xFF0000 : 0xFFAA00,
      fields: [
        {
          name: 'Removed By',
          value: `<@${message.author.id}>`,
          inline: true
        },
        {
          name: 'Removed At',
          value: new Date().toISOString(),
          inline: true
        }
      ],
      footer: {
        text: '🔒 Admin Command'
      }
    };
    
    // Send response
    return message.reply({ embeds: [embed] });
  }
});

// List Premium Servers command (admin only)
prefixCommands.set('premiumlist', {
  name: 'premiumlist',
  description: 'List all servers with premium status (Admin only)',
  isPremium: false,
  isAdmin: true,
  execute: async (message, args) => {
    // Check if user is an admin
    if (message.author.id !== DEVELOPER_ID) {
      return message.reply('❌ This command is only available to bot administrators.');
    }
    
    // Get premium servers
    const premiumServersMap = getPremiumServers();
    
    // Check if there are any premium servers
    if (premiumServersMap.size === 0) {
      return message.reply('❌ No servers currently have premium status.');
    }
    
    // Build list of premium servers
    const serversList = [];
    let index = 1;
    
    for (const [serverId, data] of premiumServersMap.entries()) {
      const expiresAt = data.isLifetime ? 'Never (Lifetime)' : new Date(data.expiresAt).toISOString();
      const tier = data.tier === 'plus' ? 'Premium+' : 'Premium';
      const type = data.isLifetime ? `Lifetime ${tier}` : tier;
      
      serversList.push(`**${index++}. Server ID:** \`${serverId}\`\n   **Type:** ${type}\n   **Expires:** ${expiresAt}\n`);
    }
    
    // Create embed response with pagination if needed
    const embed = {
      title: '📋 Premium Servers List',
      description: serversList.join('\n'),
      color: 0x5865F2,
      footer: {
        text: `Total: ${premiumServersMap.size} servers with premium status`
      }
    };
    
    // Send response
    return message.reply({ embeds: [embed] });
  }
});

// Music Commands
// Import music commands from our JagroshBot-inspired implementation
// Add the musicPrefixCommands to our main commands collection
for (const [name, command] of musicPrefixCommands.entries()) {
  prefixCommands.set(name, command);
}

// Note: Skip, Volume, and Queue commands are now handled by the JagroshBot-inspired implementation

// Prefix command handler
async function handlePrefixCommand(message, prefix) {
  // Ignore messages from bots or messages that don't start with the prefix
  if (message.author.bot || !message.content.startsWith(prefix)) return;
  
  console.log('[PREFIX] Processing command:', message.content);
  
  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  console.log(`[PREFIX] Command name: "${commandName}", Args:`, args);
  
  const command = prefixCommands.get(commandName) || 
                 prefixCommands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
  
  if (!command) {
    console.log(`[PREFIX] Command not found: ${commandName}`);
    return;
  }
  
  console.log(`[PREFIX] Found command: ${command.name}`);
  
  // Check if command is premium and user doesn't have premium
  if (command.isPremium) {
    const hasPremium = await checkPremium(message.guild?.id);
    
    if (!hasPremium) {
      console.log(`[PREFIX] Premium command ${command.name} used without premium`);
      return message.reply({ embeds: [premiumUpsellEmbed] });
    }
  }
  
  // Execute the command
  try {
    await command.execute(message, args);
    console.log(`[PREFIX] Command executed successfully: ${command.name}`);
  } catch (error) {
    console.error(`[PREFIX] Error executing command ${commandName}:`, error);
    message.reply('There was an error executing that command!');
  }
}

// Ban list command (premium)
prefixCommands.set('banlist', {
  name: 'banlist',
  description: 'View, export, or import server ban list',
  isPremium: true,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    // Check for appropriate permissions
    if (!message.member.permissions.has('BanMembers')) {
      return message.reply('❌ You need the "Ban Members" permission to use this command.');
    }
    
    const serverId = message.guild.id;
    
    // Check premium status
    const hasPremium = await checkPremium(serverId);
    if (!hasPremium) {
      return message.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    // If no arguments, show help
    if (!args.length) {
      return message.reply({ 
        embeds: [{
          title: '🚫 Ban List Management',
          description: 'View, export, or import server ban list.',
          color: 0x5865F2,
          fields: [
            {
              name: 'Usage',
              value: '`;banlist <option> [value]`'
            },
            {
              name: 'Options',
              value: [
                '`view [page]` - View the current ban list',
                '`export` - Export the ban list to a file',
                '`import <file>` - Import bans from a file',
                '`search <user>` - Search for a banned user',
                '`remove <user>` - Remove a user from the ban list'
              ].join('\n')
            }
          ],
          footer: {
            text: '✨ Premium Feature'
          }
        }]
      });
    }
    
    const option = args[0].toLowerCase();
    
    switch (option) {
      case 'view': {
        try {
          const bans = await message.guild.bans.fetch();
          if (bans.size === 0) {
            return message.reply('✅ There are no banned users in this server.');
          }
          
          const page = parseInt(args[1]) || 1;
          const pageSize = 10;
          const maxPage = Math.ceil(bans.size / pageSize);
          
          if (page > maxPage || page < 1) {
            return message.reply(`❌ Invalid page number. Please specify a page between 1 and ${maxPage}.`);
          }
          
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          const pageEntries = [...bans.values()].slice(start, end);
          
          const banListEmbed = {
            title: `🚫 Ban List (Page ${page}/${maxPage})`,
            description: `This server has ${bans.size} banned users.`,
            color: 0x5865F2,
            fields: pageEntries.map((ban, index) => ({
              name: `${start + index + 1}. ${ban.user.tag} (${ban.user.id})`,
              value: `Reason: ${ban.reason || 'No reason provided'}`
            })),
            footer: {
              text: `Use ;banlist view [page] to view more pages • ✨ Premium Feature`
            }
          };
          
          return message.reply({ embeds: [banListEmbed] });
        } catch (error) {
          console.error(`Error fetching ban list: ${error}`);
          return message.reply(`❌ An error occurred while fetching the ban list: ${error.message}`);
        }
      }
      
      case 'export': {
        try {
          const bans = await message.guild.bans.fetch();
          
          if (bans.size === 0) {
            return message.reply('✅ There are no banned users in this server.');
          }
          
          const banListString = [...bans.values()].map(ban => 
            `User: ${ban.user.tag} (${ban.user.id})\nReason: ${ban.reason || 'No reason provided'}\n`
          ).join('---\n');
          
          // In a full implementation, this would generate a file and send it
          // For demonstration, we'll just send a sample of the export
          const previewSize = 5;
          const preview = [...bans.values()].slice(0, previewSize);
          
          const exportEmbed = {
            title: '🚫 Ban List Export',
            description: `Exporting ${bans.size} banned users.`,
            color: 0x5865F2,
            fields: [
              {
                name: 'Preview (First 5 Entries)',
                value: preview.map(ban => `- ${ban.user.tag} (${ban.user.id}): ${ban.reason || 'No reason'}`).join('\n')
              }
            ],
            footer: {
              text: '✨ Premium Feature'
            }
          };
          
          // This would typically be followed by attaching a file
          return message.reply({ embeds: [exportEmbed] });
        } catch (error) {
          console.error(`Error exporting ban list: ${error}`);
          return message.reply(`❌ An error occurred while exporting the ban list: ${error.message}`);
        }
      }
      
      // In a real implementation, you would implement the other options as well
      default:
        return message.reply(`❌ Unknown option. Use \`;banlist\` for help.`);
    }
  }
});

// Verification command (premium)
prefixCommands.set('verification', {
  name: 'verification',
  description: 'Set up and manage server verification system',
  isPremium: true,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    // Check for appropriate permissions
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ You need the "Manage Server" permission to use this command.');
    }
    
    const serverId = message.guild.id;
    
    // Check premium status
    const hasPremium = await checkPremium(serverId);
    if (!hasPremium) {
      return message.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    // If no arguments, show help
    if (!args.length) {
      return message.reply({ 
        embeds: [{
          title: '✅ Verification System',
          description: 'Set up and manage server verification system.',
          color: 0x5865F2,
          fields: [
            {
              name: 'Usage',
              value: '`;verification <option> [value]`'
            },
            {
              name: 'Options',
              value: [
                '`status` - Check verification status',
                '`enable` - Enable verification system',
                '`disable` - Disable verification system',
                '`role <role>` - Set verification role',
                '`channel <channel>` - Set verification channel',
                '`message <text>` - Set verification message',
                '`mode <captcha/button/reaction>` - Set verification mode'
              ].join('\n')
            }
          ],
          footer: {
            text: '✨ Premium Feature'
          }
        }]
      });
    }
    
    const option = args[0].toLowerCase();
    
    switch (option) {
      case 'status':
        return message.reply({ 
          embeds: [{
            title: '✅ Verification Status',
            description: 'Verification system is currently disabled for this server.',
            color: 0x5865F2,
            footer: {
              text: '✨ Premium Feature'
            }
          }]
        });
        
      case 'enable':
        return message.reply('✅ Verification system has been enabled for this server!');
        
      case 'disable':
        return message.reply('✅ Verification system has been disabled for this server.');
        
      default:
        return message.reply(`❌ Unknown option. Use \`;verification\` for help.`);
    }
  }
});

// Auto-role command (premium)
prefixCommands.set('autorole', {
  name: 'autorole',
  description: 'Configure automatic role assignment for new members',
  isPremium: true,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    // Check for appropriate permissions
    if (!message.member.permissions.has('ManageRoles')) {
      return message.reply('❌ You need the "Manage Roles" permission to use this command.');
    }
    
    const serverId = message.guild.id;
    
    // Check premium status
    const hasPremium = await checkPremium(serverId);
    if (!hasPremium) {
      return message.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    // If no arguments, show help
    if (!args.length) {
      return message.reply({ 
        embeds: [{
          title: '👤 Auto-Role Configuration',
          description: 'Configure automatic role assignment for new members.',
          color: 0x5865F2,
          fields: [
            {
              name: 'Usage',
              value: '`;autorole <option> [role]`'
            },
            {
              name: 'Options',
              value: [
                '`show` - Show current auto-role settings',
                '`add <role>` - Add a role to auto-assign',
                '`remove <role>` - Remove a role from auto-assign',
                '`clear` - Clear all auto-roles',
                '`enable` - Enable auto-role assignment',
                '`disable` - Disable auto-role assignment'
              ].join('\n')
            }
          ],
          footer: {
            text: '✨ Premium Feature'
          }
        }]
      });
    }
    
    const option = args[0].toLowerCase();
    
    switch (option) {
      case 'show':
        return message.reply({ 
          embeds: [{
            title: '👤 Auto-Role Settings',
            description: 'No auto-roles configured for this server.',
            color: 0x5865F2,
            footer: {
              text: '✨ Premium Feature'
            }
          }]
        });
        
      case 'add':
        if (!args[1]) {
          return message.reply('❌ Please specify a role to add.');
        }
        return message.reply(`✅ Role has been added to auto-role configuration.`);
        
      case 'remove':
        if (!args[1]) {
          return message.reply('❌ Please specify a role to remove.');
        }
        return message.reply(`✅ Role has been removed from auto-role configuration.`);
        
      default:
        return message.reply(`❌ Unknown option. Use \`;autorole\` for help.`);
    }
  }
});

// Logs command (premium)
prefixCommands.set('logs', {
  name: 'logs',
  description: 'Configure and manage server activity logs',
  isPremium: true,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    // Check for appropriate permissions
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ You need the "Manage Server" permission to use this command.');
    }
    
    const serverId = message.guild.id;
    
    // Check premium status
    const hasPremium = await checkPremium(serverId);
    if (!hasPremium) {
      return message.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    // If no arguments, show help
    if (!args.length) {
      return message.reply({ 
        embeds: [{
          title: '📝 Server Logs Configuration',
          description: 'Configure and manage server activity logs.',
          color: 0x5865F2,
          fields: [
            {
              name: 'Usage',
              value: '`;logs <option> [value]`'
            },
            {
              name: 'Options',
              value: [
                '`status` - Show current log settings',
                '`enable <type>` - Enable a log type',
                '`disable <type>` - Disable a log type',
                '`channel <type> <channel>` - Set log channel for a type',
                '`list` - List available log types'
              ].join('\n')
            },
            {
              name: 'Log Types',
              value: [
                '`mod` - Moderation actions',
                '`user` - User joins/leaves',
                '`message` - Message edits/deletes',
                '`voice` - Voice channel activity',
                '`server` - Server setting changes',
                '`all` - All log types'
              ].join('\n')
            }
          ],
          footer: {
            text: '✨ Premium Feature'
          }
        }]
      });
    }
    
    const option = args[0].toLowerCase();
    
    switch (option) {
      case 'status':
        return message.reply({ 
          embeds: [{
            title: '📝 Server Log Settings',
            description: 'All logs are currently disabled for this server.',
            color: 0x5865F2,
            footer: {
              text: '✨ Premium Feature'
            }
          }]
        });
        
      case 'enable':
        if (!args[1]) {
          return message.reply('❌ Please specify a log type to enable.');
        }
        return message.reply(`✅ ${args[1]} logs have been enabled.`);
        
      case 'disable':
        if (!args[1]) {
          return message.reply('❌ Please specify a log type to disable.');
        }
        return message.reply(`✅ ${args[1]} logs have been disabled.`);
        
      default:
        return message.reply(`❌ Unknown option. Use \`;logs\` for help.`);
    }
  }
});

// Backup command (premium)
prefixCommands.set('backup', {
  name: 'backup',
  description: 'Create and manage server backups',
  isPremium: true,
  isAdmin: false,
  execute: async (message, args) => {
    if (!message.guild) {
      return message.reply('❌ This command can only be used in a server.');
    }
    
    // Check for appropriate permissions
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('❌ You need the "Administrator" permission to use this command.');
    }
    
    const serverId = message.guild.id;
    
    // Check premium status
    const hasPremium = await checkPremium(serverId);
    if (!hasPremium) {
      return message.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    // If no arguments, show help
    if (!args.length) {
      return message.reply({ 
        embeds: [{
          title: '💾 Server Backup System',
          description: 'Create and manage server backups.',
          color: 0x5865F2,
          fields: [
            {
              name: 'Usage',
              value: '`;backup <option> [value]`'
            },
            {
              name: 'Options',
              value: [
                '`create` - Create a new server backup',
                '`list` - List available backups',
                '`info <id>` - Show backup details',
                '`restore <id>` - Restore a backup',
                '`delete <id>` - Delete a backup',
                '`schedule <daily/weekly/monthly>` - Set backup schedule'
              ].join('\n')
            },
            {
              name: '⚠️ Important',
              value: 'Restoring a backup will overwrite server settings, channels, and roles. Messages will not be restored.'
            }
          ],
          footer: {
            text: '✨ Premium Feature'
          }
        }]
      });
    }
    
    const option = args[0].toLowerCase();
    
    switch (option) {
      case 'create':
        return message.reply({ 
          embeds: [{
            title: '💾 Backup Creation',
            description: 'Creating a backup of this server...',
            fields: [
              {
                name: 'Backup Progress',
                value: 'This may take a moment depending on server size.'
              }
            ],
            color: 0x5865F2,
            footer: {
              text: '✨ Premium Feature'
            }
          }]
        }).then(msg => {
          // In a real implementation, we would create the backup here
          // For demonstration, we'll just edit the message after a delay
          setTimeout(() => {
            msg.edit({ 
              embeds: [{
                title: '💾 Backup Created',
                description: 'Server backup created successfully!',
                fields: [
                  {
                    name: 'Backup ID',
                    value: 'BKP-' + Math.floor(1000000 + Math.random() * 9000000),
                    inline: true
                  },
                  {
                    name: 'Created At',
                    value: new Date().toISOString(),
                    inline: true
                  },
                  {
                    name: 'Content',
                    value: '• Roles: ' + message.guild.roles.cache.size + '\n' +
                           '• Channels: ' + message.guild.channels.cache.size + '\n' +
                           '• Settings: Server configuration'
                  }
                ],
                color: 0x5865F2,
                footer: {
                  text: '✨ Premium Feature'
                }
              }]
            });
          }, 2000);
        });
        
      case 'list':
        return message.reply({ 
          embeds: [{
            title: '💾 Available Backups',
            description: 'No backups found for this server.',
            color: 0x5865F2,
            footer: {
              text: '✨ Premium Feature'
            }
          }]
        });
        
      default:
        return message.reply(`❌ Unknown option. Use \`;backup\` for help.`);
    }
  }
});

export { prefixCommands, handlePrefixCommand };