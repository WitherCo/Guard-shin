#!/bin/bash

# Run JMusicBot in foreground mode

echo "Starting JMusicBot in foreground mode..."

# Check if the bot is already running
if pgrep -f "JMusicBot.*jar" > /dev/null; then
    echo "JMusicBot is already running in the background."
    echo "Please stop it first with ./stop_music_bot.sh"
    exit 1
fi

# Run JMusicBot in non-GUI mode (Replit doesn't have a GUI)
java -Dnogui=true -jar "attached_assets/JMusicBot-cd40e2e5-potoken-iprotation (1).jar"

# This script will wait until JMusicBot exits
echo "JMusicBot has exited."