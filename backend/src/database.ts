import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export interface DatabaseConfig {
  path: string;
}

const dbConfig: DatabaseConfig = {
  path: process.env.DB_PATH || './coogmusic.db',
};

let db: Database.Database | null = null;

export const createConnection = async (): Promise<Database.Database> => {
  try {
    if (!db) {
      // Ensure directory exists
      const dbDir = path.dirname(dbConfig.path);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      db = new Database(dbConfig.path);
      
      // Enable foreign key constraints
      db.pragma('foreign_keys = ON');
      
      console.log('Connected to SQLite database');
    }
    return db;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};

export const createPool = () => {
  try {
    const database = new Database(dbConfig.path);
    database.pragma('foreign_keys = ON');
    console.log('SQLite database pool created');
    return database;
  } catch (error) {
    console.error('Error creating database pool:', error);
    throw error;
  }
};

export const testConnection = async (): Promise<boolean> => {
  try {
    const database = await createConnection();
    database.prepare('SELECT 1').get();
    console.log('Database connection test successful');
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
};

export const initializeDatabase = async (): Promise<void> => {
  try {
    const database = await createConnection();
    
    // Check if tables already exist
    const tables = database.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='userprofile'
    `).get();
    
    if (!tables) {
      // Only initialize schema if tables don't exist
      const schemaPath = path.join(__dirname, 'schema.sqlite.sql');
      
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        database.exec(schema);
        console.log('Database schema initialized');
      } else {
        console.warn('Schema file not found, database may not be properly initialized');
      }
    } else {
      console.log('Database schema already exists, skipping initialization');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export const closeConnection = (): void => {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
};