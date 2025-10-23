import { Database } from 'better-sqlite3';

// Like a song
export function likeSong(db: Database, userId: number, songId: number): void {
  // Verify user exists
  const user = db.prepare('SELECT UserID FROM userprofile WHERE UserID = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify song exists
  const song = db.prepare('SELECT SongID FROM song WHERE SongID = ?').get(songId);
  if (!song) {
    throw new Error('Song not found');
  }

  // Check if already liked
  const existingLike = db.prepare('SELECT * FROM user_likes_song WHERE UserID = ? AND SongID = ?')
    .get(userId, songId);
  if (existingLike) {
    throw new Error('User has already liked this song');
  }

  db.prepare('INSERT INTO user_likes_song (UserID, SongID) VALUES (?, ?)').run(userId, songId);
}

// Unlike a song
export function unlikeSong(db: Database, userId: number, songId: number): void {
  const result = db.prepare('DELETE FROM user_likes_song WHERE UserID = ? AND SongID = ?')
    .run(userId, songId);

  if (result.changes === 0) {
    throw new Error('Like not found');
  }
}

// Like an album
export function likeAlbum(db: Database, userId: number, albumId: number): void {
  // Verify user exists
  const user = db.prepare('SELECT UserID FROM userprofile WHERE UserID = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify album exists
  const album = db.prepare('SELECT AlbumID FROM album WHERE AlbumID = ?').get(albumId);
  if (!album) {
    throw new Error('Album not found');
  }

  // Check if already liked
  const existingLike = db.prepare('SELECT * FROM user_likes_album WHERE UserID = ? AND AlbumID = ?')
    .get(userId, albumId);
  if (existingLike) {
    throw new Error('User has already liked this album');
  }

  db.prepare('INSERT INTO user_likes_album (UserID, AlbumID) VALUES (?, ?)').run(userId, albumId);
}

// Unlike an album
export function unlikeAlbum(db: Database, userId: number, albumId: number): void {
  const result = db.prepare('DELETE FROM user_likes_album WHERE UserID = ? AND AlbumID = ?')
    .run(userId, albumId);

  if (result.changes === 0) {
    throw new Error('Like not found');
  }
}

// Like a playlist
export function likePlaylist(db: Database, userId: number, playlistId: number): void {
  // Verify user exists
  const user = db.prepare('SELECT UserID FROM userprofile WHERE UserID = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify playlist exists
  const playlist = db.prepare('SELECT PlaylistID FROM playlist WHERE PlaylistID = ?').get(playlistId);
  if (!playlist) {
    throw new Error('Playlist not found');
  }

  // Check if already liked
  const existingLike = db.prepare('SELECT * FROM user_likes_playlist WHERE UserID = ? AND PlaylistID = ?')
    .get(userId, playlistId);
  if (existingLike) {
    throw new Error('User has already liked this playlist');
  }

  db.prepare('INSERT INTO user_likes_playlist (UserID, PlaylistID) VALUES (?, ?)').run(userId, playlistId);
}

// Unlike a playlist
export function unlikePlaylist(db: Database, userId: number, playlistId: number): void {
  const result = db.prepare('DELETE FROM user_likes_playlist WHERE UserID = ? AND PlaylistID = ?')
    .run(userId, playlistId);

  if (result.changes === 0) {
    throw new Error('Like not found');
  }
}

// Get user's liked songs
export function getUserLikedSongs(
  db: Database,
  userId: number,
  filters: { page?: number; limit?: number }
): any[] {
  const { page = 1, limit = 50 } = filters;

  return db.prepare(`
    SELECT s.*, uls.LikedAt,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           al.AlbumName, g.GenreName
    FROM user_likes_song uls
    JOIN song s ON uls.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON al.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE uls.UserID = ?
    ORDER BY uls.LikedAt DESC
    LIMIT ? OFFSET ?
  `).all(userId, limit, (page - 1) * limit);
}

// Get user's liked albums
export function getUserLikedAlbums(
  db: Database,
  userId: number,
  filters: { page?: number; limit?: number }
): any[] {
  const { page = 1, limit = 50 } = filters;

  return db.prepare(`
    SELECT a.*, ula.LikedAt,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName
    FROM user_likes_album ula
    JOIN album a ON ula.AlbumID = a.AlbumID
    LEFT JOIN artist ar ON a.ArtistID = ar.ArtistID
    LEFT JOIN userprofile up ON ar.ArtistID = up.UserID
    WHERE ula.UserID = ?
    ORDER BY ula.LikedAt DESC
    LIMIT ? OFFSET ?
  `).all(userId, limit, (page - 1) * limit);
}

// Get user's liked playlists
export function getUserLikedPlaylists(
  db: Database,
  userId: number,
  filters: { page?: number; limit?: number }
): any[] {
  const { page = 1, limit = 50 } = filters;

  return db.prepare(`
    SELECT p.*, ulp.LikedAt,
           up.Username, up.FirstName, up.LastName
    FROM user_likes_playlist ulp
    JOIN playlist p ON ulp.PlaylistID = p.PlaylistID
    JOIN userprofile up ON p.UserID = up.UserID
    WHERE ulp.UserID = ?
    ORDER BY ulp.LikedAt DESC
    LIMIT ? OFFSET ?
  `).all(userId, limit, (page - 1) * limit);
}

// Check if song is liked by user
export function isSongLiked(db: Database, userId: number, songId: number): boolean {
  const like = db.prepare('SELECT 1 FROM user_likes_song WHERE UserID = ? AND SongID = ?')
    .get(userId, songId);
  return !!like;
}

// Check if album is liked by user
export function isAlbumLiked(db: Database, userId: number, albumId: number): boolean {
  const like = db.prepare('SELECT 1 FROM user_likes_album WHERE UserID = ? AND AlbumID = ?')
    .get(userId, albumId);
  return !!like;
}

// Check if playlist is liked by user
export function isPlaylistLiked(db: Database, userId: number, playlistId: number): boolean {
  const like = db.prepare('SELECT 1 FROM user_likes_playlist WHERE UserID = ? AND PlaylistID = ?')
    .get(userId, playlistId);
  return !!like;
}

// Get song like count
export function getSongLikeCount(db: Database, songId: number): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM user_likes_song WHERE SongID = ?')
    .get(songId) as { count: number };
  return result.count;
}

// Get album like count
export function getAlbumLikeCount(db: Database, albumId: number): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM user_likes_album WHERE AlbumID = ?')
    .get(albumId) as { count: number };
  return result.count;
}

// Get playlist like count
export function getPlaylistLikeCount(db: Database, playlistId: number): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM user_likes_playlist WHERE PlaylistID = ?')
    .get(playlistId) as { count: number };
  return result.count;
}

