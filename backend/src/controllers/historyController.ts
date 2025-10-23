import { Database } from 'better-sqlite3';

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
export function addListeningHistory(
  db: Database,
  historyData: AddListeningHistoryData
): { historyId: number } {
  // Verify user exists
  const user = db.prepare('SELECT UserID FROM userprofile WHERE UserID = ?').get(historyData.userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Verify song exists
  const song = db.prepare('SELECT SongID FROM song WHERE SongID = ?').get(historyData.songId);
  if (!song) {
    throw new Error('Song not found');
  }

  const stmt = db.prepare(`
    INSERT INTO listening_history (UserID, SongID, Duration)
    VALUES (?, ?, ?)
  `);

  const result = stmt.run(
    historyData.userId,
    historyData.songId,
    historyData.duration || null
  );

  return { historyId: Number(result.lastInsertRowid) };
}

// Get user's listening history
export function getUserListeningHistory(
  db: Database,
  userId: number,
  filters: { page?: number; limit?: number }
): any[] {
  const { page = 1, limit = 50 } = filters;

  return db.prepare(`
    SELECT lh.*, s.SongName, s.Duration as SongDuration, s.FilePath,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           al.AlbumName, g.GenreName
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON al.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE lh.UserID = ?
    ORDER BY lh.ListenedAt DESC
    LIMIT ? OFFSET ?
  `).all(userId, limit, (page - 1) * limit);
}

// Get song's listening history
export function getSongListeningHistory(
  db: Database,
  songId: number,
  filters: { page?: number; limit?: number }
): any[] {
  const { page = 1, limit = 50 } = filters;

  return db.prepare(`
    SELECT lh.*, u.Username, u.FirstName, u.LastName
    FROM listening_history lh
    JOIN userprofile u ON lh.UserID = u.UserID
    WHERE lh.SongID = ?
    ORDER BY lh.ListenedAt DESC
    LIMIT ? OFFSET ?
  `).all(songId, limit, (page - 1) * limit);
}

// Get recent listening history
export function getRecentListeningHistory(
  db: Database,
  userId: number,
  hours: number,
  limit?: number
): any[] {
  let query = `
    SELECT lh.*, s.SongName, s.Duration as SongDuration, s.FilePath,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           al.AlbumName, g.GenreName
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON al.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE lh.UserID = ? AND lh.ListenedAt >= datetime('now', '-' || ? || ' hours')
    ORDER BY lh.ListenedAt DESC
  `;

  if (limit) {
    query += ` LIMIT ${limit}`;
  }

  return db.prepare(query).all(userId, hours);
}

// Get user's most played songs
export function getUserMostPlayedSongs(
  db: Database,
  userId: number,
  limit: number
): any[] {
  return db.prepare(`
    SELECT s.*, al.AlbumName, g.GenreName,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           COUNT(lh.HistoryID) as playCount,
           SUM(lh.Duration) as totalListenTime
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON al.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE lh.UserID = ?
    GROUP BY s.SongID
    ORDER BY playCount DESC, totalListenTime DESC
    LIMIT ?
  `).all(userId, limit);
}

// Get user's most played artists
export function getUserMostPlayedArtists(
  db: Database,
  userId: number,
  limit: number
): any[] {
  return db.prepare(`
    SELECT a.*, up.Username, up.FirstName, up.LastName,
           COUNT(lh.HistoryID) as playCount,
           SUM(lh.Duration) as totalListenTime
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    JOIN artist a ON al.ArtistID = a.ArtistID
    JOIN userprofile up ON a.ArtistID = up.UserID
    WHERE lh.UserID = ?
    GROUP BY a.ArtistID
    ORDER BY playCount DESC, totalListenTime DESC
    LIMIT ?
  `).all(userId, limit);
}

// Get globally most played songs
export function getGlobalMostPlayedSongs(db: Database, limit: number): any[] {
  return db.prepare(`
    SELECT s.*, al.AlbumName, g.GenreName,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           COUNT(lh.HistoryID) as playCount,
           SUM(lh.Duration) as totalListenTime
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON al.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    GROUP BY s.SongID
    ORDER BY playCount DESC, totalListenTime DESC
    LIMIT ?
  `).all(limit);
}

// Delete user's listening history
export function deleteUserListeningHistory(db: Database, userId: number): void {
  db.prepare('DELETE FROM listening_history WHERE UserID = ?').run(userId);
}

// Delete song's listening history
export function deleteSongListeningHistory(db: Database, songId: number): void {
  db.prepare('DELETE FROM listening_history WHERE SongID = ?').run(songId);
}

// Get user's listening statistics
export function getListeningStats(db: Database, userId: number): any {
  const stats = db.prepare(`
    SELECT 
      COUNT(DISTINCT lh.SongID) as uniqueSongsPlayed,
      COUNT(lh.HistoryID) as totalPlays,
      SUM(lh.Duration) as totalListenTime,
      COUNT(DISTINCT DATE(lh.ListenedAt)) as activeDays,
      MIN(lh.ListenedAt) as firstListen,
      MAX(lh.ListenedAt) as lastListen
    FROM listening_history lh
    WHERE lh.UserID = ?
  `).get(userId);

  return stats;
}

// Get trending songs (most played in last N days)
export function getTrendingSongs(db: Database, days: number, limit: number): any[] {
  return db.prepare(`
    SELECT s.*, al.AlbumName, g.GenreName,
           up.FirstName AS ArtistFirstName, up.LastName AS ArtistLastName,
           COUNT(lh.HistoryID) as playCount
    FROM listening_history lh
    JOIN song s ON lh.SongID = s.SongID
    LEFT JOIN album al ON s.AlbumID = al.AlbumID
    LEFT JOIN artist a ON al.ArtistID = a.ArtistID
    LEFT JOIN userprofile up ON a.ArtistID = up.UserID
    LEFT JOIN genre g ON s.GenreID = g.GenreID
    WHERE lh.ListenedAt >= datetime('now', '-' || ? || ' days')
    GROUP BY s.SongID
    ORDER BY playCount DESC
    LIMIT ?
  `).all(days, limit);
}

