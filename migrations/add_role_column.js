const { pool } = require('../server/db');
const { sql } = require('drizzle-orm');

async function addRoleColumn() {
  try {
    console.log('Running migration: Add role column to users table...');
    
    // First check if column exists
    const checkResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'role'
      );
    `);
    
    const columnExists = checkResult.rows[0].exists;
    
    if (!columnExists) {
      console.log('Column "role" does not exist, adding it...');
      
      // Add the column if it doesn't exist
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN role text DEFAULT 'user';
      `);
      
      console.log('Column "role" added successfully.');
    } else {
      console.log('Column "role" already exists, skipping migration.');
    }
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
addRoleColumn();