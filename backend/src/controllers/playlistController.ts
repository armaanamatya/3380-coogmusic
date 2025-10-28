import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface Playlist {
  PlaylistID: number;
  PlaylistName: string;
  UserID: number;
  Description: string | null;
  IsPublic: number;
  CreatedAt: string;
  UpdatedAt: string;
}

export interface CreatePlaylistData {
  playlistName: string;
  userId: number;
  description?: string;
  isPublic?: boolean;
}

export interface UpdatePlaylistData {
  PlaylistName?: string;
  Description?: string;
  IsPublic?: number;
}

// Create new playlist
export async function createPlaylist(
  pool: Pool,
  playlistData: CreatePlaylistData
): Promise<{ playlistId: number }> {
  // Verify user exists
  const [users] = await pool.execute<RowDataPacket[]>(
    'SELECT UserID FROM userprofile WHERE UserID = ?', 
    [playlistData.userId]
  );
  if (users.length === 0) {
    throw new Error('User not found');
  }

  // Insert new playlist
  const [result] = await pool.execute<ResultSetHeader>(`
    INSERT INTO playlist (PlaylistName, UserID, Description, IsPublic)
    VALUES (?, ?, ?, ?)
  `, [
    playlistData.playlistName,
    playlistData.userId,
    playlistData.description || null,
    playlistData.isPublic ? 1 : 0
  ]);

  return { playlistId: result.insertId };
}

// Get playlist by ID
export async function getPlaylistById(pool: Pool, playlistId: number): Promise<Playlist | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT p.*, u.Username, u.FirstName, u.LastName
    FROM playlist p
    JOIN userprofile u ON p.UserID = u.UserID
    WHERE p.PlaylistID = ?
  `, [playlistId]);

  return rows.length > 0 ? (rows[0] as Playlist) : null;
}

// Get playlists by user
export async function getPlaylistsByUser(
  pool: Pool,
  userId: number
): Promise<Playlist[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT p.*
    FROM playlist p
    WHERE p.UserID = ?
    ORDER BY p.CreatedAt DESC
  `, [userId]);
  
  return rows as Playlist[];
}

