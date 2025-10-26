import { createPool } from '../database';

const pool = createPool();

export interface UserFollow {
  userId: number;
  artistId: number;
  followedAt: Date;
}

export const followArtist = async (userId: number, artistId: number) => {
  const sql = `
    INSERT INTO user_follows_artist (UserID, ArtistID)
    VALUES (?, ?)
  `;
  
  try {
    const result = pool.prepare(sql).run(...([userId, artistId]));
    return result;
  } catch (error: any) {
    if (error.code === error.message && error.message.includes('UNIQUE constraint failed')) {
      throw new Error('User is already following this artist');
    }
    if (error.code === error.message && error.message.includes('FOREIGN KEY constraint failed')) {
      throw new Error('User or artist does not exist');
    }
    throw error;
  }
};

export const unfollowArtist = async (userId: number, artistId: number) => {
  const sql = `DELETE FROM user_follows_artist WHERE UserID = ? AND ArtistID = ?`;
  const result = pool.prepare(sql).run(...([userId, artistId]));
  return result;
};

export const getUserFollowing = async (userId: number) => {
  const sql = `
    SELECT a.*, u.Username, u.FirstName, u.LastName, ufa.FollowedAt
    FROM user_follows_artist ufa
    JOIN artist a ON ufa.ArtistID = a.ArtistID
    JOIN userprofile u ON a.ArtistID = u.UserID
    WHERE ufa.UserID = ?
    ORDER BY ufa.FollowedAt DESC;
  `;
  
  const rows = pool.prepare(sql).all(userId);
  return rows;
};

export const getArtistFollowers = async (artistId: number) => {
  const sql = `
    SELECT u.*, ufa.FollowedAt
    FROM user_follows_artist ufa
    JOIN userprofile u ON ufa.UserID = u.UserID
    WHERE ufa.ArtistID = ?
    ORDER BY ufa.FollowedAt DESC;
  `;
  
  const rows = pool.prepare(sql).all(artistId);
  return rows;
};

export const isFollowingArtist = async (userId: number, artistId: number): Promise<boolean> => {
  const sql = `SELECT 1 FROM user_follows_artist WHERE UserID = ? AND ArtistID = ?`;
  const rows = pool.prepare(sql).all(userId, artistId);
  return (rows as any[]).length > 0;
};

export const getFollowerCount = async (artistId: number): Promise<number> => {
  const sql = `SELECT COUNT(*) as count FROM user_follows_artist WHERE ArtistID = ?`;
  const rows = pool.prepare(sql).all(artistId);
  return (rows as any[])[0].count;
};

export const getFollowingCount = async (userId: number): Promise<number> => {
  const sql = `SELECT COUNT(*) as count FROM user_follows_artist WHERE UserID = ?`;
  const rows = pool.prepare(sql).all(userId);
  return (rows as any[])[0].count;
};

export const getMutualFollows = async (userId1: number, userId2: number) => {
  const sql = `
    SELECT a.*, u.Username, u.FirstName, u.LastName
    FROM user_follows_artist ufa1
    JOIN user_follows_artist ufa2 ON ufa1.ArtistID = ufa2.ArtistID
    JOIN artist a ON ufa1.ArtistID = a.ArtistID
    JOIN userprofile u ON a.ArtistID = u.UserID
    WHERE ufa1.UserID = ? AND ufa2.UserID = ?
    ORDER BY u.Username;
  `;
  
  const rows = pool.prepare(sql).all(userId1, userId2);
  return rows;
};

