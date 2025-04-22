# Command Registration for Team-Owned Discord Bots

## Error 20012: Not Authorized to Register Commands

If you're seeing this error message:

```
403 Forbidden (error code: 20012): You are not authorized to perform this action on this application
```

This is because the bot is owned by a team, and the current user (using the token) doesn't have the proper permissions to register commands. This is a Discord security feature.

## Solution 1: Register Commands Manually (Recommended)

The easiest way to solve this is to have a team admin or the bot owner register the commands manually:

1. Make sure you have the necessary permissions in the Discord Developer Portal
2. Run the command registration script:

```bash
node register_global_commands.js
```

This script will register all commands globally so they'll be available in all servers.

## Solution 2: Disable Command Registration in the Bot

If you want to deploy the bot without registering commands (because they're already registered or will be registered later):

1. Set the environment variable `DISABLE_COMMAND_REGISTRATION=true`
2. Run the bot normally

The bot will start without attempting to register commands, avoiding the 403 error.

## Required Files

1. `register_global_commands.js` - Script to register commands globally
2. `complete_commands_for_registration.json` - Generated from `create_command_list.js`

## Step-by-Step Process

### Preparing for Command Registration

1. Run the command list generator:

```bash
node create_command_list.js
```

2. This will create `complete_commands_for_registration.json` with all the bot's commands

### Registering Commands Globally

1. Have a team admin or bot owner run:

```bash
node register_global_commands.js
```

2. Commands will be registered globally for all servers

### Running the Bot Without Command Registration

1. Set the environment variable in `.env`:

```
DISABLE_COMMAND_REGISTRATION=true
```

2. Start the bot normally:

```bash
python run_bot.py
```

The bot will use the pre-registered commands without trying to register them again.

## Troubleshooting

1. **Invalid Token**: Make sure you're using the correct bot token
2. **Missing Commands**: Check that `complete_commands_for_registration.json` exists and contains commands
3. **Permission Error**: Only team members with Admin or Developer roles can register commands

## Discord Developer Portal

Team owners can add members with proper permissions at:
https://discord.com/developers/applications/1361873604882731008/team

## Deployment on Render

For Render deployment, the `render.yaml` configuration includes:

```yaml
envVars:
  - key: DISABLE_COMMAND_REGISTRATION
    value: true
```

This disables command registration by default for Render deployments.