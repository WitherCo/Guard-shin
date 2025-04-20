import { db } from '../db';
import { sql } from 'drizzle-orm';
import { log } from '../vite';

/**
 * Add role column to users table
 */
export async function addRoleColumn() {
  try {
    // Check if the column already exists to avoid errors
    const checkResult = await db.execute(sql`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'users'
        AND column_name = 'role'
      );
    `);
    
    const columnExists = checkResult.rows[0]?.exists === true;
    
    if (!columnExists) {
      log('Adding role column to users table...', 'migration');
      
      // Add role column to users table
      await db.execute(sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';
      `);
      
      log('Role column added successfully!', 'migration');
    } else {
      log('Role column already exists, skipping...', 'migration');
    }
    
    return true;
  } catch (error) {
    console.error('Error adding role column:', error);
    return false;
  }
}