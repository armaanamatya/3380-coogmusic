import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to add the trigger that automatically adds songs to
 * a "Hit Songs" playlist when they reach 1 million listens.
 * 
 * This script can be run on existing databases to add the trigger without
 * recreating the entire database.
 */

const addHitSongsTrigger = async () => {
  try {
    const dbPath = process.env.DB_PATH || './coogmusic.db';
    console.log(`Connecting to database: ${dbPath}`);
    
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    
    // Check if trigger already exists
    const triggerExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='trigger' AND name='add_to_hit_songs_on_million_listens'
    `).get();
    
    if (triggerExists) {
      console.log('Trigger "add_to_hit_songs_on_million_listens" already exists. Skipping...');
      db.close();
      return;
    }
    
    // Create the trigger
    console.log('Creating trigger: add_to_hit_songs_on_million_listens');
    
    db.exec(`
      CREATE TRIGGER add_to_hit_songs_on_million_listens
      AFTER UPDATE OF ListenCount ON song
      WHEN NEW.ListenCount >= 1000000 AND (OLD.ListenCount IS NULL OR OLD.ListenCount < 1000000)
      BEGIN
          -- Ensure "Hit Songs" playlist exists
          -- Create it if it doesn't exist, using an Administrator user or first user
          INSERT INTO playlist (PlaylistName, UserID, Description, IsPublic, CreatedAt, UpdatedAt)
          SELECT 
              'Hit Songs',
              COALESCE(
                  (SELECT UserID FROM userprofile WHERE UserType = 'Administrator' LIMIT 1),
                  (SELECT UserID FROM userprofile ORDER BY UserID LIMIT 1)
              ),
              'Automatically curated playlist of songs with over 1 million listens',
              1,
              DATETIME('now'),
              DATETIME('now')
          WHERE NOT EXISTS (
              SELECT 1 FROM playlist 
              WHERE PlaylistName = 'Hit Songs' AND IsPublic = 1
          );
          
          -- Add the song to the "Hit Songs" playlist if not already there
          INSERT OR IGNORE INTO playlist_song (PlaylistID, SongID, Position, AddedAt)
          SELECT 
              (SELECT PlaylistID FROM playlist WHERE PlaylistName = 'Hit Songs' AND IsPublic = 1 LIMIT 1),
              NEW.SongID,
              COALESCE(
                  (SELECT MAX(Position) + 1 FROM playlist_song 
                   WHERE PlaylistID = (SELECT PlaylistID FROM playlist WHERE PlaylistName = 'Hit Songs' AND IsPublic = 1 LIMIT 1)),
                  1
              ),
              DATETIME('now')
          WHERE EXISTS (
              SELECT 1 FROM playlist 
              WHERE PlaylistName = 'Hit Songs' AND IsPublic = 1
          );
      END;
    `);
    
    console.log('✅ Trigger created successfully!');
    
    // Optionally check for existing songs with 1M+ listens and add them to the playlist
    console.log('\nChecking for existing songs with 1M+ listens...');
    
    // First, ensure "Hit Songs" playlist exists
    const adminUser = db.prepare(`
      SELECT UserID FROM userprofile WHERE UserType = 'Administrator' LIMIT 1
    `).get() as { UserID: number } | undefined;
    
    const firstUser = db.prepare(`
      SELECT UserID FROM userprofile ORDER BY UserID LIMIT 1
    `).get() as { UserID: number } | undefined;
    
    const ownerId = adminUser?.UserID || firstUser?.UserID;
    
    if (ownerId) {
      // Create "Hit Songs" playlist if it doesn't exist
      db.prepare(`
        INSERT OR IGNORE INTO playlist (PlaylistName, UserID, Description, IsPublic, CreatedAt, UpdatedAt)
        VALUES ('Hit Songs', ?, 'Automatically curated playlist of songs with over 1 million listens', 1, DATETIME('now'), DATETIME('now'))
      `).run(ownerId);
      
      const hitSongsPlaylist = db.prepare(`
        SELECT PlaylistID FROM playlist WHERE PlaylistName = 'Hit Songs' AND IsPublic = 1 LIMIT 1
      `).get() as { PlaylistID: number } | undefined;
      
      if (hitSongsPlaylist) {
        const songsWith1M = db.prepare(`
          SELECT SongID FROM song WHERE ListenCount >= 1000000
        `).all() as Array<{ SongID: number }>;
        
        if (songsWith1M.length > 0) {
          console.log(`Found ${songsWith1M.length} existing song(s) with 1M+ listens`);
          
          let maxPosition = db.prepare(`
            SELECT COALESCE(MAX(Position), 0) as maxPos FROM playlist_song 
            WHERE PlaylistID = ?
          `).get(hitSongsPlaylist.PlaylistID) as { maxPos: number } | undefined;
          
          let currentPosition = (maxPosition?.maxPos || 0) + 1;
          
          const insertStmt = db.prepare(`
            INSERT OR IGNORE INTO playlist_song (PlaylistID, SongID, Position, AddedAt)
            VALUES (?, ?, ?, DATETIME('now'))
          `);
          
          for (const song of songsWith1M) {
            insertStmt.run(hitSongsPlaylist.PlaylistID, song.SongID, currentPosition);
            currentPosition++;
          }
          
          console.log(`✅ Added ${songsWith1M.length} existing hit song(s) to the playlist.`);
        } else {
          console.log('No existing songs found with 1M+ listens.');
        }
      }
    }
    
    console.log('\nThis trigger will automatically:');
    console.log('  - Add songs to "Hit Songs" playlist when they reach 1 million listens');
    console.log('  - Create the "Hit Songs" playlist if it doesn\'t exist');
    console.log('  - Use an Administrator user as the playlist owner (or first user if no admin exists)');
    
    db.close();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

addHitSongsTrigger();

