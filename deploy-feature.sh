#!/bin/bash
# Deploy feature branch script for pushing to GitHub

# Set your GitHub repository URL here
GITHUB_REPO="https://github.com/witherco/guard-shin.git"
BRANCH_NAME="feature/github-config"

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

# Create feature branch and switch to it
git checkout -b $BRANCH_NAME

# Add all files and commit changes
git add .
git commit -m "Add GitHub workflow configuration, deployment docs, and update logger"

# Push changes to GitHub
git push -u origin $BRANCH_NAME

echo "Feature branch '$BRANCH_NAME' has been pushed to GitHub"
echo "You can now create a Pull Request to merge these changes into main"