import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { Album, CreateAlbumData, UpdateAlbumData } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

// Get all albums with filters
export async function getAllAlbums(
  pool: Pool,
  filters: {
    artistId?: number;
  }
): Promise<Album[]> {
  const { artistId } = filters;
  
  let query = `
    SELECT al.*, 
           a.ArtistID, up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName
    FROM album al
    LEFT JOIN artist a ON al.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    WHERE 1=1
  `;
  
  const queryParams: any[] = [];
  
  if (artistId !== undefined) {
    query += ' AND al.ArtistID = ?';
    queryParams.push(artistId);
  }
  
  query += ' ORDER BY al.ReleaseDate DESC';
  
  const [rows] = await pool.execute<RowDataPacket[]>(query, queryParams);
  return rows as Album[];
}

// Get album by ID
export async function getAlbumById(pool: Pool, albumId: number): Promise<Album | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT al.*, 
           a.ArtistID, up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName
    FROM album al
    LEFT JOIN artist a ON al.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    WHERE al.AlbumID = ?
  `, [albumId]);
  
  return rows.length > 0 ? (rows[0] as Album) : null;
}

// Create new album
export async function createAlbum(
  pool: Pool,
  albumData: CreateAlbumData
): Promise<{ albumId: number }> {
  // Verify artist exists
  const [artists] = await pool.execute<RowDataPacket[]>(
    'SELECT ArtistID FROM artist WHERE ArtistID = ?', 
    [albumData.artistId]
  );
  if (artists.length === 0) {
    throw new Error('Artist not found');
  }

  // Insert new album
  const [result] = await pool.execute<ResultSetHeader>(`
    INSERT INTO album (AlbumName, ArtistID, ReleaseDate, Description)
    VALUES (?, ?, ?, ?)
  `, [
    albumData.albumName,
    albumData.artistId,
    albumData.releaseDate || new Date().toISOString().split('T')[0],
    albumData.description || null
  ]);

  return { albumId: result.insertId };
}

// Update album
export async function updateAlbum(
  pool: Pool,
  albumId: number,
  updateData: UpdateAlbumData
): Promise<void> {
  // Check if album exists
  const [existingAlbums] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM album WHERE AlbumID = ?', 
    [albumId]
  );
  if (existingAlbums.length === 0) {
    throw new Error('Album not found');
  }

  // Build update query dynamically
  const allowedFields = ['AlbumName', 'ReleaseDate', 'Description'];
  const updates: string[] = [];
  const values: any[] = [];

  allowedFields.forEach((field) => {
    if (updateData[field as keyof UpdateAlbumData] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(updateData[field as keyof UpdateAlbumData]);
    }
  });

  if (updates.length === 0) {
    throw new Error('No valid fields to update');
  }

  values.push(albumId);
  const updateQuery = `UPDATE album SET ${updates.join(', ')} WHERE AlbumID = ?`;
  
  await pool.execute(updateQuery, values);
}

// Update album cover
export async function updateAlbumCover(
  pool: Pool,
  albumId: number,
  albumCoverPath: string
): Promise<void> {
  await pool.execute('UPDATE album SET AlbumCover = ? WHERE AlbumID = ?', [albumCoverPath, albumId]);
}

// Delete album with complete cleanup
export async function deleteAlbum(pool: Pool, albumId: number): Promise<{ albumArtPath: string | null }> {
  // Check if album exists
  const [albums] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM album WHERE AlbumID = ?', 
    [albumId]
  );
  if (albums.length === 0) {
    throw new Error('Album not found');
  }

  const album = albums[0] as any;

  // Start transaction for atomic operation
  await pool.query('START TRANSACTION');

  try {
    // Clean up album-specific data first (before FK CASCADE)
    await pool.execute('DELETE FROM user_likes_album WHERE AlbumID = ?', [albumId]);
    await pool.execute('DELETE FROM album_ratings WHERE AlbumID = ?', [albumId]);

    // Delete the album - FK CASCADE will automatically:
    // 1. Delete all songs in the album
    // 2. Song deletion triggers will clean up playlists, likes, history, ratings
    await pool.execute('DELETE FROM album WHERE AlbumID = ?', [albumId]);

    // Commit transaction
    await pool.query('COMMIT');

    return { albumArtPath: album.AlbumCover || null };

  } catch (error) {
    // Rollback on error
    await pool.query('ROLLBACK');
    throw error;
  }
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

// Get top albums by like count
export async function getTopAlbumsByLikes(pool: Pool, limit: number = 10): Promise<any[]> {
  const limitValue = parseInt(String(limit), 10);
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT 
      al.AlbumID,
      al.AlbumName,
      al.ReleaseDate,
      al.AlbumCover,
      al.Description,
      al.AverageRating,
      al.TotalRatings,
      COUNT(ula.UserID) as likeCount,
      u.FirstName AS ArtistFirstName,
      u.LastName AS ArtistLastName,
      u.Username AS ArtistUsername,
      COUNT(DISTINCT s.SongID) as songCount,
      COALESCE(SUM(s.ListenCount), 0) as totalListenCount
    FROM album al
    JOIN artist a ON al.ArtistID = a.ArtistID
    JOIN userprofile u ON a.ArtistID = u.UserID
    LEFT JOIN user_likes_album ula ON al.AlbumID = ula.AlbumID
    LEFT JOIN song s ON al.AlbumID = s.AlbumID
    GROUP BY al.AlbumID, al.AlbumName, al.ReleaseDate, al.AlbumCover, al.Description, al.AverageRating, al.TotalRatings, u.FirstName, u.LastName, u.Username
    ORDER BY likeCount DESC
    LIMIT ?
  `, [limitValue]);
  
  return rows as RowDataPacket[];
}
