import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const addProfilePictureColumn = async () => {
  try {
    const db = new Database('./coogmusic.db');
    
    // Check if ProfilePicture column already exists
    const tableInfo = db.prepare("PRAGMA table_info(user)").all();
    const hasProfilePictureColumn = tableInfo.some((column: any) => column.name === 'ProfilePicture');
    
    if (!hasProfilePictureColumn) {
      // Add ProfilePicture column
      db.prepare("ALTER TABLE user ADD COLUMN ProfilePicture VARCHAR(255)").run();
      console.log('ProfilePicture column added successfully');
    } else {
      console.log('ProfilePicture column already exists');
    }
    
    db.close();
  } catch (error) {
    console.error('Error adding ProfilePicture column:', error);
  }
};

addProfilePictureColumn();
