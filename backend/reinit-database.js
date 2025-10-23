// Script to reinitialize the database with correct schema
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = './coogmusic.db';
const schemaPath = './src/schema.sqlite.sql';

console.log('🔄 Reinitializing database...\n');

// Backup old database
if (fs.existsSync(dbPath)) {
  const backupPath = `./coogmusic.db.backup.${Date.now()}`;
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ Backed up old database to: ${backupPath}`);
  
  // Delete old database
  fs.unlinkSync(dbPath);
  console.log('✅ Deleted old database');
}

// Create new database
const db = new Database(dbPath);
console.log('✅ Created new database');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Read and execute schema
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);
console.log('✅ Executed schema');

// Verify tables
const tables = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' 
  ORDER BY name
`).all();

console.log('\n📋 Created tables:');
tables.forEach(table => {
  console.log(`  - ${table.name}`);
});

db.close();
console.log('\n✅ Database reinitialized successfully!');
console.log('\n⚠️  Note: All existing data has been backed up but the database is now empty.');
console.log('   You will need to re-register users and re-upload songs.\n');

