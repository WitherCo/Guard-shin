# Guard-shin Discord Bot

This repository contains the Discord bot component of Guard-shin, an advanced Discord moderation and security platform.

## Quick Deployment Options

### Deploy to Render (Recommended)

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/WitherCo/Guard-shin/tree/discord-bot-deployment)

After clicking, configure your environment variables:
- `DISCORD_BOT_TOKEN`: Your Discord bot token (required)

[Detailed Render Deployment Guide](./RENDER_DEPLOYMENT.md)

### Deploy to Heroku

[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/WitherCo/Guard-shin/tree/discord-bot-deployment)

## Environment Variables

The following environment variables are supported:

| Variable | Required | Description |
|----------|----------|-------------|
| `DISCORD_BOT_TOKEN` | Yes | Your Discord bot token |
| `STRIPE_SECRET_KEY` | No | For premium payment processing |
| `PAYMENT_WEBHOOK_URL` | No | URL for payment notifications |
| `UPDATE_WEBHOOK_URL` | No | URL for bot update notifications |

## Manual Deployment

1. Clone this repository
2. Install dependencies: `pip install -r requirements.txt`
3. Set the required environment variables
4. Run the bot: `python run.py`

## Features

- **Moderation & Security**
  - Advanced anti-raid protection
  - Auto-moderation with customizable filters
  - Verification systems
  - Lockdown and server protection

- **Premium Features**
  - Music commands with high-quality audio
  - Customizable welcome messages
  - Advanced analytics
  - Auto-response systems

## Support

For support, join our Discord server: [Discord Support Server](https://discord.gg/1233495879223345172)

Or visit our website: [Guard-shin Dashboard](https://witherco.github.io/Guard-shin/)

## License

Guard-shin is available under a premium license model. See the LICENSE file for details.