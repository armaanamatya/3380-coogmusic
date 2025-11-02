import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Like a song
export async function likeSong(pool: Pool, userId: number, songId: number): Promise<void> {
  // Verify user exists
  const [users] = await pool.execute<RowDataPacket[]>('SELECT UserID FROM userprofile WHERE UserID = ?', [userId]);
  if (users.length === 0) {
    throw new Error('User not found');
  }

  // Verify song exists
  const [songs] = await pool.execute<RowDataPacket[]>('SELECT SongID FROM song WHERE SongID = ?', [songId]);
  if (songs.length === 0) {
    throw new Error('Song not found');
  }

  // Check if already liked
  const [existingLikes] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM user_likes_song WHERE UserID = ? AND SongID = ?',
    [userId, songId]
  );
  if (existingLikes.length > 0) {
    throw new Error('User has already liked this song');
  }

  await pool.execute('INSERT INTO user_likes_song (UserID, SongID) VALUES (?, ?)', [userId, songId]);
}

// Unlike a song
export async function unlikeSong(pool: Pool, userId: number, songId: number): Promise<void> {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM user_likes_song WHERE UserID = ? AND SongID = ?',
    [userId, songId]
  );

  if (result.affectedRows === 0) {
    throw new Error('Like not found');
  }
}

// Like an album
export async function likeAlbum(pool: Pool, userId: number, albumId: number): Promise<void> {
  // Verify user exists
  const [users] = await pool.execute<RowDataPacket[]>('SELECT UserID FROM userprofile WHERE UserID = ?', [userId]);
  if (users.length === 0) {
    throw new Error('User not found');
  }

  // Verify album exists
  const [albums] = await pool.execute<RowDataPacket[]>('SELECT AlbumID FROM album WHERE AlbumID = ?', [albumId]);
  if (albums.length === 0) {
    throw new Error('Album not found');
  }

  // Check if already liked
  const [existingLikes] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM user_likes_album WHERE UserID = ? AND AlbumID = ?',
    [userId, albumId]
  );
  if (existingLikes.length > 0) {
    throw new Error('User has already liked this album');
  }

  await pool.execute('INSERT INTO user_likes_album (UserID, AlbumID) VALUES (?, ?)', [userId, albumId]);
}

// Unlike an album
export async function unlikeAlbum(pool: Pool, userId: number, albumId: number): Promise<void> {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM user_likes_album WHERE UserID = ? AND AlbumID = ?',
    [userId, albumId]
  );

  if (result.affectedRows === 0) {
    throw new Error('Like not found');
  }
}

// Like a playlist
export async function likePlaylist(pool: Pool, userId: number, playlistId: number): Promise<void> {
  // Verify user exists
  const [users] = await pool.execute<RowDataPacket[]>('SELECT UserID FROM userprofile WHERE UserID = ?', [userId]);
  if (users.length === 0) {
    throw new Error('User not found');
  }

  // Verify playlist exists
  const [playlists] = await pool.execute<RowDataPacket[]>('SELECT PlaylistID FROM playlist WHERE PlaylistID = ?', [playlistId]);
  if (playlists.length === 0) {
    throw new Error('Playlist not found');
  }

  // Check if already liked
  const [existingLikes] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM user_likes_playlist WHERE UserID = ? AND PlaylistID = ?',
    [userId, playlistId]
  );
  if (existingLikes.length > 0) {
    throw new Error('User has already liked this playlist');
  }

  await pool.execute('INSERT INTO user_likes_playlist (UserID, PlaylistID) VALUES (?, ?)', [userId, playlistId]);
}

// Unlike a playlist
export async function unlikePlaylist(pool: Pool, userId: number, playlistId: number): Promise<void> {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM user_likes_playlist WHERE UserID = ? AND PlaylistID = ?',
    [userId, playlistId]
  );

  if (result.affectedRows === 0) {
    throw new Error('Like not found');
  }
}

// Get user's liked songs
export async function getUserLikedSongs(
  pool: Pool,
  userId: number,
  filters: { page?: number; limit?: number }
): Promise<any[]> {
  const { page = 1, limit = 50 } = filters;

  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT s.*, uls.LikedAt,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           al.AlbumName, g.GenreName
    FROM user_likes_song uls
    JOIN song s ON uls.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON s.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE uls.UserID = ?
    ORDER BY uls.LikedAt DESC
    LIMIT ? OFFSET ?
  `, [userId, parseInt(String(limit), 10), parseInt(String((page - 1) * limit), 10)]);

  return rows;
}

// Get user's liked albums
export async function getUserLikedAlbums(
  pool: Pool,
  userId: number,
  filters: { page?: number; limit?: number }
): Promise<any[]> {
  const { page = 1, limit = 50 } = filters;

  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT a.*, ula.LikedAt,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName
    FROM user_likes_album ula
    JOIN album a ON ula.AlbumID = a.AlbumID
    LEFT JOIN artist ar ON a.ArtistID = ar.ArtistID
    LEFT JOIN userprofile up ON ar.ArtistID = up.UserID
    WHERE ula.UserID = ?
    ORDER BY ula.LikedAt DESC
    LIMIT ? OFFSET ?
  `, [userId, parseInt(String(limit), 10), parseInt(String((page - 1) * limit), 10)]);

  return rows;
}

// Get user's liked playlists
export async function getUserLikedPlaylists(
  pool: Pool,
  userId: number,
  filters: { page?: number; limit?: number }
): Promise<any[]> {
  const { page = 1, limit = 50 } = filters;

  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT p.*, ulp.LikedAt,
           up.Username, up.FirstName, up.LastName
    FROM user_likes_playlist ulp
    JOIN playlist p ON ulp.PlaylistID = p.PlaylistID
    JOIN userprofile up ON p.UserID = up.UserID
    WHERE ulp.UserID = ?
    ORDER BY ulp.LikedAt DESC
    LIMIT ? OFFSET ?
  `, [userId, parseInt(String(limit), 10), parseInt(String((page - 1) * limit), 10)]);

  return rows;
}

// Check if song is liked by user
export async function isSongLiked(pool: Pool, userId: number, songId: number): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT 1 FROM user_likes_song WHERE UserID = ? AND SongID = ?',
    [userId, songId]
  );
  return rows.length > 0;
}

// Check if album is liked by user
export async function isAlbumLiked(pool: Pool, userId: number, albumId: number): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT 1 FROM user_likes_album WHERE UserID = ? AND AlbumID = ?',
    [userId, albumId]
  );
  return rows.length > 0;
}

// Check if playlist is liked by user
export async function isPlaylistLiked(pool: Pool, userId: number, playlistId: number): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT 1 FROM user_likes_playlist WHERE UserID = ? AND PlaylistID = ?',
    [userId, playlistId]
  );
  return rows.length > 0;
}

// Get song like count
export async function getSongLikeCount(pool: Pool, songId: number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM user_likes_song WHERE SongID = ?',
    [songId]
  );
  const result = rows[0] as { count: number };
  return result.count;
}

// Get album like count
export async function getAlbumLikeCount(pool: Pool, albumId: number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM user_likes_album WHERE AlbumID = ?',
    [albumId]
  );
  const result = rows[0] as { count: number };
  return result.count;
}

// Get playlist like count
export async function getPlaylistLikeCount(pool: Pool, playlistId: number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM user_likes_playlist WHERE PlaylistID = ?',
    [playlistId]
  );
  const result = rows[0] as { count: number };
  return result.count;
}
