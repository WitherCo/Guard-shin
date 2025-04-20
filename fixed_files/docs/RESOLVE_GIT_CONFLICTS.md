# Resolving Git Conflicts in Guard-shin Repository

This guide provides step-by-step instructions for resolving the Git merge conflicts in the Guard-shin repository.

## The Problem

You've encountered merge conflicts in your GitHub repository, making it difficult to push new changes. The main issues are:

1. Merge conflicts in `package.json` with git conflict markers (`<<<<<<< HEAD`, `=======`, `>>>>>>>`)
2. Merge conflicts in `shared/schema.ts` with different database schema definitions
3. Conflicts in various other files preventing successful deployment

## Solution: Create a Clean Branch and Merge

### Step 1: Clone the Repository Fresh

```bash
git clone https://github.com/WitherCo/Guard.git
cd Guard
```

### Step 2: Create a New Branch from Main

```bash
git checkout -b fix-conflicts
```

### Step 3: Replace the Problematic Files

Replace the following files with the fixed versions:

1. **package.json** - Replace with the fixed version that combines both sets of dependencies
2. **shared/schema.ts** - Replace with the fixed version that has all the schema definitions

You can use the following commands:

```bash
# Copy the fixed files
cp /path/to/fixed_package.json package.json
cp /path/to/fixed_schema.ts shared/schema.ts
```

### Step 4: Add the GitHub Actions Workflows

Make sure the `.github/workflows` directory exists and copy the workflow files:

```bash
mkdir -p .github/workflows
cp /path/to/github_actions_config/.github/workflows/node.yml .github/workflows/
cp /path/to/github_actions_config/.github/workflows/deploy.yml .github/workflows/
cp /path/to/github_actions_config/.github/workflows/database.yml .github/workflows/
cp /path/to/github_actions_config/.github/workflows/discord-bot.yml .github/workflows/
```

Also copy the registration script:

```bash
cp /path/to/github_actions_config/register-commands.js ./
```

### Step 5: Add the GitHub Actions Documentation

```bash
cp /path/to/github_actions_config/GITHUB_ACTIONS_SETUP.md ./docs/
```

### Step 6: Commit the Changes

```bash
git add .
git commit -m "Fix merge conflicts and add GitHub Actions workflows"
```

### Step 7: Push to GitHub

```bash
git push -u origin fix-conflicts
```

### Step 8: Create a Pull Request

1. Go to the GitHub repository: https://github.com/WitherCo/Guard
2. Click on "Pull requests" tab
3. Click "New pull request"
4. Select "fix-conflicts" as the compare branch
5. Click "Create pull request"
6. Add a description explaining the changes
7. Submit the pull request

### Step 9: Review and Merge

Once the pull request is approved, merge it to the main branch. This will resolve all the conflicts and update your repository with the fixed versions of the files.

## Setting Up GitHub Secrets

After resolving the conflicts, make sure to add the necessary secrets to your GitHub repository:

1. Go to your GitHub repository
2. Click on "Settings" tab
3. In the left sidebar, click on "Secrets and variables" then "Actions"
4. Click on "New repository secret"
5. Add each of these secrets:
   - DATABASE_URL
   - DISCORD_BOT_TOKEN
   - GUARD_SHIN_BOT_TOKEN
   - DISCORD_CLIENT_ID
   - DISCORD_CLIENT_SECRET
   - STRIPE_SECRET_KEY
   - VITE_STRIPE_PUBLIC_KEY
   - UPDATE_WEBHOOK_URL (Discord webhook for notifications)
   - DOCKER_HUB_USERNAME
   - DOCKER_HUB_ACCESS_TOKEN

## Testing the Fix

Once merged, test that the application builds correctly:

1. Go to the "Actions" tab in your GitHub repository
2. Find the "Node.js CI" workflow
3. Click "Run workflow" on the main branch
4. Verify that the workflow completes successfully

If everything works correctly, your repository should now be conflict-free and ready for deployment!