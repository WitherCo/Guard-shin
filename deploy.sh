#!/bin/bash

# Guard-shin Deployment Script
# This script helps deploy the Guard-shin bot to GitHub and Railway

echo "========================================"
echo "   Guard-shin Bot Deployment Script"
echo "========================================"

# Step 1: Install git if not already installed
if ! command -v git &> /dev/null; then
    echo "Git is not installed. Please install git first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Creating a template from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "Please edit the .env file with your actual tokens before continuing."
    else
        echo "Error: .env.example file not found. Please create a .env file with your tokens."
        exit 1
    fi
    exit 1
fi

# Step 2: Initialize git repository if not already done
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    echo "Git repository initialized."
else
    echo "Git repository already exists."
fi

# Step 3: Check if GitHub repository exists
read -p "Enter your GitHub username: " github_username
read -p "Enter the GitHub repository name (default: Guard-shin): " github_repo
github_repo=${github_repo:-Guard-shin}

echo "Checking if remote origin exists..."
if git remote get-url origin 2>/dev/null; then
    echo "Remote origin already exists."
else
    echo "Setting up remote origin..."
    git remote add origin "https://github.com/$github_username/$github_repo.git"
    echo "Remote origin set to https://github.com/$github_username/$github_repo.git"
fi

# Step 4: Add all files to git
echo "Adding files to git..."
git add .
echo "Files added to git."

# Step 5: Commit changes
read -p "Enter commit message (default: Initial commit): " commit_message
commit_message=${commit_message:-Initial commit}
git commit -m "$commit_message"
echo "Changes committed."

# Step 6: Push to GitHub
echo "Pushing to GitHub..."
git branch -M main
git push -u origin main
echo "Changes pushed to GitHub."

# Step 7: Instructions for GitHub Secrets
echo ""
echo "============================================================"
echo "IMPORTANT: Set up GitHub Secrets for Deployment"
echo "============================================================"
echo "1. Go to https://github.com/$github_username/$github_repo/settings/secrets/actions"
echo "2. Add the following repository secrets:"
echo "   - DISCORD_BOT_TOKEN or GUARD_SHIN_BOT_TOKEN"
echo "   - UPDATE_WEBHOOK_URL"
echo "   - RAILWAY_TOKEN"
echo ""
echo "Once these secrets are set up, your bot will be automatically deployed"
echo "when you push changes to GitHub."
echo ""
echo "Discord bot will be deployed to Railway: https://railway.app"
echo "Dashboard will be deployed to GitHub Pages: https://$github_username.github.io/$github_repo/"

echo ""
echo "Deployment preparation complete!"
echo ""