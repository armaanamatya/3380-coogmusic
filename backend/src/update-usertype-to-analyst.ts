import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import path from 'path';

dotenv.config();

/**
 * Migration script to update UserType from 'Developer' to 'Analyst'
 * 
 * This script:
 * 1. Updates any existing users with UserType='Developer' to 'Analyst'
 * 2. Modifies the database schema to allow 'Analyst' instead of 'Developer'
 * 
 * Supports both SQLite and MySQL databases.
 */

interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'coogmusic',
  port: parseInt(process.env.DB_PORT || '3306', 10),
};

const migrateSQLite = async () => {
  try {
    const dbPath = process.env.DB_PATH || './coogmusic.db';
    console.log(`\n🔷 Migrating SQLite database: ${dbPath}`);
    
    const db = new Database(dbPath);
    db.pragma('foreign_keys = OFF'); // Disable foreign keys temporarily
    
    // Step 1: Update any existing 'Developer' users to 'Analyst'
    console.log('Updating existing users with UserType="Developer" to "Analyst"...');
    const updateResult = db.prepare(`
      UPDATE userprofile 
      SET UserType = 'Analyst', UpdatedAt = DATETIME('now')
      WHERE UserType = 'Developer'
    `).run();
    
    console.log(`  ✅ Updated ${updateResult.changes} user(s) from 'Developer' to 'Analyst'`);
    
    // Step 2: SQLite doesn't support ALTER TABLE to modify CHECK constraints
    // We need to recreate the table with the new constraint
    console.log('\nRecreating userprofile table with updated UserType constraint...');
    
    // Get current table structure (excluding the constraint)
    const tableInfo = db.prepare(`
      SELECT sql FROM sqlite_master 
      WHERE type='table' AND name='userprofile'
    `).get() as { sql: string } | undefined;
    
    if (!tableInfo) {
      throw new Error('userprofile table not found');
    }
    
    // Create backup table
    console.log('  Creating backup table...');
    db.exec(`
      CREATE TABLE userprofile_backup AS 
      SELECT * FROM userprofile
    `);
    
    // Drop old table
    console.log('  Dropping old table...');
    db.exec(`DROP TABLE userprofile`);
    
    // Create new table with updated constraint
    console.log('  Creating new table with updated constraint...');
    db.exec(`
      CREATE TABLE userprofile (
          UserID INTEGER PRIMARY KEY AUTOINCREMENT,
          Username TEXT NOT NULL UNIQUE,
          UserPassword TEXT NOT NULL,
          FirstName TEXT NOT NULL,
          LastName TEXT NOT NULL,
          DateOfBirth TEXT NOT NULL,
          Email TEXT NOT NULL UNIQUE,
          UserType TEXT NOT NULL DEFAULT 'Listener' CHECK (UserType IN ('Listener', 'Artist', 'Administrator', 'Analyst')),
          DateJoined TEXT NOT NULL DEFAULT (DATE('now')),
          Country TEXT NOT NULL,
          City TEXT,
          AccountStatus TEXT NOT NULL DEFAULT 'Active' CHECK (AccountStatus IN ('Active', 'Suspended', 'Banned')),
          IsOnline INTEGER NOT NULL DEFAULT 0,
          LastLogin TEXT,
          ProfilePicture TEXT,
          CreatedAt TEXT NOT NULL DEFAULT (DATETIME('now')),
          UpdatedAt TEXT NOT NULL DEFAULT (DATETIME('now'))
      )
    `);
    
    // Copy data back
    console.log('  Copying data back to new table...');
    db.exec(`
      INSERT INTO userprofile 
      SELECT * FROM userprofile_backup
    `);
    
    // Drop backup table
    console.log('  Dropping backup table...');
    db.exec(`DROP TABLE userprofile_backup`);
    
    // Recreate indexes if they exist
    console.log('  Recreating indexes...');
    const indexes = db.prepare(`
      SELECT name, sql FROM sqlite_master 
      WHERE type='index' AND tbl_name='userprofile' AND sql IS NOT NULL
    `).all() as Array<{ name: string; sql: string }>;
    
    for (const index of indexes) {
      if (index.name !== 'sqlite_autoindex_userprofile_1' && 
          index.name !== 'sqlite_autoindex_userprofile_2') {
        try {
          db.exec(index.sql);
          console.log(`    ✅ Recreated index: ${index.name}`);
        } catch (error) {
          console.log(`    ⚠️  Could not recreate index ${index.name}: ${error}`);
        }
      }
    }
    
    db.pragma('foreign_keys = ON'); // Re-enable foreign keys
    
    db.close();
    console.log('\n✅ SQLite migration completed successfully!');
  } catch (error) {
    console.error('❌ SQLite migration failed:', error);
    throw error;
  }
};

const migrateMySQL = async () => {
  try {
    console.log('\n🔵 Migrating MySQL database...');
    console.log(`  Host: ${dbConfig.host}`);
    console.log(`  Database: ${dbConfig.database}`);
    
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      port: dbConfig.port,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Step 1: Modify the ENUM to include both 'Developer' and 'Analyst' temporarily
    // This allows us to update the data
    console.log('\nStep 1: Modifying UserType ENUM to include both "Developer" and "Analyst"...');
    await connection.execute(`
      ALTER TABLE userprofile 
      MODIFY COLUMN UserType ENUM('Listener', 'Artist', 'Administrator', 'Developer', 'Analyst') 
      NOT NULL DEFAULT 'Listener'
    `);
    console.log('  ✅ UserType ENUM updated to include both values');
    
    // Step 2: Update any existing 'Developer' users to 'Analyst'
    console.log('\nStep 2: Updating existing users with UserType="Developer" to "Analyst"...');
    const [updateResult] = await connection.execute(`
      UPDATE userprofile 
      SET UserType = 'Analyst', UpdatedAt = NOW()
      WHERE UserType = 'Developer'
    `);
    
    const affectedRows = (updateResult as any).affectedRows;
    console.log(`  ✅ Updated ${affectedRows} user(s) from 'Developer' to 'Analyst'`);
    
    // Step 3: Modify the ENUM to remove 'Developer' and keep only 'Analyst'
    console.log('\nStep 3: Modifying UserType ENUM to remove "Developer" (keeping "Analyst")...');
    await connection.execute(`
      ALTER TABLE userprofile 
      MODIFY COLUMN UserType ENUM('Listener', 'Artist', 'Administrator', 'Analyst') 
      NOT NULL DEFAULT 'Listener'
    `);
    
    console.log('  ✅ UserType ENUM updated successfully - "Developer" removed, "Analyst" kept');
    
    await connection.end();
    console.log('\n✅ MySQL migration completed successfully!');
  } catch (error) {
    console.error('❌ MySQL migration failed:', error);
    throw error;
  }
};

const main = async () => {
  try {
    console.log('🚀 Starting UserType migration: Developer → Analyst\n');
    
    // Only use MySQL (SQLite code is ignored as per user requirements)
    await migrateMySQL();
    
    console.log('\n✨ Migration completed successfully!');
    console.log('You can now create user profiles with UserType="Analyst"');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
};

main();

