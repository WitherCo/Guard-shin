# Setup Guide for Guard-shin Bot

This guide will walk you through the process of setting up the Guard-shin bot for your Discord server.

## Prerequisites

Before you begin, ensure you have the following:

1. A Discord account with administrative privileges on the server where you want to add the bot
2. Node.js 18+ and npm installed (if running the bot locally)
3. A PostgreSQL database (if running the bot locally)
4. Basic knowledge of Discord server management

## Adding the Bot to Your Server

### Quick Method

1. Click on this link to add Guard-shin to your server: [Add Guard-shin](https://discord.com/oauth2/authorize?client_id=1361873604882731008)
2. Select the server where you want to add the bot from the dropdown menu
3. Review the permissions and click "Authorize"
4. Complete the CAPTCHA verification if prompted
5. The bot will join your server and is ready to be configured

### Manual Method (if you're hosting your own instance)

1. Create a new application in the [Discord Developer Portal](https://discord.com/developers/applications)
2. Navigate to the "Bot" tab and click "Add Bot"
3. Under the "TOKEN" section, click "Copy" to copy your bot token
4. Save this token in your `.env` file as `DISCORD_BOT_TOKEN`
5. Go to the "OAuth2" tab, then "URL Generator"
6. Select the "bot" and "applications.commands" scopes
7. Select the necessary permissions for the bot
8. Copy the generated URL and open it in your browser
9. Follow the steps to add the bot to your server

## Basic Configuration

Once the bot is in your server, you can start configuring it:

1. **Set a prefix**: By default, the bot uses the `/` prefix for commands. You can change this with:
   ```
   /prefix set <your-prefix>
   ```

2. **Configure moderation settings**:
   ```
   /automod
   ```
   This will guide you through setting up auto-moderation features.

3. **Set up verification**:
   ```
   /verification setup
   ```
   Follow the prompts to configure the verification system.

4. **Configure welcome messages**:
   ```
   /welcome setup
   ```
   This allows you to set up customized welcome messages for new members.

## Premium Features

Guard-shin offers premium features for enhanced server management. To access these:

1. Join our [support server](https://discord.gg/g3rFbaW6gw)
2. Purchase a premium subscription through the dashboard or with the `/premium` command
3. Link your premium subscription to your server with:
   ```
   /premium activate
   ```

## Local Development Setup

If you want to run your own instance of Guard-shin:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/guard-shin.git
   cd guard-shin
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example` and fill in all required values

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the bot:
   ```bash
   npm run dev
   ```

## Docker Deployment

For production deployment, we recommend using Docker:

```bash
docker-compose up -d
```

This will start the bot and database in detached mode.

## Troubleshooting

If you encounter issues:

1. Check the bot has proper permissions in your server
2. Ensure the bot role is high enough in the role hierarchy
3. View logs with the `/logs` command
4. Join our [support server](https://discord.gg/g3rFbaW6gw) for assistance

## Next Steps

- Review the [Commands List](../README.md#available-commands) to learn all available commands
- Set up [Auto-moderation](./AUTO-MODERATION.md) for enhanced server protection
- Configure [Raid Protection](./RAID-PROTECTION.md) to prevent raid attacks