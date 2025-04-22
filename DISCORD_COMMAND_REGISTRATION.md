# Discord Command Registration Guide for Guard-shin

Since Guard-shin is a **team-owned verified Discord bot**, command registration requires special handling.

## Error 20012: Not Authorized

If you see this error:
```
ERROR: 403 Forbidden (error code: 20012): You are not authorized to perform this action on this application
```

This means your current deployment doesn't have the proper permissions to register commands.

## Solution: Use Manual Command Registration

For team-owned bots, especially verified ones, the recommended approach is to use manual command registration:

### Option 1: Use the Provided Scripts

1. Clone the repository to your local machine
2. Set up the environment variables:
   ```
   DISCORD_BOT_TOKEN=your_bot_token
   DISCORD_CLIENT_ID=your_client_id
   ```
3. Run this command from the repository root:
   ```bash
   node global_register.js
   ```

### Option 2: Discord Developer Portal

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select the Guard-shin application
3. Navigate to "Bot" → "Commands"
4. Use the web interface to register commands

## For Render Deployment

When deploying to Render, set an additional environment variable to disable automatic command registration:

```
DISABLE_COMMAND_REGISTRATION=true
```

This will prevent the bot from attempting to register commands on startup, avoiding the 403 error.

## Need Help?

If you continue to have issues, please contact the bot team owner to help with command registration.