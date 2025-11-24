import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { notificationApi } from '../services/api';
import { NotificationDropdown } from './NotificationDropdown';

interface NotificationBellProps {
  className?: string;
}

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

interface NotificationResponse {
  notifications: Notification[];
  count: number;
  hasMore: boolean;
}

interface UnreadCountResponse {
  unreadCount: number;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const fetchUnreadCount = async () => {
    if (!user?.userId) return;

    try {
      const response = await notificationApi.getUnreadCount(user.userId);
      if (response.ok) {
        const data: UnreadCountResponse = await response.json();
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user?.userId) return;

    try {
      setIsLoading(true);
      const response = await notificationApi.getUserNotifications(user.userId, { limit: 20 });
      if (response.ok) {
        const data: NotificationResponse = await response.json();
        setNotifications(data.notifications);
        setHasLoaded(true);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: number) => {
    if (!user?.userId) return;

    try {
      const response = await notificationApi.markAsRead(notificationId, user.userId);
      if (response.ok) {
        // Update notifications state
        setNotifications(prev => 
          prev.map(notification => 
            notification.NotificationID === notificationId 
              ? { ...notification, IsRead: 1, ReadAt: new Date().toISOString() }
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user?.userId) return;

    try {
      const response = await notificationApi.markAllAsRead(user.userId);
      if (response.ok) {
        // Update notifications state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, IsRead: 1, ReadAt: new Date().toISOString() }))
        );
        
        // Update unread count
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: number) => {
    if (!user?.userId) return;

    try {
      const response = await notificationApi.deleteNotification(notificationId, user.userId);
      if (response.ok) {
        // Update notifications state
        const deletedNotification = notifications.find(n => n.NotificationID === notificationId);
        setNotifications(prev => prev.filter(notification => notification.NotificationID !== notificationId));
        
        // Update unread count if the deleted notification was unread
        if (deletedNotification && !deletedNotification.IsRead) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Handle bell click
  const handleBellClick = () => {
    if (!hasLoaded && !isLoading) {
      fetchNotifications();
    }
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        bellRef.current && 
        dropdownRef.current &&
        !bellRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Fetch unread count on mount and set up polling
  useEffect(() => {
    if (user?.userId) {
      fetchUnreadCount();
      
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      
      return () => clearInterval(interval);
    }
  }, [user?.userId]);

  // Don't render if user is not logged in
  if (!user) return null;

  return (
    <div className={`relative ${className}`} ref={bellRef}>
      <button
        onClick={handleBellClick}
        className="relative p-2 text-gray-600 hover:text-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 rounded-lg"
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {/* Bell Icon */}
        <svg 
          className="w-6 h-6" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" 
          />
        </svg>
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] transform scale-90">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isDropdownOpen && (
        <div ref={dropdownRef}>
          <NotificationDropdown
            notifications={notifications}
            isLoading={isLoading}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDeleteNotification={deleteNotification}
            onClose={() => setIsDropdownOpen(false)}
            unreadCount={unreadCount}
          />
        </div>
      )}
    </div>
  );
};