import { notificationModel } from '../models/notificationModel.js';

export const notificationController = {
  // Get notifications for a user
  async getUserNotifications(req, res) {
    try {
      const userId = parseInt(req.url.split('/')[3]);
      const url = new URL(req.url, `http://${req.headers.host}`);
      const limit = parseInt(url.searchParams.get('limit')) || 50;
      const offset = parseInt(url.searchParams.get('offset')) || 0;

      if (!userId || isNaN(userId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Valid user ID is required' }));
        return;
      }

      const notifications = await notificationModel.getUserNotifications(userId, limit, offset);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        notifications,
        count: notifications.length,
        hasMore: notifications.length === limit
      }));
    } catch (error) {
      console.error('Error fetching user notifications:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch notifications' }));
    }
  },

  // Get unread notification count for a user
  async getUnreadCount(req, res) {
    try {
      const userId = parseInt(req.url.split('/')[4]);

      if (!userId || isNaN(userId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Valid user ID is required' }));
        return;
      }

      const unreadCount = await notificationModel.getUnreadCount(userId);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ unreadCount }));
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch unread count' }));
    }
  },

  // Mark notification as read
  async markAsRead(req, res) {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        const { notificationId, userId } = JSON.parse(body);

        if (!notificationId || !userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Notification ID and user ID are required' }));
          return;
        }

        const success = await notificationModel.markAsRead(notificationId, userId);
        
        if (success) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Notification marked as read' }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Notification not found or access denied' }));
        }
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to mark notification as read' }));
    }
  },

  // Mark all notifications as read for a user
  async markAllAsRead(req, res) {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        const { userId } = JSON.parse(body);

        if (!userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'User ID is required' }));
          return;
        }

        const updatedCount = await notificationModel.markAllAsRead(userId);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          success: true, 
          message: 'All notifications marked as read',
          updatedCount 
        }));
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to mark all notifications as read' }));
    }
  },

  // Delete notification
  async deleteNotification(req, res) {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        const { notificationId, userId } = JSON.parse(body);

        if (!notificationId || !userId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Notification ID and user ID are required' }));
          return;
        }

        const success = await notificationModel.deleteNotification(notificationId, userId);
        
        if (success) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Notification deleted' }));
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Notification not found or access denied' }));
        }
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to delete notification' }));
    }
  },

  // Get notification settings for a user
  async getNotificationSettings(req, res) {
    try {
      const userId = parseInt(req.url.split('/')[4]);

      if (!userId || isNaN(userId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Valid user ID is required' }));
        return;
      }

      const settings = await notificationModel.getNotificationSettings(userId);
      
      if (settings) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ settings }));
      } else {
        // Create default settings if not found
        const defaultSettings = {
          NewSongNotifications: 1,
          NewAlbumNotifications: 1,
          ArtistUpdateNotifications: 1,
          OnlyVerifiedArtists: 0,
          EmailNotifications: 0
        };
        
        await notificationModel.updateNotificationSettings(userId, defaultSettings);
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ settings: { UserID: userId, ...defaultSettings } }));
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch notification settings' }));
    }
  },

  // Update notification settings for a user
  async updateNotificationSettings(req, res) {
    try {
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        const userId = parseInt(req.url.split('/')[4]);
        const settings = JSON.parse(body);

        if (!userId || isNaN(userId)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Valid user ID is required' }));
          return;
        }

        // Validate settings
        const validSettings = {
          NewSongNotifications: settings.NewSongNotifications ? 1 : 0,
          NewAlbumNotifications: settings.NewAlbumNotifications ? 1 : 0,
          ArtistUpdateNotifications: settings.ArtistUpdateNotifications ? 1 : 0,
          OnlyVerifiedArtists: settings.OnlyVerifiedArtists ? 1 : 0,
          EmailNotifications: settings.EmailNotifications ? 1 : 0
        };

        const success = await notificationModel.updateNotificationSettings(userId, validSettings);
        
        if (success) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ 
            success: true, 
            message: 'Notification settings updated',
            settings: { UserID: userId, ...validSettings }
          }));
        } else {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to update notification settings' }));
        }
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to update notification settings' }));
    }
  },

  // Get recent notifications (for polling/real-time updates)
  async getRecentNotifications(req, res) {
    try {
      const userId = parseInt(req.url.split('/')[4]);
      const url = new URL(req.url, `http://${req.headers.host}`);
      const since = url.searchParams.get('since');

      if (!userId || isNaN(userId)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Valid user ID is required' }));
        return;
      }

      if (!since) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Since parameter is required' }));
        return;
      }

      const notifications = await notificationModel.getRecentNotifications(userId, since);
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        notifications,
        count: notifications.length
      }));
    } catch (error) {
      console.error('Error fetching recent notifications:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch recent notifications' }));
    }
  }
};