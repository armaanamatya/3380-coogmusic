import { createPool } from '../database';

const pool = createPool();

export interface Album {
  albumId: number;
  albumName: string;
  artistId: number;
  releaseDate: Date;
  albumCover?: Buffer;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewAlbum {
  albumName: string;
  artistId: number;
  releaseDate: Date;
  albumCover?: Buffer;
  description?: string;
}

export interface UpdateAlbum {
  albumName?: string;
  releaseDate?: Date;
  albumCover?: Buffer;
  description?: string;
}

export const validateAlbumInput = (album: Partial<NewAlbum>): string[] => {
  const errors: string[] = [];

  if (album.albumName && album.albumName.length < 1) {
    errors.push('Album name cannot be empty');
  }

  if (album.albumName && album.albumName.length > 100) {
    errors.push('Album name must be 100 characters or less');
  }

  if (album.releaseDate && album.releaseDate > new Date()) {
    errors.push('Release date cannot be in the future');
  }

  if (album.releaseDate && album.releaseDate < new Date('1900-01-01')) {
    errors.push('Release date cannot be before 1900');
  }

  if (album.albumCover && album.albumCover.length > 15 * 1024 * 1024) {
    errors.push('Album cover must be less than 15MB');
  }

  if (album.description && album.description.length > 1000) {
    errors.push('Description must be 1000 characters or less');
  }

  return errors;
};

export const createAlbum = async (album: NewAlbum) => {
  const validationErrors = validateAlbumInput(album);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  const sql = `
    INSERT INTO album (AlbumName, ArtistID, ReleaseDate, AlbumCover, Description)
    VALUES (?, ?, ?, ?, ?);
  `;

  const values = [
    album.albumName,
    album.artistId,
    album.releaseDate.toISOString().slice(0, 10),
    album.albumCover || null,
    album.description || null
  ];

  try {
    const [result] = await pool.query(sql, values);
    return result;
  } catch (error: any) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new Error('Artist does not exist');
    }
    throw error;
  }
};

export const getAlbumById = async (albumId: number) => {
  const sql = `
    SELECT a.*, u.Username, u.FirstName, u.LastName
    FROM album a
    JOIN artist ar ON a.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    WHERE a.AlbumID = ?;
  `;
  const [rows] = await pool.query(sql, [albumId]);
  return (rows as any[])[0];
};

export const getAlbumByName = async (albumName: string) => {
    const sql = `
      SELECT a.*, u.Username, u.FirstName, u.LastName
      FROM album a
      JOIN artist ar ON a.ArtistID = ar.ArtistID
      JOIN userprofile u ON ar.ArtistID = u.UserID
      WHERE a.AlbumName = ?;
    `;
    const [rows] = await pool.query(sql, [albumName]);
    return (rows as any[])[0];
  };

export const getAlbumsByArtist = async (artistId: number) => {
  const sql = `
    SELECT a.*, u.Username, u.FirstName, u.LastName
    FROM album a
    JOIN artist ar ON a.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    WHERE a.ArtistID = ?
    ORDER BY a.ReleaseDate DESC;
  `;
  const [rows] = await pool.query(sql, [artistId]);
  return rows;
};

export const getAllAlbums = async (limit?: number, offset?: number) => {
  let sql = `
    SELECT a.*, u.Username, u.FirstName, u.LastName
    FROM album a
    JOIN artist ar ON a.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    ORDER BY a.ReleaseDate DESC
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

export const updateAlbum = async (albumId: number, updates: UpdateAlbum) => {
  const validationErrors = validateAlbumInput(updates);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.albumName !== undefined) {
    setClauses.push('AlbumName = ?');
    params.push(updates.albumName);
  }

  if (updates.releaseDate !== undefined) {
    setClauses.push('ReleaseDate = ?');
    params.push(updates.releaseDate.toISOString().slice(0, 10));
  }

  if (updates.albumCover !== undefined) {
    setClauses.push('AlbumCover = ?');
    params.push(updates.albumCover || null);
  }

  if (updates.description !== undefined) {
    setClauses.push('Description = ?');
    params.push(updates.description || null);
  }

  if (setClauses.length === 0) {
    throw new Error('No valid fields provided to update.');
  }

  setClauses.push('UpdatedAt = CURRENT_TIMESTAMP');
  params.push(albumId);

  const sql = `UPDATE album SET ${setClauses.join(', ')} WHERE AlbumID = ?`;

  const [result] = await pool.query(sql, params);
  return result;
};

export const deleteAlbum = async (albumId: number) => {
  const sql = `DELETE FROM album WHERE AlbumID = ?`;
  const [result] = await pool.query(sql, [albumId]);
  return result;
};

export const searchAlbums = async (query: string) => {
  const sql = `
    SELECT a.*, u.Username, u.FirstName, u.LastName
    FROM album a
    JOIN artist ar ON a.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    WHERE a.AlbumName LIKE ? OR a.Description LIKE ? OR u.Username LIKE ?
    ORDER BY a.ReleaseDate DESC;
  `;
  
  const searchTerm = `%${query}%`;
  const [rows] = await pool.query(sql, [searchTerm, searchTerm, searchTerm]);
  return rows;
};

export const getAlbumWithSongs = async (albumId: number) => {
  const albumSql = `
    SELECT a.*, u.Username, u.FirstName, u.LastName
    FROM album a
    JOIN artist ar ON a.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    WHERE a.AlbumID = ?;
  `;
  
  const songsSql = `
    SELECT s.* FROM song s
    WHERE s.AlbumID = ?
    ORDER BY s.SongName;
  `;
  
  const [albumRows] = await pool.query(albumSql, [albumId]);
  const [songRows] = await pool.query(songsSql, [albumId]);
  
  const album = (albumRows as any[])[0];
  if (album) {
    album.songs = songRows;
  }
  
  return album;
};

