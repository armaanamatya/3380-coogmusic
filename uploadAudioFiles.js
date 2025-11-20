#!/usr/bin/env node

/**
 * Batch Audio File Upload Script for CoogMusic
 * Uploads audio files from local directories to the database
 * Supports both current local file system and future Azure Blob Storage
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

// Database configuration (adjust as needed)
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'coogmusic',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
};

// Default artist and genre mappings (adjust based on your database)
const DEFAULT_ARTIST_ID = 1; // Make sure this artist exists in your database
const DEFAULT_GENRE_ID = 1; // Make sure this genre exists in your database

/**
 * Get file duration in seconds (mock implementation)
 * In production, you'd use a library like 'node-ffprobe' or 'music-metadata'
 */
function getFileDuration(filePath) {
  // For now, return a random duration between 180-300 seconds (3-5 minutes)
  return Math.floor(Math.random() * (300 - 180 + 1)) + 180;
}

/**
 * Extract song metadata from filename
 */
function extractSongMetadata(filename, directory) {
  const nameWithoutExt = path.parse(filename).name;
  
  // Clean up common filename patterns
  let songName = nameWithoutExt
    .replace(/^\d+\s*[-.]?\s*/, '') // Remove track numbers (e.g., "01 - ", "03 ")
    .replace(/\s*\[.*?\]\s*/, '') // Remove bracketed info
    .replace(/\s*\(.*?\)\s*/, '') // Remove parenthetical info (keep some)
    .trim();

  // Determine artist based on directory or filename patterns
  let artistName = 'Unknown Artist';
  if (directory.includes('C_James-Songs')) {
    artistName = 'C. James';
  } else if (directory.includes('B_Songs')) {
    artistName = 'Various Artists';
  }

  // Extract artist from filename if present
  if (songName.includes(' - ')) {
    const parts = songName.split(' - ');
    if (parts.length >= 2) {
      artistName = parts[0].trim();
      songName = parts.slice(1).join(' - ').trim();
    }
  }

  return {
    songName,
    artistName,
    originalFilename: filename
  };
}

/**
 * Copy file to uploads directory and return the relative path
 */
function copyToUploadsDirectory(sourcePath, filename) {
  const uploadsDir = path.join(__dirname, 'backend', 'uploads', 'music');
  
  // Ensure uploads directory exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const extension = path.extname(filename);
  const uniqueFilename = `audioFile-${timestamp}-${randomSuffix}${extension}`;
  
  const destinationPath = path.join(uploadsDir, uniqueFilename);
  
  // Copy file
  fs.copyFileSync(sourcePath, destinationPath);
  
  // Return relative path (as stored in database)
  return `/uploads/music/${uniqueFilename}`;
}

/**
 * Get or create artist in database
 */
