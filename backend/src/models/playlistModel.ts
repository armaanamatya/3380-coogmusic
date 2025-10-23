import { createPool } from '../database';

const pool = createPool();

export interface Playlist {
  playlistId: number;
  playlistName: string;
  userId: number;
  description?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewPlaylist {
  playlistName: string;
  userId: number;
  description?: string;
  isPublic?: boolean;
}

export interface UpdatePlaylist {
  playlistName?: string;
  description?: string;
  isPublic?: boolean;
}

export const validatePlaylistInput = (playlist: Partial<NewPlaylist>): string[] => {
  const errors: string[] = [];

  if (playlist.playlistName && playlist.playlistName.length < 1) {
    errors.push('Playlist name cannot be empty');
  }

  if (playlist.playlistName && playlist.playlistName.length > 100) {
    errors.push('Playlist name must be 100 characters or less');
  }

  if (playlist.description && playlist.description.length > 500) {
    errors.push('Description must be 500 characters or less');
  }

  return errors;
};

export const createPlaylist = async (playlist: NewPlaylist) => {
  const validationErrors = validatePlaylistInput(playlist);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  const sql = `
    INSERT INTO playlist (PlaylistName, UserID, Description, IsPublic)
    VALUES (?, ?, ?, ?);
  `;

  const values = [
    playlist.playlistName,
    playlist.userId,
    playlist.description || null,
    playlist.isPublic || false
  ];

  try {
    const [result] = await pool.query(sql, values);
    return result;
  } catch (error: any) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new Error('User does not exist');
    }
    throw error;
  }
};

export const getPlaylistById = async (playlistId: number) => {
  const sql = `
    SELECT p.*, u.Username, u.FirstName, u.LastName
    FROM playlist p
    JOIN userprofile u ON p.UserID = u.UserID
    WHERE p.PlaylistID = ?;
  `;
  const [rows] = await pool.query(sql, [playlistId]);
  return (rows as any[])[0];
};

export const getPlaylistsByUser = async (userId: number) => {
  const sql = `
    SELECT p.* FROM playlist p
    WHERE p.UserID = ?
    ORDER BY p.CreatedAt DESC;
  `;
  const [rows] = await pool.query(sql, [userId]);
  return rows;
};

export const getPublicPlaylists = async (limit?: number, offset?: number) => {
  let sql = `
    SELECT p.*, u.Username, u.FirstName, u.LastName
    FROM playlist p
    JOIN userprofile u ON p.UserID = u.UserID
    WHERE p.IsPublic = TRUE
    ORDER BY p.CreatedAt DESC
  `;
  
  if (limit) {
    sql += ` LIMIT ${limit}`;
    if (offset) {
      sql += ` OFFSET ${offset}`;
    }
  }
  
  const [rows] = await pool.query(sql);
  return rows;
};

export const updatePlaylist = async (playlistId: number, updates: UpdatePlaylist) => {
  const validationErrors = validatePlaylistInput(updates);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.playlistName !== undefined) {
    setClauses.push('PlaylistName = ?');
    params.push(updates.playlistName);
  }

  if (updates.description !== undefined) {
    setClauses.push('Description = ?');
    params.push(updates.description || null);
  }

  if (updates.isPublic !== undefined) {
    setClauses.push('IsPublic = ?');
    params.push(updates.isPublic);
  }

  if (setClauses.length === 0) {
    throw new Error('No valid fields provided to update.');
  }

  setClauses.push('UpdatedAt = CURRENT_TIMESTAMP');
  params.push(playlistId);

  const sql = `UPDATE playlist SET ${setClauses.join(', ')} WHERE PlaylistID = ?`;

  const [result] = await pool.query(sql, params);
  return result;
};

export const deletePlaylist = async (playlistId: number) => {
  const sql = `DELETE FROM playlist WHERE PlaylistID = ?`;
  const [result] = await pool.query(sql, [playlistId]);
  return result;
};

export const searchPlaylists = async (query: string, includePrivate: boolean = false) => {
  let sql = `
    SELECT p.*, u.Username, u.FirstName, u.LastName
    FROM playlist p
    JOIN userprofile u ON p.UserID = u.UserID
    WHERE (p.PlaylistName LIKE ? OR p.Description LIKE ? OR u.Username LIKE ?)
  `;
  
  if (!includePrivate) {
    sql += ` AND p.IsPublic = TRUE`;
  }
  
  sql += ` ORDER BY p.CreatedAt DESC`;
  
  const searchTerm = `%${query}%`;
  const [rows] = await pool.query(sql, [searchTerm, searchTerm, searchTerm]);
  return rows;
};

export const addSongToPlaylist = async (playlistId: number, songId: number, position?: number) => {
  // Get the next position if not provided
  if (position === undefined) {
    const positionSql = `SELECT MAX(Position) as maxPos FROM playlist_song WHERE PlaylistID = ?`;
    const [posRows] = await pool.query(positionSql, [playlistId]);
    position = ((posRows as any[])[0].maxPos || 0) + 1;
  }

  const sql = `
    INSERT INTO playlist_song (PlaylistID, SongID, Position)
    VALUES (?, ?, ?)
  `;
  
  try {
    const [result] = await pool.query(sql, [playlistId, songId, position]);
    return result;
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Song already exists in playlist');
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new Error('Playlist or song does not exist');
    }
    throw error;
  }
};

export const removeSongFromPlaylist = async (playlistId: number, songId: number) => {
  const sql = `DELETE FROM playlist_song WHERE PlaylistID = ? AND SongID = ?`;
  const [result] = await pool.query(sql, [playlistId, songId]);
  return result;
};

export const getPlaylistSongs = async (playlistId: number) => {
  const sql = `
    SELECT s.*, u.Username, u.FirstName, u.LastName, a.AlbumName, ps.Position, ps.AddedAt
    FROM playlist_song ps
    JOIN song s ON ps.SongID = s.SongID
    JOIN artist ar ON s.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    LEFT JOIN album a ON s.AlbumID = a.AlbumID
    WHERE ps.PlaylistID = ?
    ORDER BY ps.Position;
  `;
  
  const [rows] = await pool.query(sql, [playlistId]);
  return rows;
};

export const reorderPlaylistSongs = async (playlistId: number, songId: number, newPosition: number) => {
  const sql = `
    UPDATE playlist_song 
    SET Position = ? 
    WHERE PlaylistID = ? AND SongID = ?
  `;
  
  const [result] = await pool.query(sql, [newPosition, playlistId, songId]);
  return result;
};

export const getPlaylistWithSongs = async (playlistId: number) => {
  const playlistSql = `
    SELECT p.*, u.Username, u.FirstName, u.LastName
    FROM playlist p
    JOIN userprofile u ON p.UserID = u.UserID
    WHERE p.PlaylistID = ?;
  `;
  
  const songsSql = `
    SELECT s.*, u.Username, u.FirstName, u.LastName, a.AlbumName, ps.Position, ps.AddedAt
    FROM playlist_song ps
    JOIN song s ON ps.SongID = s.SongID
    JOIN artist ar ON s.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    LEFT JOIN album a ON s.AlbumID = a.AlbumID
    WHERE ps.PlaylistID = ?
    ORDER BY ps.Position;
  `;
  
  const [playlistRows] = await pool.query(playlistSql, [playlistId]);
  const [songRows] = await pool.query(songsSql, [playlistId]);
  
  const playlist = (playlistRows as any[])[0];
  if (playlist) {
    playlist.songs = songRows;
  }
  
  return playlist;
};

