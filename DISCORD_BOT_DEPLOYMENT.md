# Guard-shin Discord Bot Deployment Guide

This guide explains how to deploy and maintain the Guard-shin Discord bot.

## Automatic Deployment

The bot is configured to automatically deploy to a dedicated branch called `discord-bot-deployment` in your GitHub repository. This happens through GitHub Actions whenever you:

1. Push changes to the `main` branch that affect bot files
2. Manually trigger the "Deploy Discord Bot" workflow
3. Wait for the scheduled run (every 4 hours)

## Deployment Options

### 1. Heroku Deployment (Recommended)

1. Go to the [Heroku Dashboard](https://dashboard.heroku.com/)
2. Create a new app
3. Go to the "Deploy" tab
4. Connect your GitHub repository
5. Select the `discord-bot-deployment` branch
6. Enable automatic deploys
7. Add the required environment variables in the "Settings" tab:
   - `DISCORD_BOT_TOKEN` or `GUARD_SHIN_BOT_TOKEN`

Alternatively, use the one-click deploy button in the branch's README file.

### 2. Render Deployment

1. Go to the [Render Dashboard](https://dashboard.render.com/)
2. Create a new "Web Service"
3. Connect your GitHub repository
4. Select the `discord-bot-deployment` branch
5. Set the environment type to "Python"
6. Set the build command to `pip install -r requirements.txt`
7. Set the start command to `python run.py`
8. Add the required environment variables:
   - `DISCORD_BOT_TOKEN` or `GUARD_SHIN_BOT_TOKEN`

Alternatively, use the one-click deploy button in the branch's README file.

### 3. Local Deployment

To run the bot locally:

1. Clone the repository
2. Check out the `discord-bot-deployment` branch
3. Install dependencies: `pip install -r requirements.txt`
4. Set environment variables:
   - On Windows: `set DISCORD_BOT_TOKEN=your_token_here`
   - On Linux/Mac: `export DISCORD_BOT_TOKEN=your_token_here`
5. Run the bot: `python run.py`

### 4. Other Hosting Options

Any platform that supports Python applications can run this bot, including:

- DigitalOcean App Platform
- AWS Elastic Beanstalk
- Google Cloud Run
- Railway.app
- PythonAnywhere

## Troubleshooting

If the bot isn't working properly:

1. Check the logs on your hosting platform
2. Verify that the correct token is set in environment variables
3. Ensure the bot has the required permissions in Discord
4. Make sure the bot is invited to your server with the correct scopes
5. Check if your hosting platform is preventing the bot from running continuously
6. Try re-deploying the bot by manually triggering the GitHub workflow