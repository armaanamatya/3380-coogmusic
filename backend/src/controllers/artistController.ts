import { Database } from 'better-sqlite3';
import { Artist } from '../types/index.js';

// Get all artists
export function getAllArtists(db: Database): any[] {
  const artists = db.prepare(`
    SELECT a.ArtistID, up.FirstName, up.LastName, up.Username, a.ArtistBio, a.VerifiedStatus
    FROM artist a
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    ORDER BY up.FirstName, up.LastName
  `).all();
  
  return artists;
}

// Get artist by ID
export function getArtistById(db: Database, artistId: number): any | null {
  const artist = db.prepare(`
    SELECT a.ArtistID, up.FirstName, up.LastName, up.Username, up.ProfilePicture,
           a.ArtistBio, a.VerifiedStatus, a.DateVerified
    FROM artist a
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    WHERE a.ArtistID = ?
  `).get(artistId);
  
  return artist || null;
}

// Update artist bio
export function updateArtistBio(
  db: Database,
  artistId: number,
  bio: string
): void {
  // Check if artist exists
  const existingArtist = db.prepare('SELECT * FROM artist WHERE ArtistID = ?').get(artistId);
  if (!existingArtist) {
    throw new Error('Artist not found');
  }

  db.prepare('UPDATE artist SET ArtistBio = ? WHERE ArtistID = ?').run(bio, artistId);
}

// Verify artist (admin function)
export function verifyArtist(
  db: Database,
  artistId: number,
  adminId: number
): void {
  // Check if artist exists
  const existingArtist = db.prepare('SELECT * FROM artist WHERE ArtistID = ?').get(artistId);
  if (!existingArtist) {
    throw new Error('Artist not found');
  }

  const dateVerified = new Date().toISOString().split('T')[0];
  
  db.prepare(
    'UPDATE artist SET VerifiedStatus = 1, VerifyingAdminID = ?, DateVerified = ? WHERE ArtistID = ?'
  ).run(adminId, dateVerified, artistId);
}

// Get artist albums
export function getArtistAlbums(db: Database, artistId: number): any[] {
  return db.prepare(`
    SELECT * FROM album 
    WHERE ArtistID = ? 
    ORDER BY AlbumDate DESC
  `).all(artistId);
}

// Get artist songs
export function getArtistSongs(db: Database, artistId: number): any[] {
  return db.prepare(`
    SELECT s.*, al.AlbumName, g.GenreName
    FROM song s
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE al.ArtistID = ?
    ORDER BY s.SongID DESC
  `).all(artistId);
}

