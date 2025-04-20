#!/bin/bash
# Apply Guard-shin repository fixes
# Run this script in your Guard repository root directory

echo "Applying Guard-shin repository fixes..."

# Create necessary directories
mkdir -p shared .github/workflows docs

# Copy fixed files
cp -v package.json ./
cp -v shared/schema.ts shared/
cp -v .github/workflows/*.yml .github/workflows/
cp -v register-commands.js ./
cp -v docs/*.md docs/

echo "All fixes have been applied successfully!"
echo ""
echo "Next steps:"
echo "1. Verify the changes: git status"
echo "2. Add all changes: git add ."
echo "3. Commit the changes: git commit -m 'Fix: Resolve merge conflicts and GitHub Actions workflows'"
echo "4. Push to your branch: git push origin <your-branch-name>"
