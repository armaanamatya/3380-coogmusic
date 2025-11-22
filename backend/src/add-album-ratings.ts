/**
 * Azure Database Migration Script: Add Album Ratings
 * 
 * This script adds album rating functionality to the existing database:
 * - Adds AverageRating and TotalRatings columns to album table
 * - Creates album_ratings table
 * - Creates triggers for automatic rating statistics updates
 * 
 * Usage: tsx add-album-ratings.ts
 */

import { getPool } from './database.js';

async function addAlbumRatings() {
  let pool;
  
  try {
    console.log('🔗 Connecting to database...');
    pool = await getPool();
    
    // Check if album_ratings table already exists
    console.log('📋 Checking if album_ratings table exists...');
    const [tableCheck] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'album_ratings'
    `);
    
    const tableExists = (tableCheck as any[])[0].count > 0;
    
    if (tableExists) {
      console.log('⚠️  album_ratings table already exists. Skipping migration.');
      return;
    }

    console.log('🔧 Starting album ratings migration...');

    // Step 1: Add AverageRating and TotalRatings columns to album table
    console.log('📝 Adding AverageRating and TotalRatings columns to album table...');
    
    try {
      await pool.execute(`
        ALTER TABLE album 
        ADD COLUMN AverageRating DECIMAL(3,2) DEFAULT 0.00,
        ADD COLUMN TotalRatings INT DEFAULT 0
      `);
      console.log('✅ Successfully added rating columns to album table');
    } catch (error: any) {
      if (error.message.includes('Duplicate column name')) {
        console.log('⚠️  Rating columns already exist in album table');
      } else {
        throw error;
      }
    }

    // Step 2: Create album_ratings table
    console.log('📝 Creating album_ratings table...');
    await pool.execute(`
      CREATE TABLE album_ratings (
        UserID INT NOT NULL,
        AlbumID INT NOT NULL,
        Rating TINYINT NOT NULL CHECK (Rating >= 1 AND Rating <= 5),
        RatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (UserID, AlbumID),
        FOREIGN KEY (UserID) REFERENCES userprofile(UserID) ON DELETE CASCADE,
        FOREIGN KEY (AlbumID) REFERENCES album(AlbumID) ON DELETE CASCADE,
        INDEX idx_album_ratings_user (UserID),
        INDEX idx_album_ratings_album (AlbumID),
        INDEX idx_album_ratings_rating (Rating)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅ Successfully created album_ratings table');

    // Step 3: Create triggers for automatic rating statistics updates
    console.log('📝 Creating triggers for album rating statistics...');
    
    // Create after INSERT trigger
    await pool.execute(`
      CREATE TRIGGER after_album_rating_insert
      AFTER INSERT ON album_ratings
      FOR EACH ROW
      BEGIN
        UPDATE album 
        SET 
          TotalRatings = (SELECT COUNT(*) FROM album_ratings WHERE AlbumID = NEW.AlbumID),
          AverageRating = (SELECT AVG(Rating) FROM album_ratings WHERE AlbumID = NEW.AlbumID)
        WHERE AlbumID = NEW.AlbumID;
      END
    `);

    // Create after UPDATE trigger
    await pool.execute(`
      CREATE TRIGGER after_album_rating_update
      AFTER UPDATE ON album_ratings
      FOR EACH ROW
      BEGIN
        UPDATE album 
        SET 
          TotalRatings = (SELECT COUNT(*) FROM album_ratings WHERE AlbumID = NEW.AlbumID),
          AverageRating = (SELECT AVG(Rating) FROM album_ratings WHERE AlbumID = NEW.AlbumID)
        WHERE AlbumID = NEW.AlbumID;
      END
    `);

    // Create after DELETE trigger
    await pool.execute(`
      CREATE TRIGGER after_album_rating_delete
      AFTER DELETE ON album_ratings
      FOR EACH ROW
      BEGIN
        UPDATE album 
        SET 
          TotalRatings = (SELECT COUNT(*) FROM album_ratings WHERE AlbumID = OLD.AlbumID),
          AverageRating = COALESCE((SELECT AVG(Rating) FROM album_ratings WHERE AlbumID = OLD.AlbumID), 0.00)
        WHERE AlbumID = OLD.AlbumID;
      END
    `);

    console.log('✅ Successfully created album rating triggers');

    // Step 4: Initialize rating statistics for existing albums
    console.log('📝 Initializing rating statistics for existing albums...');
    await pool.execute(`
      UPDATE album 
      SET AverageRating = 0.00, TotalRatings = 0
    `);
    console.log('✅ Successfully initialized album rating statistics');

    console.log('🎉 Album ratings migration completed successfully!');
    
    // Display summary
    const [albumCount] = await pool.execute('SELECT COUNT(*) as count FROM album');
    console.log(`📊 Migration summary:`);
    console.log(`   - Album ratings table created`);
    console.log(`   - ${(albumCount as any[])[0].count} existing albums initialized with default ratings`);
    console.log(`   - Database triggers created for automatic rating updates`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

// Run migration if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  addAlbumRatings()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Migration error:', error);
      process.exit(1);
    });
}

export { addAlbumRatings };