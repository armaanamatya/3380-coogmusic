import { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export interface ListeningHistory {
  HistoryID: number;
  UserID: number;
  SongID: number;
  ListenedAt: string;
  Duration: number | null;
}

export interface AddListeningHistoryData {
  userId: number;
  songId: number;
  duration?: number;
}

// Add listening history entry
export async function addListeningHistory(
  pool: Pool,
  historyData: AddListeningHistoryData
): Promise<{ historyId: number }> {
  // Verify user exists
  const [users] = await pool.execute<RowDataPacket[]>('SELECT UserID FROM userprofile WHERE UserID = ?', [historyData.userId]);
  if (users.length === 0) {
    throw new Error('User not found');
  }

  // Verify song exists
  const [songs] = await pool.execute<RowDataPacket[]>('SELECT SongID FROM song WHERE SongID = ?', [historyData.songId]);
  if (songs.length === 0) {
    throw new Error('Song not found');
  }

  const [result] = await pool.execute<ResultSetHeader>(`
    INSERT INTO listening_history (UserID, SongID, Duration)
    VALUES (?, ?, ?)
  `, [
    historyData.userId,
    historyData.songId,
    historyData.duration || null
  ]);

  return { historyId: result.insertId };
}

// Get user's listening history
export async function getUserListeningHistory(
  pool: Pool,
  userId: number,
  filters: { page?: number; limit?: number }
): Promise<any[]> {
  const { page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT lh.*, s.SongName, s.Duration as SongDuration, s.FilePath,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           al.AlbumName, g.GenreName
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON s.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE lh.UserID = ?
    ORDER BY lh.ListenedAt DESC
    LIMIT ? OFFSET ?
  `, [userId, parseInt(String(limit), 10), parseInt(String(offset), 10)]);

  return rows;
}

// Get song's listening history
export async function getSongListeningHistory(
  pool: Pool,
  songId: number,
  filters: { page?: number; limit?: number }
): Promise<any[]> {
  const { page = 1, limit = 50 } = filters;
  const offset = (page - 1) * limit;

  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT lh.*, u.Username, u.FirstName, u.LastName
    FROM listening_history lh
    JOIN userprofile u ON lh.UserID = u.UserID
    WHERE lh.SongID = ?
    ORDER BY lh.ListenedAt DESC
    LIMIT ? OFFSET ?
  `, [songId, limit, offset]);

  return rows;
}

// Get recent listening history
export async function getRecentListeningHistory(
  pool: Pool,
  userId: number,
  hours: number,
  limit?: number
): Promise<any[]> {
  let query = `
    SELECT lh.*, s.SongName, s.Duration as SongDuration, s.FilePath,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           al.AlbumName, g.GenreName
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON s.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE lh.UserID = ? AND lh.ListenedAt >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    ORDER BY lh.ListenedAt DESC
  `;

  const params: any[] = [userId, hours];

  if (limit) {
    query += ` LIMIT ?`;
    params.push(limit);
  }

  const [rows] = await pool.execute<RowDataPacket[]>(query, params);
  return rows;
}

// Get user's most played songs
export async function getUserMostPlayedSongs(
  pool: Pool,
  userId: number,
  limit: number
): Promise<any[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT s.*, al.AlbumName, g.GenreName,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           COUNT(lh.HistoryID) as playCount,
           SUM(lh.Duration) as totalListenTime
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON s.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE lh.UserID = ?
    GROUP BY s.SongID
    ORDER BY playCount DESC, totalListenTime DESC
    LIMIT ?
  `, [userId, parseInt(String(limit), 10)]);

  return rows;
}

// Get user's most played artists
export async function getUserMostPlayedArtists(
  pool: Pool,
  userId: number,
  limit: number
): Promise<any[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT a.*, up.Username, up.FirstName, up.LastName,
           COUNT(lh.HistoryID) as playCount,
           SUM(lh.Duration) as totalListenTime
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    JOIN artist a ON s.ArtistID = a.ArtistID
    JOIN userprofile up ON a.ArtistID = up.UserID
    WHERE lh.UserID = ?
    GROUP BY a.ArtistID
    ORDER BY playCount DESC, totalListenTime DESC
    LIMIT ?
  `, [userId, parseInt(String(limit), 10)]);

  return rows;
}

// Get globally most played songs
export async function getGlobalMostPlayedSongs(pool: Pool, limit: number): Promise<any[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT s.*, al.AlbumName, g.GenreName,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           COUNT(lh.HistoryID) as playCount,
           SUM(lh.Duration) as totalListenTime
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON s.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    GROUP BY s.SongID
    ORDER BY playCount DESC, totalListenTime DESC
    LIMIT ?
  `, [parseInt(String(limit), 10)]);

  return rows;
}

// Delete user's listening history
export async function deleteUserListeningHistory(pool: Pool, userId: number): Promise<void> {
  await pool.execute('DELETE FROM listening_history WHERE UserID = ?', [userId]);
}

// Delete song's listening history
export async function deleteSongListeningHistory(pool: Pool, songId: number): Promise<void> {
  await pool.execute('DELETE FROM listening_history WHERE SongID = ?', [songId]);
}

// Get user's listening statistics
export async function getListeningStats(pool: Pool, userId: number): Promise<any> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT 
      COUNT(DISTINCT lh.SongID) as uniqueSongsPlayed,
      COUNT(lh.HistoryID) as totalPlays,
      SUM(lh.Duration) as totalListenTime,
      COUNT(DISTINCT DATE(lh.ListenedAt)) as activeDays,
      MIN(lh.ListenedAt) as firstListen,
      MAX(lh.ListenedAt) as lastListen
    FROM listening_history lh
    WHERE lh.UserID = ?
  `, [userId]);

  return rows[0];
}

// Get trending songs (most played in last N days)
export async function getTrendingSongs(pool: Pool, days: number, limit: number): Promise<any[]> {
  const [rows] = await pool.execute<RowDataPacket[]>(`
    SELECT s.*, al.AlbumName, g.GenreName,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           COUNT(lh.HistoryID) as playCount
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON s.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE lh.ListenedAt >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY s.SongID
    ORDER BY playCount DESC
    LIMIT ?
  `, [days, parseInt(String(limit), 10)]);
  
  return rows;
}
