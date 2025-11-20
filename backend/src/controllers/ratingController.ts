import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Rate or update rating for a song
export async function rateSong(pool: Pool, userId: number, songId: number, rating: number): Promise<void> {
  // Validate rating range
  if (rating < 1 || rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  // Verify user exists
  const [users] = await pool.execute<RowDataPacket[]>('SELECT UserID FROM userprofile WHERE UserID = ?', [userId]);
  if (users.length === 0) {
    throw new Error('User not found');
  }

  // Verify song exists
  const [songs] = await pool.execute<RowDataPacket[]>('SELECT SongID FROM song WHERE SongID = ?', [songId]);
  if (songs.length === 0) {
    throw new Error('Song not found');
  }

  // Check if user has already rated this song
  const [existingRatings] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM song_ratings WHERE UserID = ? AND SongID = ?',
    [userId, songId]
  );

  if (existingRatings.length > 0) {
    // Update existing rating
    await pool.execute(
      'UPDATE song_ratings SET Rating = ?, UpdatedAt = CURRENT_TIMESTAMP WHERE UserID = ? AND SongID = ?',
      [rating, userId, songId]
    );
  } else {
    // Insert new rating
    await pool.execute(
      'INSERT INTO song_ratings (UserID, SongID, Rating) VALUES (?, ?, ?)',
      [userId, songId, rating]
    );
  }
}

// Get a specific user's rating for a song
export async function getUserSongRating(pool: Pool, userId: number, songId: number): Promise<number | null> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT Rating FROM song_ratings WHERE UserID = ? AND SongID = ?',
    [userId, songId]
  );

  return rows.length > 0 ? rows[0].Rating : null;
}

// Get song rating statistics (average rating and total count)
export async function getSongRatingStats(pool: Pool, songId: number): Promise<{ averageRating: number; totalRatings: number }> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT AverageRating, TotalRatings FROM song WHERE SongID = ?',
    [songId]
  );

  if (rows.length === 0) {
    throw new Error('Song not found');
  }

  return {
    averageRating: parseFloat(rows[0].AverageRating) || 0,
    totalRatings: rows[0].TotalRatings || 0
  };
}

// Remove a user's rating for a song
export async function removeRating(pool: Pool, userId: number, songId: number): Promise<void> {
  // Check if rating exists
  const [existingRatings] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM song_ratings WHERE UserID = ? AND SongID = ?',
    [userId, songId]
  );

  if (existingRatings.length === 0) {
    throw new Error('Rating not found');
  }

  // Delete the rating (triggers will automatically update song statistics)
  await pool.execute('DELETE FROM song_ratings WHERE UserID = ? AND SongID = ?', [userId, songId]);
}

// Get all ratings for a specific song with user details
export async function getSongRatings(
  pool: Pool, 
  songId: number,
  options: { page?: number; limit?: number } = {}
): Promise<Array<{
  userId: number;
  username: string;
  rating: number;
  ratedAt: Date;
  updatedAt: Date;
}>> {
  const { page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;

  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT 
      r.UserID as userId,
      u.Username as username,
      r.Rating as rating,
      r.RatedAt as ratedAt,
      r.UpdatedAt as updatedAt
    FROM song_ratings r
    JOIN userprofile u ON r.UserID = u.UserID
    WHERE r.SongID = ?
    ORDER BY r.UpdatedAt DESC
    LIMIT ? OFFSET ?
  `, [songId, limit, offset]);

  return rows as Array<{
    userId: number;
    username: string;
    rating: number;
    ratedAt: Date;
    updatedAt: Date;
  }>;
}

// Get all ratings by a specific user
export async function getUserRatings(
  pool: Pool,
  userId: number,
  options: { page?: number; limit?: number } = {}
): Promise<Array<{
  songId: number;
  songName: string;
  artistName: string;
  rating: number;
  ratedAt: Date;
  updatedAt: Date;
}>> {
  const { page = 1, limit = 50 } = options;
  const offset = (page - 1) * limit;

  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT 
      r.SongID as songId,
      s.SongName as songName,
      u.Username as artistName,
      r.Rating as rating,
      r.RatedAt as ratedAt,
      r.UpdatedAt as updatedAt
    FROM song_ratings r
    JOIN song s ON r.SongID = s.SongID
    JOIN artist a ON s.ArtistID = a.ArtistID
    JOIN userprofile u ON a.ArtistID = u.UserID
    WHERE r.UserID = ?
    ORDER BY r.UpdatedAt DESC
    LIMIT ? OFFSET ?
  `, [userId, limit, offset]);

  return rows as Array<{
    songId: number;
    songName: string;
    artistName: string;
    rating: number;
    ratedAt: Date;
    updatedAt: Date;
  }>;
}

// Get songs with highest average ratings
export async function getTopRatedSongs(pool: Pool, limit: number = 10): Promise<Array<{
  songId: number;
  songName: string;
  artistName: string;
  averageRating: number;
  totalRatings: number;
  listenCount: number;
}>> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT 
      s.SongID as songId,
      s.SongName as songName,
      u.Username as artistName,
      s.AverageRating as averageRating,
      s.TotalRatings as totalRatings,
      s.ListenCount as listenCount
    FROM song s
    JOIN artist a ON s.ArtistID = a.ArtistID
    JOIN userprofile u ON a.ArtistID = u.UserID
    WHERE s.TotalRatings > 0
    ORDER BY s.AverageRating DESC, s.TotalRatings DESC
    LIMIT ?
  `, [limit]);

  return rows as Array<{
    songId: number;
    songName: string;
    artistName: string;
    averageRating: number;
    totalRatings: number;
    listenCount: number;
  }>;
}

// Get rating distribution for a song (how many 1-star, 2-star, etc.)
export async function getSongRatingDistribution(pool: Pool, songId: number): Promise<{
  [rating: number]: number;
  total: number;
}> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT 
      Rating,
      COUNT(*) as count
    FROM song_ratings 
    WHERE SongID = ?
    GROUP BY Rating
    ORDER BY Rating
  `, [songId]);

  // Initialize distribution object
  const distribution: { [rating: number]: number; total: number } = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
    total: 0
  };

  // Fill in the actual counts
  for (const row of rows as RowDataPacket[]) {
    distribution[row.Rating] = row.count;
    distribution.total += row.count;
  }

  return distribution;
}