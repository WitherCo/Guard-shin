#!/bin/bash

# Start the JMusicBot in the background and log output
echo "Starting JMusicBot in background mode..."

# Check if the bot is already running
if pgrep -f "JMusicBot.*jar" > /dev/null; then
    echo "JMusicBot is already running."
    exit 0
fi

# Run the JMusicBot in the background
nohup java -Dnogui=true -jar "attached_assets/JMusicBot-cd40e2e5-potoken-iprotation (1).jar" > jmusicbot.log 2>&1 &

# Get the process ID
JMUSICBOT_PID=$!

# Check if the process started successfully
if ps -p $JMUSICBOT_PID > /dev/null; then
    echo "JMusicBot started with PID: $JMUSICBOT_PID"
    echo $JMUSICBOT_PID > jmusicbot.pid
    echo "Log output is being saved to jmusicbot.log"
else
    echo "Failed to start JMusicBot."
    exit 1
fi

echo "JMusicBot is now running in the background."