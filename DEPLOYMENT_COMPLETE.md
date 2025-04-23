# Guard-shin Deployment Guide

## Successfully Deployed!

Congratulations! The Guard-shin Discord bot has been prepared for deployment on Render and the dashboard has been deployed to GitHub Pages.

### GitHub Pages Dashboard

✅ **Your dashboard has been successfully deployed to GitHub Pages!**
- Dashboard URL: https://WitherCo.github.io/Guard-shin/
- It may take 5-10 minutes for GitHub Pages to update and show your site.

### Render Bot Deployment

You have two options for deploying your Discord bot to Render:

#### Option 1: Automated Deployment (Recommended)

We've created a simple script to automate your Render deployment:

1. **Set Required Environment Variables**
   ```bash
   export RENDER_API_KEY=your_render_api_key
   export DISCORD_BOT_TOKEN=your_discord_bot_token
   export STRIPE_SECRET_KEY=your_stripe_secret_key
   ```

2. **Run the Deployment Script**
   ```bash
   ./deploy_render.sh
   ```

3. **Monitor Deployment**
   - The script will provide a URL to monitor your deployment
   - Once deployed, your bot should come online in Discord

#### Option 2: Manual Deployment

If you prefer to manually deploy through the Render Dashboard:

1. **Login to Render Dashboard**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Login with your account

2. **Create a New Web Service**
   - Click "New" in the top right corner
   - Select "Web Service"

3. **Connect Your Repository**
   - Choose "Deploy from GitHub" or "Upload files directly"
   - Connect your GitHub repository or upload all files

4. **Configure the Service**
   - **Name**: `guard-shin-bot`
   - **Environment**: `Python`
   - **Region**: Choose the closest to your users
   - **Branch**: `main` (if using GitHub)
   - **Build Command**: `pip install -r requirements-render.txt && chmod +x render_start.sh`
   - **Start Command**: `./render_start.sh`
   - **Health Check Path**: `/health`
   - **Plan**: Free or choose a plan that suits your needs

5. **Environment Variables**
   Set the following environment variables:
   
   ```
   PORT=8080
   PYTHON_VERSION=3.11.3
   DISABLE_COMMAND_REGISTRATION=true
   DISCORD_BOT_TOKEN=(your Discord bot token)
   DISCORD_CLIENT_ID=1361873604882731008
   STRIPE_SECRET_KEY=(your Stripe secret key)
   ```

6. **Create Web Service**
   - Click "Create Web Service"
   - Render will begin deploying your bot
   - Monitor the logs for any errors

7. **Verify Deployment**
   - Once deployed, your bot should come online in Discord
   - You can check the logs on Render to ensure it's working

## Important Configuration Notes

### Discord Bot Invite Link
- Use this link to add the bot to servers: `https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot%20applications.commands&permissions=8`

### Payment Links
- **PayPal**: https://paypal.me/ChristopherThomas429?country.x=US&locale.x=en_US
- **CashApp**: Username is "guardshin"
- **Stripe**: Integrated directly in dashboard

### Support Server
- Server ID: 1233495879223345172

## Troubleshooting

If you encounter issues:

1. **Port Binding Issues**: Make sure PORT=8080 is set and the bot is binding to 0.0.0.0
2. **Bot Not Coming Online**: Check the logs in Render for any errors
3. **Dashboard Not Loading**: Allow 5-10 minutes for GitHub Pages to update

## Monitoring Your Bot

We've included a monitoring script that checks if your bot is online and sends notifications if it goes down:

1. **Set Up Monitoring**
   ```bash
   # Set the URL to your deployed Render service
   export RENDER_SERVICE_URL=https://your-bot-url.onrender.com
   
   # Start the monitoring script
   node monitor_bot.js &
   ```

2. **What the Monitor Does**
   - Checks your bot's health every 5 minutes
   - Sends notifications to your Discord webhook if the bot goes down
   - Logs all checks to `monitor.log`

## Next Steps

1. Test your bot's functionality in a Discord server
2. Verify all dashboard pages are working correctly
3. Set up the monitoring script to ensure reliable operation

---

Congratulations on your successful deployment! 🎉