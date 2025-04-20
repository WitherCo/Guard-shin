import { db } from './server/db.js';
import { storage } from './server/storage.js';
import * as schema from './shared/schema.js';

// Drop all tables in the correct order (respecting foreign key constraints)
async function resetDatabase() {
  console.log('Dropping all tables...');
  
  try {
    // Drop tables in the reverse order of their dependencies
    await db.drop(schema.infractions);
    await db.drop(schema.verificationSettings);
    await db.drop(schema.raidProtectionSettings);
    await db.drop(schema.autoModSettings);
    await db.drop(schema.servers);
    await db.drop(schema.users);
    
    console.log('All tables dropped successfully.');
    
    // Re-initialize the database with updated data
    console.log('Reinitializing database with updated data...');
    await storage.initializeDemoData();
    
    console.log('Database reset complete.');
  } catch (error) {
    console.error('Error resetting database:', error);
  }
  
  process.exit(0);
}

resetDatabase();