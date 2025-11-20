#!/usr/bin/env node

/**
 * Audio File Distribution Script for CoogMusic
 * Distributes 19 audio files across ALL existing song records
 * Ensures Azure deployment compatibility
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Configuration
const AUDIO_DIRECTORIES = [
  'C:/Users/armaa/OneDrive/Desktop/3380-coogmusic/C_James-Songs',
  'C:/Users/armaa/OneDrive/Desktop/3380-coogmusic/B_Songs'
];

const SUPPORTED_FORMATS = ['.mp3', '.wav', '.flac', '.m4a', '.aac'];
const SKIP_FORMATS = ['.m4p']; // DRM protected files

// Database configuration
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'coogmusic',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

/**
 * Get all audio files from the source directories
 */
function getAllAudioFiles() {
  const audioFiles = [];
  
  for (const directory of AUDIO_DIRECTORIES) {
    if (!fs.existsSync(directory)) {
      console.log(`⚠️ Directory not found: ${directory}`);
      continue;
    }
    
    const files = fs.readdirSync(directory);
    
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();
      const filePath = path.join(directory, file);
      
      if (SUPPORTED_FORMATS.includes(ext)) {
        audioFiles.push({
          originalPath: filePath,
          filename: file,
          extension: ext,
          directory: directory
        });
      } else if (SKIP_FORMATS.includes(ext)) {
        console.log(`⏭️ Skipping DRM-protected file: ${file}`);
      } else {
        console.log(`⏭️ Skipping unsupported format: ${file}`);
      }
    }
  }
  
  return audioFiles;
}

/**
 * Copy audio files to uploads directory with proper naming
 */
function copyAudioFilesToUploads(audioFiles) {
  const uploadsDir = path.join(__dirname, 'backend', 'uploads', 'music');
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log(`📁 Created uploads directory: ${uploadsDir}`);
  }
  
  const copiedFiles = [];
  
  for (let i = 0; i < audioFiles.length; i++) {
    const audioFile = audioFiles[i];
    const timestamp = Date.now() + i; // Ensure unique timestamps
    const randomSuffix = Math.floor(Math.random() * 1000000);
    const uniqueFilename = `audioFile-${timestamp}-${randomSuffix}${audioFile.extension}`;
    
    const destinationPath = path.join(uploadsDir, uniqueFilename);
    const relativePath = `/uploads/music/${uniqueFilename}`;
    
    try {
      // Copy file
      fs.copyFileSync(audioFile.originalPath, destinationPath);
      
      // Get file size
      const stats = fs.statSync(destinationPath);
      const fileSize = stats.size;
      
      copiedFiles.push({
        originalFilename: audioFile.filename,
        uniqueFilename: uniqueFilename,
        relativePath: relativePath,
        fullPath: destinationPath,
        fileSize: fileSize,
        extension: audioFile.extension
      });
      
      console.log(`✅ Copied: ${audioFile.filename} → ${uniqueFilename}`);
      
    } catch (error) {
      console.error(`❌ Failed to copy ${audioFile.filename}: ${error.message}`);
    }
  }
  
  return copiedFiles;
}

/**
 * Update all song records with distributed audio files
 */
async function updateSongRecords(pool, copiedFiles) {
  if (copiedFiles.length === 0) {
    throw new Error('No audio files were copied successfully');
  }
  
  console.log(`\n🔄 Updating song records with ${copiedFiles.length} audio files...`);
  
  // Get all existing song records
  const [songs] = await pool.execute('SELECT SongID, SongName FROM song ORDER BY SongID');
  console.log(`📊 Found ${songs.length} existing song records`);
  
  if (songs.length === 0) {
    throw new Error('No song records found in database');
  }
  
  const updateResults = {
    successful: 0,
    failed: 0,
    errors: []
  };
  
  // Distribute audio files across all songs
  for (let i = 0; i < songs.length; i++) {
    const song = songs[i];
    
    // Use modulo to distribute files evenly
    const fileIndex = i % copiedFiles.length;
    const assignedFile = copiedFiles[fileIndex];
    
    try {
      // Update song record
      await pool.execute(
        'UPDATE song SET FilePath = ?, FileSize = ? WHERE SongID = ?',
        [assignedFile.relativePath, assignedFile.fileSize, song.SongID]
      );
      
      updateResults.successful++;
      
      if (i < 10 || i % 50 === 0) { // Show first 10 and every 50th update
        console.log(`   ${i + 1}/${songs.length}: "${song.SongName}" → ${assignedFile.uniqueFilename}`);
      }
      
    } catch (error) {
      updateResults.failed++;
      updateResults.errors.push({
        songId: song.SongID,
        songName: song.SongName,
        error: error.message
      });
      console.error(`❌ Failed to update Song ID ${song.SongID}: ${error.message}`);
    }
  }
  
  return updateResults;
}

