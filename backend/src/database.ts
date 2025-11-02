import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  waitForConnections: boolean;
  connectionLimit: number;
  queueLimit: number;
  ssl?: any;
}

const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'coogmusic',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Azure requires SSL
  ssl: {
    rejectUnauthorized: false
  }
};

let pool: mysql.Pool | null = null;

export const createConnection = async (): Promise<mysql.Pool> => {
  try {
    if (!pool) {
      pool = mysql.createPool(dbConfig);
      // Test the connection
      const connection = await pool.getConnection();
      await connection.ping();
      connection.release();
      console.log('Connected to MySQL database');
    }
    return pool;
  } catch (error) {
    console.error('Error connecting to database:', error);
    throw error;
  }
};

export const getPool = createConnection;

export const testConnection = async (): Promise<boolean> => {
  try {
    const database = await createConnection();
    const [rows] = await database.query('SELECT 1 as test');
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
    const [tables] = await database.query<any[]>(
      "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'userprofile'",
      [dbConfig.database]
    );

    if (tables.length === 0) {
      const schemaPath = path.join(__dirname, 'schema.mysql.sql');
      
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        // Split by semicolons and execute each statement
        const statements = schema
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await database.query(statement);
            } catch (error: any) {
              // Skip errors for IF NOT EXISTS statements
              if (!error.message.includes('already exists')) {
                console.warn('Schema statement warning:', error.message);
              }
            }
          }
        }
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

export const closeConnection = async (): Promise<void> => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Database connection closed');
  }
};