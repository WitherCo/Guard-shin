/**
 * Developer-only commands for administrative purposes
 */

// List of developer Discord IDs who are allowed to run these commands
const DEV_IDS = [
  '1259367203346841725' // Developer Discord user ID
];

/**
 * Check if a user is a developer
 * @param {string} userId - Discord user ID to check
 * @returns {boolean} - Whether the user is a developer
 */
function isDeveloper(userId) {
  return DEV_IDS.includes(userId);
}

// Import premium utilities
const { addServerPremium } = require('../utils/premiumCheck');

/**
 * Execute the add-premium slash command
 * @param {Object} interaction - Discord interaction object
 */
async function executeAddPremiumCommand(interaction) {
  // Check if the user is a developer
  if (!isDeveloper(interaction.user.id)) {
    return interaction.reply({
      content: 'You do not have permission to use this command.',
      ephemeral: true
    });
  }

  // Get the target server ID from options
  const serverId = interaction.options.getString('server_id');
  const tier = interaction.options.getString('tier') || 'premium';
  let days = interaction.options.getInteger('days') || 30;
  
  // Handle lifetime tiers (set days to 0 for permanent premium)
  const isLifetime = tier === 'lifetime' || tier === 'lifetime_plus';
  if (isLifetime) {
    days = 0; // 0 days means permanent/lifetime in our system
  }

  // Add the server to the premium list
  const success = addServerPremium(serverId, tier, days);

  if (success) {
    // Determine embed color based on tier
    let embedColor;
    switch(tier) {
      case 'premium_plus':
        embedColor = 0xE91E63; // Pink for Premium+
        break;
      case 'lifetime':
        embedColor = 0x9C27B0; // Purple for Lifetime Premium
        break;
      case 'lifetime_plus':
        embedColor = 0x673AB7; // Deep Purple for Lifetime Premium+
        break;
      default:
        embedColor = 0xFFA500; // Orange for regular Premium
    }
    
    // Format tier name for display
    let tierName;
    switch(tier) {
      case 'premium_plus':
        tierName = 'Premium Plus';
        break;
      case 'lifetime':
        tierName = 'Lifetime Premium';
        break;
      case 'lifetime_plus':
        tierName = 'Lifetime Premium Plus';
        break;
      default:
        tierName = 'Premium';
    }
    
    // Set up fields for the embed
    const fields = [
      {
        name: 'Server ID',
        value: serverId,
        inline: true
      },
      {
        name: 'Tier',
        value: tierName,
        inline: true
      }
    ];
    
    // Add duration info for non-lifetime tiers
    if (!isLifetime) {
      // Calculate expiry date for display
      const expiryDate = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
      const expiryDateFormatted = expiryDate.toLocaleString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      fields.push(
        {
          name: 'Duration',
          value: `${days} days`,
          inline: true
        },
        {
          name: 'Expires',
          value: expiryDateFormatted,
          inline: false
        }
      );
    } else {
      fields.push(
        {
          name: 'Duration',
          value: 'Lifetime (Never Expires)',
          inline: true
        }
      );
    }

    // Format a nice response embed
    const embed = {
      color: embedColor,
      title: `✅ Premium Activated`,
      description: `Successfully granted premium status to the server.`,
      fields: fields,
      footer: {
        text: `Activated by ${interaction.user.tag}`
      },
      timestamp: new Date()
    };

    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });

    // Log the premium activation
    console.log(`[DEV] Premium tier "${tier}" activated for server ${serverId} for ${days} days by ${interaction.user.tag}`);
  } else {
    await interaction.reply({
      content: `❌ Failed to add premium status to server ${serverId}. Please check the logs for details.`,
      ephemeral: true
    });
  }
}

module.exports = {
  executeAddPremiumCommand,
  isDeveloper
};