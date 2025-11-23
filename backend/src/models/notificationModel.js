import { getPool } from '../database.js';

export const notificationModel = {
  // Get notifications for a specific user
  async getUserNotifications(userId, limit = 50, offset = 0) {
    const pool = await getPool();
    const query = `
      SELECT 
        n.NotificationID,
        n.UserID,
        n.ArtistID,
        n.SongID,
        n.NotificationType,
        n.Message,
        n.IsRead,
        n.CreatedAt,
        n.ReadAt,
        up.FirstName as ArtistFirstName,
        up.LastName as ArtistLastName,
        up.Username as ArtistUsername,
        s.SongName,
        s.FilePath as SongFilePath
      FROM notifications n
      INNER JOIN userprofile up ON n.ArtistID = up.UserID
      INNER JOIN song s ON n.SongID = s.SongID
      WHERE n.UserID = ?
      ORDER BY n.CreatedAt DESC
      LIMIT ? OFFSET ?
    `;
    
    const [rows] = await pool.query(query, [userId, limit, offset]);
    return rows;
  },

  // Get unread notification count for a user
  async getUnreadCount(userId) {
    const pool = await getPool();
    const query = `
      SELECT COUNT(*) as unreadCount
      FROM notifications
      WHERE UserID = ? AND IsRead = 0
    `;
    
    const [rows] = await pool.query(query, [userId]);
    return rows[0]?.unreadCount || 0;
  },

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    const pool = await getPool();
    const query = `
      UPDATE notifications 
      SET IsRead = 1, ReadAt = NOW()
      WHERE NotificationID = ? AND UserID = ?
    `;
    
    const [result] = await pool.query(query, [notificationId, userId]);
    return result.affectedRows > 0;
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    const pool = await getPool();
    const query = `
      UPDATE notifications 
      SET IsRead = 1, ReadAt = NOW()
      WHERE UserID = ? AND IsRead = 0
    `;
    
    const [result] = await pool.query(query, [userId]);
    return result.affectedRows;
  },

  // Delete notification
  async deleteNotification(notificationId, userId) {
    const pool = await getPool();
    const query = `
      DELETE FROM notifications 
      WHERE NotificationID = ? AND UserID = ?
    `;
    
    const [result] = await pool.query(query, [notificationId, userId]);
    return result.affectedRows > 0;
  },

  // Get notification settings for a user
  async getNotificationSettings(userId) {
    const pool = await getPool();
    const query = `
      SELECT 
        UserID,
        NewSongNotifications,
        NewAlbumNotifications,
        ArtistUpdateNotifications,
        OnlyVerifiedArtists,
        EmailNotifications,
        CreatedAt,
        UpdatedAt
      FROM notification_settings
      WHERE UserID = ?
    `;
    
    const [rows] = await pool.query(query, [userId]);
    return rows[0] || null;
  },

  // Update notification settings for a user
  async updateNotificationSettings(userId, settings) {
    const pool = await getPool();
    const {
      NewSongNotifications,
      NewAlbumNotifications,
      ArtistUpdateNotifications,
      OnlyVerifiedArtists,
      EmailNotifications
    } = settings;

    const query = `
      INSERT INTO notification_settings (
        UserID, NewSongNotifications, NewAlbumNotifications, 
        ArtistUpdateNotifications, OnlyVerifiedArtists, EmailNotifications
      ) VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        NewSongNotifications = VALUES(NewSongNotifications),
        NewAlbumNotifications = VALUES(NewAlbumNotifications),
        ArtistUpdateNotifications = VALUES(ArtistUpdateNotifications),
        OnlyVerifiedArtists = VALUES(OnlyVerifiedArtists),
        EmailNotifications = VALUES(EmailNotifications),
        UpdatedAt = NOW()
    `;
    
    const [result] = await pool.query(query, [
      userId,
      NewSongNotifications,
      NewAlbumNotifications,
      ArtistUpdateNotifications,
      OnlyVerifiedArtists,
      EmailNotifications
    ]);
    
    return result.affectedRows > 0;
  },

  // Create a manual notification (for admin use or special cases)
  async createNotification(userId, artistId, songId, notificationType, message) {
    const pool = await getPool();
    const query = `
      INSERT INTO notifications (UserID, ArtistID, SongID, NotificationType, Message, CreatedAt)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;
    
    const [result] = await pool.query(query, [userId, artistId, songId, notificationType, message]);
    return result.insertId;
  },

  // Get recent notifications for a user (useful for real-time updates)
  async getRecentNotifications(userId, since) {
    const pool = await getPool();
    const query = `
      SELECT 
        n.NotificationID,
        n.UserID,
        n.ArtistID,
        n.SongID,
        n.NotificationType,
        n.Message,
        n.IsRead,
        n.CreatedAt,
        n.ReadAt,
        up.FirstName as ArtistFirstName,
        up.LastName as ArtistLastName,
        up.Username as ArtistUsername,
        s.SongName,
        s.FilePath as SongFilePath
      FROM notifications n
      INNER JOIN userprofile up ON n.ArtistID = up.UserID
      INNER JOIN song s ON n.SongID = s.SongID
      WHERE n.UserID = ? AND n.CreatedAt > ?
      ORDER BY n.CreatedAt DESC
    `;
    
    const [rows] = await pool.query(query, [userId, since]);
    return rows;
  }
};