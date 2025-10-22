import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';
import toast from 'react-hot-toast';

interface Notification {
  _id?: string;
  id?: string;
  type: 'friend_request' | 'friend_accepted' | 'comment' | 'like' | 'comment_like' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  fromUser?: string;
  fromUsername?: string;
  metadata?: any;
  read: boolean;
  createdAt: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socket = useSocket();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 20 },
      });

      if (response.data.success) {
        setNotifications(response.data.data);
        setUnreadCount(response.data.unreadCount);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  useEffect(() => {
    if (!socket) return;

    // Listen for new notifications
    socket.on('notification', (notification: Notification) => {
      console.log('📬 New notification:', notification);
      
      // Add to notifications list
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show toast notification
      const icon = {
        friend_request: '👋',
        friend_accepted: '✅',
        comment: '💬',
        like: '❤️',
        comment_like: '👍',
        system: '🔔',
      }[notification.type] || '📢';

      toast.success(
        <div>
          <div className="font-semibold">{notification.title}</div>
          <div className="text-sm text-gray-600">{notification.message}</div>
        </div>,
        {
          icon,
          duration: 4000,
        }
      );
    });

    return () => {
      socket.off('notification');
    };
  }, [socket]);

  const value = {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
