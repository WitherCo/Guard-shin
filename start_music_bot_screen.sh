#!/bin/bash

# Script to run JMusicBot in a screen session
# This allows the bot to keep running even if the connection is closed

# Check if screen is installed
if ! command -v screen &> /dev/null; then
    echo "Screen is not installed. Installing screen..."
    apt-get update && apt-get install -y screen
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "Error: Java is not installed. Please install Java before running JMusicBot."
    exit 1
fi

# JAR file location
JAR_FILE="attached_assets/JMusicBot-cd40e2e5-potoken-iprotation (1).jar"

# Check if JAR file exists
if [ ! -f "$JAR_FILE" ]; then
    echo "Error: JMusicBot JAR file not found at: $JAR_FILE"
    exit 1
fi

# Check if config file exists
if [ ! -f "config.txt" ]; then
    echo "Warning: config.txt not found. The bot might not work correctly."
    echo "Please make sure you've created a config.txt file with your bot token."
fi

# Create playlists directory if it doesn't exist
if [ ! -d "playlists" ]; then
    echo "Creating playlists directory..."
    mkdir -p playlists
fi

# Kill any existing screen sessions for JMusicBot
screen -ls | grep "jmusicbot" | cut -d. -f1 | awk '{print $1}' | xargs -r kill

# Start JMusicBot in a new screen session
echo "Starting JMusicBot in a screen session..."
screen -dmS jmusicbot bash -c "java -Dnogui=true -jar \"$JAR_FILE\" 2>&1 | tee jmusicbot.log"

# Display instructions
echo "JMusicBot has been started in a screen session named 'jmusicbot'"
echo ""
echo "To view the bot console:"
echo "  screen -r jmusicbot"
echo ""
echo "To detach from the console (leave it running):"
echo "  Press Ctrl+A, then press D"
echo ""
echo "To stop the bot:"
echo "  screen -S jmusicbot -X quit"
echo "  or run ./stop_music_bot.sh"
echo ""
echo "Log file is being written to: jmusicbot.log"