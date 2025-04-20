#!/bin/bash
# Deployment script for Guard-Shin

# Exit on any error
set -e

echo "Starting deployment process for Guard-Shin..."

# Pull the latest code
echo "Pulling latest code from repository..."
git pull origin main

# Generate package-lock.json if it doesn't exist
if [ ! -f package-lock.json ]; then
  echo "Generating package-lock.json..."
  npm install --package-lock-only
fi

# Install dependencies
echo "Installing dependencies..."
npm ci || npm install

# Build the application
echo "Building application..."
npm run build

# Apply database migrations
echo "Applying database migrations..."
npm run db:push

# Pull the latest Docker images
echo "Pulling latest Docker images..."
docker-compose pull

# Restart services
echo "Restarting services..."
docker-compose down
docker-compose up -d

# Register Discord commands
echo "Registering Discord slash commands..."
node github_actions_config/register-commands.js

# Send notification to Discord
if [ -n "$UPDATE_WEBHOOK_URL" ]; then
  echo "Sending deployment notification to Discord..."
  curl -H "Content-Type: application/json" \
    -d '{"username": "Deployment Bot", "content": "Lifeless rose updated: 🚀 Guard-Shin has been successfully deployed!"}' \
    $UPDATE_WEBHOOK_URL
fi

echo "Deployment completed successfully!"