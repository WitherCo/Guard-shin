# JMusicBot Integration for Guard-shin Discord Bot

This document provides information on the JMusicBot integration with the Guard-shin Discord bot, which provides stable and reliable music playback.

## Overview

JMusicBot is a Java-based music bot for Discord that offers more reliable music playback compared to JavaScript-based solutions. It's integrated with Guard-shin to provide fallback capabilities when the JavaScript music player encounters YouTube API rate limiting errors.

## Requirements

- Java Runtime Environment (JDK or JRE)
- The JMusicBot JAR file (included in attached_assets)
- Discord bot token (same as your main bot)

## Setup Instructions

Run the setup script to configure JMusicBot:

```bash
./setup_jmusicbot.sh
```

This script will:
1. Check if Java is installed (and attempt to install it if missing)
2. Verify the JMusicBot JAR file exists
3. Set up the config.txt file
4. Create the playlists directory
5. Test the JMusicBot installation
6. Make all startup scripts executable

## Starting JMusicBot

There are several ways to start JMusicBot:

### Option 1: Run in Background

```bash
./start_music_bot.sh
```

This will start JMusicBot in the background, with output logged to jmusicbot.log.

### Option 2: Run in Foreground

```bash
./run_jmusicbot.sh
```

This will start JMusicBot in the foreground, showing the console output.

### Option 3: Run with Main Bot

```bash
./run_discord_bot_bg.sh
```

This will start both the main Discord bot and JMusicBot in the background.

## Stopping JMusicBot

To stop JMusicBot:

```bash
./stop_music_bot.sh
```

Or to stop all bots:

```bash
./stop_all_bots.sh
```

## Usage

JMusicBot uses a semicolon (`;`) prefix by default. Some common commands:

- `;play <song>` - Play a song or add it to the queue
- `;pause` - Pause the current track
- `;resume` - Resume playback
- `;skip` - Skip to the next song
- `;stop` - Stop playback and clear the queue
- `;np` - Show the current song
- `;queue` - Display the current queue
- `;volume <0-100>` - Set the volume

## Automatic Fallback System

The Guard-shin bot includes an automatic fallback system that switches to JMusicBot when the JavaScript music player encounters YouTube API rate limiting errors. This provides a more reliable music playback experience.

## Troubleshooting

If you encounter issues:

1. Check the JMusicBot logs:
   ```bash
   cat jmusicbot.log
   ```

2. Verify Java is installed:
   ```bash
   java -version
   ```

3. Ensure the bot token in config.txt is correct

4. If JMusicBot won't start, try:
   ```bash
   ./stop_music_bot.sh
   ./start_music_bot.sh
   ```

5. For persistent issues, try running JMusicBot directly:
   ```bash
   java -Dnogui=true -jar "attached_assets/JMusicBot-cd40e2e5-potoken-iprotation (1).jar"
   ```

## Additional Resources

- [JMusicBot Official GitHub](https://github.com/jagrosh/MusicBot)
- [JMusicBot Command Reference](https://jmusicbot.com/commands/)
- [Discord.js Documentation](https://discord.js.org/#/)