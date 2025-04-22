#!/bin/bash

# Guard-shin Deployment Script
# This script helps deploy both the Discord bot and GitHub Pages dashboard

echo "🚀 Guard-shin Deployment Helper"
echo "==============================="

# Check for GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
  echo "⚠️ GITHUB_TOKEN environment variable not set."
  echo "Please set it with: export GITHUB_TOKEN=your_token"
  exit 1
fi

# Deploy static dashboard to GitHub Pages
echo -e "\n📱 Deploying static dashboard to GitHub Pages..."
node deploy_static_dashboard.cjs

# Deploy Discord bot (implement this part if needed)
echo -e "\n🤖 Checking Discord bot status..."
node check_discord_bot.cjs

echo -e "\n✅ Deployment process completed!"
echo "Dashboard: https://witherco.github.io/Guard-shin/"
echo "Bot Client ID: 1361873604882731008"
echo "Add Bot Link: https://discord.com/oauth2/authorize?client_id=1361873604882731008&scope=bot&permissions=8"