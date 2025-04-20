const { MessageEmbed } = require('discord.js');
const { prefixCommands } = require('../commands/prefixCommands');
const { slashCommands } = require('../commands/slashCommands');

/**
 * Help command - displays information about available commands
 * @param {Message} message - Discord message object
 * @param {Array} args - Command arguments
 */
async function executeHelpCommand(message, args) {
  // If a specific command is requested
  if (args.length > 0) {
    const commandName = args[0].toLowerCase();
    
    // Check if it's a prefix command
    const command = prefixCommands.get(commandName);
    
    if (command) {
      // Create an embed for the command details
      const embed = {
        color: 0x5865F2, // Discord Blurple
        title: `Command: ${command.name}`,
        description: command.description,
        fields: [
          {
            name: 'Usage',
            value: `\`${command.usage}\``,
            inline: false
          }
        ],
        footer: {
          text: 'Guard-shin Bot'
        },
        timestamp: new Date()
      };
      
      // Add example if available
      if (command.example) {
        embed.fields.push({
          name: 'Example',
          value: `\`${command.example}\``,
          inline: false
        });
      }
      
      // Add aliases if available
      if (command.aliases && command.aliases.length > 0) {
        embed.fields.push({
          name: 'Aliases',
          value: command.aliases.map(alias => `\`${alias}\``).join(', '),
          inline: false
        });
      }
      
      // Add premium/admin indicators
      let restrictions = [];
      if (command.isPremium) restrictions.push('⭐ Premium Command');
      if (command.isAdmin) restrictions.push('🔒 Admin Command');
      
      if (restrictions.length > 0) {
        embed.fields.push({
          name: 'Restrictions',
          value: restrictions.join(', '),
          inline: false
        });
      }
      
      return message.channel.send({ embeds: [embed] });
    } else {
      return message.reply(`No command called "${commandName}" was found.`);
    }
  }
  
  // If no specific command requested, show command categories
  // Create categories for organization
  const categories = {
    moderation: [],
    automod: [],
    utility: [],
    info: [],
    admin: [],
    premium: []
  };
  
  // Sort prefix commands into categories
  for (const [name, cmd] of prefixCommands.entries()) {
    // Skip aliases (only include the main command name)
    if (cmd.name !== name) continue;
    
    // Add to category
    if (categories[cmd.category]) {
      categories[cmd.category].push(cmd.name);
    }
  }
  
  // Create an embed for the help menu
  const helpEmbed = {
    color: 0x5865F2, // Discord Blurple
    title: 'Guard-shin Help Menu',
    description: 'Here\'s a list of available commands. Use `;help <command>` for detailed information on a specific command.',
    fields: [],
    footer: {
      text: 'Guard-shin Bot • Premium commands require subscription'
    },
    timestamp: new Date()
  };
  
  // Add fields for each category
  for (const [category, commands] of Object.entries(categories)) {
    if (commands.length > 0) {
      helpEmbed.fields.push({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: commands.map(cmd => `\`${cmd}\``).join(', '),
        inline: false
      });
    }
  }
  
  // Add info about slash commands too
  helpEmbed.fields.push({
    name: 'Slash Commands',
    value: 'Guard-shin also supports Discord slash commands. Type `/` in the chat to see all available slash commands.',
    inline: false
  });
  
  return message.channel.send({ embeds: [helpEmbed] });
}

/**
 * Help slash command - displays information about available commands
 * @param {Interaction} interaction - Discord interaction object
 */
async function executeHelpSlashCommand(interaction) {
  const commandName = interaction.options.getString('command');
  
  // If a specific command is requested
  if (commandName) {
    // Check if it's a slash command
    const command = slashCommands.get(commandName);
    
    if (command) {
      // Create an embed for the command details
      const embed = {
        color: 0x5865F2, // Discord Blurple
        title: `Slash Command: /${command.data.name}`,
        description: command.data.description,
        fields: [],
        footer: {
          text: 'Guard-shin Bot'
        },
        timestamp: new Date()
      };
      
      // Add options if available
      if (command.data.options && command.data.options.length > 0) {
        embed.fields.push({
          name: 'Options',
          value: command.data.options.map(option => {
            const required = option.required ? ' (required)' : '';
            return `\`${option.name}\`${required}: ${option.description}`;
          }).join('\n'),
          inline: false
        });
      }
      
      // Add premium/admin indicators
      let restrictions = [];
      if (command.isPremium) restrictions.push('⭐ Premium Command');
      if (command.isAdmin) restrictions.push('🔒 Admin Command');
      
      if (restrictions.length > 0) {
        embed.fields.push({
          name: 'Restrictions',
          value: restrictions.join(', '),
          inline: false
        });
      }
      
      return interaction.reply({ embeds: [embed] });
    } else {
      return interaction.reply({ 
        content: `No slash command called "/${commandName}" was found.`,
        ephemeral: true 
      });
    }
  }
  
  // If no specific command requested, show general help
  // Create categories
  const categories = {
    moderation: [],
    automod: [],
    utility: [],
    info: [],
    admin: [],
    premium: []
  };
  
  // Sort slash commands into categories
  for (const [name, cmd] of slashCommands.entries()) {
    // Get category (might need to add category property to slash commands)
    const category = cmd.category || 'utility';
    
    if (categories[category]) {
      categories[category].push(name);
    }
  }
  
  // Create the help embed
  const helpEmbed = {
    color: 0x5865F2, // Discord Blurple
    title: 'Guard-shin Slash Commands',
    description: 'Here\'s a list of available slash commands. Use `/help command:<commandname>` for detailed information on a specific command.',
    fields: [],
    footer: {
      text: 'Guard-shin Bot • Premium commands require subscription'
    },
    timestamp: new Date()
  };
  
  // Add fields for each category
  for (const [category, commands] of Object.entries(categories)) {
    if (commands.length > 0) {
      helpEmbed.fields.push({
        name: category.charAt(0).toUpperCase() + category.slice(1),
        value: commands.map(cmd => `\`/${cmd}\``).join(', '),
        inline: false
      });
    }
  }
  
  // Add information about prefix commands
  helpEmbed.fields.push({
    name: 'Prefix Commands',
    value: 'Guard-shin also supports traditional prefix commands. Use `;help` to see all available prefix commands.',
    inline: false
  });
  
  return interaction.reply({ embeds: [helpEmbed] });
}

module.exports = {
  executeHelpCommand,
  executeHelpSlashCommand
};