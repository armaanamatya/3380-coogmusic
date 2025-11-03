import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to add the trigger that automatically removes songs
 * from playlists and related tables when a song is deleted.
 * 
 * This script can be run on existing databases to add the trigger without
 * recreating the entire database.
 */

const addSongDeletionTrigger = async () => {
  try {
    const dbPath = process.env.DB_PATH || './coogmusic.db';
    console.log(`Connecting to database: ${dbPath}`);
    
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    
    // Check if trigger already exists
    const triggerExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='trigger' AND name='remove_song_from_playlists_on_delete'
    `).get();
    
    if (triggerExists) {
      console.log('Trigger "remove_song_from_playlists_on_delete" already exists. Skipping...');
      db.close();
      return;
    }
    
    // Create the trigger
    console.log('Creating trigger: remove_song_from_playlists_on_delete');
    
    db.exec(`
      CREATE TRIGGER remove_song_from_playlists_on_delete
      BEFORE DELETE ON song
      BEGIN
          -- Remove song from all playlists
          DELETE FROM playlist_song WHERE SongID = OLD.SongID;
          
          -- Remove all likes for this song (additional safety beyond CASCADE)
          DELETE FROM user_likes_song WHERE SongID = OLD.SongID;
          
          -- Remove from listening history (additional safety beyond CASCADE)
          DELETE FROM listening_history WHERE SongID = OLD.SongID;
          
          -- Note: Album relationship is handled automatically - when the song is deleted,
          -- it's no longer part of any album (since AlbumID is a reference field in the song table)
      END;
    `);
    
    console.log('✅ Trigger created successfully!');
    console.log('\nThis trigger will automatically:');
    console.log('  - Remove songs from all playlists when deleted');
    console.log('  - Remove all likes for the song when deleted');
    console.log('  - Remove the song from listening history when deleted');
    console.log('  - Note: Songs are automatically removed from albums (AlbumID is just a reference)');
    
    db.close();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

addSongDeletionTrigger();

