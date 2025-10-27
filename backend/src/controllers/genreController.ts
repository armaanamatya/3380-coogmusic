import { Database } from 'better-sqlite3';
import { Genre } from '../types/index.js';

// Get all genres
export function getAllGenres(db: Database): Genre[] {
  return db.prepare('SELECT * FROM genre ORDER BY GenreName').all() as Genre[];
}

// Get genre by ID
export function getGenreById(db: Database, genreId: number): Genre | null {
  const genre = db.prepare('SELECT * FROM genre WHERE GenreID = ?').get(genreId) as Genre | undefined;
  return genre || null;
}

// Create new genre
export function createGenre(
  db: Database,
  genreName: string,
  description: string | null
): { genreId: number } {
  // Check if genre already exists
  const existingGenre = db.prepare('SELECT GenreID FROM genre WHERE GenreName = ?').get(genreName);
  if (existingGenre) {
    throw new Error('Genre already exists');
  }

  const stmt = db.prepare(`
    INSERT INTO genre (GenreName, Description)
    VALUES (?, ?)
  `);

  const result = stmt.run(genreName, description);

  return { genreId: Number(result.lastInsertRowid) };
}

// Update genre
export function updateGenre(
  db: Database,
  genreId: number,
  genreName?: string,
  description?: string
): void {
  // Check if genre exists
  const existingGenre = db.prepare('SELECT * FROM genre WHERE GenreID = ?').get(genreId);
  if (!existingGenre) {
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
  
  db.prepare(updateQuery).run(...values);
}

// Delete genre
export function deleteGenre(db: Database, genreId: number): void {
  // Check if genre exists
  const existingGenre = db.prepare('SELECT * FROM genre WHERE GenreID = ?').get(genreId);
  if (!existingGenre) {
    throw new Error('Genre not found');
  }

  // Check if genre is used by any songs
  const songsCount = db.prepare('SELECT COUNT(*) as count FROM song WHERE GenreID = ?').get(genreId) as any;
  if (songsCount.count > 0) {
    throw new Error('Cannot delete genre that is used by songs');
  }

  db.prepare('DELETE FROM genre WHERE GenreID = ?').run(genreId);
}

// Get songs by genre
export function getSongsByGenre(db: Database, genreId: number): any[] {
  return db.prepare(`
    SELECT s.*, al.AlbumName, up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName
    FROM song s
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON al.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    WHERE s.GenreID = ?
    ORDER BY s.SongID DESC
  `).all(genreId);
}

// Get genres with listen counts
export function getGenresWithListenCount(db: Database): any[] {
  return db.prepare(`
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
  `).all();
}

