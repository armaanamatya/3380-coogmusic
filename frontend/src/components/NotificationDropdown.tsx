import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';

interface Notification {
  NotificationID: number;
  UserID: number;
  ArtistID: number;
  SongID: number;
  NotificationType: 'new_song' | 'new_album' | 'artist_update';
  Message: string;
  IsRead: number;
  CreatedAt: string;
  ReadAt?: string;
  ArtistFirstName: string;
  ArtistLastName: string;
  ArtistUsername: string;
  SongName: string;
  SongFilePath?: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  isLoading: boolean;
  onMarkAsRead: (notificationId: number) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (notificationId: number) => void;
  onClose: () => void;
  unreadCount: number;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClose,
  unreadCount
}) => {
  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.IsRead) {
      onMarkAsRead(notification.NotificationID);
    }
    // Could add navigation to the song here in the future
    // For now, just mark as read
  };

  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_song':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        );
      case 'new_album':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        );
    }
  };

  return (
    <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Mark All Read Button */}
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
          >
            Mark all as read ({unreadCount})
          </button>
        )}
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-2">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <p className="text-lg font-medium mb-2">No notifications</p>
            <p className="text-sm">You're all caught up! We'll notify you when artists you follow post new songs.</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => (
              <div
                key={notification.NotificationID}
                className={`relative p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer group ${
                  !notification.IsRead ? 'bg-red-50 border-l-4 border-l-red-500' : ''
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                {/* Unread indicator */}
                {!notification.IsRead && (
                  <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full"></div>
                )}

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNotification(notification.NotificationID);
                  }}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-1 rounded"
                  aria-label="Delete notification"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                <div className="flex items-start space-x-3 pr-6">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.NotificationType)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${!notification.IsRead ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                      {notification.Message}
                    </p>
                    
                    {/* Artist and Time */}
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        @{notification.ArtistUsername}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatTimeAgo(notification.CreatedAt)}
                      </span>
                    </div>

                    {/* Song name */}
                    <div className="mt-1">
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">
                        🎵 {notification.SongName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
          <button 
            className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
            onClick={onClose}
          >
            View All Notifications
          </button>
        </div>
      )}
    </div>
  );
};