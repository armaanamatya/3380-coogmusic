import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to add triggers that automatically set IsOnline status
 * when users log in or log out.
 * 
 * This script creates:
 * 1. set_user_online_on_login - Sets IsOnline = 1 when a new login record is created
 * 2. set_user_offline_on_logout - Sets IsOnline = 0 when a logout occurs
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
      },
      multipleStatements: true
    });
    
    // Check if triggers already exist
    console.log('\nChecking if triggers already exist...');
    const [triggers] = await connection.execute<any[]>(`
      SELECT TRIGGER_NAME 
      FROM information_schema.TRIGGERS 
      WHERE TRIGGER_SCHEMA = ? 
        AND TRIGGER_NAME IN ('set_user_online_on_login', 'set_user_offline_on_logout')
    `, [dbConfig.database]);
    
    const existingTriggers = triggers.map((t: any) => t.TRIGGER_NAME);
    
    // Drop existing triggers if they exist (to recreate them)
    if (existingTriggers.includes('set_user_online_on_login')) {
      console.log('  Dropping existing trigger: set_user_online_on_login');
      await connection.execute('DROP TRIGGER IF EXISTS set_user_online_on_login');
    }
    
    if (existingTriggers.includes('set_user_offline_on_logout')) {
      console.log('  Dropping existing trigger: set_user_offline_on_logout');
      await connection.execute('DROP TRIGGER IF EXISTS set_user_offline_on_logout');
    }
    
    // Create triggers
    console.log('\nCreating triggers...');
    
    // Trigger 1: Set IsOnline = 1 on login
    console.log('  Creating trigger: set_user_online_on_login');
    await connection.query(`
      CREATE TRIGGER set_user_online_on_login
      AFTER INSERT ON user_logins
      FOR EACH ROW
      BEGIN
          UPDATE userprofile
          SET IsOnline = 1,
              LastLogin = NEW.LoginDate,
              UpdatedAt = NOW()
          WHERE UserID = NEW.UserID;
      END
    `);
    console.log('    ✅ Trigger created successfully');
    
    // Trigger 2: Set IsOnline = 0 on logout
    console.log('  Creating trigger: set_user_offline_on_logout');
    await connection.query(`
      CREATE TRIGGER set_user_offline_on_logout
      AFTER UPDATE ON user_logins
      FOR EACH ROW
      BEGIN
          -- Only update if LogoutDate changed from NULL to a non-NULL value
          IF OLD.LogoutDate IS NULL AND NEW.LogoutDate IS NOT NULL THEN
              UPDATE userprofile
              SET IsOnline = 0,
                  UpdatedAt = NOW()
              WHERE UserID = NEW.UserID;
          END IF;
      END
    `);
    console.log('    ✅ Trigger created successfully');
    
    await connection.end();
    console.log('\n✅ Migration completed successfully!');
    console.log('The IsOnline triggers are now active.');
  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

const main = async () => {
  try {
    console.log('🚀 Starting IsOnline triggers migration\n');
    await migrate();
    console.log('\n✨ Migration completed successfully!');
    console.log('IsOnline status will now be automatically updated on login/logout.');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
};

main();

