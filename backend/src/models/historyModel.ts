import { createPool } from '../database';

const pool = createPool();

export interface ListeningHistory {
  historyId: number;
  userId: number;
  songId: number;
  listenedAt: Date;
  duration?: number;
}

export interface NewListeningHistory {
  userId: number;
  songId: number;
  duration?: number;
}

export const addListeningHistory = async (history: NewListeningHistory) => {
  const sql = `
    INSERT INTO listening_history (UserID, SongID, Duration)
    VALUES (?, ?, ?)
  `;
  
  try {
    const [result] = await pool.query(sql, [history.userId, history.songId, history.duration || null]);
    return result;
  } catch (error: any) {
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      throw new Error('User or song does not exist');
    }
    throw error;
  }
};

export const getUserListeningHistory = async (userId: number, limit?: number) => {
  let sql = `
    SELECT lh.*, s.SongName, s.Duration as SongDuration, s.FilePath,
           u.Username, u.FirstName, u.LastName, a.AlbumName
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    JOIN artist ar ON s.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    LEFT JOIN album a ON s.AlbumID = a.AlbumID
    WHERE lh.UserID = ?
    ORDER BY lh.ListenedAt DESC
  `;
  
  if (limit) {
    sql += ` LIMIT ${limit}`;
  }
  
  const [rows] = await pool.query(sql, [userId]);
  return rows;
};

export const getSongListeningHistory = async (songId: number, limit?: number) => {
  let sql = `
    SELECT lh.*, u.Username, u.FirstName, u.LastName
    FROM listening_history lh
    JOIN userprofile u ON lh.UserID = u.UserID
    WHERE lh.SongID = ?
    ORDER BY lh.ListenedAt DESC
  `;
  
  if (limit) {
    sql += ` LIMIT ${limit}`;
  }
  
  const [rows] = await pool.query(sql, [songId]);
  return rows;
};

export const getRecentListeningHistory = async (userId: number, hours: number = 24, limit?: number) => {
  let sql = `
    SELECT lh.*, s.SongName, s.Duration as SongDuration, s.FilePath,
           u.Username, u.FirstName, u.LastName, a.AlbumName
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    JOIN artist ar ON s.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    LEFT JOIN album a ON s.AlbumID = a.AlbumID
    WHERE lh.UserID = ? AND lh.ListenedAt >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    ORDER BY lh.ListenedAt DESC
  `;
  
  if (limit) {
    sql += ` LIMIT ${limit}`;
  }
  
  const [rows] = await pool.query(sql, [userId, hours]);
  return rows;
};

export const getUserMostPlayedSongs = async (userId: number, limit: number = 10) => {
  const sql = `
    SELECT s.*, u.Username, u.FirstName, u.LastName, a.AlbumName,
           COUNT(lh.HistoryID) as playCount,
           SUM(lh.Duration) as totalListenTime
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    JOIN artist ar ON s.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    LEFT JOIN album a ON s.AlbumID = a.AlbumID
    WHERE lh.UserID = ?
    GROUP BY s.SongID
    ORDER BY playCount DESC, totalListenTime DESC
    LIMIT ?;
  `;
  
  const [rows] = await pool.query(sql, [userId, limit]);
  return rows;
};

export const getUserMostPlayedArtists = async (userId: number, limit: number = 10) => {
  const sql = `
    SELECT ar.*, u.Username, u.FirstName, u.LastName,
           COUNT(lh.HistoryID) as playCount,
           SUM(lh.Duration) as totalListenTime
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    JOIN artist ar ON s.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    WHERE lh.UserID = ?
    GROUP BY ar.ArtistID
    ORDER BY playCount DESC, totalListenTime DESC
    LIMIT ?;
  `;
  
  const [rows] = await pool.query(sql, [userId, limit]);
  return rows;
};

export const getGlobalMostPlayedSongs = async (limit: number = 10) => {
  const sql = `
    SELECT s.*, u.Username, u.FirstName, u.LastName, a.AlbumName,
           COUNT(lh.HistoryID) as playCount,
           SUM(lh.Duration) as totalListenTime
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    JOIN artist ar ON s.ArtistID = ar.ArtistID
    JOIN userprofile u ON ar.ArtistID = u.UserID
    LEFT JOIN album a ON s.AlbumID = a.AlbumID
    GROUP BY s.SongID
    ORDER BY playCount DESC, totalListenTime DESC
    LIMIT ?;
  `;
  
  const [rows] = await pool.query(sql, [limit]);
  return rows;
};

export const deleteUserListeningHistory = async (userId: number) => {
  const sql = `DELETE FROM listening_history WHERE UserID = ?`;
  const [result] = await pool.query(sql, [userId]);
  return result;
};

export const deleteSongListeningHistory = async (songId: number) => {
  const sql = `DELETE FROM listening_history WHERE SongID = ?`;
  const [result] = await pool.query(sql, [songId]);
  return result;
};

export const getListeningStats = async (userId: number) => {
  const sql = `
    SELECT 
      COUNT(DISTINCT lh.SongID) as uniqueSongsPlayed,
      COUNT(lh.HistoryID) as totalPlays,
      SUM(lh.Duration) as totalListenTime,
      COUNT(DISTINCT DATE(lh.ListenedAt)) as activeDays,
      MIN(lh.ListenedAt) as firstListen,
      MAX(lh.ListenedAt) as lastListen
    FROM listening_history lh
    WHERE lh.UserID = ?;
  `;
  
  const [rows] = await pool.query(sql, [userId]);
  return (rows as any[])[0];
};

