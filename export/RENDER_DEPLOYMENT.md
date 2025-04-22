# Guard-shin Bot Deployment Guide for Render

This guide walks you through deploying the Guard-shin Discord bot to Render, a cloud platform that makes it easy to run applications.

## Prerequisites

1. A [Render account](https://render.com)
2. Your Discord bot token and client ID
3. The Guard-shin codebase (this repository)

## Deployment Methods

There are two ways to deploy the Guard-shin bot on Render:

### Method 1: Using the Blueprint (Recommended)

1. Click the **Deploy to Render** button below:

   [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

2. Sign in to your Render account if not already logged in.
3. Render will prompt you to create a new service. Follow the prompts to complete the deployment.
4. Configure your environment variables as described below.

### Method 2: Manual Deployment

1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New** and select **Web Service**.
3. Connect your GitHub repository, or upload your code manually.
4. Configure your service with the following settings:
   - **Name**: guard-shin-bot (or your preferred name)
   - **Environment**: Python
   - **Region**: Choose a region close to Discord's servers (e.g., Ohio for US)
   - **Branch**: main (or your deployment branch)
   - **Build Command**: `pip install -r requirements-render.txt`
   - **Start Command**: `python run_bot.py`
   - **Plan**: Free (or upgrade as needed)

## Environment Variables

Configure the following environment variables in your Render service:

- `DISCORD_BOT_TOKEN`: Your Discord bot token
- `DISCORD_CLIENT_ID`: Your Discord application client ID
- `DISCORD_CLIENT_SECRET`: (Optional) Your Discord application client secret, needed if you use OAuth2
- `PYTHON_VERSION`: 3.11.0

Optional but recommended variables:
- `STRIPE_SECRET_KEY`: For premium subscriptions
- `DATABASE_URL`: If you're using a database (automatically set if using Render's database)

## Health Checks

Render performs health checks to ensure your service is running correctly. We've set up the bot to respond to the `/health` endpoint with a 200 OK status for this purpose.

## Checking Your Deployment

After deployment, you can verify your bot is working correctly by:

1. Checking the Render dashboard logs
2. Using the `check_render_deployment.py` script which tests bot connectivity
3. Inviting your bot to a server and testing commands

## Troubleshooting

If your bot fails to deploy or run:

1. Check the logs in the Render dashboard
2. Verify all required environment variables are set
3. Ensure the Python version is set to 3.11.0
4. Check that the bot token is valid and has the correct permissions

For more assistance, visit our [support server](https://discord.gg/1233495879223345172) or open an issue on GitHub.

## Advanced Configuration

For advanced setups including database integration, multiple services, or custom domains, refer to [Render's documentation](https://render.com/docs) and the more detailed instructions in this repository.

## Notes for Premium Features

If you're enabling premium features that require payment processing:

1. Set up your Stripe account and get your API keys
2. Configure the relevant environment variables
3. Test the payment system thoroughly before release