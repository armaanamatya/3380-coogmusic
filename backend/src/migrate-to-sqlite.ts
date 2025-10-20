import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrateToSQLite = async () => {
  try {
    console.log('Starting migration to SQLite...');
    
    // Create SQLite database
    const db = new Database('./coogmusic.db');
    db.pragma('foreign_keys = ON');
    
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sqlite.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schema);
    
    console.log('SQLite database created successfully!');
    console.log('Database file: ./coogmusic.db');
    console.log('You can now share this file with your friends for development.');
    
    db.close();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

migrateToSQLite();
