import { createPool } from '../database';

const pool = createPool();

export interface Genre {
  genreId: number;
  genreName: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface NewGenre {
  genreName: string;
  description?: string;
}

export interface UpdateGenre {
  genreName?: string;
  description?: string;
}

export const validateGenreInput = (genre: Partial<NewGenre>): string[] => {
  const errors: string[] = [];

  if (genre.genreName && genre.genreName.length < 2) {
    errors.push('Genre name must be at least 2 characters long');
  }

  if (genre.genreName && genre.genreName.length > 50) {
    errors.push('Genre name must be 50 characters or less');
  }

  if (genre.genreName && !genre.genreName.match(/^[A-Za-z0-9\s\-&/]+$/)) {
    errors.push('Genre name can only contain letters, numbers, spaces, hyphens, ampersands, and forward slashes');
  }

  if (genre.description && genre.description.length > 500) {
    errors.push('Description must be 500 characters or less');
  }

  return errors;
};

export const createGenre = async (genre: NewGenre) => {
  const validationErrors = validateGenreInput(genre);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  const sql = `
    INSERT INTO genre (GenreName, Description)
    VALUES (?, ?);
  `;

  const values = [
    genre.genreName,
    genre.description || null
  ];

  try {
    const [result] = await pool.query(sql, values);
    return result;
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Genre name already exists');
    }
    throw error;
  }
};

export const getGenreById = async (genreId: number) => {
  const sql = `SELECT * FROM genre WHERE GenreID = ?`;
  const [rows] = await pool.query(sql, [genreId]);
  return (rows as any[])[0];
};

export const getGenreByName = async (genreName: string) => {
  const sql = `SELECT * FROM genre WHERE GenreName = ?`;
  const [rows] = await pool.query(sql, [genreName]);
  return (rows as any[])[0];
};

export const getAllGenres = async () => {
  const sql = `SELECT * FROM genre ORDER BY GenreName`;
  const [rows] = await pool.query(sql);
  return rows;
};

export const updateGenre = async (genreId: number, updates: UpdateGenre) => {
  const validationErrors = validateGenreInput(updates);
  if (validationErrors.length > 0) {
    throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
  }

  const setClauses: string[] = [];
  const params: any[] = [];

  if (updates.genreName !== undefined) {
    setClauses.push('GenreName = ?');
    params.push(updates.genreName);
  }

  if (updates.description !== undefined) {
    setClauses.push('Description = ?');
    params.push(updates.description || null);
  }

  if (setClauses.length === 0) {
    throw new Error('No valid fields provided to update.');
  }

  setClauses.push('UpdatedAt = CURRENT_TIMESTAMP');
  params.push(genreId);

  const sql = `UPDATE genre SET ${setClauses.join(', ')} WHERE GenreID = ?`;

  try {
    const [result] = await pool.query(sql, params);
    return result;
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('Genre name already exists');
    }
    throw error;
  }
};

export const deleteGenre = async (genreId: number) => {
  // Check if genre is being used by any songs
  const checkSql = `SELECT COUNT(*) as count FROM song WHERE GenreID = ?`;
  const [checkRows] = await pool.query(checkSql, [genreId]);
  const count = (checkRows as any[])[0].count;

  if (count > 0) {
    throw new Error('Cannot delete genre that is associated with songs');
  }

  const sql = `DELETE FROM genre WHERE GenreID = ?`;
  const [result] = await pool.query(sql, [genreId]);
  return result;
};

export const searchGenres = async (query: string) => {
  const sql = `
    SELECT * FROM genre 
    WHERE GenreName LIKE ? OR Description LIKE ?
    ORDER BY GenreName
  `;
  
  const searchTerm = `%${query}%`;
  const [rows] = await pool.query(sql, [searchTerm, searchTerm]);
  return rows;
};

export const getGenresWithSongCount = async () => {
  const sql = `
    SELECT g.*, COUNT(s.SongID) as songCount
    FROM genre g
    LEFT JOIN song s ON g.GenreID = s.GenreID
    GROUP BY g.GenreID
    ORDER BY songCount DESC, g.GenreName
  `;
  
  const [rows] = await pool.query(sql);
  return rows;
};

export const getSongsByGenre = async (genreId: number) => {
  const sql = `
    SELECT s.*, u.Username, u.FirstName, u.LastName, a.AlbumName
    FROM song s
    JOIN artist ar ON s.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    LEFT JOIN album a ON s.AlbumID = a.AlbumID
    WHERE s.GenreID = ?
    ORDER BY s.ReleaseDate DESC
  `;
  
  const [rows] = await pool.query(sql, [genreId]);
  return rows;
};
