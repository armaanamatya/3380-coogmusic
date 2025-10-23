import { Database } from 'better-sqlite3';

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
export function createPlaylist(
  db: Database,
  playlistData: CreatePlaylistData
): { playlistId: number } {
  // Verify user exists
  const user = db.prepare('SELECT UserID FROM userprofile WHERE UserID = ?').get(playlistData.userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Insert new playlist
  const stmt = db.prepare(`
    INSERT INTO playlist (PlaylistName, UserID, Description, IsPublic)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(
    playlistData.playlistName,
    playlistData.userId,
    playlistData.description || null,
    playlistData.isPublic ? 1 : 0
  );

  return { playlistId: Number(result.lastInsertRowid) };
}

// Get playlist by ID
export function getPlaylistById(db: Database, playlistId: number): Playlist | null {
  const playlist = db.prepare(`
    SELECT p.*, u.Username, u.FirstName, u.LastName
    FROM playlist p
    JOIN userprofile u ON p.UserID = u.UserID
    WHERE p.PlaylistID = ?
  `).get(playlistId) as Playlist | undefined;

  return playlist || null;
}

// Get playlists by user
export function getPlaylistsByUser(
  db: Database,
  userId: number
): Playlist[] {
  return db.prepare(`
    SELECT p.*
    FROM playlist p
    WHERE p.UserID = ?
    ORDER BY p.CreatedAt DESC
  `).all(userId) as Playlist[];
}

// Get public playlists
export function getPublicPlaylists(
  db: Database,
  filters: { page?: number; limit?: number }
): Playlist[] {
  const { page = 1, limit = 50 } = filters;

  return db.prepare(`
    SELECT p.*, u.Username, u.FirstName, u.LastName
    FROM playlist p
    JOIN userprofile u ON p.UserID = u.UserID
    WHERE p.IsPublic = 1
    ORDER BY p.CreatedAt DESC
    LIMIT ? OFFSET ?
  `).all(limit, (page - 1) * limit) as Playlist[];
}

// Update playlist
export function updatePlaylist(
  db: Database,
  playlistId: number,
  updateData: UpdatePlaylistData
): void {
  // Check if playlist exists
  const existingPlaylist = db.prepare('SELECT * FROM playlist WHERE PlaylistID = ?').get(playlistId);
  if (!existingPlaylist) {
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

  db.prepare(updateQuery).run(...values);
}

// Delete playlist
export function deletePlaylist(db: Database, playlistId: number): void {
  const playlist = db.prepare('SELECT * FROM playlist WHERE PlaylistID = ?').get(playlistId);
  if (!playlist) {
    throw new Error('Playlist not found');
  }

  db.prepare('DELETE FROM playlist WHERE PlaylistID = ?').run(playlistId);
}

// Add song to playlist
export function addSongToPlaylist(
  db: Database,
  playlistId: number,
  songId: number,
  position?: number
): void {
  // Verify playlist exists
  const playlist = db.prepare('SELECT PlaylistID FROM playlist WHERE PlaylistID = ?').get(playlistId);
  if (!playlist) {
    throw new Error('Playlist not found');
  }

  // Verify song exists
  const song = db.prepare('SELECT SongID FROM song WHERE SongID = ?').get(songId);
  if (!song) {
    throw new Error('Song not found');
  }

  // Check if song already in playlist
  const existingEntry = db.prepare('SELECT * FROM playlist_song WHERE PlaylistID = ? AND SongID = ?')
    .get(playlistId, songId);
  if (existingEntry) {
    throw new Error('Song already exists in playlist');
  }

  // Get next position if not provided
  if (position === undefined) {
    const maxPos = db.prepare('SELECT MAX(Position) as maxPos FROM playlist_song WHERE PlaylistID = ?')
      .get(playlistId) as { maxPos: number | null };
    position = (maxPos.maxPos || 0) + 1;
  }

  db.prepare(`
    INSERT INTO playlist_song (PlaylistID, SongID, Position)
    VALUES (?, ?, ?)
  `).run(playlistId, songId, position);
}

// Remove song from playlist
export function removeSongFromPlaylist(
  db: Database,
  playlistId: number,
  songId: number
): void {
  const result = db.prepare('DELETE FROM playlist_song WHERE PlaylistID = ? AND SongID = ?')
    .run(playlistId, songId);

  if (result.changes === 0) {
    throw new Error('Song not found in playlist');
  }
}

// Get songs in playlist
export function getPlaylistSongs(db: Database, playlistId: number): any[] {
  return db.prepare(`
    SELECT s.*, ps.Position, ps.AddedAt,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           al.AlbumName, g.GenreName
    FROM playlist_song ps
    JOIN song s ON ps.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON al.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE ps.PlaylistID = ?
    ORDER BY ps.Position
  `).all(playlistId);
}

// Reorder song in playlist
export function reorderPlaylistSong(
  db: Database,
  playlistId: number,
  songId: number,
  newPosition: number
): void {
  const result = db.prepare(`
    UPDATE playlist_song 
    SET Position = ? 
    WHERE PlaylistID = ? AND SongID = ?
  `).run(newPosition, playlistId, songId);

  if (result.changes === 0) {
    throw new Error('Song not found in playlist');
  }
}

