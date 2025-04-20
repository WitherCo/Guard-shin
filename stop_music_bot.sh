#!/bin/bash

# Stop the JMusicBot process

echo "Stopping JMusicBot..."

# First, try to use the PID file if it exists
if [ -f "jmusicbot.pid" ]; then
    PID=$(cat jmusicbot.pid)
    if ps -p $PID > /dev/null; then
        echo "Stopping JMusicBot process with PID: $PID"
        kill $PID
        sleep 2
        
        # Check if it's still running and force kill if necessary
        if ps -p $PID > /dev/null; then
            echo "Process still running, force killing..."
            kill -9 $PID
        fi
        
        echo "JMusicBot stopped."
        rm jmusicbot.pid
    else
        echo "No running JMusicBot process found with PID: $PID"
        rm jmusicbot.pid
    fi
else
    # If no PID file, try to find the process by name
    JMUSICBOT_PIDS=$(pgrep -f "JMusicBot.*jar")
    
    if [ -n "$JMUSICBOT_PIDS" ]; then
        echo "Found JMusicBot processes with PIDs: $JMUSICBOT_PIDS"
        echo "Stopping all JMusicBot processes..."
        
        for PID in $JMUSICBOT_PIDS; do
            kill $PID
        done
        
        sleep 2
        
        # Check if any are still running and force kill if necessary
        REMAINING_PIDS=$(pgrep -f "JMusicBot.*jar")
        if [ -n "$REMAINING_PIDS" ]; then
            echo "Some processes still running, force killing..."
            for PID in $REMAINING_PIDS; do
                kill -9 $PID
            done
        fi
        
        echo "All JMusicBot processes stopped."
    else
        echo "No running JMusicBot processes found."
    fi
fi

echo "JMusicBot shutdown complete."