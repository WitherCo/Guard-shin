#!/bin/bash

# Stop all bots (both main Discord bot and JMusicBot)

echo "===================================================="
echo "🛑 Stopping Guard-shin Discord Bot & JMusicBot 🛑"
echo "===================================================="

# Stop the main Discord bot
echo "Stopping main Discord bot..."
MAIN_BOT_PIDS=$(pgrep -f "node.*start_bot")

if [ -n "$MAIN_BOT_PIDS" ]; then
    echo "Found main bot processes with PIDs: $MAIN_BOT_PIDS"
    
    for PID in $MAIN_BOT_PIDS; do
        kill $PID
        echo "Sent kill signal to PID: $PID"
    done
    
    sleep 2
    
    # Check if any are still running and force kill if necessary
    REMAINING_PIDS=$(pgrep -f "node.*start_bot")
    if [ -n "$REMAINING_PIDS" ]; then
        echo "Some processes still running, force killing..."
        for PID in $REMAINING_PIDS; do
            kill -9 $PID
            echo "Force killed PID: $PID"
        done
    fi
    
    echo "✅ Main Discord bot stopped."
else
    echo "⚠️ No main Discord bot processes found."
fi

# Stop JMusicBot using the dedicated script
echo "Stopping JMusicBot..."
if [ -f "./stop_music_bot.sh" ]; then
    ./stop_music_bot.sh
else
    echo "⚠️ stop_music_bot.sh script not found, trying direct kill..."
    
    JMUSIC_PIDS=$(pgrep -f "JMusicBot.*jar")
    
    if [ -n "$JMUSIC_PIDS" ]; then
        echo "Found JMusicBot processes with PIDs: $JMUSIC_PIDS"
        
        for PID in $JMUSIC_PIDS; do
            kill $PID
            echo "Sent kill signal to PID: $PID"
        done
        
        sleep 2
        
        # Check if any are still running and force kill if necessary
        REMAINING_PIDS=$(pgrep -f "JMusicBot.*jar")
        if [ -n "$REMAINING_PIDS" ]; then
            echo "Some processes still running, force killing..."
            for PID in $REMAINING_PIDS; do
                kill -9 $PID
                echo "Force killed PID: $PID"
            done
        fi
        
        # Cleanup PID file if exists
        if [ -f "jmusicbot.pid" ]; then
            rm jmusicbot.pid
        fi
        
        echo "✅ JMusicBot stopped."
    else
        echo "⚠️ No JMusicBot processes found."
    fi
fi

# Clean up any zombie processes
echo "Cleaning up any remaining zombie processes..."
for ZOMBIE in $(ps -xaw -o state,ppid,pid,cmd | grep -w Z | awk '{print $3}'); do
    kill -9 $ZOMBIE
done

echo ""
echo "🎮 All bots have been stopped."
echo ""
echo "📊 To restart the bots:"
echo "   Main bot only:    node start_bot.js"
echo "   JMusicBot only:   ./start_music_bot.sh"
echo "   Both bots:        ./run_discord_bot_bg.sh"
echo ""