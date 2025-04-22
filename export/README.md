# Guard-shin Discord Bot and Dashboard

Guard-shin is an advanced Discord moderation and security platform with comprehensive bot monitoring, automated workflow tools, and intelligent server management capabilities.

## Features

### Free Features
- Advanced moderation commands (ban, kick, warn, etc.)
- Server information and stats
- User information lookup
- Auto-moderation capabilities
- Verification system
- Customizable prefix

### Premium Features
- Custom welcome messages with images
- Auto-response system
- Music commands
- Advanced analytics
- Priority support

## Dashboard

The Guard-shin dashboard provides an intuitive interface to manage all aspects of the bot and server settings:

- **Dashboard**: https://witherco.github.io/Guard-shin/
- **Commands**: https://witherco.github.io/Guard-shin/commands.html
- **Premium**: https://witherco.github.io/Guard-shin/premium.html

## Invite the Bot

Add Guard-shin to your server using this link:
[Add to Server](https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8)

## Support

Join our support server for help and updates:
[Support Server](https://discord.gg/g3rFbaW6gw)

## Deployment Instructions

### Prerequisites
- Discord Bot Token
- Discord Client ID and Secret
- Stripe API Keys (for premium features)
- GitHub Repository
- Railway Account (for bot hosting)

### Deploy Discord Bot to Railway
1. Fork this repository
2. Set up the required secrets in your GitHub repository:
   - `DISCORD_BOT_TOKEN`
   - `DISCORD_CLIENT_ID`
   - `DISCORD_CLIENT_SECRET`
   - `RAILWAY_TOKEN`
   - `PAYMENT_WEBHOOK_URL`
   - `UPDATE_WEBHOOK_URL`
3. Push to the main branch or manually trigger the workflow

### Deploy Dashboard to GitHub Pages
1. Set up the required secret in your GitHub repository:
   - `VITE_STRIPE_PUBLIC_KEY`
2. Push to the main branch or manually trigger the workflow

## Development

### Local Setup
1. Clone the repository
2. Install dependencies with `npm install`
3. Create a `.env` file with the required environment variables
4. Run the dashboard with `npm run dev`
5. Run the bot with `python run_bot.py`

### Environment Variables
Create a `.env` file in the root directory with:
```
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
PAYMENT_WEBHOOK_URL=your_payment_webhook_url
UPDATE_WEBHOOK_URL=your_update_webhook_url
```

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Credits
Created by WitherCo