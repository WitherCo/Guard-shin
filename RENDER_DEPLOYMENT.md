# Guard-shin Deployment Guide for Render

This guide walks you through deploying Guard-shin to Render, ensuring both the Discord bot and web dashboard are running correctly.

## Prerequisites

1. A [Render](https://render.com/) account
2. Your Discord application set up with:
   - Bot token: `DISCORD_BOT_TOKEN`
   - Application ID: `DISCORD_CLIENT_ID`
   - Client Secret: `DISCORD_CLIENT_SECRET`
3. Optional: Stripe payment keys (if using premium features)

## Step 1: Create a New Web Service

1. Go to the Render dashboard and click "New Web Service"
2. Connect your GitHub repository (https://github.com/WitherCo/Guard-shin)
3. Provide these details:
   - **Name**: guard-shin-bot
   - **Region**: Choose one close to your users
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.cjs`

## Step 2: Set Environment Variables

In the "Environment" section, add these variables:

| Key | Value | Description |
|-----|-------|-------------|
| DISCORD_CLIENT_ID | 1361873604882731008 | Your Discord Application ID |
| DISCORD_BOT_TOKEN | your_bot_token | Your Discord Bot Token |
| DISCORD_CLIENT_SECRET | your_client_secret | Your Discord Client Secret |
| STRIPE_SECRET_KEY | your_stripe_secret | Stripe API Key (Premium) |
| VITE_STRIPE_PUBLIC_KEY | your_stripe_publishable | Stripe Public Key (Premium) |
| PAYMENT_WEBHOOK_URL | https://your-render-app.onrender.com/api/webhook/payment | For payment notifications |
| UPDATE_WEBHOOK_URL | https://your-render-app.onrender.com/api/webhook/update | For deployment updates |

## Step 3: Deploy Your Service

1. Click "Create Web Service"
2. Wait for the initial deployment to complete (5-10 minutes)
3. Check the logs for any deployment issues

## Step 4: Configure Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to "OAuth2" → "General"
4. Add a Redirect URL:
   - `https://your-render-app.onrender.com/auth/callback`
5. Go to "Bot" section
6. Enable "Server Members Intent" and "Message Content Intent"
7. Save changes

## Step 5: Update Invite Link

Update your bot invite link to include required permissions and scopes:

```
https://discord.com/oauth2/authorize?client_id=1361873604882731008&permissions=8&scope=bot%20applications.commands
```

This link includes:
- Your client ID
- Administrator permissions (8)
- Bot and application.commands scopes

## Step 6: Verify Deployment

1. Check Render logs for successful startup
2. Look for "Logged in as Guard-shin" in the logs
3. Verify bot connects to your servers
4. Test slash commands in Discord

## Troubleshooting

### Bot Not Connecting
- Verify `DISCORD_BOT_TOKEN` is correct
- Check Discord Developer Portal for correct settings
- Make sure intents are enabled

### Commands Not Registering
- Verify `DISCORD_CLIENT_ID` matches your bot token's application
- Ensure the bot has the `applications.commands` scope when invited
- Check Render logs for registration errors

### Dashboard Not Loading
- Check the Render logs for web server errors
- Verify all environment variables are properly set
- Make sure GitHub deployment was successful

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Discord.js Guide](https://discordjs.guide/#before-you-begin)
- [Discord Developer Portal](https://discord.com/developers/applications)