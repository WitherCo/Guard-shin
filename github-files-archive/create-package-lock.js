/**
 * Script to generate package-lock.json
 * Run this script once before committing to GitHub
 */
console.log("Generating package-lock.json file...");
console.log("This will help GitHub Actions properly install dependencies.");

const { execSync } = require('child_process');
try {
  console.log("Executing: npm install --package-lock-only");
  execSync('npm install --package-lock-only', { stdio: 'inherit' });
  console.log("package-lock.json generated successfully!");
  console.log("Now you can commit this file to GitHub to fix dependency lock file errors.");
} catch (error) {
  console.error("Error generating package-lock.json:", error);
  process.exit(1);
}