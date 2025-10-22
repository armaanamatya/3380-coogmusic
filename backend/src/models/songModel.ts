import { createPool } from '../database';

const pool = createPool();

export interface Song {
  songId: number;
  songName: string;
  artistId: number;
  albumId?: number;
  genreId?: number;
  duration: number;
  listenCount: number;
  filePath: string;
  fileSize: number;
  releaseDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewSong {
  songName: string;
  artistId: number;
  albumId?: number;
  genreId?: number;
  duration: number;
  filePath: string;
  fileSize: number;
  releaseDate: Date;
}

export interface UpdateSong {
  songName?: string;
  albumId?: number;
  genreId?: number;
  duration?: number;
  filePath?: string;
  fileSize?: number;
  releaseDate?: Date;
}

export const validateSongInput = (song: Partial<NewSong>): string[] => {
  const errors: string[] = [];

  if (song.songName && song.songName.length < 1) {
    errors.push('Song name cannot be empty');
  }

  if (song.songName && song.songName.length > 100) {
    errors.push('Song name must be 100 characters or less');
  }

  if (song.duration && song.duration < 1) {
    errors.push('Duration must be at least 1 second');
  }

  if (song.duration && song.duration > 3600) {
    errors.push('Duration cannot exceed 1 hour');
  }

  if (song.filePath && song.filePath.length > 500) {
    errors.push('File path must be 500 characters or less');
  }

  if (song.fileSize && song.fileSize < 0) {
    errors.push('File size cannot be negative');
  }

  if (song.fileSize && song.fileSize > 100 * 1024 * 1024) {
    errors.push('File size cannot exceed 100MB');
  }

  if (song.releaseDate && song.releaseDate > new Date()) {
    errors.push('Release date cannot be in the future');
  }

  if (song.releaseDate && song.releaseDate < new Date('1900-01-01')) {
    errors.push('Release date cannot be before 1900');
  }

  return errors;
};

export const createSong = async (song: NewSong) => {
  const validationErrors = validateSongInput(song);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  const sql = `
    INSERT INTO song (SongName, ArtistID, AlbumID, GenreID, Duration, ListenCount, FilePath, FileSize, ReleaseDate)
    VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?);
  `;

  const values = [
    song.songName,
    song.artistId,
    song.albumId || null,
    song.genreId || null,
    song.duration,
    song.filePath,
    song.fileSize,
    song.releaseDate.toISOString().slice(0, 10)
  ];

  try {
    const [result] = await pool.query(sql, values);
    return result;
  } catch (error: any) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new Error('Artist or album does not exist');
    }
    throw error;
  }
};

export const getSongById = async (songId: number) => {
  const sql = `
    SELECT s.*, u.Username, u.FirstName, u.LastName, a.AlbumName, g.GenreName
    FROM song s
    JOIN artist ar ON s.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    LEFT JOIN album a ON s.AlbumID = a.AlbumID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE s.SongID = ?;
  `;
  const [rows] = await pool.query(sql, [songId]);
  return (rows as any[])[0];
};

export const getSongsByArtist = async (artistId: number) => {
  const sql = `
    SELECT s.*, a.AlbumName, g.GenreName
    FROM song s
    LEFT JOIN album a ON s.AlbumID = a.AlbumID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE s.ArtistID = ?
    ORDER BY s.ReleaseDate DESC;
  `;
  const [rows] = await pool.query(sql, [artistId]);
  return rows;
};


export const getSongsByAlbum = async (albumId: number) => {
  const sql = `
    SELECT s.*, g.GenreName FROM song s
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE s.AlbumID = ?
    ORDER BY s.SongName;
  `;
  const [rows] = await pool.query(sql, [albumId]);
  return rows;
};

