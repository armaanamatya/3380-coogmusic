import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to add the user_logins table to existing MySQL databases.
 * 
 * This script creates the user_logins table for tracking user login sessions,
 * activity counters, and logout events.
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

const migrate = async () => {
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
    
    // Check if table already exists
    console.log('\nChecking if user_logins table exists...');
    const [tables] = await connection.execute<any[]>(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'user_logins'
    `, [dbConfig.database]);
    
    if (tables.length > 0) {
      console.log('  ✅ user_logins table already exists. Skipping...');
      await connection.end();
      return;
    }
    
    // Create the table
    console.log('\nCreating user_logins table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_logins (
        LoginID INT AUTO_INCREMENT PRIMARY KEY,
        UserID INT NOT NULL,
        LoginDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        LogoutDate TIMESTAMP NULL DEFAULT NULL,
        LoginSession INT NULL DEFAULT NULL COMMENT 'Session duration in seconds (LogoutDate - LoginDate)',
        SongsPlayed INT NOT NULL DEFAULT 0,
        SongsLiked INT NOT NULL DEFAULT 0,
        ArtistsFollowed INT NOT NULL DEFAULT 0,
        SongsUploaded INT NOT NULL DEFAULT 0 COMMENT 'Only applicable for Artist user type',
        CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
        INDEX idx_user_id (UserID),
        INDEX idx_login_date (LoginDate),
        INDEX idx_logout_date (LogoutDate)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('  ✅ user_logins table created successfully');
    
    await connection.end();
    console.log('\n✅ Migration completed successfully!');
    console.log('The user_logins table is now available for tracking user sessions.');
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

const main = async () => {
  try {
    console.log('🚀 Starting user_logins table migration\n');
    await migrate();
    console.log('\n✨ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
};

main();

