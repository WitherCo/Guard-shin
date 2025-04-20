#!/bin/bash

# Run both the main Discord bot and JMusicBot in the background

echo "===================================================="
echo "🤖 Starting Guard-shin Discord Bot & JMusicBot 🎵"
echo "===================================================="

# Define log files
MAIN_BOT_LOG="discord_bot.log"
MUSIC_BOT_LOG="jmusicbot.log"

# Check if bots are already running
if pgrep -f "node.*start_bot" > /dev/null; then
    echo "⚠️ Main Discord bot is already running."
else
    echo "🚀 Starting main Discord bot..."
    nohup node start_bot.js > $MAIN_BOT_LOG 2>&1 &
    MAIN_BOT_PID=$!
    echo "✅ Main Discord bot started with PID: $MAIN_BOT_PID"
    echo "📝 Logs are being saved to $MAIN_BOT_LOG"
fi

# Check if JMusicBot is already running
if pgrep -f "JMusicBot.*jar" > /dev/null; then
    echo "⚠️ JMusicBot is already running."
else
    # Check if Java is installed
    if command -v java &> /dev/null; then
        echo "🎵 Starting JMusicBot..."
        
        # Check if the JAR file exists
        if [ -f "attached_assets/JMusicBot-cd40e2e5-potoken-iprotation (1).jar" ]; then
            nohup java -Dnogui=true -jar "attached_assets/JMusicBot-cd40e2e5-potoken-iprotation (1).jar" > $MUSIC_BOT_LOG 2>&1 &
            MUSIC_BOT_PID=$!
            echo $MUSIC_BOT_PID > jmusicbot.pid
            echo "✅ JMusicBot started with PID: $MUSIC_BOT_PID"
            echo "📝 Logs are being saved to $MUSIC_BOT_LOG"
        else
            echo "❌ JMusicBot JAR file not found. Music bot will not be started."
            echo "   Run ./setup_jmusicbot.sh to set up the music bot."
        fi
    else
        echo "❌ Java is not installed. JMusicBot will not be started."
        echo "   Run ./setup_jmusicbot.sh to install Java and set up the music bot."
    fi
fi

echo ""
echo "🔄 Both bots are now running in the background."
echo ""
echo "📊 To monitor logs:"
echo "   Main bot:   tail -f $MAIN_BOT_LOG"
echo "   Music bot: tail -f $MUSIC_BOT_LOG"
echo ""
echo "🛑 To stop the bots:"
echo "   Main bot:   pkill -f 'node.*start_bot'"
echo "   Music bot: ./stop_music_bot.sh"
echo "   Both bots: ./stop_all_bots.sh"
echo ""
echo "✨ Guard-shin is ready! ✨"