export const getAllSongs = async (limit?: number, offset?: number) => {
  let sql = `
    SELECT s.*, u.Username, u.FirstName, u.LastName, a.AlbumName, g.GenreName
    FROM song s
    JOIN artist ar ON s.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    LEFT JOIN album a ON s.AlbumID = a.AlbumID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    ORDER BY s.ReleaseDate DESC
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

export const updateSong = async (songId: number, updates: UpdateSong) => {
  const validationErrors = validateSongInput(updates);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.songName !== undefined) {
    setClauses.push('SongName = ?');
    params.push(updates.songName);
  }

  if (updates.albumId !== undefined) {
    setClauses.push('AlbumID = ?');
    params.push(updates.albumId || null);
  }

  if (updates.genreId !== undefined) {
    setClauses.push('GenreID = ?');
    params.push(updates.genreId || null);
  }

  if (updates.duration !== undefined) {
    setClauses.push('Duration = ?');
    params.push(updates.duration);
  }

  if (updates.filePath !== undefined) {
    setClauses.push('FilePath = ?');
    params.push(updates.filePath);
  }

  if (updates.fileSize !== undefined) {
    setClauses.push('FileSize = ?');
    params.push(updates.fileSize);
  }

  if (updates.releaseDate !== undefined) {
    setClauses.push('ReleaseDate = ?');
    params.push(updates.releaseDate.toISOString().slice(0, 10));
  }

  if (setClauses.length === 0) {
    throw new Error('No valid fields provided to update.');
  }

  setClauses.push('UpdatedAt = CURRENT_TIMESTAMP');
  params.push(songId);

  const sql = `UPDATE song SET ${setClauses.join(', ')} WHERE SongID = ?`;

  const [result] = await pool.query(sql, params);
  return result;
};

export const deleteSong = async (songId: number) => {
  const sql = `DELETE FROM song WHERE SongID = ?`;
  const [result] = await pool.query(sql, [songId]);
  return result;
};

export const searchSongs = async (query: string) => {
  const sql = `
    SELECT s.*, u.Username, u.FirstName, u.LastName, a.AlbumName, g.GenreName
    FROM song s
    JOIN artist ar ON s.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    LEFT JOIN album a ON s.AlbumID = a.AlbumID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE s.SongName LIKE ? OR u.Username LIKE ? OR a.AlbumName LIKE ? OR g.GenreName LIKE ?
    ORDER BY s.ReleaseDate DESC;
  `;
  
  const searchTerm = `%${query}%`;
  const [rows] = await pool.query(sql, [searchTerm, searchTerm, searchTerm, searchTerm]);
  return rows;
};

export const getSongWithGenre = async (songId: number) => {
  const sql = `
    SELECT s.*, u.Username, u.FirstName, u.LastName, a.AlbumName, g.GenreName, g.Description as GenreDescription
    FROM song s
    JOIN artist ar ON s.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    LEFT JOIN album a ON s.AlbumID = a.AlbumID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE s.SongID = ?;
  `;
  
  const [rows] = await pool.query(sql, [songId]);
  return (rows as any[])[0];
};

export const getSongsByGenre = async (genreId: number) => {
  const sql = `
    SELECT s.*, u.Username, u.FirstName, u.LastName, a.AlbumName, g.GenreName
    FROM song s
    JOIN artist ar ON s.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    LEFT JOIN album a ON s.AlbumID = a.AlbumID
    JOIN genre g ON s.GenreID = g.GenreID
    WHERE s.GenreID = ?
    ORDER BY s.ReleaseDate DESC;
  `;
  
  const [rows] = await pool.query(sql, [genreId]);
  return rows;
};

export const incrementListenCount = async (songId: number) => {
  const sql = `UPDATE song SET ListenCount = ListenCount + 1 WHERE SongID = ?`;
  const [result] = await pool.query(sql, [songId]);
  return result;
};

export const getPopularSongs = async (limit: number = 10) => {
  const sql = `
    SELECT s.*, u.Username, u.FirstName, u.LastName, a.AlbumName, g.GenreName,
           COUNT(ul.UserID) as likeCount
    FROM song s
    JOIN artist ar ON s.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    LEFT JOIN album a ON s.AlbumID = a.AlbumID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    LEFT JOIN user_likes_song ul ON s.SongID = ul.SongID
    GROUP BY s.SongID
    ORDER BY likeCount DESC, s.ReleaseDate DESC
    LIMIT ?;
  `;
  
  const [rows] = await pool.query(sql, [limit]);
  return rows;
};
