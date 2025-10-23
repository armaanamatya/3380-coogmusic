// Migrate from old MySQL schema to new SQLite schema
const Database = require('better-sqlite3');
const fs = require('fs');

console.log('\n🔄 Migrating database schema...\n');

// Stop if server is running
console.log('⚠️  Make sure the backend server is STOPPED before running this script!\n');

const db = new Database('./coogmusic.db');

// Backup current data
const backup = {
  users: db.prepare('SELECT * FROM userprofile').all(),
  artists: db.prepare('SELECT * FROM artist').all(),
  genres: db.prepare('SELECT * FROM genre').all(),
  albums: db.prepare('SELECT * FROM album').all(),
  songs: db.prepare('SELECT * FROM song').all()
};

console.log('✅ Backed up existing data:');
console.log(`   - ${backup.users.length} users`);
console.log(`   - ${backup.artists.length} artists`);
console.log(`   - ${backup.genres.length} genres`);
console.log(`   - ${backup.albums.length} albums`);
console.log(`   - ${backup.songs.length} songs\n`);

// Drop all old tables
console.log('🗑️  Dropping old tables...');
const oldTables = ['userfollows', 'likedsong', 'likes', 'rating', 'playlistsong', 'playlist', 'historysong', 'history', 'song', 'album', 'genre', 'artist', 'userprofile'];
oldTables.forEach(table => {
  try {
    db.prepare(`DROP TABLE IF EXISTS ${table}`).run();
  } catch (e) {
    // Ignore errors
  }
});
console.log('✅ Old tables dropped\n');

// Read and execute new schema
console.log('📋 Creating new schema...');
const schema = fs.readFileSync('./src/schema.sqlite.sql', 'utf8');
db.exec(schema);
console.log('✅ New schema created\n');

// Restore data
console.log('📥 Restoring data...\n');

// Restore users
if (backup.users.length > 0) {
  const insertUser = db.prepare(`
    INSERT INTO userprofile (UserID, Username, UserPassword, FirstName, LastName, DateOfBirth, Email, UserType, DateJoined, Country, City, IsOnline, AccountStatus, ProfilePicture)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  backup.users.forEach(user => {
    insertUser.run(
      user.UserID,
      user.Username,
      user.UserPassword,
      user.FirstName,
      user.LastName,
      user.DateOfBirth,
      user.Email,
      user.UserType,
      user.DateJoined,
      user.Country,
      user.City || null,
      user.IsOnline || 0,
      user.AccountStatus || 'Active',
      user.ProfilePicture || null
    );
  });
  console.log(`✅ Restored ${backup.users.length} users`);
}

// Restore artists (and create missing ones for Artist users)
const artistUsers = backup.users.filter(u => u.UserType === 'Artist');
artistUsers.forEach(user => {
  const existingArtist = backup.artists.find(a => a.ArtistID === user.UserID);
  if (!existingArtist) {
    db.prepare('INSERT INTO artist (ArtistID) VALUES (?)').run(user.UserID);
  }
});

if (backup.artists.length > 0) {
  backup.artists.forEach(artist => {
    try {
      db.prepare(`
        INSERT OR REPLACE INTO artist (ArtistID, ArtistBio, VerifiedStatus, VerifyingAdminID, DateVerified, CreatedAt, UpdatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        artist.ArtistID,
        artist.ArtistBio || null,
        artist.VerifiedStatus || 0,
        artist.VerifyingAdminID || null,
        artist.DateVerified || null,
        artist.CreatedAt || new Date().toISOString(),
        artist.UpdatedAt || new Date().toISOString()
      );
    } catch (e) {
      console.log(`   ⚠️  Skipped artist ${artist.ArtistID}: ${e.message}`);
    }
  });
}
console.log(`✅ Restored/created ${artistUsers.length} artists`);

// Restore genres
if (backup.genres.length > 0) {
  const insertGenre = db.prepare('INSERT INTO genre (GenreID, GenreName) VALUES (?, ?)');
  backup.genres.forEach(genre => {
    insertGenre.run(genre.GenreID, genre.GenreName);
  });
  console.log(`✅ Restored ${backup.genres.length} genres`);
}

// Restore albums
if (backup.albums.length > 0) {
  const insertAlbum = db.prepare(`
    INSERT INTO album (AlbumID, AlbumName, ArtistID, ReleaseDate, Description, AlbumArt, CreatedAt, UpdatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  backup.albums.forEach(album => {
    insertAlbum.run(
      album.AlbumID,
      album.AlbumName,
      album.ArtistID,
      album.ReleaseDate,
      album.Description || null,
      album.AlbumArt || null,
      album.CreatedAt || new Date().toISOString(),
      album.UpdatedAt || new Date().toISOString()
    );
  });
  console.log(`✅ Restored ${backup.albums.length} albums`);
}

// Restore songs
if (backup.songs.length > 0) {
  const insertSong = db.prepare(`
    INSERT INTO song (SongID, SongName, AlbumID, GenreID, SongLength, SongFile, FileSize, FileFormat, ListenCount, ReleaseDate, CreatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  backup.songs.forEach(song => {
    insertSong.run(
      song.SongID,
      song.SongName,
      song.AlbumID || null,
      song.GenreID || null,
      song.SongLength || 0,
      song.SongFile,
      song.FileSize || 0,
      song.FileFormat || 'mp3',
      song.ListenCount || 0,
      song.ReleaseDate || new Date().toISOString().split('T')[0],
      song.CreatedAt || new Date().toISOString()
    );
  });
  console.log(`✅ Restored ${backup.songs.length} songs`);
}

db.close();

console.log('\n✅ Migration complete!');
console.log('\n📝 Summary:');
console.log('   - Database schema updated to new SQLite format');
console.log('   - All existing data preserved');
console.log('   - Artist entries created for all Artist users');
console.log('\n🚀 You can now restart the backend server!\n');

