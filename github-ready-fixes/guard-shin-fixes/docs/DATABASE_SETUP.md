# Database Setup Guide for Guard-shin

This guide explains how to set up and configure the PostgreSQL database for the Guard-shin Discord bot.

## Local Development Database

For local development, you can use the Replit database or a local PostgreSQL instance.

### Option 1: Using the Replit Database

Replit automatically provisions a PostgreSQL database for your project. The connection string is available in the `DATABASE_URL` environment variable.

### Option 2: Local PostgreSQL Instance

1. Install PostgreSQL on your local machine
2. Create a new database for Guard-shin
3. Set the `DATABASE_URL` environment variable to your local database connection string:

```
DATABASE_URL=postgresql://username:password@localhost:5432/guardshin
```

## Production Database Setup

For production, you have several options:

### Option 1: Neon Database (Recommended)

1. Sign up for a free account at [Neon](https://neon.tech/)
2. Create a new project
3. Create a new database named `guardshin`
4. Copy the connection string and set it as `DATABASE_URL` in your environment variables

### Option 2: Supabase

1. Sign up for a free account at [Supabase](https://supabase.com/)
2. Create a new project
3. Go to Project Settings > Database
4. Copy the connection string and set it as `DATABASE_URL` in your environment variables

### Option 3: Railway

1. Sign up for an account at [Railway](https://railway.app/)
2. Create a new PostgreSQL database
3. Copy the connection string and set it as `DATABASE_URL` in your environment variables

## Database Migrations

Guard-shin uses Drizzle ORM for database migrations. The schema is defined in `shared/schema.ts`.

### Running Migrations

To apply schema changes to your database, run:

```bash
npm run db:push
```

This will push all schema changes from `shared/schema.ts` to your database.

## Setting Up Database Environment Variables

Make sure the following environment variables are set:

- `DATABASE_URL`: The PostgreSQL connection string
- `NODE_ENV`: Set to 'development' or 'production'

For GitHub Actions workflows, add these secrets to your repository:

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" then "Actions"
4. Click on "New repository secret"
5. Add `DATABASE_URL` with your PostgreSQL connection string

## Database Schema Information

The Guard-shin database includes the following tables:

- `users`: User accounts, including Discord authentication data
- `servers`: Discord servers managed by the bot
- `auto_mod_settings`: Auto-moderation configuration
- `raid_protection_settings`: Raid protection configuration
- `infractions`: User infractions (warnings, mutes, kicks, bans)
- `verification_settings`: Server verification configuration
- `welcome_message_settings`: Welcome message configuration
- `welcome_image_settings`: Welcome image configuration
- `reaction_roles`: Role assignment via reactions
- `auto_role_settings`: Automatic role assignment settings
- `logging_settings`: Server logging configuration
- `subscription_pricing`: Subscription tier pricing
- `user_subscriptions`: User subscription data
- `payment_transactions`: Payment transaction records
- `server_settings`: General server settings
- `custom_commands`: User-defined commands
- `auto_responses`: Automatic message responses
- `music_player_settings`: Music player configuration
- `analytics_events`: Analytics data collection
- `command_usage`: Command usage statistics

## Troubleshooting Database Issues

### Connection Issues

If you encounter connection issues:

1. Verify that the `DATABASE_URL` environment variable is correctly set
2. Ensure the database server is running and accessible
3. Check for firewall or network restrictions
4. Verify that the database user has the necessary permissions

### Migration Issues

If migrations fail:

1. Check for syntax errors in `shared/schema.ts`
2. Ensure the database user has permission to create/alter tables
3. Consider dropping and recreating the database if it's a development environment
4. Check the console output for specific error messages

## Database Backup and Restore

It's recommended to regularly backup your production database:

### Creating a Backup

```bash
pg_dump -Fc -v -h <host> -U <username> -d <database> -f guardshin_backup.dump
```

### Restoring from Backup

```bash
pg_restore -v -h <host> -U <username> -d <database> guardshin_backup.dump
```

## Security Considerations

- Use a strong, unique password for your database
- Do not expose your database to the public internet
- Limit database user permissions to only what is necessary
- Regularly update your database server software
- Enable SSL/TLS encryption for production databases
- Regularly backup your database data