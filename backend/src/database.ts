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
        
        // Better statement splitting - handle multi-line statements
        // Remove comments first
        const cleanedSchema = schema
          .replace(/--.*$/gm, '') // Remove single-line comments
          .replace(/\/\*[\s\S]*?\*\//g, ''); // Remove multi-line comments
        
        // Split by semicolons, but keep multi-line statements together
        const statements = cleanedSchema
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
        
        console.log(`Executing ${statements.length} schema statements...`);
        
        for (let i = 0; i < statements.length; i++) {
          const statement = statements[i].trim();
          if (statement) {
            try {
              await database.query(statement);
              console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
            } catch (error: any) {
              // Log errors properly instead of just warning
              console.error(`❌ Error in statement ${i + 1}:`, error.message);
              console.error(`Statement preview: ${statement.substring(0, 200)}...`);
              // Don't skip - we need to see what's failing
              throw error; // Re-throw to stop execution
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