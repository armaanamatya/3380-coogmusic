#!/usr/bin/env node

/**
 * Simple Database Update Script - Link existing audio files to songs
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const DB_CONFIG = {
  host: 'coogmusic-mysql.mysql.database.azure.com',
  user: 'coogmusic_admin',
  password: 'yeet123$',
  database: 'coogmusic',
  ssl: { rejectUnauthorized: false }
};

async function updateDatabaseWithAudioFiles() {
  let pool;
  
  try {
    console.log('🎵 CoogMusic Database Audio Update Script');
    console.log('=========================================\n');
    
    // Connect to database
    console.log('🔗 Connecting to Azure MySQL database...');
    pool = await mysql.createPool(DB_CONFIG);
    await pool.execute('SELECT 1'); // Test connection
    console.log('✅ Database connected successfully');
    
    // Get all audio files
    const uploadsDir = path.join(__dirname, 'backend', 'uploads', 'music');
    const audioFiles = fs.readdirSync(uploadsDir)
      .filter(file => ['.mp3', '.wav', '.flac', '.m4a', '.aac'].includes(path.extname(file).toLowerCase()))
      .map(file => ({
        filename: file,
        relativePath: `/uploads/music/${file}`,
        fileSize: fs.statSync(path.join(uploadsDir, file)).size
      }));
    
    console.log(`📁 Found ${audioFiles.length} audio files in uploads directory`);
    
    // Get all songs
    const [songs] = await pool.execute('SELECT SongID, SongName FROM song ORDER BY SongID');
    console.log(`🎵 Found ${songs.length} songs in database`);
    
    if (songs.length === 0) {
      throw new Error('No songs found in database');
    }
    
    // Update songs with audio files
    console.log('\n🔄 Updating song records with audio files...');
    
    let updateCount = 0;
    
    for (let i = 0; i < songs.length; i++) {
      const song = songs[i];
      const fileIndex = i % audioFiles.length; // Distribute files evenly
      const audioFile = audioFiles[fileIndex];
      
      try {
        await pool.execute(
          'UPDATE song SET FilePath = ?, FileSize = ? WHERE SongID = ?',
          [audioFile.relativePath, audioFile.fileSize, song.SongID]
        );
        
        updateCount++;
        
        if (i < 10 || i % 20 === 0) { // Show first 10 and every 20th update
          console.log(`   ${i + 1}/${songs.length}: "${song.SongName}" → ${audioFile.filename}`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to update Song ID ${song.SongID}: ${error.message}`);
      }
    }
    
    console.log(`\n📊 Database Update Summary:`);
    console.log(`========================`);
    console.log(`🎵 Total songs: ${songs.length}`);
    console.log(`📁 Audio files available: ${audioFiles.length}`);
    console.log(`✅ Songs updated: ${updateCount}`);
    console.log(`🔄 Each audio file used ~${Math.ceil(songs.length / audioFiles.length)} times`);
    
    // Test a few updated records
    console.log('\n🧪 Testing updated records:');
    const [testSongs] = await pool.execute(
      'SELECT SongID, SongName, FilePath, FileSize FROM song WHERE FilePath IS NOT NULL LIMIT 5'
    );
    
    testSongs.forEach((song, index) => {
      console.log(`   ${index + 1}. "${song.SongName}" → ${song.FilePath} (${(song.FileSize / 1024 / 1024).toFixed(2)} MB)`);
    });
    
    console.log('\n🎉 Database update completed successfully!');
    console.log('🚀 Your songs now have real audio files attached!');
    console.log('\n📋 Next steps:');
    console.log('   1. Test locally: Start backend and visit http://localhost:3001/api/songs');
    console.log('   2. Deploy to Render: git add . && git commit && git push');
    console.log('   3. Verify streaming: Test audio playback on your deployed app');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('\n🔚 Database connection closed');
    }
  }
}

// Run the script
updateDatabaseWithAudioFiles().catch(error => {
  console.error('💥 Unhandled error:', error);
  process.exit(1);
});