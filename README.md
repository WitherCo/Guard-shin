# Guard-shin Discord Bot

Guard-shin is an advanced Discord moderation and security bot that provides intelligent protection and management for Discord server environments through comprehensive, user-friendly tools.

## Features

- **Intelligent Auto-Moderation**: Automatically detect and filter spam, inappropriate content, excessive mentions, and other unwanted behavior
- **Raid Protection**: Detect and prevent raid attempts with smart verification systems
- **Comprehensive Moderation**: Warning, muting, kicking, banning, and user infraction management
- **User Verification**: Secure your server with customizable verification systems
- **Detailed Logs**: Keep track of all moderation actions and server activities
- **And More**: Custom welcome images, advanced server analytics, auto-response systems (Premium features)

## Quick Links

- [Invite Bot](https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8)
- [Support Server](https://discord.gg/g3rFbaW6gw)
- [Dashboard](https://witherco.github.io/Guard-shin/)

## Deployment

### Prerequisites

1. Discord Bot Token: Create a bot on the [Discord Developer Portal](https://discord.com/developers/applications)
2. Railway Account: Sign up on [Railway](https://railway.app/) and get your deployment token
3. GitHub Account: Create a repository for this project

### Deployment Steps

1. Fork this repository to your GitHub account
2. Set up GitHub Secrets in your repository:
   - Go to Settings > Secrets and variables > Actions
   - Add the following secrets:
     - `DISCORD_BOT_TOKEN` or `GUARD_SHIN_BOT_TOKEN`: Your Discord bot token
     - `UPDATE_WEBHOOK_URL`: Discord webhook URL for update notifications
     - `RAILWAY_TOKEN`: Your Railway deployment token
3. Push any changes to trigger automatic deployment:
   - The Discord bot will be deployed to Railway
   - The dashboard will be deployed to GitHub Pages

Alternatively, you can run the `deploy.sh` script which guides you through the deployment process.

## Configuration

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_discord_bot_token_here
GUARD_SHIN_BOT_TOKEN=your_discord_bot_token_here
UPDATE_WEBHOOK_URL=your_discord_webhook_url_here

# Railway Deployment
RAILWAY_TOKEN=your_railway_token_here

# Stripe Integration
STRIPE_SECRET_KEY=your_stripe_secret_key_here
VITE_STRIPE_PUBLIC_KEY=your_stripe_publishable_key_here

# Database (if using PostgreSQL)
DATABASE_URL=your_database_connection_string_here
```

You can find your Stripe API keys at: https://dashboard.stripe.com/apikeys

## Development

### Discord Bot

The Discord bot is located in the `discord-bot` directory. To run it locally:

```bash
cd discord-bot
pip install -r requirements.txt
python bot.py
```

### Dashboard

The Guard-shin Dashboard provides a user-friendly interface to manage all bot settings and features. It allows you to:

- Configure auto-moderation settings
- Set up welcome messages and images
- Manage raid protection
- View server analytics
- Configure reaction roles
- Purchase premium subscriptions
- And much more!

The dashboard is built with React, Vite, and Chakra UI. It uses Stripe for secure payment processing and is deployed to GitHub Pages.

## Premium Features

Guard-shin offers premium features for enhanced server management:

- Advanced Auto-Moderation
- Custom Welcome Images
- Advanced Server Analytics
- Auto-Response System
- Music Commands
- Reaction Roles
- Priority Support

### Premium Plans

We offer several subscription options:

#### Regular Premium
- Monthly: $4.99/month
- Yearly: $49.99/year (Save 16%)
- Lifetime: $149.99 (one-time payment)

#### Premium+
- Monthly: $9.99/month
- Yearly: $99.99/year (Save 16%)
- Lifetime: $249.99 (one-time payment)

### Payment Methods
- Stripe (Credit/Debit Cards)
- PayPal ($ChristopherThomas429)
- CashApp ($kingsweets2004)

Visit our [dashboard](https://witherco.github.io/Guard-shin/) to subscribe and unlock all premium features instantly.

## Support

If you need help or have any questions, join our [support server](https://discord.gg/g3rFbaW6gw) or contact us at support@witherco.org.

## License

```
GUARD-SHIN SOFTWARE LICENSE AGREEMENT

Copyright (c) 2024-2025 WitherCo. All Rights Reserved.

1. OWNERSHIP
   This software, known as "Guard-shin," including all associated code, assets, 
   documentation, and related materials, is the exclusive intellectual property 
   of WitherCo. All rights not expressly granted herein are reserved by WitherCo.

2. USAGE RESTRICTIONS
   This software is provided for use exclusively through the official bot instance
   as offered by WitherCo. You may:
   - Invite the official bot to Discord servers you own or manage
   - Use the features and functionality provided by the official bot instance
   - Subscribe to premium features through official channels

   You may NOT:
   - Copy, redistribute, or reproduce the software or its code
   - Modify, adapt, or create derivative works
   - Reverse engineer, decompile, or disassemble the software
   - Use the code to create competing services
   - Self-host or deploy your own instance of the bot
   - Claim ownership or authorship of the software

3. TERMINATION
   WitherCo reserves the right to terminate access to the software at any time
   for violation of this license or for any other reason at its sole discretion.

4. DISCLAIMER OF WARRANTY
   THE SOFTWARE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED. WITHERCO MAKES NO REPRESENTATION OR WARRANTY OF MERCHANTABILITY,
   SATISFACTORY QUALITY, OR FITNESS FOR A PARTICULAR PURPOSE.

5. LIMITATION OF LIABILITY
   IN NO EVENT SHALL WITHERCO BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY,
   WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF,
   OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

By using Guard-shin, you acknowledge that you have read and agree to the terms of
this license agreement.
```

This proprietary license replaces the MIT license that was previously in place. Guard-shin is now closed-source and proprietary software, exclusive to WitherCo.