#!/bin/bash

# Guard-shin deployment script
echo "Starting Guard-shin deployment..."

# Pull latest changes
git pull

# Install dependencies
npm ci

# Build the application
npm run build

# Check if the bot is already running with PM2
if pm2 list | grep -q "guard-shin"; then
  # Restart the bot
  pm2 restart guard-shin
else
  # Start the bot
  pm2 start dist/index.js --name guard-shin
fi

echo "Guard-shin deployment completed successfully."