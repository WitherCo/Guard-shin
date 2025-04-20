#!/bin/bash

# Setup script for JMusicBot
# This script handles the entire setup process for JMusicBot

echo "========================================="
echo "🎵 JMusicBot Setup for Guard-shin Bot 🎵"
echo "========================================="
echo ""

# 1. Check if Java is installed
echo "📋 Step 1: Checking for Java installation..."
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed."
    echo "🔄 Installing Java..."
    
    # Check if we're on a Replit environment
    if [ -f "/home/runner/.replit" ]; then
        echo "🔍 Detected Replit environment, installing Java through Nix..."
        
        # Create a temporary shell.nix file
        cat > shell.nix << 'EOL'
{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = [
    pkgs.jdk
  ];
}
EOL
        
        # Source nix environment
        echo "⏳ Loading Nix environment with Java..."
        eval "$(nix-shell --command 'echo "export PATH=$PATH"')"
    else
        echo "Please install Java manually, then run this script again."
        exit 1
    fi
fi

# Verify Java installation
java -version
if [ $? -eq 0 ]; then
    echo "✅ Java is installed and working."
else
    echo "❌ Failed to install or verify Java. Please install Java manually."
    exit 1
fi

# 2. Check for JMusicBot JAR
echo ""
echo "📋 Step 2: Checking for JMusicBot JAR file..."

JAR_FILE="attached_assets/JMusicBot-cd40e2e5-potoken-iprotation (1).jar"

if [ -f "$JAR_FILE" ]; then
    echo "✅ Found JMusicBot JAR at: $JAR_FILE"
else
    echo "❌ JMusicBot JAR not found at: $JAR_FILE"
    echo "Please ensure the JMusicBot JAR file is located in the attached_assets directory."
    exit 1
fi

# 3. Set up config.txt
echo ""
echo "📋 Step 3: Setting up configuration file..."

CONFIG_FILE="config.txt"

if [ -f "$CONFIG_FILE" ]; then
    echo "🔍 Existing config.txt found. Would you like to keep it or create a new one? (keep/new)"
    read -r CONFIG_CHOICE
    
    if [[ "$CONFIG_CHOICE" == "new" ]]; then
        SETUP_CONFIG=true
    else
        echo "✅ Keeping existing config.txt"
        SETUP_CONFIG=false
    fi
else
    SETUP_CONFIG=true
fi

if [ "$SETUP_CONFIG" = true ]; then
    echo "⏳ Creating new config.txt..."
    
    # Check for bot token
    if [ -z "$DISCORD_BOT_TOKEN" ]; then
        echo "⚠️ No DISCORD_BOT_TOKEN environment variable found."
        echo "Please enter your Discord bot token (or press Enter to skip):"
        read -r TOKEN_INPUT
        
        if [ -z "$TOKEN_INPUT" ]; then
            BOT_TOKEN="YOUR_TOKEN_HERE"
        else
            BOT_TOKEN="$TOKEN_INPUT"
        fi
    else
        BOT_TOKEN="${DISCORD_BOT_TOKEN}"
    fi
    
    # Owner ID
    echo "Please enter your Discord user ID (or press Enter for default):"
    read -r OWNER_INPUT
    
    if [ -z "$OWNER_INPUT" ]; then
        OWNER_ID="311986834439430144"
    else
        OWNER_ID="$OWNER_INPUT"
    fi
    
    # Create the config file
    cat > "$CONFIG_FILE" << EOL
# JMusicBot Configuration File
# ================================

# This file contains the core settings for JMusicBot. 
# You need to edit this file when you first set up your bot.

# The bot token from Discord
# If using JDA, keep this private!
token=${BOT_TOKEN}

# The bot's owner ID
# This is your Discord user ID (NOT your bot ID)
owner=${OWNER_ID}

# This sets the prefix for the bot
# The prefix is used to control the commands
# If you use an @mention, you can escape your own mentions using \\
prefix=;

# Music settings
# Your bot will stay in the voice channel even when alone
stayinchannel=true

# Show the current song in the bot's status
songinstatus=true

# Show embedded artwork in nowplaying messages
npimages=true

# Use YTSEARCH for YouTube by default
ytformat=251,140

# Maximum allowed song length (in seconds)
# Note: This can be overridden using the DJ role
maxseconds=7200

# The path to the playlists folder
# Absolute paths work as well
playlistfolder=playlists
EOL
    
    echo "✅ Created new config.txt"
fi

# 4. Create playlists directory
echo ""
echo "📋 Step 4: Creating playlists directory..."

if [ ! -d "playlists" ]; then
    mkdir -p playlists
    echo "✅ Created playlists directory"
else
    echo "✅ Playlists directory already exists"
fi

# 5. Test run JMusicBot
echo ""
echo "📋 Step 5: Testing JMusicBot installation..."
echo "⚠️ This will start JMusicBot in non-GUI mode for 5 seconds as a test."
echo "⏳ Press Enter to continue with the test run (or Ctrl+C to cancel)..."
read -r

echo "⏳ Starting JMusicBot test..."
java -Dnogui=true -jar "$JAR_FILE" &
JMUSIC_PID=$!

echo "⏱️ Running for 5 seconds..."
sleep 5

echo "⏹️ Stopping JMusicBot test..."
kill $JMUSIC_PID 2>/dev/null
sleep 1

# 6. Final setup
echo ""
echo "📋 Step 6: Setting up startup scripts..."

# Make all our scripts executable
chmod +x start_music_bot.sh stop_music_bot.sh run_jmusicbot.sh 2>/dev/null

echo ""
echo "🎉 JMusicBot setup completed!"
echo ""
echo "You can now start JMusicBot using one of the following methods:"
echo "  1. ./start_music_bot.sh        - Run in background with logs"
echo "  2. ./run_jmusicbot.sh          - Run in foreground (shows console)"
echo "  3. ./run_discord_bot_bg.sh     - Run both main bot and JMusicBot"
echo ""
echo "To stop JMusicBot, use:"
echo "  ./stop_music_bot.sh"
echo ""
echo "Happy listening! 🎵"