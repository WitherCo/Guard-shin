# Guard-shin Discord Bot Deployment on Render

This guide provides step-by-step instructions for deploying the Guard-shin Discord bot on Render.com.

## Quick Start Guide

1. **Login to Render.com** (create an account if needed)
2. Click **New** → **Web Service**
3. Select **Build and deploy from a Git repository**
4. Connect your GitHub account and select your Guard-shin repository
5. Use these settings:
   - **Name**: guard-shin-bot
   - **Root Directory**: discord-bot
   - **Environment**: Node
   - **Build Command**: npm install && pip install -r requirements.txt
   - **Start Command**: node server.js
6. Add your **DISCORD_BOT_TOKEN** environment variable
7. Click **Create Web Service**

## Detailed Deployment Steps

### 1. Create a Render Account

1. Go to [render.com](https://render.com) and sign up for a free account
2. Verify your email address

### 2. Connect Your GitHub Repository

1. In the Render dashboard, click **New** and select **Web Service**
2. Choose **Build and deploy from a Git repository**
3. Click **Connect GitHub** if you haven't connected your account yet
4. Find and select your Guard-shin repository

### 3. Configure Your Web Service

1. Configure the following settings:
   - **Name**: guard-shin-bot (or any name you prefer)
   - **Root Directory**: discord-bot
   - **Environment**: Node
   - **Region**: Choose the closest to your location
   - **Branch**: main
   - **Build Command**: npm install && pip install -r requirements.txt
   - **Start Command**: node server.js
   - **Plan**: Free

2. Under **Environment Variables**, add at minimum:
   - Key: DISCORD_BOT_TOKEN
   - Value: Your Discord bot token

3. Click **Advanced** and add:
   - Health Check Path: /health

4. Click **Create Web Service**

### 4. Monitor Deployment

1. Render will begin building and deploying your bot
2. The deployment process takes about 2-5 minutes
3. You can follow the build logs in real-time on the Render dashboard
4. Once complete, your bot should connect to Discord automatically

## Important Notes

- The health check endpoint keeps your bot running on Render's free tier
- You can monitor your bot's status at the provided Render URL
- For server connection issues, check the Render logs
- Premium features require additional environment variables (STRIPE_SECRET_KEY, etc.)

## Troubleshooting

If your bot doesn't connect:
1. Check the Render logs for errors
2. Verify your Discord bot token is correct
3. Ensure the bot has proper permissions in Discord

## Managing Your Bot

- **Restart**: Visit your Render URL + "/restart" or use the Render dashboard
- **Logs**: View real-time logs in the Render dashboard
- **Updates**: Push changes to GitHub, and Render will automatically redeploy