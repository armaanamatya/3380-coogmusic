import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

// Follow an artist
export async function followArtist(pool: Pool, userId: number, artistId: number): Promise<void> {
  // Verify user exists
  const [users] = await pool.execute<RowDataPacket[]>('SELECT UserID FROM userprofile WHERE UserID = ?', [userId]);
  if (users.length === 0) {
    throw new Error('User not found');
  }

  // Verify artist exists
  const [artists] = await pool.execute<RowDataPacket[]>('SELECT ArtistID FROM artist WHERE ArtistID = ?', [artistId]);
  if (artists.length === 0) {
    throw new Error('Artist not found');
  }

  // Check if already following
  const [existingFollows] = await pool.execute<RowDataPacket[]>(
    'SELECT * FROM user_follows_artist WHERE UserID = ? AND ArtistID = ?',
    [userId, artistId]
  );
  if (existingFollows.length > 0) {
    throw new Error('User is already following this artist');
  }

  await pool.execute('INSERT INTO user_follows_artist (UserID, ArtistID) VALUES (?, ?)', [userId, artistId]);
}

// Unfollow an artist
export async function unfollowArtist(pool: Pool, userId: number, artistId: number): Promise<void> {
  const [result] = await pool.execute<ResultSetHeader>(
    'DELETE FROM user_follows_artist WHERE UserID = ? AND ArtistID = ?',
    [userId, artistId]
  );

  if (result.affectedRows === 0) {
    throw new Error('Follow relationship not found');
  }
}

// Get artists followed by user
export async function getUserFollowing(
  pool: Pool,
  userId: number,
  filters: { page?: number; limit?: number }
): Promise<any[]> {
  const { page = 1, limit = 50 } = filters;

  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT a.*, u.Username, u.FirstName, u.LastName, u.ProfilePicture, ufa.FollowedAt
    FROM user_follows_artist ufa
    JOIN artist a ON ufa.ArtistID = a.ArtistID
    JOIN userprofile u ON a.ArtistID = u.UserID
    WHERE ufa.UserID = ?
    ORDER BY ufa.FollowedAt DESC
    LIMIT ? OFFSET ?
  `, [userId, parseInt(String(limit), 10), parseInt(String((page - 1) * limit), 10)]);

  return rows;
}

// Get followers of an artist
export async function getArtistFollowers(
  pool: Pool,
  artistId: number,
  filters: { page?: number; limit?: number }
): Promise<any[]> {
  const { page = 1, limit = 50 } = filters;

  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT u.UserID, u.Username, u.FirstName, u.LastName, u.ProfilePicture, ufa.FollowedAt
    FROM user_follows_artist ufa
    JOIN userprofile u ON ufa.UserID = u.UserID
    WHERE ufa.ArtistID = ?
    ORDER BY ufa.FollowedAt DESC
    LIMIT ? OFFSET ?
  `, [artistId, parseInt(String(limit), 10), parseInt(String((page - 1) * limit), 10)]);

  return rows;
}

// Check if user is following artist
export async function isFollowingArtist(pool: Pool, userId: number, artistId: number): Promise<boolean> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT 1 FROM user_follows_artist WHERE UserID = ? AND ArtistID = ?',
    [userId, artistId]
  );
  return rows.length > 0;
}

// Get follower count for artist
export async function getFollowerCount(pool: Pool, artistId: number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM user_follows_artist WHERE ArtistID = ?',
    [artistId]
  );
  const result = rows[0] as { count: number };
  return result.count;
}

// Get following count for user
export async function getFollowingCount(pool: Pool, userId: number): Promise<number> {
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT COUNT(*) as count FROM user_follows_artist WHERE UserID = ?',
    [userId]
  );
  const result = rows[0] as { count: number };
  return result.count;
}

// Get mutual follows (artists both users follow)
export async function getMutualFollows(pool: Pool, userId1: number, userId2: number): Promise<any[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT a.*, u.Username, u.FirstName, u.LastName
    FROM user_follows_artist ufa1
    JOIN user_follows_artist ufa2 ON ufa1.ArtistID = ufa2.ArtistID
    JOIN artist a ON ufa1.ArtistID = a.ArtistID
    JOIN userprofile u ON a.ArtistID = u.UserID
    WHERE ufa1.UserID = ? AND ufa2.UserID = ?
    ORDER BY u.Username
  `, [userId1, userId2]);

  return rows;
}
