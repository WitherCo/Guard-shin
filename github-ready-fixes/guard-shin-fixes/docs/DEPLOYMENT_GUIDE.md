# Guard-shin Deployment Guide

This guide provides detailed instructions for deploying the Guard-shin Discord bot and dashboard to various platforms.

## Prerequisites

Before deploying, ensure you have:

1. A Discord application with bot created at [Discord Developer Portal](https://discord.com/developers/applications)
2. Bot token, client ID, and client secret from your Discord application
3. A PostgreSQL database (see `DATABASE_SETUP.md` for setup instructions)
4. Stripe account if using premium features (optional)
5. Node.js v20+ installed on your deployment machine

## Environment Variables

Set up the following environment variables:

### Required

```
DATABASE_URL=postgresql://username:password@hostname:port/database
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
NODE_ENV=production
```

### Optional (for Premium Features)

```
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_publishable_key
UPDATE_WEBHOOK_URL=discord_webhook_url_for_update_notifications
```

## Deployment Options

### Option 1: Docker Deployment

The easiest way to deploy Guard-shin is using Docker.

#### Using Docker Compose

1. Pull the Docker image:

```bash
docker pull witherco/guard-shin:latest
```

2. Create a `docker-compose.yml` file:

```yaml
version: '3'
services:
  guard-shin:
    image: witherco/guard-shin:latest
    environment:
      - NODE_ENV=production
      - DATABASE_URL=your_database_url
      - DISCORD_BOT_TOKEN=your_discord_bot_token
      - DISCORD_CLIENT_ID=your_discord_client_id
      - DISCORD_CLIENT_SECRET=your_discord_client_secret
      - STRIPE_SECRET_KEY=your_stripe_secret_key
      - VITE_STRIPE_PUBLIC_KEY=your_stripe_publishable_key
    ports:
      - "3000:3000"
    restart: unless-stopped
```

3. Start the container:

```bash
docker-compose up -d
```

#### Using Plain Docker

```bash
docker run -d \
  --name guard-shin \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URL=your_database_url \
  -e DISCORD_BOT_TOKEN=your_discord_bot_token \
  -e DISCORD_CLIENT_ID=your_discord_client_id \
  -e DISCORD_CLIENT_SECRET=your_discord_client_secret \
  --restart unless-stopped \
  witherco/guard-shin:latest
```

### Option 2: Deploying on Railway

[Railway](https://railway.app/) is a platform that makes it easy to deploy applications.

1. Create a new project in Railway
2. Connect your GitHub repository
3. Add the PostgreSQL plugin
4. Set up all required environment variables
5. Deploy the application

### Option 3: Deploying on Render

[Render](https://render.com/) provides easy cloud hosting with a free tier.

1. Create a new Web Service in Render
2. Connect your GitHub repository
3. Configure the build and start commands:
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm start`
4. Add all required environment variables
5. Deploy the application

### Option 4: Manual Deployment

For manual deployment on your own server:

1. Clone the repository:

```bash
git clone https://github.com/WitherCo/Guard.git
cd Guard
```

2. Install dependencies:

```bash
npm ci
```

3. Build the application:

```bash
npm run build
```

4. Start the application:

```bash
npm start
```

It's recommended to use a process manager like PM2:

```bash
npm install -g pm2
pm2 start npm --name "guard-shin" -- start
pm2 save
```

## Setting up Discord OAuth2 Redirect URL

After deployment, set up the OAuth2 redirect URL in your Discord application:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to the "OAuth2" section
4. Add a redirect URL: `https://your-domain.com/api/auth/discord/callback`

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Verify that your DATABASE_URL is correct
   - Check that your database is accessible from your deployment server

2. **Discord Authentication Issues**:
   - Verify that your redirect URL is correctly set in the Discord Developer Portal
   - Check that your DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET are correct

3. **Application Not Starting**:
   - Check the application logs for errors
   - Verify that all required environment variables are set
   - Ensure you're using Node.js v20+

### Checking Logs

For Docker deployment:

```bash
docker logs guard-shin
```

For PM2:

```bash
pm2 logs guard-shin
```

## Updating the Application

To update to the latest version:

### Docker:

```bash
docker pull witherco/guard-shin:latest
docker-compose down
docker-compose up -d
```

### Manual Deployment:

```bash
git pull
npm ci
npm run build
pm2 restart guard-shin
```

## Setting Up HTTPS

For production deployments, HTTPS is required for secure connections.

### Using Nginx as a Reverse Proxy

1. Install Nginx:

```bash
sudo apt update
sudo apt install nginx
```

2. Set up a server block:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Use Certbot to get a free SSL certificate:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Inviting the Bot to Servers

Create an invite link for your bot:

```
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot%20applications.commands
```

Replace `YOUR_CLIENT_ID` with your Discord application's client ID. This link grants administrator permissions to the bot.