// Get public playlists
export async function getPublicPlaylists(
  pool: Pool,
  filters: { page?: number; limit?: number }
): Promise<Playlist[]> {
  const { page = 1, limit = 50 } = filters;

  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT p.*, u.Username, u.FirstName, u.LastName
    FROM playlist p
    JOIN userprofile u ON p.UserID = u.UserID
    WHERE p.IsPublic = 1
    ORDER BY p.CreatedAt DESC
    LIMIT ? OFFSET ?
  `, [limit, (page - 1) * limit]);
  
  return rows as Playlist[];
}

// Update playlist
export async function updatePlaylist(
  pool: Pool,
  playlistId: number,
  updateData: UpdatePlaylistData
): Promise<void> {
  // Check if playlist exists
  const [existingPlaylists] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM playlist WHERE PlaylistID = ?', 
    [playlistId]
  );
  if (existingPlaylists.length === 0) {
    throw new Error('Playlist not found');
  }

  // Build update query dynamically
  const allowedFields = ['PlaylistName', 'Description', 'IsPublic'];
  const updates: string[] = [];
  const values: any[] = [];

  allowedFields.forEach((field) => {
    if (updateData[field as keyof UpdatePlaylistData] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(updateData[field as keyof UpdatePlaylistData]);
    }
  });

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(playlistId);
  const updateQuery = `UPDATE playlist SET ${updates.join(', ')} WHERE PlaylistID = ?`;

  await pool.execute(updateQuery, values);
}

// Delete playlist
export async function deletePlaylist(pool: Pool, playlistId: number): Promise<void> {
  const [playlists] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM playlist WHERE PlaylistID = ?', 
    [playlistId]
  );
  if (playlists.length === 0) {
    throw new Error('Playlist not found');
  }

  await pool.execute('DELETE FROM playlist WHERE PlaylistID = ?', [playlistId]);
}

// Add song to playlist
export async function addSongToPlaylist(
  pool: Pool,
  playlistId: number,
  songId: number,
  position?: number
): Promise<void> {
  // Verify playlist exists
  const [playlists] = await pool.execute<RowDataPacket[]>(
    'SELECT PlaylistID FROM playlist WHERE PlaylistID = ?', 
    [playlistId]
  );
  if (playlists.length === 0) {
    throw new Error('Playlist not found');
  }

  // Verify song exists
  const [songs] = await pool.execute<RowDataPacket[]>(
    'SELECT SongID FROM song WHERE SongID = ?', 
    [songId]
  );
  if (songs.length === 0) {
    throw new Error('Song not found');
  }

  // Check if song already in playlist
  const [existingEntries] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM playlist_song WHERE PlaylistID = ? AND SongID = ?',
    [playlistId, songId]
  );
  if (existingEntries.length > 0) {
    throw new Error('Song already exists in playlist');
  }

  // Get next position if not provided
  if (position === undefined) {
    const [maxPosRows] = await pool.execute<RowDataPacket[]>(
      'SELECT MAX(Position) as maxPos FROM playlist_song WHERE PlaylistID = ?',
      [playlistId]
    );
    const maxPos = maxPosRows[0] as { maxPos: number | null };
    position = (maxPos.maxPos || 0) + 1;
  }

  await pool.execute(`
    INSERT INTO playlist_song (PlaylistID, SongID, Position)
    VALUES (?, ?, ?)
  `, [playlistId, songId, position]);
}

// Remove song from playlist
export async function removeSongFromPlaylist(
  pool: Pool,
  playlistId: number,
  songId: number
): Promise<void> {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM playlist_song WHERE PlaylistID = ? AND SongID = ?',
    [playlistId, songId]
  );

  if (result.affectedRows === 0) {
    throw new Error('Song not found in playlist');
  }
}

// Get songs in playlist
export async function getPlaylistSongs(pool: Pool, playlistId: number): Promise<any[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT s.*, ps.Position, ps.AddedAt,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           al.AlbumName, g.GenreName
    FROM playlist_song ps
    JOIN song s ON ps.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON s.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE ps.PlaylistID = ?
    ORDER BY ps.Position
  `, [playlistId]);
  
  return rows;
}

// Reorder song in playlist
export async function reorderPlaylistSong(
  pool: Pool,
  playlistId: number,
  songId: number,
  newPosition: number
): Promise<void> {
  const [result] = await pool.execute<ResultSetHeader>(`
    UPDATE playlist_song 
    SET Position = ? 
    WHERE PlaylistID = ? AND SongID = ?
  `, [newPosition, playlistId, songId]);

  if (result.affectedRows === 0) {
    throw new Error('Song not found in playlist');
  }
}

// Get top playlists by like count (only public playlists)
export async function getTopPlaylistsByLikes(pool: Pool, limit: number = 10): Promise<any[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT 
      p.PlaylistID,
      p.PlaylistName,
      p.Description,
      p.IsPublic,
      p.CreatedAt,
      COUNT(ulp.UserID) as likeCount,
      u.FirstName AS CreatorFirstName,
      u.LastName AS CreatorLastName,
      u.Username AS CreatorUsername,
      COUNT(DISTINCT ps.SongID) as songCount
    FROM playlist p
    JOIN userprofile u ON p.UserID = u.UserID
    LEFT JOIN user_likes_playlist ulp ON p.PlaylistID = ulp.PlaylistID
    LEFT JOIN playlist_song ps ON p.PlaylistID = ps.PlaylistID
    WHERE p.IsPublic = 1
    GROUP BY p.PlaylistID, p.PlaylistName, p.Description, p.IsPublic, p.CreatedAt, u.FirstName, u.LastName, u.Username
    ORDER BY likeCount DESC
    LIMIT ?
  `, [limit]);
  
  return rows;
}
