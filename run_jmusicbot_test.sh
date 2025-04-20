#!/bin/bash

# Script to run JMusicBot directly for testing purposes

# JAR file location
JAR_FILE="attached_assets/JMusicBot-cd40e2e5-potoken-iprotation (1).jar"

# Check if JAR file exists
if [ ! -f "$JAR_FILE" ]; then
    echo "Error: JMusicBot JAR file not found at: $JAR_FILE"
    exit 1
fi

echo "Running JMusicBot for testing..."
echo "Press Ctrl+C to stop the bot"
echo "-------------------------"

# Run JMusicBot with output to console
java -Dnogui=true -jar "$JAR_FILE"