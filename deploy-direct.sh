#!/bin/bash
# Direct deployment script to push directly to main branch

# Set your GitHub repository URL here
GITHUB_REPO="https://github.com/witherco/guard-shin.git"

# Check if GITHUB_TOKEN is available
if [ -z "$GITHUB_TOKEN" ]; then
  echo "ERROR: GITHUB_TOKEN environment variable is not set"
  echo "Please set it before running this script"
  exit 1
fi

# Configure Git with token authentication
git config --global credential.helper store
echo "https://oauth2:$GITHUB_TOKEN@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials

# Add GitHub as remote if not already added
if ! git remote | grep -q origin; then
  git remote add origin $GITHUB_REPO
else
  # Update the URL if remote already exists
  git remote set-url origin $GITHUB_REPO
fi

# Force-fetch from remote to ensure we have latest changes
git fetch --force origin

# Create a temporary branch based on remote main
git checkout -b temp-main origin/main || git checkout -b temp-main

# Add all files to include our changes
git add .

# Commit changes
git commit -m "Deploy Guard-shin dashboard with GitHub Actions configuration"

# Force push temp-main as main to overwrite remote main
git push -f origin temp-main:main

echo "Direct deployment completed - main branch updated!"