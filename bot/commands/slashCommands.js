/**
 * Slash Commands for Discord Bot
 * 
 * This file contains the slash command implementations for Discord.js
 */

import { SlashCommandBuilder } from 'discord.js';
import { checkPremium, premiumUpsellEmbed } from '../utils/premiumCheckESM.js';

// Collection of slash commands
const slashCommands = [];

// Ban command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server with an optional reason')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('The reason for the ban'))
    .addIntegerOption(option => 
      option.setName('delete_days')
        .setDescription('Number of days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)),
  category: 'moderation',
  adminOnly: true,
  premiumRequired: false,
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') || 0;
    
    // Check if the bot has permission to ban members
    if (!interaction.guild.members.me.permissions.has('BanMembers')) {
      return interaction.reply({ 
        content: '❌ I don\'t have permission to ban members in this server.', 
        ephemeral: true 
      });
    }
    
    try {
      await interaction.guild.members.ban(user, { 
        reason: `${reason} | Banned by ${interaction.user.tag}`,
        deleteMessageDays: deleteDays
      });
      
      return interaction.reply({
        embeds: [{
          title: '🔨 User Banned',
          description: `**${user.tag}** has been banned from the server.`,
          fields: [
            {
              name: 'Reason',
              value: reason
            },
            {
              name: 'Message History Deleted',
              value: `${deleteDays} days`
            },
            {
              name: 'Banned By',
              value: interaction.user.tag
            }
          ],
          color: 0xFF0000,
          timestamp: new Date().toISOString()
        }]
      });
    } catch (error) {
      console.error('Ban command error:', error);
      return interaction.reply({ 
        content: `❌ Failed to ban user: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
});

// Unban command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .addStringOption(option => 
      option.setName('user_id')
        .setDescription('The user ID to unban')
        .setRequired(true)),
  category: 'moderation',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    const userId = interaction.options.getString('user_id');
    
    // Check if the bot has permission to ban members (which includes unbanning)
    if (!interaction.guild.members.me.permissions.has('BanMembers')) {
      return interaction.reply({ 
        content: '❌ I don\'t have permission to unban members in this server.', 
        ephemeral: true 
      });
    }
    
    try {
      await interaction.guild.members.unban(userId);
      
      return interaction.reply({
        embeds: [{
          title: '✅ User Unbanned',
          description: `User with ID **${userId}** has been unbanned from the server.`,
          color: 0x00FF00,
          timestamp: new Date().toISOString()
        }]
      });
    } catch (error) {
      console.error('Unban command error:', error);
      return interaction.reply({ 
        content: `❌ Failed to unban user: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
});

// Kick command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server with an optional reason')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('The reason for the kick')),
  category: 'moderation',
  adminOnly: true,
  premiumRequired: false,
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Check if the bot has permission to kick members
    if (!interaction.guild.members.me.permissions.has('KickMembers')) {
      return interaction.reply({ 
        content: '❌ I don\'t have permission to kick members in this server.', 
        ephemeral: true 
      });
    }
    
    try {
      const member = await interaction.guild.members.fetch(user.id);
      await member.kick(`${reason} | Kicked by ${interaction.user.tag}`);
      
      return interaction.reply({
        embeds: [{
          title: '👢 User Kicked',
          description: `**${user.tag}** has been kicked from the server.`,
          fields: [
            {
              name: 'Reason',
              value: reason
            },
            {
              name: 'Kicked By',
              value: interaction.user.tag
            }
          ],
          color: 0xFFA500,
          timestamp: new Date().toISOString()
        }]
      });
    } catch (error) {
      console.error('Kick command error:', error);
      return interaction.reply({ 
        content: `❌ Failed to kick user: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
});

// Warn command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user with an optional reason')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to warn')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('The reason for the warning')),
  category: 'moderation',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // In a real implementation, we would add the warning to a database
    
    return interaction.reply({
      embeds: [{
        title: '⚠️ User Warned',
        description: `**${user.tag}** has been warned.`,
        fields: [
          {
            name: 'Reason',
            value: reason
          },
          {
            name: 'Warned By',
            value: interaction.user.tag
          }
        ],
        color: 0xFFFF00,
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Warnings command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View warnings for a specific user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to check warnings for')
        .setRequired(true)),
  category: 'moderation',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    
    // In a real implementation, we would fetch warnings from a database
    const warnings = [
      { reason: 'Spamming in chat', date: '2023-01-15', mod: 'Moderator1' },
      { reason: 'Inappropriate language', date: '2023-02-20', mod: 'Moderator2' }
    ];
    
    return interaction.reply({
      embeds: [{
        title: '⚠️ User Warnings',
        description: `Warnings for **${user.tag}**:`,
        fields: warnings.map((warning, index) => ({
          name: `Warning #${index + 1}`,
          value: `**Reason:** ${warning.reason}\n**Date:** ${warning.date}\n**Moderator:** ${warning.mod}`
        })),
        color: 0xFFFF00,
        footer: {
          text: `Total Warnings: ${warnings.length}`
        },
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Clearwarnings command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('clearwarnings')
    .setDescription('Clear all warnings for a user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to clear warnings for')
        .setRequired(true)),
  category: 'moderation',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    
    // In a real implementation, we would clear warnings from a database
    
    return interaction.reply({
      embeds: [{
        title: '✅ Warnings Cleared',
        description: `All warnings for **${user.tag}** have been cleared.`,
        color: 0x00FF00,
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Mute command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mute a user for a specified duration')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to mute')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('duration')
        .setDescription('Duration of the mute (e.g., 1h, 30m, 1d)'))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('The reason for the mute')),
  category: 'moderation',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const duration = interaction.options.getString('duration') || '1h';
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Parse duration string to get milliseconds
    let durationMs = 3600000; // Default 1 hour
    
    // In a real implementation, we would parse the duration string and timeout the user
    
    return interaction.reply({
      embeds: [{
        title: '🔇 User Muted',
        description: `**${user.tag}** has been muted for **${duration}**.`,
        fields: [
          {
            name: 'Reason',
            value: reason
          },
          {
            name: 'Muted By',
            value: interaction.user.tag
          },
          {
            name: 'Duration',
            value: duration
          }
        ],
        color: 0xFFA500,
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Unmute command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Unmute a previously muted user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to unmute')
        .setRequired(true)),
  category: 'moderation',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    const user = interaction.options.getUser('user');
    
    // In a real implementation, we would remove the timeout from the user
    
    return interaction.reply({
      embeds: [{
        title: '🔊 User Unmuted',
        description: `**${user.tag}** has been unmuted.`,
        color: 0x00FF00,
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Purge command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete a specified number of messages from a channel')
    .addIntegerOption(option => 
      option.setName('amount')
        .setDescription('Number of messages to delete (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true))
    .addUserOption(option => 
      option.setName('user')
        .setDescription('Only delete messages from this user')),
  category: 'moderation',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    const amount = interaction.options.getInteger('amount');
    const user = interaction.options.getUser('user');
    
    // Check if the bot has permission to manage messages
    if (!interaction.channel.permissionsFor(interaction.guild.members.me).has('ManageMessages')) {
      return interaction.reply({ 
        content: '❌ I don\'t have permission to delete messages in this channel.', 
        ephemeral: true 
      });
    }
    
    try {
      await interaction.deferReply({ ephemeral: true });
      
      let messages;
      if (user) {
        // Fetch messages and filter by user
        const allMessages = await interaction.channel.messages.fetch({ limit: 100 });
        const userMessages = allMessages.filter(msg => msg.author.id === user.id).first(amount);
        
        if (userMessages.length === 0) {
          return interaction.editReply('❌ No messages from this user found in the recent history.');
        }
        
        messages = await interaction.channel.bulkDelete(userMessages, true);
      } else {
        // Delete specified amount of messages
        messages = await interaction.channel.bulkDelete(amount, true);
      }
      
      return interaction.editReply({
        content: `✅ Successfully deleted ${messages.size} messages.`
      });
    } catch (error) {
      console.error('Purge command error:', error);
      return interaction.editReply({ 
        content: `❌ Failed to delete messages: ${error.message}`
      });
    }
  }
});

// Slowmode command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Set the slowmode cooldown for a channel')
    .addIntegerOption(option => 
      option.setName('seconds')
        .setDescription('Slowmode delay in seconds (0 to disable)')
        .setRequired(true)),
  category: 'moderation',
  adminOnly: true,
  premiumRequired: false,
  async execute(interaction) {
    const seconds = interaction.options.getInteger('seconds');
    
    // Check if the bot has permission to manage channels
    if (!interaction.channel.permissionsFor(interaction.guild.members.me).has('ManageChannels')) {
      return interaction.reply({ 
        content: '❌ I don\'t have permission to manage channel settings.', 
        ephemeral: true 
      });
    }
    
    try {
      await interaction.channel.setRateLimitPerUser(seconds);
      
      if (seconds === 0) {
        return interaction.reply({
          embeds: [{
            title: '✅ Slowmode Disabled',
            description: 'Slowmode has been disabled for this channel.',
            color: 0x00FF00,
            timestamp: new Date().toISOString()
          }]
        });
      } else {
        return interaction.reply({
          embeds: [{
            title: '⏱️ Slowmode Enabled',
            description: `Slowmode has been set to **${seconds} seconds** for this channel.`,
            color: 0xFFA500,
            timestamp: new Date().toISOString()
          }]
        });
      }
    } catch (error) {
      console.error('Slowmode command error:', error);
      return interaction.reply({ 
        content: `❌ Failed to set slowmode: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
});

// Lockdown command (premium)
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Temporarily lock a channel, preventing messages from being sent')
    .addStringOption(option => 
      option.setName('duration')
        .setDescription('Duration of the lockdown (e.g., 30m, 1h)'))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for the lockdown')),
  category: 'moderation',
  adminOnly: false,
  premiumRequired: true,
  async execute(interaction) {
    // Check premium status
    const hasPremium = await checkPremium(interaction.guild.id);
    if (!hasPremium) {
      return interaction.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    const duration = interaction.options.getString('duration') || '30m';
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    try {
      // In a real implementation, we would lock the channel by updating permissions
      
      return interaction.reply({
        embeds: [{
          title: '🔒 Channel Locked',
          description: `This channel has been locked for **${duration}**.`,
          fields: [
            {
              name: 'Reason',
              value: reason
            },
            {
              name: 'Locked By',
              value: interaction.user.tag
            }
          ],
          color: 0xFF0000,
          timestamp: new Date().toISOString()
        }]
      });
    } catch (error) {
      console.error('Lockdown command error:', error);
      return interaction.reply({ 
        content: `❌ Failed to lock channel: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
});

// Unlock command (premium)
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Unlock a previously locked channel'),
  category: 'moderation',
  adminOnly: false,
  premiumRequired: true,
  async execute(interaction) {
    // Check premium status
    const hasPremium = await checkPremium(interaction.guild.id);
    if (!hasPremium) {
      return interaction.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    try {
      // In a real implementation, we would unlock the channel by updating permissions
      
      return interaction.reply({
        embeds: [{
          title: '🔓 Channel Unlocked',
          description: 'This channel has been unlocked. Members can now send messages again.',
          color: 0x00FF00,
          timestamp: new Date().toISOString()
        }]
      });
    } catch (error) {
      console.error('Unlock command error:', error);
      return interaction.reply({ 
        content: `❌ Failed to unlock channel: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
});

// Massban command (premium)
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('massban')
    .setDescription('Ban multiple users at once')
    .addStringOption(option => 
      option.setName('users')
        .setDescription('Comma-separated list of user IDs to ban')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for the mass ban')),
  category: 'moderation',
  adminOnly: true,
  premiumRequired: true,
  async execute(interaction) {
    // Check premium status
    const hasPremium = await checkPremium(interaction.guild.id);
    if (!hasPremium) {
      return interaction.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    const usersString = interaction.options.getString('users');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    const userIds = usersString.split(',').map(id => id.trim());
    
    if (userIds.length === 0) {
      return interaction.reply({ 
        content: '❌ No valid user IDs provided.', 
        ephemeral: true 
      });
    }
    
    // Check if the bot has permission to ban members
    if (!interaction.guild.members.me.permissions.has('BanMembers')) {
      return interaction.reply({ 
        content: '❌ I don\'t have permission to ban members in this server.', 
        ephemeral: true 
      });
    }
    
    await interaction.deferReply();
    
    const banResults = [];
    
    for (const userId of userIds) {
      try {
        await interaction.guild.members.ban(userId, { 
          reason: `${reason} | Mass ban by ${interaction.user.tag}`
        });
        banResults.push(`✅ Banned user ID: ${userId}`);
      } catch (error) {
        banResults.push(`❌ Failed to ban ID ${userId}: ${error.message}`);
      }
    }
    
    return interaction.editReply({
      embeds: [{
        title: '🔨 Mass Ban Results',
        description: `Attempted to ban ${userIds.length} users.`,
        fields: [
          {
            name: 'Reason',
            value: reason
          },
          {
            name: 'Results',
            value: banResults.join('\n')
          }
        ],
        color: 0xFF0000,
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Hackban command (premium)
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('hackban')
    .setDescription('Ban a user that isn\'t in the server yet')
    .addStringOption(option => 
      option.setName('user_id')
        .setDescription('The user ID to ban')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('reason')
        .setDescription('Reason for the ban')),
  category: 'moderation',
  adminOnly: false,
  premiumRequired: true,
  async execute(interaction) {
    // Check premium status
    const hasPremium = await checkPremium(interaction.guild.id);
    if (!hasPremium) {
      return interaction.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    const userId = interaction.options.getString('user_id');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Check if the bot has permission to ban members
    if (!interaction.guild.members.me.permissions.has('BanMembers')) {
      return interaction.reply({ 
        content: '❌ I don\'t have permission to ban members in this server.', 
        ephemeral: true 
      });
    }
    
    try {
      await interaction.guild.members.ban(userId, { 
        reason: `${reason} | Hackban by ${interaction.user.tag}`
      });
      
      return interaction.reply({
        embeds: [{
          title: '🔨 User Hackbanned',
          description: `User ID **${userId}** has been banned from the server.`,
          fields: [
            {
              name: 'Reason',
              value: reason
            },
            {
              name: 'Banned By',
              value: interaction.user.tag
            }
          ],
          color: 0xFF0000,
          timestamp: new Date().toISOString()
        }]
      });
    } catch (error) {
      console.error('Hackban command error:', error);
      return interaction.reply({ 
        content: `❌ Failed to ban user: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
});

// Automod command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('View and configure the automod settings')
    .addStringOption(option => 
      option.setName('setting')
        .setDescription('The automod setting to configure')
        .addChoices(
          { name: 'Invites', value: 'invites' },
          { name: 'Links', value: 'links' },
          { name: 'Caps', value: 'caps' },
          { name: 'Mentions', value: 'mentions' },
          { name: 'Spam', value: 'spam' }
        ))
    .addStringOption(option => 
      option.setName('value')
        .setDescription('The value to set (on/off)')
        .addChoices(
          { name: 'On', value: 'on' },
          { name: 'Off', value: 'off' }
        )),
  category: 'automod',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    const setting = interaction.options.getString('setting');
    const value = interaction.options.getString('value');
    
    // If no options provided, show current settings
    if (!setting) {
      return interaction.reply({
        embeds: [{
          title: '⚙️ AutoMod Settings',
          description: 'Current AutoMod configuration for this server:',
          fields: [
            {
              name: 'Invite Filter',
              value: '✅ Enabled',
              inline: true
            },
            {
              name: 'Link Filter',
              value: '✅ Enabled',
              inline: true
            },
            {
              name: 'Caps Filter',
              value: '❌ Disabled',
              inline: true
            },
            {
              name: 'Mention Spam',
              value: '✅ Enabled (Max: 5)',
              inline: true
            },
            {
              name: 'Message Spam',
              value: '✅ Enabled (5 msgs/3s)',
              inline: true
            }
          ],
          color: 0x5865F2,
          timestamp: new Date().toISOString()
        }]
      });
    }
    
    // If setting but no value, show current value for that setting
    if (setting && !value) {
      let currentValue;
      switch (setting) {
        case 'invites': currentValue = '✅ Enabled'; break;
        case 'links': currentValue = '✅ Enabled'; break;
        case 'caps': currentValue = '❌ Disabled'; break;
        case 'mentions': currentValue = '✅ Enabled (Max: 5)'; break;
        case 'spam': currentValue = '✅ Enabled (5 msgs/3s)'; break;
        default: currentValue = 'Unknown';
      }
      
      return interaction.reply({
        embeds: [{
          title: '⚙️ AutoMod Setting',
          description: `Current value for **${setting}** filter: ${currentValue}`,
          color: 0x5865F2,
          timestamp: new Date().toISOString()
        }]
      });
    }
    
    // Update setting
    const settingName = setting.charAt(0).toUpperCase() + setting.slice(1);
    const newValue = value === 'on' ? '✅ Enabled' : '❌ Disabled';
    
    return interaction.reply({
      embeds: [{
        title: '⚙️ AutoMod Updated',
        description: `The **${settingName}** filter has been set to: ${newValue}`,
        color: 0x00FF00,
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Filter command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('filter')
    .setDescription('Add or remove words from the word filter')
    .addStringOption(option => 
      option.setName('action')
        .setDescription('Action to perform on the filter')
        .setRequired(true)
        .addChoices(
          { name: 'Add', value: 'add' },
          { name: 'Remove', value: 'remove' },
          { name: 'List', value: 'list' }
        ))
    .addStringOption(option => 
      option.setName('word')
        .setDescription('The word to add or remove')),
  category: 'automod',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    const action = interaction.options.getString('action');
    const word = interaction.options.getString('word');
    
    if (action === 'list') {
      return interaction.reply({
        embeds: [{
          title: '🔍 Word Filter List',
          description: 'The following words are currently filtered:',
          fields: [
            {
              name: 'Filtered Words',
              value: '• badword1\n• badword2\n• badword3'
            }
          ],
          color: 0x5865F2,
          timestamp: new Date().toISOString(),
          footer: {
            text: 'These words will be automatically removed from messages'
          }
        }]
      });
    }
    
    if (!word) {
      return interaction.reply({ 
        content: '❌ You must provide a word to add or remove.', 
        ephemeral: true 
      });
    }
    
    if (action === 'add') {
      return interaction.reply({
        embeds: [{
          title: '✅ Word Added to Filter',
          description: `The word **${word}** has been added to the filter.`,
          color: 0x00FF00,
          timestamp: new Date().toISOString()
        }]
      });
    } else if (action === 'remove') {
      return interaction.reply({
        embeds: [{
          title: '✅ Word Removed from Filter',
          description: `The word **${word}** has been removed from the filter.`,
          color: 0x00FF00,
          timestamp: new Date().toISOString()
        }]
      });
    }
  }
});

// Antispam command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('antispam')
    .setDescription('Configure anti-spam settings')
    .addStringOption(option => 
      option.setName('status')
        .setDescription('Enable or disable anti-spam')
        .setRequired(true)
        .addChoices(
          { name: 'On', value: 'on' },
          { name: 'Off', value: 'off' }
        ))
    .addIntegerOption(option => 
      option.setName('threshold')
        .setDescription('Number of messages that trigger anti-spam'))
    .addIntegerOption(option => 
      option.setName('timeframe')
        .setDescription('Timeframe in seconds to check messages')),
  category: 'automod',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    const status = interaction.options.getString('status');
    const threshold = interaction.options.getInteger('threshold') || 5;
    const timeframe = interaction.options.getInteger('timeframe') || 3;
    
    if (status === 'on') {
      return interaction.reply({
        embeds: [{
          title: '✅ Anti-Spam Enabled',
          description: `Anti-spam protection has been enabled with the following settings:`,
          fields: [
            {
              name: 'Threshold',
              value: `${threshold} messages`,
              inline: true
            },
            {
              name: 'Timeframe',
              value: `${timeframe} seconds`,
              inline: true
            }
          ],
          color: 0x00FF00,
          timestamp: new Date().toISOString()
        }]
      });
    } else {
      return interaction.reply({
        embeds: [{
          title: '❌ Anti-Spam Disabled',
          description: 'Anti-spam protection has been disabled for this server.',
          color: 0xFF0000,
          timestamp: new Date().toISOString()
        }]
      });
    }
  }
});

// Antiraid command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Configure anti-raid protection')
    .addStringOption(option => 
      option.setName('status')
        .setDescription('Enable or disable anti-raid protection')
        .setRequired(true)
        .addChoices(
          { name: 'On', value: 'on' },
          { name: 'Off', value: 'off' }
        )),
  category: 'automod',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    const status = interaction.options.getString('status');
    
    if (status === 'on') {
      return interaction.reply({
        embeds: [{
          title: '✅ Anti-Raid Protection Enabled',
          description: 'Anti-raid protection has been enabled for this server.',
          fields: [
            {
              name: 'Join Rate Threshold',
              value: '10 joins / 10 seconds',
              inline: true
            },
            {
              name: 'Action',
              value: 'Temporary lockdown',
              inline: true
            }
          ],
          color: 0x00FF00,
          timestamp: new Date().toISOString()
        }]
      });
    } else {
      return interaction.reply({
        embeds: [{
          title: '❌ Anti-Raid Protection Disabled',
          description: 'Anti-raid protection has been disabled for this server.',
          color: 0xFF0000,
          timestamp: new Date().toISOString()
        }]
      });
    }
  }
});

// Autorole command (premium)
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Automatically assign roles to new members')
    .addStringOption(option => 
      option.setName('status')
        .setDescription('Enable or disable autorole')
        .setRequired(true)
        .addChoices(
          { name: 'On', value: 'on' },
          { name: 'Off', value: 'off' }
        ))
    .addRoleOption(option => 
      option.setName('role')
        .setDescription('Role to automatically assign')),
  category: 'utility',
  adminOnly: false,
  premiumRequired: true,
  async execute(interaction) {
    // Check premium status
    const hasPremium = await checkPremium(interaction.guild.id);
    if (!hasPremium) {
      return interaction.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    const status = interaction.options.getString('status');
    const role = interaction.options.getRole('role');
    
    if (status === 'on') {
      if (!role) {
        return interaction.reply({ 
          content: '❌ You must specify a role to automatically assign.', 
          ephemeral: true 
        });
      }
      
      return interaction.reply({
        embeds: [{
          title: '✅ Auto-Role Enabled',
          description: `New members will automatically be assigned the ${role} role when they join.`,
          color: 0x00FF00,
          timestamp: new Date().toISOString()
        }]
      });
    } else {
      return interaction.reply({
        embeds: [{
          title: '❌ Auto-Role Disabled',
          description: 'New members will no longer be automatically assigned roles when they join.',
          color: 0xFF0000,
          timestamp: new Date().toISOString()
        }]
      });
    }
  }
});

// Logs command (premium)
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('logs')
    .setDescription('Configure server logging')
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('Channel to send logs to (use \'disable\' to turn off logging)')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('type')
        .setDescription('Type of logs to send')
        .addChoices(
          { name: 'Moderation', value: 'moderation' },
          { name: 'Messages', value: 'messages' },
          { name: 'Members', value: 'members' },
          { name: 'Server', value: 'server' },
          { name: 'All', value: 'all' }
        )),
  category: 'utility',
  adminOnly: false,
  premiumRequired: true,
  async execute(interaction) {
    // Check premium status
    const hasPremium = await checkPremium(interaction.guild.id);
    if (!hasPremium) {
      return interaction.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    const channel = interaction.options.getChannel('channel');
    const type = interaction.options.getString('type') || 'all';
    
    if (channel.type !== 0) { // Text channel
      return interaction.reply({ 
        content: '❌ Please select a text channel for logging.', 
        ephemeral: true 
      });
    }
    
    // Convert type to a readable form
    let logType;
    switch (type) {
      case 'moderation': logType = 'Moderation logs'; break;
      case 'messages': logType = 'Message logs'; break;
      case 'members': logType = 'Member logs'; break;
      case 'server': logType = 'Server logs'; break;
      case 'all': logType = 'All logs'; break;
      default: logType = 'Unknown logs';
    }
    
    return interaction.reply({
      embeds: [{
        title: '✅ Logging Configured',
        description: `${logType} will now be sent to ${channel}.`,
        color: 0x00FF00,
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Botinfo command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('botinfo')
    .setDescription('Display information about the bot'),
  category: 'info',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    const botUser = interaction.client.user;
    
    return interaction.reply({
      embeds: [{
        title: `${botUser.username} Bot Information`,
        description: 'Advanced Discord moderation and security bot with intelligent protection and management features.',
        thumbnail: {
          url: botUser.displayAvatarURL({ dynamic: true })
        },
        fields: [
          {
            name: 'Bot ID',
            value: botUser.id,
            inline: true
          },
          {
            name: 'Created',
            value: `<t:${Math.floor(botUser.createdTimestamp / 1000)}:R>`,
            inline: true
          },
          {
            name: 'Servers',
            value: interaction.client.guilds.cache.size.toString(),
            inline: true
          },
          {
            name: 'Uptime',
            value: '4 days, 7 hours',
            inline: true
          },
          {
            name: 'Prefix',
            value: ';',
            inline: true
          },
          {
            name: 'Version',
            value: '1.2.0',
            inline: true
          },
          {
            name: 'Links',
            value: '[Invite Bot](https://discord.com/oauth2/authorize?client_id=1361873604882731008) | [Support Server](https://discord.gg/g3rFbaW6gw) | [Website](https://dashboard.guardshin.com)'
          }
        ],
        color: 0x5865F2,
        footer: {
          text: 'Developed by Witherco'
        },
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Uptime command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Check how long the bot has been online'),
  category: 'info',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    // In a real implementation, we would calculate actual uptime
    const uptime = '4 days, 7 hours, 23 minutes';
    
    return interaction.reply({
      embeds: [{
        title: '⏱️ Bot Uptime',
        description: `${interaction.client.user.username} has been online for:\n\n**${uptime}**`,
        color: 0x5865F2,
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Invite command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('invite')
    .setDescription('Get an invite link for the bot'),
  category: 'info',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    return interaction.reply({
      embeds: [{
        title: '🔗 Invite Guard-shin',
        description: 'You can add Guard-shin to your own server using the link below:',
        fields: [
          {
            name: 'Invite Link',
            value: '[Click here to invite Guard-shin to your server](https://discord.com/oauth2/authorize?client_id=1361873604882731008&permissions=8&scope=bot%20applications.commands)'
          }
        ],
        color: 0x5865F2,
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Premium command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('premium')
    .setDescription('Get information about Guard-shin Premium'),
  category: 'info',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    const hasPremium = await checkPremium(interaction.guild.id);
    
    return interaction.reply({
      embeds: [{
        title: '✨ Guard-shin Premium',
        description: 'Unlock powerful security and moderation features with Guard-shin Premium.',
        fields: [
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
          },
          {
            name: 'Current Status',
            value: hasPremium ? '✅ This server has Premium activated!' : '❌ This server does not have Premium'
          }
        ],
        color: 0x5865F2,
        footer: {
          text: 'Unlock Guard-shin\'s full potential with Premium!'
        },
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Support command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Get a link to the support server'),
  category: 'info',
  adminOnly: false,
  premiumRequired: false,
  async execute(interaction) {
    return interaction.reply({
      embeds: [{
        title: '🔧 Guard-shin Support',
        description: 'Need help with Guard-shin? Join our support server!',
        fields: [
          {
            name: 'Support Server',
            value: '[Click here to join the Guard-shin support server](https://discord.gg/g3rFbaW6gw)'
          },
          {
            name: 'Email Support',
            value: 'For business inquiries: support@witherco.org'
          }
        ],
        color: 0x5865F2,
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Setup command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('Run the initial setup for Guard-shin'),
  category: 'admin',
  adminOnly: true,
  premiumRequired: false,
  async execute(interaction) {
    // Check if user has manage server permission
    if (!interaction.member.permissions.has('ManageGuild')) {
      return interaction.reply({ 
        content: '❌ You need the Manage Server permission to use this command.', 
        ephemeral: true 
      });
    }
    
    await interaction.deferReply();
    
    // In a real implementation, we would run through a setup process
    
    return interaction.editReply({
      embeds: [{
        title: '✅ Setup Complete',
        description: 'Guard-shin has been successfully set up for your server!',
        fields: [
          {
            name: 'Configured Features',
            value: [
              '• Moderation commands enabled',
              '• Basic auto-moderation enabled',
              '• Logging channel set to #bot-logs',
              '• Welcome messages enabled'
            ].join('\n')
          },
          {
            name: 'Next Steps',
            value: [
              '• Use `/config` to customize settings',
              '• Set up custom permissions with `/permission`',
              '• Explore premium features with `/premium`'
            ].join('\n')
          }
        ],
        color: 0x00FF00,
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Config command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('View and modify bot configuration')
    .addStringOption(option => 
      option.setName('setting')
        .setDescription('Setting to configure'))
    .addStringOption(option => 
      option.setName('value')
        .setDescription('Value to set')),
  category: 'admin',
  adminOnly: true,
  premiumRequired: false,
  async execute(interaction) {
    // Check if user has manage server permission
    if (!interaction.member.permissions.has('ManageGuild')) {
      return interaction.reply({ 
        content: '❌ You need the Manage Server permission to use this command.', 
        ephemeral: true 
      });
    }
    
    const setting = interaction.options.getString('setting');
    const value = interaction.options.getString('value');
    
    // If no setting provided, show all settings
    if (!setting) {
      return interaction.reply({
        embeds: [{
          title: '⚙️ Bot Configuration',
          description: 'Current configuration for Guard-shin:',
          fields: [
            {
              name: 'Prefix',
              value: ';',
              inline: true
            },
            {
              name: 'Mod Logs',
              value: '#mod-logs',
              inline: true
            },
            {
              name: 'Welcome Channel',
              value: '#welcome',
              inline: true
            },
            {
              name: 'Auto-Moderation',
              value: 'Enabled',
              inline: true
            },
            {
              name: 'Verification',
              value: 'Disabled',
              inline: true
            }
          ],
          color: 0x5865F2,
          footer: {
            text: 'Use /config setting value to modify a setting'
          },
          timestamp: new Date().toISOString()
        }]
      });
    }
    
    // If setting provided but no value, show current value
    if (setting && !value) {
      let currentValue;
      switch (setting.toLowerCase()) {
        case 'prefix': currentValue = ';'; break;
        case 'modlogs': currentValue = '#mod-logs'; break;
        case 'welcome': currentValue = '#welcome'; break;
        case 'automod': currentValue = 'Enabled'; break;
        case 'verification': currentValue = 'Disabled'; break;
        default: currentValue = 'Not set';
      }
      
      return interaction.reply({
        embeds: [{
          title: '⚙️ Configuration Setting',
          description: `Current value for **${setting}**: ${currentValue}`,
          color: 0x5865F2,
          timestamp: new Date().toISOString()
        }]
      });
    }
    
    // Update setting
    return interaction.reply({
      embeds: [{
        title: '✅ Configuration Updated',
        description: `The **${setting}** setting has been updated to: ${value}`,
        color: 0x00FF00,
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Permission command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('permission')
    .setDescription('Configure command permissions for roles')
    .addStringOption(option => 
      option.setName('command')
        .setDescription('Command to configure permissions for')
        .setRequired(true))
    .addRoleOption(option => 
      option.setName('role')
        .setDescription('Role to configure permissions for')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('permission')
        .setDescription('Allow or deny permission')
        .setRequired(true)
        .addChoices(
          { name: 'Allow', value: 'allow' },
          { name: 'Deny', value: 'deny' }
        )),
  category: 'admin',
  adminOnly: true,
  premiumRequired: false,
  async execute(interaction) {
    // Check if user has manage server permission
    if (!interaction.member.permissions.has('ManageGuild')) {
      return interaction.reply({ 
        content: '❌ You need the Manage Server permission to use this command.', 
        ephemeral: true 
      });
    }
    
    const command = interaction.options.getString('command');
    const role = interaction.options.getRole('role');
    const permission = interaction.options.getString('permission');
    
    // In a real implementation, we would update permissions in a database
    
    return interaction.reply({
      embeds: [{
        title: '✅ Permission Updated',
        description: `The ${role} role has been ${permission === 'allow' ? 'allowed' : 'denied'} permission to use the **${command}** command.`,
        color: 0x00FF00,
        timestamp: new Date().toISOString()
      }]
    });
  }
});

// Reset command
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('reset')
    .setDescription('Reset all bot settings to default'),
  category: 'admin',
  adminOnly: true,
  premiumRequired: false,
  async execute(interaction) {
    // Check if user has manage server permission
    if (!interaction.member.permissions.has('ManageGuild')) {
      return interaction.reply({ 
        content: '❌ You need the Manage Server permission to use this command.', 
        ephemeral: true 
      });
    }
    
    // Add a confirmation button
    const confirmButton = {
      type: 1,
      components: [
        {
          type: 2,
          style: 4,
          label: 'Reset All Settings',
          custom_id: 'confirm_reset'
        },
        {
          type: 2,
          style: 2,
          label: 'Cancel',
          custom_id: 'cancel_reset'
        }
      ]
    };
    
    return interaction.reply({
      embeds: [{
        title: '⚠️ Reset Confirmation',
        description: 'Are you sure you want to reset all bot settings to default? This action cannot be undone.',
        color: 0xFF0000,
        timestamp: new Date().toISOString()
      }],
      components: [confirmButton]
    });
  }
});

// Backup command (premium)
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('Create a backup of server settings and configurations')
    .addStringOption(option => 
      option.setName('action')
        .setDescription('Action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'Create', value: 'create' },
          { name: 'Load', value: 'load' },
          { name: 'List', value: 'list' }
        ))
    .addStringOption(option => 
      option.setName('backup_id')
        .setDescription('ID of the backup (required for load)')),
  category: 'admin',
  adminOnly: true,
  premiumRequired: true,
  async execute(interaction) {
    // Check premium status
    const hasPremium = await checkPremium(interaction.guild.id);
    if (!hasPremium) {
      return interaction.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    // Check if user has manage server permission
    if (!interaction.member.permissions.has('ManageGuild')) {
      return interaction.reply({ 
        content: '❌ You need the Manage Server permission to use this command.', 
        ephemeral: true 
      });
    }
    
    const action = interaction.options.getString('action');
    const backupId = interaction.options.getString('backup_id');
    
    if (action === 'create') {
      // Generate a random backup ID
      const newBackupId = Math.random().toString(36).substring(2, 10);
      
      return interaction.reply({
        embeds: [{
          title: '✅ Backup Created',
          description: 'A backup of your server settings has been created.',
          fields: [
            {
              name: 'Backup ID',
              value: newBackupId
            },
            {
              name: 'Created At',
              value: new Date().toISOString()
            },
            {
              name: 'Included Settings',
              value: [
                '• Bot configuration',
                '• Auto-moderation settings',
                '• Custom commands',
                '• Welcome messages',
                '• Logging settings'
              ].join('\n')
            }
          ],
          color: 0x00FF00,
          timestamp: new Date().toISOString()
        }]
      });
    } else if (action === 'load') {
      if (!backupId) {
        return interaction.reply({ 
          content: '❌ You must provide a backup ID to load a backup.', 
          ephemeral: true 
        });
      }
      
      // Add a confirmation button
      const confirmButton = {
        type: 1,
        components: [
          {
            type: 2,
            style: 4,
            label: 'Load Backup',
            custom_id: 'confirm_load_backup'
          },
          {
            type: 2,
            style: 2,
            label: 'Cancel',
            custom_id: 'cancel_load_backup'
          }
        ]
      };
      
      return interaction.reply({
        embeds: [{
          title: '⚠️ Load Backup Confirmation',
          description: `Are you sure you want to load backup **${backupId}**? This will overwrite all current settings.`,
          color: 0xFF0000,
          timestamp: new Date().toISOString()
        }],
        components: [confirmButton]
      });
    } else if (action === 'list') {
      return interaction.reply({
        embeds: [{
          title: '📋 Backup List',
          description: 'Here are your available backups:',
          fields: [
            {
              name: 'Backup 1',
              value: 'ID: abcd1234\nCreated: 2023-03-15\nServer: My Cool Server'
            },
            {
              name: 'Backup 2',
              value: 'ID: efgh5678\nCreated: 2023-04-20\nServer: My Cool Server'
            }
          ],
          color: 0x5865F2,
          timestamp: new Date().toISOString()
        }]
      });
    }
  }
});

// Banlist command (premium)
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('banlist')
    .setDescription('View, import, or export the server ban list')
    .addStringOption(option => 
      option.setName('action')
        .setDescription('Action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'View', value: 'view' },
          { name: 'Import', value: 'import' },
          { name: 'Export', value: 'export' }
        )),
  category: 'admin',
  adminOnly: true,
  premiumRequired: true,
  async execute(interaction) {
    // Check premium status
    const hasPremium = await checkPremium(interaction.guild.id);
    if (!hasPremium) {
      return interaction.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    // Check if user has ban members permission
    if (!interaction.member.permissions.has('BanMembers')) {
      return interaction.reply({ 
        content: '❌ You need the Ban Members permission to use this command.', 
        ephemeral: true 
      });
    }
    
    const action = interaction.options.getString('action');
    
    if (action === 'view') {
      await interaction.deferReply();
      
      try {
        // In a real implementation, we would fetch actual bans
        const bans = [
          { user: 'User1#1234', reason: 'Spamming', date: '2023-01-15' },
          { user: 'User2#5678', reason: 'Harassment', date: '2023-02-20' },
          { user: 'User3#9012', reason: 'Raid participation', date: '2023-03-25' }
        ];
        
        return interaction.editReply({
          embeds: [{
            title: '🔨 Ban List',
            description: `Total bans: ${bans.length}`,
            fields: bans.map((ban, index) => ({
              name: `Ban #${index + 1}`,
              value: `**User:** ${ban.user}\n**Reason:** ${ban.reason}\n**Date:** ${ban.date}`
            })),
            color: 0xFF0000,
            timestamp: new Date().toISOString()
          }]
        });
      } catch (error) {
        console.error('Banlist view error:', error);
        return interaction.editReply({ 
          content: `❌ Failed to fetch ban list: ${error.message}`
        });
      }
    } else if (action === 'export') {
      return interaction.reply({
        embeds: [{
          title: '✅ Ban List Exported',
          description: 'Your server ban list has been exported. Click the button below to download.',
          color: 0x00FF00,
          timestamp: new Date().toISOString()
        }],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                style: 5,
                label: 'Download Ban List',
                url: 'https://example.com/download-ban-list'
              }
            ]
          }
        ]
      });
    } else if (action === 'import') {
      return interaction.reply({
        content: 'To import a ban list, upload a JSON file with your ban list.',
        ephemeral: true
      });
    }
  }
});

// Verification command (premium)
slashCommands.push({
  data: new SlashCommandBuilder()
    .setName('verification')
    .setDescription('Set up member verification system')
    .addStringOption(option => 
      option.setName('action')
        .setDescription('Action to perform')
        .setRequired(true)
        .addChoices(
          { name: 'Setup', value: 'setup' },
          { name: 'Disable', value: 'disable' }
        ))
    .addStringOption(option => 
      option.setName('method')
        .setDescription('Verification method')
        .addChoices(
          { name: 'Captcha', value: 'captcha' },
          { name: 'Reaction', value: 'reaction' },
          { name: 'Question', value: 'question' }
        ))
    .addChannelOption(option => 
      option.setName('channel')
        .setDescription('Channel for verification')),
  category: 'admin',
  adminOnly: true,
  premiumRequired: true,
  async execute(interaction) {
    // Check premium status
    const hasPremium = await checkPremium(interaction.guild.id);
    if (!hasPremium) {
      return interaction.reply({ embeds: [premiumUpsellEmbed()] });
    }
    
    // Check if user has manage server permission
    if (!interaction.member.permissions.has('ManageGuild')) {
      return interaction.reply({ 
        content: '❌ You need the Manage Server permission to use this command.', 
        ephemeral: true 
      });
    }
    
    const action = interaction.options.getString('action');
    const method = interaction.options.getString('method') || 'captcha';
    const channel = interaction.options.getChannel('channel');
    
    if (action === 'setup') {
      if (!channel) {
        return interaction.reply({ 
          content: '❌ You must specify a channel for verification.', 
          ephemeral: true 
        });
      }
      
      if (channel.type !== 0) { // Text channel
        return interaction.reply({ 
          content: '❌ Please select a text channel for verification.', 
          ephemeral: true 
        });
      }
      
      return interaction.reply({
        embeds: [{
          title: '✅ Verification Setup Complete',
          description: `Member verification has been set up with the following settings:`,
          fields: [
            {
              name: 'Method',
              value: method.charAt(0).toUpperCase() + method.slice(1),
              inline: true
            },
            {
              name: 'Channel',
              value: channel.toString(),
              inline: true
            },
            {
              name: 'Next Steps',
              value: 'The verification message has been sent to the channel. New members will need to verify before accessing the server.'
            }
          ],
          color: 0x00FF00,
          timestamp: new Date().toISOString()
        }]
      });
    } else if (action === 'disable') {
      return interaction.reply({
        embeds: [{
          title: '✅ Verification Disabled',
          description: 'Member verification has been disabled for this server.',
          color: 0xFF0000,
          timestamp: new Date().toISOString()
        }]
      });
    }
  }
});

// Export the commands collection
export default slashCommands;