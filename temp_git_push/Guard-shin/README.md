# Guard-shin Discord Bot

Guard-shin is an advanced Discord moderation and security bot that provides intelligent protection and management for Discord server environments through comprehensive, user-friendly tools.

## Features

- **Intelligent Auto-Moderation**: Automatically detect and filter spam, inappropriate content, excessive mentions, and other unwanted behavior
- **Raid Protection**: Detect and prevent raid attempts with smart verification systems
- **Comprehensive Moderation**: Warning, muting, kicking, banning, and user infraction management
- **User Verification**: Secure your server with customizable verification systems
- **Detailed Logs**: Keep track of all moderation actions and server activities
- **Premium Features**: Custom welcome images, advanced server analytics, auto-response systems, music commands

## Quick Links

- [Invite Bot](https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8)
- [Support Server](https://discord.gg/g3rFbaW6gw)
- [Dashboard](https://witherco.github.io/Guard-shin/)

## Step-by-Step GitHub Deployment

### Prerequisites

1. Discord Bot Token: Create a bot on the [Discord Developer Portal](https://discord.com/developers/applications)
2. Railway Account: Sign up on [Railway](https://railway.app/) and get your deployment token
3. GitHub Account: Create a repository for this project

### Step 1: Create a GitHub Repository

1. Go to [GitHub](https://github.com) and sign in
2. Click on the "+" icon in the top-right corner and select "New repository"
3. Name your repository "Guard-shin"
4. Set it to Public (required for GitHub Pages to work on the free tier)
5. Click "Create repository"

### Step 2: Upload the Code

**Option A: Using GitHub's Web Interface**
1. In your new repository, click "uploading an existing file"
2. Drag and drop all the files from the export directory
3. Click "Commit changes"

**Option B: Using Git Command Line**
1. Clone your repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Guard-shin.git
   cd Guard-shin
   ```
2. Copy all the files from the export directory to this folder
3. Add, commit, and push:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

### Step 3: Set Up GitHub Secrets

1. Go to your repository on GitHub
2. Click on "Settings" > "Secrets and variables" > "Actions"
3. Click "New repository secret" and add the following:
   - Name: `DISCORD_BOT_TOKEN` (or `GUARD_SHIN_BOT_TOKEN`)
     Value: Your Discord bot token
   - Name: `UPDATE_WEBHOOK_URL`
     Value: Your Discord webhook URL for update notifications
   - Name: `RAILWAY_TOKEN`
     Value: Your Railway deployment token
   - Name: `STRIPE_SECRET_KEY` (if using Stripe payments)
     Value: Your Stripe secret key
   - Name: `VITE_STRIPE_PUBLIC_KEY` (if using Stripe payments)
     Value: Your Stripe publishable key

### Step 4: Enable GitHub Pages

1. Go to "Settings" > "Pages"
2. For Source, select "Deploy from a branch"
3. For Branch, select "gh-pages" (this will be created by the workflow)
4. Click "Save"

### Step 5: Check Deployments

1. Go to the "Actions" tab
2. You should see workflows running automatically
3. Wait for them to complete (green checkmark)
4. Your bot should now be deployed to Railway
5. Your dashboard should be accessible at `https://YOUR_USERNAME.github.io/Guard-shin/`

## Configuration Details

### Environment Variables

Guard-shin requires these environment variables:

```
# Discord Bot Configuration (REQUIRED)
DISCORD_BOT_TOKEN=your_discord_bot_token_here
# or GUARD_SHIN_BOT_TOKEN=your_discord_bot_token_here

# Discord Webhook for Updates (REQUIRED)
UPDATE_WEBHOOK_URL=your_discord_webhook_url_here

# Railway Deployment (REQUIRED for Railway deployment)
RAILWAY_TOKEN=your_railway_token_here

# Stripe Payment (Required for premium features)
STRIPE_SECRET_KEY=your_stripe_secret_key_here
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key_here
```

## Local Development

### Discord Bot

```bash
# Install dependencies
cd discord-bot
pip install -r requirements.txt

# Run the bot
python run.py
```

### Web Dashboard

```bash
# Install dependencies
npm install

# Run the local server
node server.js
```

## Support and Contact

- Support Server: [https://discord.gg/g3rFbaW6gw](https://discord.gg/g3rFbaW6gw)
- Email: support@witherco.org

## License and Copyright

Copyright © 2025 WitherCo. All rights reserved.

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

Guard-shin is a proprietary software project. Unauthorized distribution, modification, or commercial use without explicit permission is prohibited.