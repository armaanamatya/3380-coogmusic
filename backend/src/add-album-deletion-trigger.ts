import Database from 'better-sqlite3';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Migration script to add the trigger that automatically deletes all songs
 * in an album when the album is deleted.
 * 
 * This script can be run on existing databases to add the trigger without
 * recreating the entire database.
 */

const addAlbumDeletionTrigger = async () => {
  try {
    const dbPath = process.env.DB_PATH || './coogmusic.db';
    console.log(`Connecting to database: ${dbPath}`);
    
    const db = new Database(dbPath);
    db.pragma('foreign_keys = ON');
    
    // Check if trigger already exists
    const triggerExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='trigger' AND name='delete_songs_on_album_delete'
    `).get();
    
    if (triggerExists) {
      console.log('Trigger "delete_songs_on_album_delete" already exists. Skipping...');
      db.close();
      return;
    }
    
    // Create the trigger
    console.log('Creating trigger: delete_songs_on_album_delete');
    
    db.exec(`
      CREATE TRIGGER delete_songs_on_album_delete
      BEFORE DELETE ON album
      BEGIN
          -- Delete all songs that belong to this album
          -- This trigger will cascade and also trigger the remove_song_from_playlists_on_delete
          -- for each song, ensuring all related data is cleaned up
          DELETE FROM song WHERE AlbumID = OLD.AlbumID;
      END;
    `);
    
    console.log('✅ Trigger created successfully!');
    console.log('\nThis trigger will automatically:');
    console.log('  - Delete all songs in an album when the album is deleted');
    console.log('  - The song deletion will trigger cleanup of playlists, likes, and history');
    
    db.close();
    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

addAlbumDeletionTrigger();

