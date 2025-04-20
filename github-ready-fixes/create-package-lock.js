/**
 * Script to generate package-lock.json
 * Run this script once before committing to GitHub
 */
console.log("Generating package-lock.json file...");
console.log("This will help GitHub Actions properly install dependencies.");
console.log("Executing npm install --package-lock-only");

const { execSync } = require('child_process');
try {
  execSync('npm install --package-lock-only', { stdio: 'inherit' });
  console.log("package-lock.json generated successfully!");
} catch (error) {
  console.error("Error generating package-lock.json:", error);
  process.exit(1);
}