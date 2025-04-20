# Fix for Missing Dependencies Lock File

The error `Dependencies lock file is not found in /home/runner/work/Guard/Guard` occurs because GitHub Actions requires a lock file for dependency installation.

## How to Fix

1. **Generate the lock file locally**:
   ```bash
   node create-package-lock.js
   ```
   This script will create a `package-lock.json` file without installing any dependencies.

2. **Commit the lock file**:
   ```bash
   git add package-lock.json
   git commit -m "Add package-lock.json for GitHub Actions"
   git push
   ```

3. **Alternative approach**: 
   The updated GitHub Actions workflow now includes a step to automatically create a lock file if one doesn't exist, but it's still better to have the lock file committed to ensure consistent dependency versions.

## Why This Matters

Lock files ensure that all developers and CI/CD environments use exactly the same dependency versions, preventing "works on my machine" issues. Without a lock file, different environments might install slightly different package versions, leading to unexpected behaviors.

## Additional Notes for GitHub Actions

- Our updated workflow uses `npm ci || npm install` to handle both scenarios (with or without lock file)
- The workflow will automatically generate a lock file if it doesn't exist
- For optimal results, generate and commit the lock file as described above