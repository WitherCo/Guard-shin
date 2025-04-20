#!/bin/bash

# Script to download the latest version of JMusicBot

echo "===================================================="
echo "🎵 JMusicBot Downloader for Guard-shin Bot 🎵"
echo "===================================================="

# Define the JAR file path and URL
JAR_PATH="attached_assets/JMusicBot-cd40e2e5-potoken-iprotation (1).jar"
JAR_STABLE_URL="https://github.com/jagrosh/MusicBot/releases/latest/download/JMusicBot.jar"

# Create the attached_assets directory if it doesn't exist
if [ ! -d "attached_assets" ]; then
    echo "📁 Creating attached_assets directory..."
    mkdir -p attached_assets
fi

# Check if we already have the JAR file
if [ -f "$JAR_PATH" ]; then
    echo "✅ JMusicBot JAR already exists at: $JAR_PATH"
    echo "   If you want to re-download, delete the existing file first."
    echo "   rm \"$JAR_PATH\""
    exit 0
fi

# Check if curl or wget is available
if command -v curl &> /dev/null; then
    DOWNLOAD_CMD="curl -L -o"
elif command -v wget &> /dev/null; then
    DOWNLOAD_CMD="wget -O"
else
    echo "❌ Neither curl nor wget is installed. Cannot download JMusicBot."
    exit 1
fi

# Download the JAR file
echo "⏳ Downloading the latest JMusicBot JAR file..."
echo "   URL: $JAR_STABLE_URL"
echo "   Target: $JAR_PATH"

$DOWNLOAD_CMD "$JAR_PATH" "$JAR_STABLE_URL"

# Check if download was successful
if [ $? -eq 0 ] && [ -f "$JAR_PATH" ]; then
    echo "✅ Successfully downloaded JMusicBot JAR file."
    echo "   Size: $(du -h "$JAR_PATH" | cut -f1)"
    echo ""
    echo "🎮 You can now run JMusicBot with:"
    echo "   ./start_music_bot.sh"
    echo ""
    echo "📝 Or set it up with:"
    echo "   ./setup_jmusicbot.sh"
else
    echo "❌ Failed to download JMusicBot JAR file."
    if [ -f "$JAR_PATH" ]; then
        rm "$JAR_PATH"
    fi
    exit 1
fi