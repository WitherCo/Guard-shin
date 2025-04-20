# GitHub Actions Setup Guide

This guide explains how to set up GitHub Actions for automated deployment, database migrations, and Discord bot management.

## Required Repository Secrets

You need to add the following secrets to your GitHub repository to enable the workflows:

### Database Secrets
- `DATABASE_URL`: Full PostgreSQL connection string
- `PGUSER`: PostgreSQL username
- `PGPASSWORD`: PostgreSQL password
- `PGDATABASE`: PostgreSQL database name
- `PGHOST`: PostgreSQL host address
- `PGPORT`: PostgreSQL port number

### Discord Secrets
- `DISCORD_BOT_TOKEN`: Your Discord bot token
- `DISCORD_CLIENT_ID`: Your Discord application client ID
- `DISCORD_CLIENT_SECRET`: Your Discord application client secret
- `GUARD_SHIN_BOT_TOKEN`: Guard-Shin bot token (if different from main bot)
- `UPDATE_WEBHOOK_URL`: Discord webhook URL for posting update notifications

### Payment Processing Secrets
- `STRIPE_SECRET_KEY`: Your Stripe secret key
- `VITE_STRIPE_PUBLIC_KEY`: Your Stripe publishable key

### GitHub Container Registry
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## How to Add Secrets

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" then "Actions"
4. Click on "New repository secret"
5. Add each secret name and value

## Workflows

This repository contains several GitHub Actions workflows:

### 1. Node.js CI
- Runs on every push and pull request to main branch
- Installs dependencies
- Builds the application
- Runs type checking

### 2. Deploy
- Runs on push to main branch
- Builds and deploys the application
- Builds and pushes Docker images to GitHub Container Registry
- Sends a Discord notification when complete

### 3. Database Migration
- Runs when schema or migration files are changed
- Applies database migrations
- Sends a Discord notification when complete

### 4. Discord Bot
- Runs when bot code is changed
- Registers slash commands with Discord API
- Sends a Discord notification when complete

## Fixing Common Issues

### Missing package-lock.json
If GitHub Actions fails with "Dependencies lock file is not found", run:
```bash
node create-package-lock.js
```
Then commit the generated package-lock.json file.

### Discord Command Registration Failures
If Discord slash commands fail to register, check:
1. Your bot token is valid
2. Your application ID is correct
3. The bot has the `applications.commands` scope

## Environment Variables

For local development, copy `.env.example` to `.env` and fill in the values. For production deployment, ensure all the corresponding secrets are set in GitHub repository settings.