/**
 * Verify file serving functionality
 */
async function verifyFileServing(copiedFiles) {
  console.log('\n🔍 Verifying file serving setup...');
  
  const uploadsDir = path.join(__dirname, 'backend', 'uploads', 'music');
  
  for (const file of copiedFiles) {
    const exists = fs.existsSync(file.fullPath);
    console.log(`   ${exists ? '✅' : '❌'} ${file.relativePath} (${(file.fileSize / 1024 / 1024).toFixed(2)} MB)`);
  }
  
  console.log(`\n📁 All files are in: ${uploadsDir}`);
  console.log('🌐 Files will be served via: http://your-domain.com/uploads/music/filename');
  console.log('☁️ For Azure deployment, files are served through the backend HTTP routes');
}

/**
 * Display distribution summary
 */
function displayDistributionSummary(copiedFiles, updateResults, totalSongs) {
  console.log('\n📊 Distribution Summary:');
  console.log('========================');
  console.log(`🎵 Audio files copied: ${copiedFiles.length}`);
  console.log(`📀 Song records updated: ${updateResults.successful}`);
  console.log(`❌ Failed updates: ${updateResults.failed}`);
  console.log(`🔄 Files per song: Each audio file used ~${Math.ceil(totalSongs / copiedFiles.length)} times`);
  
  console.log('\n🎧 File Distribution:');
  copiedFiles.forEach((file, index) => {
    const timesUsed = Math.floor(totalSongs / copiedFiles.length) + (index < (totalSongs % copiedFiles.length) ? 1 : 0);
    console.log(`   ${index + 1}. ${file.originalFilename} → Used ${timesUsed} times`);
  });
  
  if (updateResults.errors.length > 0) {
    console.log('\n❌ Errors encountered:');
    updateResults.errors.forEach((error, index) => {
      console.log(`   ${index + 1}. Song "${error.songName}" (ID: ${error.songId}): ${error.error}`);
    });
  }
}

/**
 * Main distribution function
 */
async function distributeAudioFiles() {
  let pool;
  
  try {
    console.log('🎵 CoogMusic Audio File Distribution Script');
    console.log('==========================================\n');
    
    // Step 1: Get all audio files
    console.log('📂 Scanning audio directories...');
    const audioFiles = getAllAudioFiles();
    console.log(`✅ Found ${audioFiles.length} audio files to distribute`);
    
    if (audioFiles.length === 0) {
      throw new Error('No supported audio files found in the specified directories');
    }
    
    // Step 2: Copy files to uploads directory
    console.log('\n📁 Copying files to uploads directory...');
    const copiedFiles = copyAudioFilesToUploads(audioFiles);
    
    if (copiedFiles.length === 0) {
      throw new Error('Failed to copy any audio files');
    }
    
    // Step 3: Connect to database
    console.log('\n🔗 Connecting to database...');
    pool = await mysql.createPool(DB_CONFIG);
    await pool.execute('SELECT 1'); // Test connection
    console.log('✅ Database connected successfully');
    
    // Step 4: Update song records
    const updateResults = await updateSongRecords(pool, copiedFiles);
    
    // Step 5: Verify file serving
    await verifyFileServing(copiedFiles);
    
    // Step 6: Display summary
    displayDistributionSummary(copiedFiles, updateResults, updateResults.successful + updateResults.failed);
    
    console.log('\n🎉 Audio file distribution completed successfully!');
    console.log('🚀 Your CoogMusic app now has real audio files for streaming!');
    console.log('\n📋 Next steps for Azure deployment:');
    console.log('   1. Test streaming locally: npm run dev (in backend folder)');
    console.log('   2. Deploy to production: git push to trigger deployment');
    console.log('   3. Files will be served via your backend URL/uploads/music/filename');
    console.log('   4. Consider Azure Blob Storage migration for better global performance');
    
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('\n🔚 Database connection closed');
    }
  }
}

// Run the distribution script
if (require.main === module) {
  distributeAudioFiles().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { distributeAudioFiles };