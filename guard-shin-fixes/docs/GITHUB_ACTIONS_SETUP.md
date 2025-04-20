# GitHub Actions Setup Guide for Guard-shin Bot

This document explains how to set up GitHub Actions for Guard-shin bot to automate building, testing, and deployment processes.

## Required Secrets

To ensure GitHub Actions workflows run properly, you need to configure the following repository secrets:

1. **DATABASE_URL**: Your PostgreSQL connection string
2. **DISCORD_BOT_TOKEN**: Your Discord bot token
3. **GUARD_SHIN_BOT_TOKEN**: Your Guard-shin bot token
4. **DISCORD_CLIENT_ID**: Your Discord application client ID
5. **DISCORD_CLIENT_SECRET**: Your Discord application client secret
6. **STRIPE_SECRET_KEY**: Your Stripe secret key
7. **VITE_STRIPE_PUBLIC_KEY**: Your Stripe publishable key
8. **UPDATE_WEBHOOK_URL**: Discord webhook URL for deployment notifications
9. **DOCKER_HUB_USERNAME**: Your Docker Hub username
10. **DOCKER_HUB_ACCESS_TOKEN**: Your Docker Hub access token

## Setting Up Secrets

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" then "Actions"
4. Click on "New repository secret"
5. Add each secret by name and value
6. Click "Add secret" after entering each one

## Workflows

The repository includes four main workflows:

1. **Node.js CI**: Builds and tests the application on every push
2. **Deploy**: Builds a Docker image for deployment 
3. **Database Migrations**: Runs database migrations when schema changes are detected
4. **Discord Bot Deployment**: Updates and registers Discord bot commands

## Manual Deployment

You can manually trigger deployments:

1. Go to the "Actions" tab in your repository
2. Select the desired workflow
3. Click "Run workflow"
4. Select the branch to deploy
5. Click "Run workflow"

## Managing Discord Bot Slash Commands

The Discord bot workflow will automatically register slash commands when changes are detected in the bot directory. This ensures that your Discord bot commands are always up-to-date with your code.

## Docker Deployment Setup

For Docker deployment, you'll need:

1. Docker Hub account
2. Access token with push permissions
3. Repository secrets configured with your Docker Hub credentials

The workflow will automatically build and push the Docker image to Docker Hub, where it can be pulled by your production server.

## Troubleshooting

If workflows fail, check:

1. All required secrets are properly configured
2. The database connection is working
3. Dependencies are properly installed
4. Build steps complete successfully

For detailed logs, click on the failed workflow run in the Actions tab.

## Adding Additional Workflows

To add new workflows:

1. Create a new YAML file in the `.github/workflows` directory
2. Follow the GitHub Actions syntax for defining jobs and steps
3. Commit and push the file to your repository

## Security Best Practices

1. Never hardcode tokens or credentials in workflow files
2. Always use repository secrets for sensitive information
3. Limit permissions of access tokens to only what's needed
4. Regularly rotate credentials and tokens