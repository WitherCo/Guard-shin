# Guard-shin Render Deployment Guide

This guide explains how to deploy the Guard-shin Discord bot to Render.com using the included render.yaml configuration.

## Prerequisites

Before deploying, make sure you have:

1. A Discord application with bot token (from the [Discord Developer Portal](https://discord.com/developers/applications))
2. A Render.com account
3. The necessary API keys for services like Stripe (for premium features)

## Deployment Steps

### 1. Create a New Render Blueprint

1. Log in to your [Render Dashboard](https://dashboard.render.com)
2. Click the "New" button and select "Blueprint"
3. Connect your GitHub repository containing the Guard-shin code
4. Select the repository and click "Connect"

### 2. Configure Environment Variables

The render.yaml file already defines the required environment variables, but you'll need to provide the actual values:

- **DISCORD_BOT_TOKEN**: Your Discord bot token
- **DISCORD_CLIENT_ID**: Your Discord application client ID
- **DISCORD_CLIENT_SECRET**: Your Discord application client secret
- **STRIPE_SECRET_KEY**: Your Stripe secret key (for premium features)
- **VITE_STRIPE_PUBLIC_KEY**: Your Stripe publishable key (for premium features)
- **GITHUB_TOKEN**: (Optional) If you're using GitHub integration
- **PAYMENT_WEBHOOK_URL**: (Optional) Webhook URL for payment notifications
- **UPDATE_WEBHOOK_URL**: (Optional) Webhook URL for bot update notifications

### 3. Deploy the Service

1. Click "Apply" to deploy the service according to the render.yaml configuration
2. Wait for the build and deployment to complete
3. Once deployed, Render will provide a URL for your bot service

### 4. Verify Deployment

1. Access the URL provided by Render
2. You should see a status page showing that the Guard-shin bot is running
3. You can also check the health endpoint at `/health` to verify the bot is operational

## Environment Variables Explanation

- **PYTHON_VERSION**: Specifies the Python version to use (3.11.3)
- **DISCORD_BOT_TOKEN**: The token for your Discord bot
- **DISCORD_CLIENT_ID**: Your Discord application's client ID
- **DISCORD_CLIENT_SECRET**: Your Discord application's client secret
- **DISABLE_COMMAND_REGISTRATION**: Set to "true" to prevent command registration issues
- **STRIPE_SECRET_KEY**: Your Stripe secret key for processing payments
- **VITE_STRIPE_PUBLIC_KEY**: Your Stripe publishable key for the frontend

## Troubleshooting

If you encounter any issues:

1. Check the Render logs for error messages
2. Verify that all environment variables are correctly set
3. Ensure your Discord bot token is valid and has the necessary permissions
4. Check that your requirements-render.txt file includes all necessary dependencies

For Discord API rate limit errors, consider using the unverified bot approach described in UNVERIFIED_BOT_GUIDE.md.

## Maintenance

To update your deployment:

1. Push changes to your GitHub repository
2. Render will automatically rebuild and deploy the latest version

## Using the Unverified Bot Approach

If you're experiencing issues with global command registration due to Discord's verification requirements, consider using the unverified bot approach:

1. Follow the instructions in UNVERIFIED_BOT_GUIDE.md to create a new unverified bot
2. Update your DISCORD_BOT_TOKEN and DISCORD_CLIENT_ID environment variables in Render
3. Set DISABLE_COMMAND_REGISTRATION to "true" as commands will be registered separately

This approach allows for global command registration without team owner approval requirements.