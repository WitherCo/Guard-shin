/**
 * Create AutoMod Rules Slash Command
 * This command creates 100 AutoMod rules to earn the AutoMod badge
 */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { handleCreateAutoModRulesCommand } = require('../automod/discordAutoModRules');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod_rules')
    .setDescription('Generate 100 AutoMod rules to earn the AutoMod badge')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator), // Admin-only command
  
  adminOnly: true,
  premiumRequired: false,
  
  async execute(interaction) {
    // Call the handler from our automod rules file
    await handleCreateAutoModRulesCommand(interaction);
  }
};