async function getOrCreateArtist(pool, artistName) {
  try {
    // First try to find existing artist by name
    const [existingArtists] = await pool.execute(
      'SELECT a.ArtistID FROM artist a JOIN userprofile u ON a.ArtistID = u.UserID WHERE u.FirstName = ? OR u.LastName = ? OR CONCAT(u.FirstName, " ", u.LastName) = ?',
      [artistName, artistName, artistName]
    );

    if (existingArtists.length > 0) {
      return existingArtists[0].ArtistID;
    }

    // Create new user profile for artist
    const [userResult] = await pool.execute(
      `INSERT INTO userprofile (Username, UserPassword, FirstName, LastName, DateOfBirth, Email, UserType, Country) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        artistName.toLowerCase().replace(/\s+/g, ''),
        'temp_password', // Temporary password
        artistName.split(' ')[0] || artistName,
        artistName.split(' ').slice(1).join(' ') || '',
        '1990-01-01', // Default birth date
        `${artistName.toLowerCase().replace(/\s+/g, '')}@coogmusic.com`,
        'Artist',
        'United States'
      ]
    );

    const userId = userResult.insertId;

    // Create artist profile
    await pool.execute(
      'INSERT INTO artist (ArtistID, ArtistBio) VALUES (?, ?)',
      [userId, `Auto-generated profile for ${artistName}`]
    );

    console.log(`✓ Created new artist: ${artistName} (ID: ${userId})`);
    return userId;

  } catch (error) {
    console.warn(`Warning: Could not create artist "${artistName}", using default artist ID ${DEFAULT_ARTIST_ID}`);
    return DEFAULT_ARTIST_ID;
  }
}

/**
 * Upload a single audio file
 */
async function uploadAudioFile(pool, filePath, directory) {
  const filename = path.basename(filePath);
  const stats = fs.statSync(filePath);
  const fileSize = stats.size;
  
  console.log(`📁 Processing: ${filename}`);
  
  // Extract metadata
  const metadata = extractSongMetadata(filename, directory);
  console.log(`   Song: "${metadata.songName}" by ${metadata.artistName}`);
  
  // Copy file to uploads directory
  const relativeFilePath = copyToUploadsDirectory(filePath, filename);
  console.log(`   Copied to: ${relativeFilePath}`);
  
  // Get or create artist
  const artistId = await getOrCreateArtist(pool, metadata.artistName);
  
  // Get file duration
  const duration = getFileDuration(filePath);
  
  try {
    // Insert song into database
    const [result] = await pool.execute(
      `INSERT INTO song (SongName, ArtistID, AlbumID, GenreID, Duration, FilePath, FileSize, ReleaseDate)
       VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())`,
      [
        metadata.songName,
        artistId,
        null, // No album for now
        DEFAULT_GENRE_ID,
        duration,
        relativeFilePath,
        fileSize
      ]
    );
    
    const songId = result.insertId;
    console.log(`   ✅ Uploaded successfully (Song ID: ${songId})`);
    
    return {
      success: true,
      songId,
      songName: metadata.songName,
      artistName: metadata.artistName,
      filePath: relativeFilePath
    };
    
  } catch (error) {
    console.error(`   ❌ Database error: ${error.message}`);
    // Remove copied file if database insertion failed
    try {
      const fullPath = path.join(__dirname, 'backend', relativeFilePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    } catch (cleanupError) {
      console.error(`   ⚠️ Could not clean up file: ${cleanupError.message}`);
    }
    
    return {
      success: false,
      error: error.message,
      filename
    };
  }
}

/**
 * Main upload function
 */
async function uploadAllAudioFiles() {
  let pool;
  
  try {
    // Connect to database
    console.log('🔗 Connecting to database...');
    pool = await mysql.createPool(DB_CONFIG);
    await pool.execute('SELECT 1'); // Test connection
    console.log('✅ Database connected successfully');
    
    const results = {
      successful: [],
      failed: [],
      skipped: []
    };
    
    // Process each directory
    for (const directory of AUDIO_DIRECTORIES) {
      if (!fs.existsSync(directory)) {
        console.log(`⚠️ Directory not found: ${directory}`);
        continue;
      }
      
      console.log(`\n📂 Processing directory: ${directory}`);
      const files = fs.readdirSync(directory);
      
      for (const file of files) {
        const ext = path.extname(file).toLowerCase();
        const filePath = path.join(directory, file);
        
        // Skip unsupported formats
        if (!SUPPORTED_FORMATS.includes(ext)) {
          if (SKIP_FORMATS.includes(ext)) {
            console.log(`⏭️ Skipping DRM-protected file: ${file}`);
            results.skipped.push({ filename: file, reason: 'DRM-protected format' });
          } else {
            console.log(`⏭️ Skipping unsupported format: ${file}`);
            results.skipped.push({ filename: file, reason: 'Unsupported format' });
          }
          continue;
        }
        
        // Upload the file
        const result = await uploadAudioFile(pool, filePath, directory);
        
        if (result.success) {
          results.successful.push(result);
        } else {
          results.failed.push(result);
        }
      }
    }
    
    // Print summary
    console.log('\n📊 Upload Summary:');
    console.log(`✅ Successful uploads: ${results.successful.length}`);
    console.log(`❌ Failed uploads: ${results.failed.length}`);
    console.log(`⏭️ Skipped files: ${results.skipped.length}`);
    
    if (results.successful.length > 0) {
      console.log('\n🎵 Successfully uploaded songs:');
      results.successful.forEach((song, index) => {
        console.log(`   ${index + 1}. "${song.songName}" by ${song.artistName}`);
      });
    }
    
    if (results.failed.length > 0) {
      console.log('\n❌ Failed uploads:');
      results.failed.forEach((failure, index) => {
        console.log(`   ${index + 1}. ${failure.filename}: ${failure.error}`);
      });
    }
    
    if (results.skipped.length > 0) {
      console.log('\n⏭️ Skipped files:');
      results.skipped.forEach((skip, index) => {
        console.log(`   ${index + 1}. ${skip.filename}: ${skip.reason}`);
      });
    }
    
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

// Run the upload script
if (require.main === module) {
  console.log('🎵 CoogMusic Audio File Upload Script');
  console.log('=====================================\n');
  
  uploadAllAudioFiles().catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

module.exports = { uploadAllAudioFiles };