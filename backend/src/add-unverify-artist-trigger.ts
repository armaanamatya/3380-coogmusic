import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to add the trigger that automatically unverifies artists
 * when they drop below 100 followers.
 * 
 * This script can be run on existing databases to add the trigger without
 * recreating the entire database.
 */

const addUnverifyArtistTrigger = async () => {
  try {
    const dbPath = process.env.DB_PATH || './coogmusic.db';
    console.log(`Connecting to database: ${dbPath}`);
    
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    
    // Check if trigger already exists
    const triggerExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='trigger' AND name='unverify_artist_below_100_followers'
    `).get();
    
    if (triggerExists) {
      console.log('Trigger "unverify_artist_below_100_followers" already exists. Skipping...');
      db.close();
      return;
    }
    
    // Create the trigger
    console.log('Creating trigger: unverify_artist_below_100_followers');
    
    db.exec(`
      CREATE TRIGGER unverify_artist_below_100_followers
      AFTER DELETE ON user_follows_artist
      BEGIN
          UPDATE artist
          SET VerifiedStatus = 0,
              DateVerified = NULL,
              VerifyingAdminID = NULL,
              UpdatedAt = DATETIME('now')
          WHERE ArtistID = OLD.ArtistID
              AND VerifiedStatus = 1
              AND (
                  SELECT COUNT(*)
                  FROM user_follows_artist
                  WHERE ArtistID = OLD.ArtistID
              ) < 100;
      END;
    `);
    
    console.log('✅ Trigger created successfully!');
    
    // Optionally check for artists that should be unverified
    console.log('\nChecking for artists with < 100 followers that are still verified...');
    
    const artistsToUnverify = db.prepare(`
      SELECT a.ArtistID, COUNT(ufa.UserID) as follower_count
      FROM artist a
      LEFT JOIN user_follows_artist ufa ON a.ArtistID = ufa.ArtistID
      WHERE a.VerifiedStatus = 1
      GROUP BY a.ArtistID
      HAVING COUNT(ufa.UserID) < 100
    `).all();
    
    if (artistsToUnverify.length > 0) {
      console.log(`Found ${artistsToUnverify.length} artist(s) with < 100 followers that should be unverified:`);
      
      const updateStmt = db.prepare(`
        UPDATE artist
        SET VerifiedStatus = 0,
            DateVerified = NULL,
            VerifyingAdminID = NULL,
            UpdatedAt = DATETIME('now')
        WHERE ArtistID = ?
      `);
      
      for (const artist of artistsToUnverify as Array<{ ArtistID: number; follower_count: number }>) {
        updateStmt.run(artist.ArtistID);
        console.log(`  - Unverified ArtistID ${artist.ArtistID} (${artist.follower_count} followers)`);
      }
      
      console.log(`\n✅ Unverified ${artistsToUnverify.length} existing artist(s).`);
    } else {
      console.log('No existing artists found that need to be unverified.');
    }
    
    console.log('\nThis trigger will automatically:');
    console.log('  - Unverify artists when they drop below 100 followers');
    console.log('  - Clear DateVerified and VerifyingAdminID when unverifying');
    
    db.close();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

addUnverifyArtistTrigger();

