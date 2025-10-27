import { Database } from 'better-sqlite3';
import { Album, CreateAlbumData, UpdateAlbumData } from '../types/index.js';
import * as fs from 'fs';
import * as path from 'path';

// Get all albums with filters
export function getAllAlbums(
  db: Database,
  filters: {
    artistId?: number;
  }
): Album[] {
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
  
  return db.prepare(query).all(...queryParams) as Album[];
}

// Get album by ID
export function getAlbumById(db: Database, albumId: number): Album | null {
  const album = db.prepare(`
    SELECT al.*, 
           a.ArtistID, up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName
    FROM album al
    LEFT JOIN artist a ON al.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    WHERE al.AlbumID = ?
  `).get(albumId) as Album | undefined;
  
  return album || null;
}

// Create new album
export function createAlbum(
  db: Database,
  albumData: CreateAlbumData
): { albumId: number } {
  // Verify artist exists
  const artist = db.prepare('SELECT ArtistID FROM artist WHERE ArtistID = ?').get(albumData.artistId);
  if (!artist) {
    throw new Error('Artist not found');
  }

  // Insert new album
  const stmt = db.prepare(`
    INSERT INTO album (AlbumName, ArtistID, ReleaseDate, Description)
    VALUES (?, ?, ?, ?)
  `);

  const result = stmt.run(
    albumData.albumName,
    albumData.artistId,
    albumData.releaseDate || new Date().toISOString().split('T')[0],
    albumData.description || null
  );

  return { albumId: Number(result.lastInsertRowid) };
}

// Update album
export function updateAlbum(
  db: Database,
  albumId: number,
  updateData: UpdateAlbumData
): void {
  // Check if album exists
  const existingAlbum = db.prepare('SELECT * FROM album WHERE AlbumID = ?').get(albumId);
  if (!existingAlbum) {
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
  
  db.prepare(updateQuery).run(...values);
}

// Update album cover
export function updateAlbumCover(
  db: Database,
  albumId: number,
  albumCoverPath: string
): void {
  db.prepare('UPDATE album SET AlbumCover = ? WHERE AlbumID = ?').run(albumCoverPath, albumId);
}

// Delete album
export function deleteAlbum(db: Database, albumId: number): { albumArtPath: string | null } {
  // Check if album exists
  const album = db.prepare('SELECT * FROM album WHERE AlbumID = ?').get(albumId) as any;
  if (!album) {
    throw new Error('Album not found');
  }

  // Check if album has songs
  const songsCount = db.prepare('SELECT COUNT(*) as count FROM song WHERE AlbumID = ?').get(albumId) as any;
  if (songsCount.count > 0) {
    throw new Error('Cannot delete album with existing songs');
  }

  // Delete the album from database
  db.prepare('DELETE FROM album WHERE AlbumID = ?').run(albumId);

  return { albumArtPath: album.AlbumCover || null };
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
export function getTopAlbumsByLikes(db: Database, limit: number = 10): any[] {
  return db.prepare(`
    SELECT 
      al.AlbumID,
      al.AlbumName,
      al.ReleaseDate,
      al.AlbumCover,
      al.Description,
      COUNT(ula.UserID) as likeCount,
      u.FirstName AS ArtistFirstName,
      u.LastName AS ArtistLastName,
      u.Username AS ArtistUsername,
      COUNT(DISTINCT s.SongID) as songCount
    FROM album al
    JOIN artist a ON al.ArtistID = a.ArtistID
    JOIN userprofile u ON a.ArtistID = u.UserID
    LEFT JOIN user_likes_album ula ON al.AlbumID = ula.AlbumID
    LEFT JOIN song s ON al.AlbumID = s.AlbumID
    GROUP BY al.AlbumID, al.AlbumName, al.ReleaseDate, al.AlbumCover, al.Description, u.FirstName, u.LastName, u.Username
    ORDER BY likeCount DESC
    LIMIT ?
  `).all(limit);
}

