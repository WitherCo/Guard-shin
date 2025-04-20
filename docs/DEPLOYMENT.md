# Deployment Guide for Guard-shin Dashboard

This guide explains how to deploy the Guard-shin Dashboard using GitHub Actions and GitHub Pages.

## Automatic Deployment

The project is configured for automatic deployment using GitHub Actions. Every time code is pushed to the `main` branch, the following steps are executed automatically:

1. The code is checked out
2. Dependencies are installed
3. The application is built
4. The built files are deployed to GitHub Pages
5. A notification is sent to Discord via webhook

### Required Secrets

For automatic deployment to work, you need to configure the following secrets in your GitHub repository settings:

- `UPDATE_WEBHOOK_URL`: Discord webhook URL for deployment notifications

### GitHub Pages Configuration

The deployment uses the `gh-pages` branch to host the static files. You can configure your custom domain in the GitHub repository settings under the Pages section.

## Manual Deployment

If you need to deploy the dashboard manually, follow these steps:

1. Build the application:
   ```bash
   npm run build
   ```

2. The built files will be in the `dist` directory.

3. Deploy these files to your hosting service of choice.

## Monitoring Deployments

You can monitor deployments in several ways:

1. Check the Actions tab in your GitHub repository to see the status of deployment workflows.
2. The Discord webhook will send notifications about deployments to the configured channel.

## Troubleshooting

If deployments fail, check the following:

1. Ensure all required secrets are set in the GitHub repository settings.
2. Check the build logs in the Actions tab for any errors.
3. Verify that the GitHub Pages settings are configured correctly.
4. Make sure the `UPDATE_WEBHOOK_URL` is valid and accessible.

## Local Development

For local development:

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run dev` to start the development server
4. Access the dashboard at `http://localhost:5000`