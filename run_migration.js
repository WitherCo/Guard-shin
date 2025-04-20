import { execSync } from 'child_process';
import { createRequire } from 'module';

// Compile the TypeScript file
console.log('Compiling migration script...');
execSync('npx esbuild server/migrations/add_role_column.ts --bundle --platform=node --outfile=migrations/add_role_column.cjs');

// Use createRequire to get a require function
const require = createRequire(import.meta.url);

// Now import the compiled JS file
const { addRoleColumn } = require('./migrations/add_role_column.cjs');

async function runMigration() {
  console.log('Running migrations...');
  try {
    await addRoleColumn();
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  }
}

runMigration();