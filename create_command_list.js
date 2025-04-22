/**
 * Guard-shin Command List Generator
 * 
 * This script extracts slash commands from fixed command files and creates a complete list
 * for registration with Discord.
 */

const fs = require('fs');
const path = require('path');

function combineCommands() {
  console.log('Generating combined command list for registration...');
  
  // Define the files to check for commands (in order of priority)
  const possibleFiles = [
    'fixed_commands.json',
    'command_list.json',
    'commands_for_dev_portal.json',
    'existing_commands.json',
    'complete_commands_for_registration.json'
  ];
  
  let allCommands = [];
  let loadedFrom = null;
  
  // Load commands from the first available file
  for (const file of possibleFiles) {
    try {
      if (fs.existsSync(file)) {
        const fileContent = JSON.parse(fs.readFileSync(file, 'utf8'));
        
        // Extract commands based on file structure (varies between files)
        if (Array.isArray(fileContent)) {
          allCommands = fileContent;
        } else if (fileContent.commands && Array.isArray(fileContent.commands)) {
          allCommands = fileContent.commands;
        } else {
          // Try to find an array property
          const arrayProps = Object.keys(fileContent).filter(key => Array.isArray(fileContent[key]));
          if (arrayProps.length > 0) {
            allCommands = fileContent[arrayProps[0]];
          }
        }
        
        if (allCommands.length > 0) {
          loadedFrom = file;
          console.log(`Loaded ${allCommands.length} commands from ${file}`);
          break;
        }
      }
    } catch (error) {
      console.log(`Error loading from ${file}: ${error.message}`);
    }
  }
  
  if (!loadedFrom) {
    console.error('Could not find any command files to load from!');
    return false;
  }
  
  // Check for any duplicates by name
  const commandNames = new Set();
  const uniqueCommands = [];
  
  for (const cmd of allCommands) {
    if (!commandNames.has(cmd.name)) {
      commandNames.add(cmd.name);
      uniqueCommands.push(cmd);
    } else {
      console.log(`Duplicate command found: ${cmd.name} - skipping`);
    }
  }
  
  console.log(`After removing duplicates: ${uniqueCommands.length} commands`);
  
  // Validate commands (basic check)
  const validatedCommands = uniqueCommands.filter(cmd => {
    if (!cmd.name || !cmd.description) {
      console.log(`Invalid command found without name or description: ${JSON.stringify(cmd)}`);
      return false;
    }
    return true;
  });
  
  // Save to complete_commands_for_registration.json
  fs.writeFileSync(
    'complete_commands_for_registration.json', 
    JSON.stringify(validatedCommands, null, 2)
  );
  
  console.log(`Successfully saved ${validatedCommands.length} commands to complete_commands_for_registration.json`);
  return true;
}

combineCommands();