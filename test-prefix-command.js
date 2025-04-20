// This is a test file to debug prefix commands
// To run this, change "type": "module" to "type": "commonjs" in package.json temporarily,
// then revert it back when done testing

// Import the prefixCommands collection and the handler
const { prefixCommands, handlePrefixCommand } = require('./bot/commands/prefixCommands.js');

// Log all commands in the collection
console.log("Available prefix commands:");
prefixCommands.forEach((command, name) => {
  console.log(`- ${name}: ${command.description} (Premium: ${command.isPremium})`);
});

// Create a mock message object
const mockMessage = {
  content: ';test',
  author: { 
    bot: false,
    tag: 'TestUser#1234'
  },
  channel: { 
    send: (content) => console.log("CHANNEL SEND:", content),
    reply: (content) => console.log("REPLY:", content)
  },
  guild: { 
    id: '1233495879223345172',
    name: 'Test Guild'
  },
  member: {
    permissions: {
      has: () => true
    }
  },
  mentions: {
    users: {
      first: () => null
    },
    channels: {
      first: () => null
    },
    roles: {
      first: () => null
    }
  }
};

// Test the handlePrefixCommand function
console.log("Testing prefix command ';test'...");
handlePrefixCommand(mockMessage, ';')
  .then(() => {
    console.log("Command execution completed");
  })
  .catch((err) => {
    console.error("Error executing command:", err);
  });