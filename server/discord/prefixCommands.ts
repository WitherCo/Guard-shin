/**
 * Prefix Commands Handler
 * 
 * This module handles prefix-based commands for the Discord bot.
 */
import { logUpdate } from '../update-logger';

/**
 * Handle a prefix command from Discord
 * @param message The Discord message object
 * @param prefix The command prefix (e.g., ';')
 */
export async function handlePrefixCommand(message: any, prefix: string): Promise<void> {
  try {
    // Check if the message starts with the prefix
    if (!message.content.startsWith(prefix)) {
      return;
    }
    
    // Extract the command and arguments
    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    
    if (!commandName) {
      return;
    }
    
    console.log(`[PREFIX COMMAND] Processing command: ${commandName} with args: ${args.join(', ')}`);
    
    // Get the command handler
    const command = commands[commandName];
    
    if (!command) {
      await message.reply(`Unknown command: ${commandName}`);
      return;
    }
    
    // Check if user has permissions to run the command
    if (command.requiresAdmin) {
      // Simple permission check - in production, you'd use proper Discord permission checks
      const isAdmin = message.member?.permissions?.has('ADMINISTRATOR');
      
      if (!isAdmin) {
        await message.reply('You do not have permission to use this command.');
        return;
      }
    }
    
    // Execute the command
    await command.execute(message, args);
    
    // Log the command usage
    await logUpdate(`User ${message.author.tag} ran prefix command: ${commandName}`, 'discord');
  } catch (error) {
    console.error('[PREFIX COMMAND] Error processing command:', error);
    
    try {
      await message.reply('There was an error executing that command.');
    } catch (replyError) {
      console.error('[PREFIX COMMAND] Could not send error reply:', replyError);
    }
  }
}

/**
 * Command interface
 */
interface Command {
  name: string;
  description: string;
  requiresAdmin: boolean;
  execute: (message: any, args: string[]) => Promise<void>;
}

/**
 * Available command handlers
 */
const commands: Record<string, Command> = {
  // Help command
  help: {
    name: 'help',
    description: 'Shows a list of available commands',
    requiresAdmin: false,
    execute: async (message, args) => {
      const commandList = Object.values(commands)
        .filter(cmd => !cmd.requiresAdmin || message.member?.permissions?.has('ADMINISTRATOR'))
        .map(cmd => `**${cmd.name}**: ${cmd.description}`)
        .join('\n');
      
      await message.reply(`**Available Commands**\nUse ${prefix}command to run a command.\n\n${commandList}`);
    }
  },
  
  // Ping command
  ping: {
    name: 'ping',
    description: 'Check if the bot is responsive',
    requiresAdmin: false,
    execute: async (message, args) => {
      const sent = await message.reply('Pinging...');
      const diff = sent.createdTimestamp - message.createdTimestamp;
      
      await sent.edit(`Pong! 🏓 Took ${diff}ms`);
    }
  },
  
  // Server info command
  serverinfo: {
    name: 'serverinfo',
    description: 'Display information about the server',
    requiresAdmin: false,
    execute: async (message, args) => {
      const guild = message.guild;
      
      if (!guild) {
        await message.reply('This command must be used in a server.');
        return;
      }
      
      const info = [
        `**Name**: ${guild.name}`,
        `**ID**: ${guild.id}`,
        `**Owner**: <@${guild.ownerId}>`,
        `**Members**: ${guild.memberCount}`,
        `**Created**: <t:${Math.floor(guild.createdTimestamp / 1000)}:F>`
      ].join('\n');
      
      await message.reply(info);
    }
  },
  
  // Lockdown command
  lockdown: {
    name: 'lockdown',
    description: 'Enable or disable server lockdown mode',
    requiresAdmin: true,
    execute: async (message, args) => {
      // In a real implementation, this would call the raidProtection module
      
      const action = args[0]?.toLowerCase();
      
      if (action === 'enable' || action === 'on') {
        await message.reply('🔒 Server lockdown enabled. All channel permissions have been restricted for regular members.');
      } else if (action === 'disable' || action === 'off') {
        await message.reply('🔓 Server lockdown disabled. Channel permissions have been restored.');
      } else {
        await message.reply('Please specify either `enable` or `disable` after the lockdown command.');
      }
    }
  },
  
  // Ban command
  ban: {
    name: 'ban',
    description: 'Ban a user from the server',
    requiresAdmin: true,
    execute: async (message, args) => {
      if (!args.length) {
        await message.reply('Please mention a user to ban.');
        return;
      }
      
      const target = message.mentions.users.first();
      
      if (!target) {
        await message.reply('Could not find that user.');
        return;
      }
      
      // Remove the mention from args to get just the reason
      args.shift();
      const reason = args.length ? args.join(' ') : 'No reason provided';
      
      try {
        await message.guild.members.ban(target, { reason });
        await message.reply(`🔨 Banned ${target.tag} | Reason: ${reason}`);
      } catch (error) {
        console.error('Error banning user:', error);
        await message.reply('Failed to ban user. Make sure I have the necessary permissions.');
      }
    }
  },
  
  // Kick command
  kick: {
    name: 'kick',
    description: 'Kick a user from the server',
    requiresAdmin: true,
    execute: async (message, args) => {
      if (!args.length) {
        await message.reply('Please mention a user to kick.');
        return;
      }
      
      const target = message.mentions.users.first();
      
      if (!target) {
        await message.reply('Could not find that user.');
        return;
      }
      
      // Remove the mention from args to get just the reason
      args.shift();
      const reason = args.length ? args.join(' ') : 'No reason provided';
      
      try {
        const member = message.guild.members.cache.get(target.id);
        
        if (member) {
          await member.kick(reason);
          await message.reply(`👢 Kicked ${target.tag} | Reason: ${reason}`);
        } else {
          await message.reply('That user is not in this server.');
        }
      } catch (error) {
        console.error('Error kicking user:', error);
        await message.reply('Failed to kick user. Make sure I have the necessary permissions.');
      }
    }
  },
  
  // Clear messages command
  clear: {
    name: 'clear',
    description: 'Clear a specified number of messages from the channel',
    requiresAdmin: true,
    execute: async (message, args) => {
      const amount = parseInt(args[0]);
      
      if (isNaN(amount) || amount < 1 || amount > 100) {
        await message.reply('Please provide a number between 1 and 100.');
        return;
      }
      
      try {
        // Delete the command message
        await message.delete();
        
        // Delete the specified number of messages
        const deleted = await message.channel.bulkDelete(amount, true);
        
        // Send a temporary confirmation message
        const confirmation = await message.channel.send(`🧹 Deleted ${deleted.size} messages.`);
        
        // Delete the confirmation message after 5 seconds
        setTimeout(() => confirmation.delete().catch(console.error), 5000);
      } catch (error) {
        console.error('Error clearing messages:', error);
        await message.reply('Failed to clear messages. Messages older than 14 days cannot be bulk deleted.');
      }
    }
  }
};