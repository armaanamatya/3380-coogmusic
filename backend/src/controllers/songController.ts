import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { Song, UpdateSongData, UploadMusicData } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

// Get all songs with filters
export async function getAllSongs(
  pool: Pool,
  filters: {
    page?: number;
    limit?: number;
    artistId?: number;
    genreId?: number;
    albumId?: number;
  }
): Promise<Song[]> {
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
  queryParams.push(parseInt(String(limit), 10), parseInt(String((page - 1) * limit), 10));
  
  const [rows] = await pool.execute<RowDataPacket[]>(query, queryParams);
  return rows as Song[];
}

// Get song by ID
export async function getSongById(pool: Pool, songId: number): Promise<Song | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
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
  `, [songId]);
  
  return rows.length > 0 ? (rows[0] as Song) : null;
}

// Create new song
export async function createSong(
  pool: Pool,
  musicData: UploadMusicData,
  audioFilePath: string,
  audioFileSize: number
): Promise<{ songId: number; audioFilePath: string }> {
  // Verify artist exists
  const [artists] = await pool.execute<RowDataPacket[]>(
    'SELECT ArtistID FROM artist WHERE ArtistID = ?', 
    [musicData.artistId]
  );
  if (artists.length === 0) {
    throw new Error('Artist not found');
  }

  // Insert new song
  const [result] = await pool.execute<ResultSetHeader>(`
    INSERT INTO song (SongName, ArtistID, AlbumID, GenreID, Duration, FilePath, FileSize, ReleaseDate)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE())
  `, [
    musicData.songName,
    musicData.artistId,
    musicData.albumId || null,
    musicData.genreId || null,
    parseInt(musicData.duration) || 0,
    audioFilePath,
    audioFileSize
  ]);

  return {
    songId: result.insertId,
    audioFilePath
  };
}

// Update song
export async function updateSong(
  pool: Pool,
  songId: number,
  updateData: UpdateSongData
): Promise<void> {
  // Check if song exists
  const [existingSongs] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM song WHERE SongID = ?', 
    [songId]
  );
  if (existingSongs.length === 0) {
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
  
  await pool.execute(updateQuery, values);
}

// Delete song
export async function deleteSong(pool: Pool, songId: number): Promise<{ filePath: string | null }> {
  // Get song details including file path
  const [songs] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM song WHERE SongID = ?', 
    [songId]
  );
  if (songs.length === 0) {
    throw new Error('Song not found');
  }

  const song = songs[0] as any;

  // Delete the song from database
  await pool.execute('DELETE FROM song WHERE SongID = ?', [songId]);

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
export async function getTopSongsByListenCount(pool: Pool, limit: number = 10): Promise<any[]> {
  const limitValue = parseInt(String(limit), 10);
  const [rows] = await pool.query<RowDataPacket[]>(`
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
  `, [limitValue]);
  
  return rows as RowDataPacket[];
}

