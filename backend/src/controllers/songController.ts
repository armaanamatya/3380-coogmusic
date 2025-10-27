import { Database } from 'better-sqlite3';
import { Song, UpdateSongData, UploadMusicData } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

// Get all songs with filters
export function getAllSongs(
  db: Database,
  filters: {
    page?: number;
    limit?: number;
    artistId?: number;
    genreId?: number;
    albumId?: number;
  }
): Song[] {
  const { page = 1, limit = 50, artistId, genreId, albumId } = filters;
  
  let query = `
    SELECT s.*, 
           a.ArtistID, up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           al.AlbumName, al.AlbumCover,
           g.GenreName
    FROM song s
    LEFT JOIN artist a ON s.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE 1=1
  `;
  
  const queryParams: any[] = [];
  
  if (artistId !== undefined) {
    query += ' AND s.ArtistID = ?';
    queryParams.push(artistId);
  }
  
  if (genreId !== undefined) {
    query += ' AND s.GenreID = ?';
    queryParams.push(genreId);
  }
  
  if (albumId !== undefined) {
    query += ' AND s.AlbumID = ?';
    queryParams.push(albumId);
  }
  
  query += ' ORDER BY s.SongID DESC LIMIT ? OFFSET ?';
  queryParams.push(limit, (page - 1) * limit);
  
  return db.prepare(query).all(...queryParams) as Song[];
}

// Get song by ID
export function getSongById(db: Database, songId: number): Song | null {
  const song = db.prepare(`
    SELECT s.*, 
           a.ArtistID, up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           al.AlbumName, al.AlbumCover,
           g.GenreName
    FROM song s
    LEFT JOIN artist a ON s.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE s.SongID = ?
  `).get(songId) as Song | undefined;
  
  return song || null;
}

// Create new song
export function createSong(
  db: Database,
  musicData: UploadMusicData,
  audioFilePath: string,
  audioFileSize: number
): { songId: number; audioFilePath: string } {
  // Verify artist exists
  const artist = db.prepare('SELECT ArtistID FROM artist WHERE ArtistID = ?').get(musicData.artistId);
  if (!artist) {
    throw new Error('Artist not found');
  }

  // Insert new song
  const stmt = db.prepare(`
    INSERT INTO song (SongName, ArtistID, AlbumID, GenreID, Duration, FilePath, FileSize, ReleaseDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, DATE('now'))
  `);

  const result = stmt.run(
    musicData.songName,
    musicData.artistId,
    musicData.albumId || null,
    musicData.genreId || null,
    parseInt(musicData.duration) || 0,
    audioFilePath,
    audioFileSize
  );

  return {
    songId: Number(result.lastInsertRowid),
    audioFilePath
  };
}

// Update song
export function updateSong(
  db: Database,
  songId: number,
  updateData: UpdateSongData
): void {
  // Check if song exists
  const existingSong = db.prepare('SELECT * FROM song WHERE SongID = ?').get(songId);
  if (!existingSong) {
    throw new Error('Song not found');
  }

  // Build update query dynamically
  const allowedFields = ['SongName', 'ArtistID', 'AlbumID', 'GenreID', 'Duration', 'ReleaseDate'];
  const updates: string[] = [];
  const values: any[] = [];

  allowedFields.forEach((field) => {
    if (updateData[field as keyof UpdateSongData] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(updateData[field as keyof UpdateSongData]);
    }
  });

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(songId);
  const updateQuery = `UPDATE song SET ${updates.join(', ')} WHERE SongID = ?`;
  
  db.prepare(updateQuery).run(...values);
}

// Delete song
export function deleteSong(db: Database, songId: number): { filePath: string | null } {
  // Get song details including file path
  const song = db.prepare('SELECT * FROM song WHERE SongID = ?').get(songId) as any;
  if (!song) {
    throw new Error('Song not found');
  }

  // Delete the song from database
  db.prepare('DELETE FROM song WHERE SongID = ?').run(songId);

  return { filePath: song.FilePath || null };
}

// Delete file from filesystem
export function deleteFileFromDisk(filePath: string): void {
  if (filePath) {
    const fullPath = path.join(process.cwd(), filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }
}

// Get top songs by listen count
export function getTopSongsByListenCount(db: Database, limit: number = 10): any[] {
  return db.prepare(`
    SELECT 
      s.SongID,
      s.SongName,
      s.ListenCount,
      s.Duration,
      s.ReleaseDate,
      s.FilePath,
      s.FileSize,
      u.FirstName AS ArtistFirstName,
      u.LastName AS ArtistLastName,
      u.Username AS ArtistUsername,
      al.AlbumName,
      g.GenreName
    FROM song s
    JOIN artist a ON s.ArtistID = a.ArtistID
    JOIN userprofile u ON a.ArtistID = u.UserID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    ORDER BY s.ListenCount DESC
    LIMIT ?
  `).all(limit);
}

