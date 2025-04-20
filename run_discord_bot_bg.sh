#!/bin/bash

# Script to run the Discord bot in the background
echo "Starting Guard-shin Discord Bot in background..."

# Kill any existing bot processes
pkill -f "python run_bot.py" || true

# Start bot in background
nohup python run_bot.py > bot_logs.log 2>&1 &

# Get the process ID
BOT_PID=$!
echo "Bot started with PID: $BOT_PID"
echo "Log file: bot_logs.log"
echo "Run 'cat bot_logs.log' to see output"
echo "Run 'pkill -f \"python run_bot.py\"' to stop the bot"