import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

/**
 * Migration script to add the trigger that automatically verifies artists
 * when they reach 100 followers.
 * 
 * This script can be run on existing databases to add the trigger without
 * recreating the entire database.
 */

const addVerifyArtistTrigger = async () => {
  try {
    const dbPath = process.env.DB_PATH || './coogmusic.db';
    console.log(`Connecting to database: ${dbPath}`);
    
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    
    // Check if trigger already exists
    const triggerExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='trigger' AND name='verify_artist_on_100_followers'
    `).get();
    
    if (triggerExists) {
      console.log('Trigger "verify_artist_on_100_followers" already exists. Skipping...');
      db.close();
      return;
    }
    
    // Create the trigger
    console.log('Creating trigger: verify_artist_on_100_followers');
    
    db.exec(`
      CREATE TRIGGER verify_artist_on_100_followers
      AFTER INSERT ON user_follows_artist
      BEGIN
          UPDATE artist
          SET VerifiedStatus = 1,
              DateVerified = DATETIME('now'),
              UpdatedAt = DATETIME('now')
          WHERE ArtistID = NEW.ArtistID
              AND VerifiedStatus = 0
              AND (
                  SELECT COUNT(*)
                  FROM user_follows_artist
                  WHERE ArtistID = NEW.ArtistID
              ) >= 100;
      END;
    `);
    
    console.log('✅ Trigger created successfully!');
    
    // Optionally verify artists that already have 100+ followers
    console.log('\nChecking for existing artists with 100+ followers that need verification...');
    
    const artistsToVerify = db.prepare(`
      SELECT a.ArtistID, COUNT(ufa.UserID) as follower_count
      FROM artist a
      LEFT JOIN user_follows_artist ufa ON a.ArtistID = ufa.ArtistID
      WHERE a.VerifiedStatus = 0
      GROUP BY a.ArtistID
      HAVING COUNT(ufa.UserID) >= 100
    `).all();
    
    if (artistsToVerify.length > 0) {
      console.log(`Found ${artistsToVerify.length} artist(s) with 100+ followers that need verification:`);
      
      const updateStmt = db.prepare(`
        UPDATE artist
        SET VerifiedStatus = 1,
            DateVerified = DATETIME('now'),
            UpdatedAt = DATETIME('now')
        WHERE ArtistID = ?
      `);
      
      for (const artist of artistsToVerify as Array<{ ArtistID: number; follower_count: number }>) {
        updateStmt.run(artist.ArtistID);
        console.log(`  - Verified ArtistID ${artist.ArtistID} (${artist.follower_count} followers)`);
      }
      
      console.log(`\n✅ Verified ${artistsToVerify.length} existing artist(s).`);
    } else {
      console.log('No existing artists found that need verification.');
    }
    
    db.close();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

addVerifyArtistTrigger();

