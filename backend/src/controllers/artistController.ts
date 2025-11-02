import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { Artist } from '../types/index.js';

// Get all artists
export async function getAllArtists(pool: Pool): Promise<any[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT a.ArtistID, up.FirstName, up.LastName, up.Username, a.ArtistBio, a.VerifiedStatus
    FROM artist a
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    ORDER BY up.FirstName, up.LastName
  `);
  
  return rows;
}

// Get artist by ID
export async function getArtistById(pool: Pool, artistId: number): Promise<any | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT a.ArtistID, up.FirstName, up.LastName, up.Username, up.ProfilePicture,
           a.ArtistBio, a.VerifiedStatus, a.DateVerified
    FROM artist a
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    WHERE a.ArtistID = ?
  `, [artistId]);
  
  return rows.length > 0 ? rows[0] : null;
}

// Update artist bio
export async function updateArtistBio(
  pool: Pool,
  artistId: number,
  bio: string
): Promise<void> {
  // Check if artist exists
  const [existingArtists] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM artist WHERE ArtistID = ?', 
    [artistId]
  );
  if (existingArtists.length === 0) {
    throw new Error('Artist not found');
  }

  await pool.execute('UPDATE artist SET ArtistBio = ? WHERE ArtistID = ?', [bio, artistId]);
}

// Verify artist (admin function)
export async function verifyArtist(
  pool: Pool,
  artistId: number,
  adminId: number
): Promise<void> {
  // Check if artist exists
  const [existingArtists] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM artist WHERE ArtistID = ?', 
    [artistId]
  );
  if (existingArtists.length === 0) {
    throw new Error('Artist not found');
  }

  const dateVerified = new Date().toISOString().split('T')[0];
  
  await pool.execute(
    'UPDATE artist SET VerifiedStatus = 1, VerifyingAdminID = ?, DateVerified = ? WHERE ArtistID = ?',
    [adminId, dateVerified, artistId]
  );
}

// Get artist albums
export async function getArtistAlbums(pool: Pool, artistId: number): Promise<any[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT * FROM album 
    WHERE ArtistID = ? 
    ORDER BY ReleaseDate DESC
  `, [artistId]);
  
  return rows;
}

// Get artist songs
export async function getArtistSongs(pool: Pool, artistId: number): Promise<any[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT s.*, al.AlbumName, g.GenreName
    FROM song s
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE s.ArtistID = ?
    ORDER BY s.SongID DESC
  `, [artistId]);
  
  return rows;
}

// Get top artists by follower count
export async function getTopArtistsByFollowers(pool: Pool, limit: number = 10): Promise<any[]> {
  const limitValue = parseInt(String(limit), 10);
  const [rows] = await pool.query<RowDataPacket[]>(`
    SELECT 
      a.ArtistID,
      u.FirstName,
      u.LastName,
      u.Username,
      u.ProfilePicture,
      a.ArtistBio,
      a.VerifiedStatus,
      COUNT(ufa.UserID) as followerCount
    FROM artist a
    JOIN userprofile u ON a.ArtistID = u.UserID
    LEFT JOIN user_follows_artist ufa ON a.ArtistID = ufa.ArtistID
    GROUP BY a.ArtistID, u.FirstName, u.LastName, u.Username, u.ProfilePicture, a.ArtistBio, a.VerifiedStatus
    ORDER BY followerCount DESC
    LIMIT ?
  `, [limitValue]);
  
  return rows as RowDataPacket[];
}
