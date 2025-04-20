# Guard-shin Discord Bot

Guard-shin is an advanced Discord moderation and security bot that provides intelligent protection and management for Discord server environments through comprehensive, user-friendly tools.

## Features

### Moderation
- Ban, kick, mute, and warn management
- Automatic detection and handling of rule violations
- Customizable automod settings
- Raid protection with configurable thresholds
- Anti-spam and anti-alt account protection

### Security
- Advanced verification systems
- Lockdown capabilities for emergency situations
- Real-time monitoring of suspicious activity
- Customizable security levels for different server needs

### Premium Features
- Enhanced raid protection with AI detection
- Advanced auto-moderation with content scanning
- Custom CAPTCHA and verification methods
- Complete server activity logs and analytics
- Custom commands and automation
- And much more!

## Technology Stack

- **Backend**: Node.js, Express, TypeScript, Python (Discord.py)
- **Frontend**: React, TypeScript, Tailwind CSS
- **Database**: PostgreSQL with Drizzle ORM
- **API Integration**: Discord API, Stripe Payment API
- **Security**: OAuth2 authentication
- **Deployment**: Containerized with multi-environment support

## Documentation

Comprehensive documentation is available in the [docs](./docs) directory:

- [Setup Guide](./docs/SETUP.md) - Get started with installing and configuring Guard-shin
- [Auto-Moderation Guide](./docs/AUTO-MODERATION.md) - Learn how to configure powerful auto-moderation features
- [Raid Protection Guide](./docs/RAID-PROTECTION.md) - Protect your server from coordinated attacks

## Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL database
- Discord Developer Application credentials

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/guard-shin.git
   cd guard-shin
   ```

2. Install dependencies:
   ```bash
   npm install
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in all required values (Discord tokens, database credentials, etc.)

4. Set up the database:
   ```bash
   npm run db:push
   ```

5. Start the application:
   ```bash
   npm run dev
   ```

## Bot Setup

1. Create a new Discord application at the [Discord Developer Portal](https://discord.com/developers/applications)
2. Configure the bot with necessary permissions
3. Invite the bot to your server using this link: [Add Guard-shin](https://discord.com/oauth2/authorize?client_id=1361873604882731008)
4. Configure bot settings through the dashboard or commands

## Available Commands

Guard-shin offers a comprehensive set of moderation and utility commands:

### Moderation Commands
- `/ban <user> [reason]` - Ban a user from the server
- `/unban <user>` - Unban a user from the server
- `/kick <user> [reason]` - Kick a user from the server
- `/mute <user> [duration] [reason]` - Temporarily mute a user
- `/unmute <user>` - Unmute a previously muted user
- `/warn <user> [reason]` - Issue a warning to a user
- `/warnings <user>` - View a user's warnings
- `/clearwarnings <user>` - Clear a user's warnings
- `/purge <amount>` - Delete multiple messages at once
- `/slowmode <duration>` - Set channel slowmode
- `/lockdown` - Lock down the current channel
- `/unlock` - Unlock a locked channel

### Auto-Moderation Commands
- `/automod` - Configure auto-moderation settings
- `/filter` - Set up word filters
- `/antispam` - Configure anti-spam settings
- `/raid-protection` - Set up raid protection
- `/verification` - Configure verification settings

### Music Commands
- `/play <song>` - Play a song or add to queue
- `/skip` - Skip the current song
- `/stop` - Stop playback and clear the queue
- `/queue` - View the current music queue
- `/pause` - Pause the current song
- `/resume` - Resume playback
- `/volume <level>` - Adjust the music volume
- `/loop` - Toggle looping of current song or queue
- `/playlist <name>` - Load a saved playlist

## Premium Plans

Guard-shin offers several premium subscription options:

- **Premium** - Enhanced moderation for growing communities
- **Premium Plus** - Ultimate protection for large communities
- **Lifetime Premium** - One-time payment for lifetime premium access
- **Lifetime Premium+** - One-time payment for lifetime premium+ access

Visit our [website](https://guard-shin.com) for more information on premium features and pricing.

## Support

- Join our [Discord support server](https://discord.gg/g3rFbaW6gw)
- Email: support@witherco.org

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with [Discord.js](https://discord.js.org/)
- Uses [discord.py](https://discordpy.readthedocs.io/) for Python components
- Uses [JMusicBot](https://github.com/jagrosh/MusicBot) for music functionality