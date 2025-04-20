# Guard-shin Discord Bot

This directory contains the source code for the Guard-shin Discord bot, an advanced moderation and security bot for Discord servers.

## Hosting Options

### Option 1: GitHub Actions with a Cloud Provider (Recommended)

The easiest way to host the bot is to use GitHub Actions to deploy to a cloud provider. This repository includes a GitHub Actions workflow at `.github/workflows/discord-bot.yml` that you can customize for your preferred hosting platform.

Supported cloud platforms:
- **[Railway](https://railway.app)** - Free tier available, easy setup
- **[Render](https://render.com)** - Free tier available
- **[Heroku](https://heroku.com)** - Paid service with good scaling
- **[DigitalOcean](https://digitalocean.com)** - Paid service, more customization

### Option 2: Self-hosting

You can also run the bot on your own server or computer. Here's how:

#### Prerequisites
- Python 3.11 or higher
- Node.js 18 or higher (if using JavaScript components)
- Discord Bot Token

#### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/WitherCo/Guard-shin.git
   cd Guard-shin/discord-bot
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create a `.env` file with your configuration:
   ```
   DISCORD_BOT_TOKEN=your_token_here
   GUARD_SHIN_BOT_TOKEN=your_token_here
   ```

4. Run the bot:
   ```bash
   python bot.py
   ```

## Adding Bot to GitHub Actions Secrets

To use the GitHub Actions workflow, you need to add your Discord bot token as a secret:

1. Go to your GitHub repository
2. Click on "Settings"
3. Click on "Secrets and variables" then "Actions"
4. Click "New repository secret"
5. Name: `GUARD_SHIN_BOT_TOKEN`
6. Value: Your Discord bot token
7. Click "Add secret"

## Custom Deployment Options

### Railway

1. Set up a Railway account
2. Connect your GitHub repository
3. Add the following environment variables:
   - `GUARD_SHIN_BOT_TOKEN`
4. Deploy your application

### Render

1. Set up a Render account
2. Connect your GitHub repository
3. Create a new Web Service
4. Select the repository
5. Choose Python as the runtime
6. Set the build command: `pip install -r requirements.txt`
7. Set the start command: `python bot.py`
8. Add environment variables:
   - `GUARD_SHIN_BOT_TOKEN`

### Hosting on a VPS (Advanced)

For more control, you can host on a VPS using PM2 to keep the bot running:

1. Install PM2:
   ```bash
   npm install -g pm2
   ```

2. Start the bot with PM2:
   ```bash
   pm2 start bot.py --name guard-shin --interpreter python3
   ```

3. Configure PM2 to start on system boot:
   ```bash
   pm2 startup
   pm2 save
   ```

## Monitoring & Logs

When using cloud hosting or a VPS, you can monitor your bot's health and view logs through your provider's dashboard.

For self-hosting with PM2:
```bash
pm2 logs guard-shin  # View logs
pm2 monit            # View monitoring dashboard
```