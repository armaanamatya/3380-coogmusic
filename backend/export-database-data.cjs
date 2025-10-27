// Export database data to recreate the same dataset on another computer
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const db = new Database('./coogmusic.db');

console.log('📤 Exporting database data for replication...\n');

// Helper function to escape SQL strings
const escapeString = (str) => {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.toString().replace(/'/g, "''")}'`;
};

// Helper function to format values for INSERT
const formatValue = (value) => {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'string') return escapeString(value);
  return value;
};

// Get all data from each table
const tables = [
  'userprofile',
  'artist', 
  'genre',
  'album',
  'song',
  'playlist',
  'user_follows_artist',
  'user_likes_song',
  'user_likes_album', 
  'user_likes_playlist',
  'playlist_song',
  'listening_history'
];

let exportData = {
  schema: '',
  data: {}
};

// Export schema
console.log('📋 Exporting database schema...');
const schemaResult = db.prepare(`
  SELECT sql FROM sqlite_master 
  WHERE type='table' AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`).all();

exportData.schema = schemaResult.map(row => row.sql).join(';\n\n') + ';';

// Export data from each table
tables.forEach(tableName => {
  console.log(`📊 Exporting ${tableName}...`);
  
  try {
    // Get table structure
    const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
    const columnNames = columns.map(col => col.name);
    
    // Get all data
    const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
    
    if (rows.length === 0) {
      console.log(`  ⚠️  No data in ${tableName}`);
      exportData.data[tableName] = [];
      return;
    }
    
    // Generate INSERT statements
    const insertStatements = [];
    
    // Create INSERT statement for each row
    rows.forEach(row => {
      const values = columnNames.map(col => formatValue(row[col]));
      const insertSQL = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${values.join(', ')});`;
      insertStatements.push(insertSQL);
    });
    
    exportData.data[tableName] = {
      columns: columnNames,
      rowCount: rows.length,
      insertStatements: insertStatements
    };
    
    console.log(`  ✅ Exported ${rows.length} rows from ${tableName}`);
    
  } catch (error) {
    console.log(`  ❌ Error exporting ${tableName}:`, error.message);
    exportData.data[tableName] = { error: error.message };
  }
});

// Generate complete SQL script
console.log('\n📝 Generating complete SQL script...');

let completeSQL = `-- CoogMusic Database Export
-- Generated: ${new Date().toISOString()}
-- This script recreates the complete database with all data

-- Drop existing tables if they exist
DROP TABLE IF EXISTS listening_history;
DROP TABLE IF EXISTS playlist_song;
DROP TABLE IF EXISTS user_likes_playlist;
DROP TABLE IF EXISTS user_likes_album;
DROP TABLE IF EXISTS user_likes_song;
DROP TABLE IF EXISTS user_follows_artist;
DROP TABLE IF EXISTS playlist;
DROP TABLE IF EXISTS song;
DROP TABLE IF EXISTS album;
DROP TABLE IF EXISTS artist;
DROP TABLE IF EXISTS genre;
DROP TABLE IF EXISTS userprofile;

-- Create schema
${exportData.schema}

-- Insert data
`;

// Add data in dependency order
const insertOrder = [
  'userprofile',
  'artist',
  'genre', 
  'album',
  'song',
  'playlist',
  'user_follows_artist',
  'user_likes_song',
  'user_likes_album',
  'user_likes_playlist', 
  'playlist_song',
  'listening_history'
];

insertOrder.forEach(tableName => {
  if (exportData.data[tableName] && exportData.data[tableName].insertStatements) {
    completeSQL += `\n-- ${tableName} (${exportData.data[tableName].rowCount} rows)\n`;
    completeSQL += exportData.data[tableName].insertStatements.join('\n') + '\n';
  }
});

// Write complete SQL file
const sqlFilePath = path.join(__dirname, 'coogmusic_complete_export.sql');
fs.writeFileSync(sqlFilePath, completeSQL);

// Write JSON export for programmatic use
const jsonFilePath = path.join(__dirname, 'coogmusic_data_export.json');
fs.writeFileSync(jsonFilePath, JSON.stringify(exportData, null, 2));

// Generate summary
console.log('\n📊 Export Summary:');
console.log('==================');
Object.keys(exportData.data).forEach(tableName => {
  const tableData = exportData.data[tableName];
  if (tableData.error) {
    console.log(`❌ ${tableName}: ERROR - ${tableData.error}`);
  } else {
    console.log(`✅ ${tableName}: ${tableData.rowCount} rows`);
  }
});

console.log(`\n📁 Files created:`);
console.log(`  📄 ${sqlFilePath}`);
console.log(`  📄 ${jsonFilePath}`);

console.log('\n🚀 To recreate this database on another computer:');
console.log('1. Copy the SQL file to the target computer');
console.log('2. Run: sqlite3 new_database.db < coogmusic_complete_export.sql');
console.log('3. Or use the JSON file with a custom import script');

db.close();
console.log('\n✅ Database export completed!');
