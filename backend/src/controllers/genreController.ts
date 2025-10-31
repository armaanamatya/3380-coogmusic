import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { Genre } from '../types/index.js';

// Get all genres
export async function getAllGenres(pool: Pool): Promise<Genre[]> {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM genre ORDER BY GenreName');
  return rows as Genre[];
}

// Get genre by ID
export async function getGenreById(pool: Pool, genreId: number): Promise<Genre | null> {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT * FROM genre WHERE GenreID = ?', [genreId]);
  return rows.length > 0 ? (rows[0] as Genre) : null;
}

// Create new genre
export async function createGenre(
  pool: Pool,
  genreName: string,
  description: string | null
): Promise<{ genreId: number }> {
  // Check if genre already exists
  const [existingGenres] = await pool.execute<RowDataPacket[]>(
    'SELECT GenreID FROM genre WHERE GenreName = ?', 
    [genreName]
  );
  if (existingGenres.length > 0) {
    throw new Error('Genre already exists');
  }

  const [result] = await pool.execute<ResultSetHeader>(`
    INSERT INTO genre (GenreName, Description)
    VALUES (?, ?)
  `, [genreName, description]);

  return { genreId: result.insertId };
}

// Update genre
export async function updateGenre(
  pool: Pool,
  genreId: number,
  genreName?: string,
  description?: string
): Promise<void> {
  // Check if genre exists
  const [existingGenres] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM genre WHERE GenreID = ?', 
    [genreId]
  );
  if (existingGenres.length === 0) {
    throw new Error('Genre not found');
  }

  const updates: string[] = [];
  const values: any[] = [];

  if (genreName !== undefined) {
    updates.push('GenreName = ?');
    values.push(genreName);
  }

  if (description !== undefined) {
    updates.push('Description = ?');
    values.push(description);
  }

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(genreId);
  const updateQuery = `UPDATE genre SET ${updates.join(', ')} WHERE GenreID = ?`;
  
  await pool.execute(updateQuery, values);
}

// Delete genre
export async function deleteGenre(pool: Pool, genreId: number): Promise<void> {
  // Check if genre exists
  const [existingGenres] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM genre WHERE GenreID = ?', 
    [genreId]
  );
  if (existingGenres.length === 0) {
    throw new Error('Genre not found');
  }

  // Check if genre is used by any songs
  const [songsCounts] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM song WHERE GenreID = ?', 
    [genreId]
  );
  const songsCount = songsCounts[0] as any;
  if (songsCount.count > 0) {
    throw new Error('Cannot delete genre that is used by songs');
  }

  await pool.execute('DELETE FROM genre WHERE GenreID = ?', [genreId]);
}

// Get songs by genre
export async function getSongsByGenre(pool: Pool, genreId: number): Promise<any[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT s.*, al.AlbumName, up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName
    FROM song s
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON s.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    WHERE s.GenreID = ?
    ORDER BY s.SongID DESC
  `, [genreId]);
  
  return rows;
}

// Get genres with listen counts
export async function getGenresWithListenCount(pool: Pool): Promise<any[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT 
      g.GenreID,
      g.GenreName,
      g.Description,
      g.CreatedAt,
      g.UpdatedAt,
      COUNT(DISTINCT s.SongID) as songCount,
      COALESCE(SUM(s.ListenCount), 0) as totalListens
    FROM genre g
    LEFT JOIN song s ON g.GenreID = s.GenreID
    GROUP BY g.GenreID, g.GenreName, g.Description, g.CreatedAt, g.UpdatedAt
    ORDER BY totalListens DESC, songCount DESC, g.GenreName
  `);
  
  return rows;
}
