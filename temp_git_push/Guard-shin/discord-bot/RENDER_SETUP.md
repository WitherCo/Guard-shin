# Setting Up Guard-shin on Render

This guide will walk you through setting up your Guard-shin Discord bot on Render, a cloud platform that offers a free tier suitable for Discord bots.

## Prerequisites

1. A [GitHub](https://github.com/) account
2. A [Render](https://render.com/) account (you can sign up with your GitHub account)
3. Your Discord Bot Token

## Step 1: Fork the Repository

1. Go to the [Guard-shin GitHub repository](https://github.com/WitherCo/Guard-shin)
2. Click the "Fork" button in the top right
3. This creates a copy of the repository under your GitHub account

## Step 2: Create a Render Service

1. Sign in to [Render](https://render.com/)
2. Click "New" and select "Web Service"
3. Connect your GitHub account if you haven't already
4. Choose your forked Guard-shin repository
5. Configure the service:
   - **Name**: Guard-shin Bot
   - **Environment**: Python 3
   - **Build Command**: `pip install -r discord-bot/requirements.txt`
   - **Start Command**: `python discord-bot/bot.py`

## Step 3: Configure Environment Variables

1. Scroll down to the "Environment" section
2. Add the following environment variables:
   - `GUARD_SHIN_BOT_TOKEN` - Your Discord bot token
   - `DISCORD_BOT_TOKEN` - Same as above (for compatibility)

## Step 4: Add a Database (Optional but Recommended)

1. In Render, click "New" and select "PostgreSQL"
2. Configure the database:
   - **Name**: guard-shin-db
   - **User**: guard_shin (or any username you prefer)
   - **Database**: guard_shin (or any database name you prefer)
3. Click "Create Database"
4. Once created, copy the "Internal Database URL" from the database dashboard
5. Go back to your web service and add a new environment variable:
   - `DATABASE_URL` - Paste the internal database URL

## Step 5: Deploy the Bot

1. Click "Create Web Service"
2. Render will automatically build and deploy your bot
3. You can view the build and deployment logs in real-time

## Step 6: Monitor Your Bot

1. Once deployed, your bot should be online and running
2. You can view logs by selecting your service and clicking the "Logs" tab
3. If there are any issues, check the logs for error messages

## Step 7: Set Up Automatic Deployment (Optional)

By default, Render will automatically deploy your bot whenever you push changes to the repository. You can configure this behavior in the "Settings" tab:

1. Go to your web service and click "Settings"
2. Scroll down to the "Deploy" section
3. Under "Auto-Deploy", you can choose:
   - **Yes**: Deploy on every push
   - **No**: Manual deploys only

## Tips

1. Render's free tier includes 750 hours of runtime per month, which is enough for most bots
2. Free tier services will spin down after 15 minutes of inactivity, which may cause a slight delay when your bot receives a new interaction
3. To avoid this, consider upgrading to a paid plan or implementing a "ping" mechanism to keep your bot active

## Troubleshooting

If your bot fails to deploy or run, check the following:

1. Verify your environment variables are set correctly
2. Check the logs for any Python errors
3. Make sure your bot token is valid and has the correct permissions
4. Ensure the build and start commands are pointing to the correct files and directories

For further assistance, join our [Discord support server](https://discord.gg/g3rFbaW6gw)