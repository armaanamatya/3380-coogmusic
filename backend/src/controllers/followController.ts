import { Database } from 'better-sqlite3';

// Follow an artist
export function followArtist(db: Database, userId: number, artistId: number): void {
  // Verify user exists
  const user = db.prepare('SELECT UserID FROM userprofile WHERE UserID = ?').get(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify artist exists
  const artist = db.prepare('SELECT ArtistID FROM artist WHERE ArtistID = ?').get(artistId);
  if (!artist) {
    throw new Error('Artist not found');
  }

  // Check if already following
  const existingFollow = db.prepare('SELECT * FROM user_follows_artist WHERE UserID = ? AND ArtistID = ?')
    .get(userId, artistId);
  if (existingFollow) {
    throw new Error('User is already following this artist');
  }

  db.prepare('INSERT INTO user_follows_artist (UserID, ArtistID) VALUES (?, ?)').run(userId, artistId);
}

// Unfollow an artist
export function unfollowArtist(db: Database, userId: number, artistId: number): void {
  const result = db.prepare('DELETE FROM user_follows_artist WHERE UserID = ? AND ArtistID = ?')
    .run(userId, artistId);

  if (result.changes === 0) {
    throw new Error('Follow relationship not found');
  }
}

// Get artists followed by user
export function getUserFollowing(
  db: Database,
  userId: number,
  filters: { page?: number; limit?: number }
): any[] {
  const { page = 1, limit = 50 } = filters;

  return db.prepare(`
    SELECT a.*, u.Username, u.FirstName, u.LastName, u.ProfilePicture, ufa.FollowedAt
    FROM user_follows_artist ufa
    JOIN artist a ON ufa.ArtistID = a.ArtistID
    JOIN userprofile u ON a.ArtistID = u.UserID
    WHERE ufa.UserID = ?
    ORDER BY ufa.FollowedAt DESC
    LIMIT ? OFFSET ?
  `).all(userId, limit, (page - 1) * limit);
}

// Get followers of an artist
export function getArtistFollowers(
  db: Database,
  artistId: number,
  filters: { page?: number; limit?: number }
): any[] {
  const { page = 1, limit = 50 } = filters;

  return db.prepare(`
    SELECT u.UserID, u.Username, u.FirstName, u.LastName, u.ProfilePicture, ufa.FollowedAt
    FROM user_follows_artist ufa
    JOIN userprofile u ON ufa.UserID = u.UserID
    WHERE ufa.ArtistID = ?
    ORDER BY ufa.FollowedAt DESC
    LIMIT ? OFFSET ?
  `).all(artistId, limit, (page - 1) * limit);
}

// Check if user is following artist
export function isFollowingArtist(db: Database, userId: number, artistId: number): boolean {
  const follow = db.prepare('SELECT 1 FROM user_follows_artist WHERE UserID = ? AND ArtistID = ?')
    .get(userId, artistId);
  return !!follow;
}

// Get follower count for artist
export function getFollowerCount(db: Database, artistId: number): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM user_follows_artist WHERE ArtistID = ?')
    .get(artistId) as { count: number };
  return result.count;
}

// Get following count for user
export function getFollowingCount(db: Database, userId: number): number {
  const result = db.prepare('SELECT COUNT(*) as count FROM user_follows_artist WHERE UserID = ?')
    .get(userId) as { count: number };
  return result.count;
}

// Get mutual follows (artists both users follow)
export function getMutualFollows(db: Database, userId1: number, userId2: number): any[] {
  return db.prepare(`
    SELECT a.*, u.Username, u.FirstName, u.LastName
    FROM user_follows_artist ufa1
    JOIN user_follows_artist ufa2 ON ufa1.ArtistID = ufa2.ArtistID
    JOIN artist a ON ufa1.ArtistID = a.ArtistID
    JOIN userprofile u ON a.ArtistID = u.UserID
    WHERE ufa1.UserID = ? AND ufa2.UserID = ?
    ORDER BY u.Username
  `).all(userId1, userId2);
}

