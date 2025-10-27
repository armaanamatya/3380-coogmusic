// Import database data from exported files
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  // Path to the exported SQL file
  sqlFile: './coogmusic_complete_export.sql',
  // Path to the new database file
  newDbPath: './coogmusic_imported.db',
  // Whether to backup existing database
  backupExisting: true
};

console.log('📥 Importing database data...\n');

// Check if SQL file exists
if (!fs.existsSync(config.sqlFile)) {
  console.error(`❌ SQL file not found: ${config.sqlFile}`);
  console.log('Please ensure the exported SQL file is in the same directory.');
  process.exit(1);
}

// Backup existing database if it exists
if (fs.existsSync(config.newDbPath) && config.backupExisting) {
  const backupPath = `${config.newDbPath}.backup.${Date.now()}`;
  fs.copyFileSync(config.newDbPath, backupPath);
  console.log(`📦 Backed up existing database to: ${backupPath}`);
}

// Create new database
console.log(`🗄️  Creating new database: ${config.newDbPath}`);
const db = new Database(config.newDbPath);

try {
  // Read and execute SQL file
  console.log('📖 Reading SQL file...');
  const sqlContent = fs.readFileSync(config.sqlFile, 'utf8');
  
  console.log('⚡ Executing SQL statements...');
  
  // Disable foreign key constraints temporarily
  console.log('🔧 Disabling foreign key constraints...');
  db.exec('PRAGMA foreign_keys = OFF');
  
  // Split by semicolon and execute each statement
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
  
  let executedCount = 0;
  let errorCount = 0;
  
  statements.forEach((statement, index) => {
    try {
      if (statement.trim()) {
        db.exec(statement);
        executedCount++;
        
        // Log progress for large imports
        if (executedCount % 1000 === 0) {
          console.log(`  📊 Executed ${executedCount} statements...`);
        }
      }
    } catch (error) {
      errorCount++;
      if (errorCount <= 10) { // Only show first 10 errors to avoid spam
        console.log(`  ⚠️  Error in statement ${index + 1}: ${error.message}`);
      } else if (errorCount === 11) {
        console.log(`  ⚠️  ... and ${errorCount - 10} more errors (suppressing output)`);
      }
      // Continue with other statements
    }
  });
  
  // Re-enable foreign key constraints
  console.log('🔧 Re-enabling foreign key constraints...');
  db.exec('PRAGMA foreign_keys = ON');
  
  console.log(`\n📊 Import Summary:`);
  console.log(`  ✅ Statements executed: ${executedCount}`);
  console.log(`  ❌ Errors encountered: ${errorCount}`);
  
  // Verify import by checking table counts
  console.log('\n🔍 Verifying import...');
  
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
  
  tables.forEach(tableName => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get();
      console.log(`  📋 ${tableName}: ${count.count} rows`);
    } catch (error) {
      console.log(`  ❌ ${tableName}: Error - ${error.message}`);
    }
  });
  
  // Test some key queries
  console.log('\n🧪 Testing key functionality...');
  
  try {
    // Test genres with listen counts
    const genreTest = db.prepare(`
      SELECT 
        g.GenreName,
        COUNT(DISTINCT s.SongID) as songCount,
        COALESCE(SUM(s.ListenCount), 0) as totalListens
      FROM genre g
      LEFT JOIN song s ON g.GenreID = s.GenreID
      GROUP BY g.GenreID, g.GenreName
      ORDER BY totalListens DESC
      LIMIT 3
    `).all();
    
    console.log('  🎵 Top genres by listen count:');
    genreTest.forEach(genre => {
      console.log(`    ${genre.GenreName}: ${genre.songCount} songs, ${genre.totalListens} listens`);
    });
    
    // Test playlists with like counts
    const playlistTest = db.prepare(`
      SELECT 
        p.PlaylistName,
        COUNT(DISTINCT ps.SongID) as songCount,
        COUNT(DISTINCT ulp.UserID) as likeCount
      FROM playlist p
      LEFT JOIN playlist_song ps ON p.PlaylistID = ps.PlaylistID
      LEFT JOIN user_likes_playlist ulp ON p.PlaylistID = ulp.PlaylistID
      WHERE p.IsPublic = 1
      GROUP BY p.PlaylistID, p.PlaylistName
      ORDER BY likeCount DESC
      LIMIT 3
    `).all();
    
    console.log('  📋 Top playlists by like count:');
    playlistTest.forEach(playlist => {
      console.log(`    ${playlist.PlaylistName}: ${playlist.songCount} songs, ${playlist.likeCount} likes`);
    });
    
  } catch (error) {
    console.log(`  ⚠️  Error testing functionality: ${error.message}`);
  }
  
  console.log(`\n✅ Database import completed successfully!`);
  console.log(`📁 New database created: ${config.newDbPath}`);
  console.log(`\n🚀 To use this database:`);
  console.log(`1. Copy ${config.newDbPath} to your backend directory`);
  console.log(`2. Rename it to coogmusic.db`);
  console.log(`3. Start your backend server`);
  
} catch (error) {
  console.error(`❌ Import failed: ${error.message}`);
  process.exit(1);
} finally {
  db.close();
}
