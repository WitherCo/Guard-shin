/**
 * AutoMod Badge Command
 * Slash command to generate 100 AutoMod rules to earn the Discord AutoMod badge
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { createAutoModRules } from './discordAutoModRules.js';

export default {
  // Define the command
  data: new SlashCommandBuilder()
    .setName('automod_badge')
    .setDescription('Generate 100 AutoMod rules to earn the Discord AutoMod badge')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  // Command settings
  adminOnly: true, // Require administrator permissions
  premiumRequired: false, // Available to all users
  
  // Command execution
  async execute(interaction) {
    // Check if this is a guild command
    if (!interaction.guild) {
      return interaction.reply({
        content: '❌ This command can only be used in a server.',
        ephemeral: true
      });
    }
    
    // Verify bot permissions
    if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({
        content: '❌ I need the "Manage Server" permission to create AutoMod rules.',
        ephemeral: true
      });
    }
    
    await interaction.deferReply({ ephemeral: true });
    
    try {
      // Get current rules count before creating new ones
      const existingRules = await interaction.guild.autoModerationRules.fetch().catch(() => null) || new Map();
      const existingCount = existingRules.size;
      
      await interaction.followUp({
        content: `⏳ Creating AutoMod rules for this server... This may take a minute.\nCurrent rule count: ${existingCount}`,
        ephemeral: true
      });
      
      // Create rules for this guild
      const createdCount = await createAutoModRules(interaction.guild);
      
      // Get updated count after creating rules
      const updatedRules = await interaction.guild.autoModerationRules.fetch().catch(() => null) || new Map();
      const newCount = updatedRules.size;
      
      if (newCount >= 100) {
        await interaction.followUp({
          content: `🎉 Success! Created ${createdCount} AutoMod rules.\n\nTotal rules: ${newCount}/100\n\nYour server now has enough rules to qualify for the AutoMod badge! It may take some time for Discord to update your badge status.`,
          ephemeral: true
        });
      } else {
        await interaction.followUp({
          content: `✅ Created ${createdCount} AutoMod rules.\n\nTotal rules: ${newCount}/100\n\nYou need at least 100 AutoMod rules to qualify for the badge.`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error(`Error generating AutoMod rules: ${error}`);
      await interaction.followUp({
        content: `❌ An error occurred while creating AutoMod rules: ${error.message}`,
        ephemeral: true
      });
    }
  }
};