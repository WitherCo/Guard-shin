# Setting Up Guard-shin on Railway

This guide will walk you through setting up your Guard-shin Discord bot on Railway, a cloud platform that offers a free tier suitable for Discord bots.

## Prerequisites

1. A [GitHub](https://github.com/) account
2. A [Railway](https://railway.app/) account (you can sign up with your GitHub account)
3. Your Discord Bot Token

## Step 1: Fork the Repository

1. Go to the [Guard-shin GitHub repository](https://github.com/WitherCo/Guard-shin)
2. Click the "Fork" button in the top right
3. This creates a copy of the repository under your GitHub account

## Step 2: Create a Railway Project

1. Sign in to [Railway](https://railway.app/)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your forked Guard-shin repository
5. Select the repository and click "Deploy Now"

## Step 3: Configure Environment Variables

1. In your Railway project, click on the "Variables" tab
2. Add the following environment variables:
   - `GUARD_SHIN_BOT_TOKEN` - Your Discord bot token
   - `DISCORD_BOT_TOKEN` - Same as above (for compatibility)
   - `DATABASE_URL` - This will be auto-populated if you add a PostgreSQL database in the next step

## Step 4: Add a Database (Optional but Recommended)

1. In your Railway project, click on "New"
2. Select "Database" then "PostgreSQL"
3. Railway will automatically create a PostgreSQL database and add the connection string to your environment variables

## Step 5: Configure the Start Command

1. In your Railway project, click on the "Settings" tab
2. Under "Start Command", enter: `python discord-bot/bot.py`

## Step 6: Monitor Your Bot

1. Once deployed, your bot should be online and running
2. You can view logs by clicking on your deployment and selecting the "Logs" tab
3. If there are any issues, check the logs for error messages

## Step 7: Set Up GitHub Actions for Automatic Deployment (Optional)

1. Go to your GitHub repository
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Add a new repository secret:
   - Name: `RAILWAY_TOKEN`
   - Value: Your Railway API token (get this from Railway dashboard > Account > Developer > New Token)
4. Now whenever you push changes to the repository, GitHub Actions will automatically deploy to Railway

## Tips

1. Railway's free tier includes 500 hours of runtime per month, which is enough for most small to medium bots
2. If you need more hours, consider upgrading to Railway's paid tier
3. Ensure your bot code includes error handling and automatic reconnection logic for better reliability

## Troubleshooting

If your bot fails to deploy or run, check the following:

1. Verify your environment variables are set correctly
2. Check the logs for any Python errors
3. Make sure your bot token is valid and has the correct permissions
4. Ensure the start command is pointing to the correct file

For further assistance, join our [Discord support server](https://discord.gg/g3rFbaW6gw)