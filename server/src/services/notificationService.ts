import { Notification } from '@/models/Notification';
import { getIO } from '@/socket';

interface CreateNotificationData {
  userId: string;
  type: 'friend_request' | 'friend_accepted' | 'comment' | 'like' | 'comment_like' | 'system';
  title: string;
  message: string;
  actionUrl?: string;
  fromUser?: string;
  fromUsername?: string;
  metadata?: any;
}

export const createNotification = async (data: CreateNotificationData) => {
  try {
    console.log('📬 Creating notification:', {
      userId: data.userId,
      type: data.type,
      title: data.title,
    });

    const notification = await Notification.create({
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
      actionUrl: data.actionUrl,
      fromUser: data.fromUser,
      fromUsername: data.fromUsername,
      metadata: data.metadata,
      read: false,
    });

    console.log('✅ Notification created:', notification._id);

    // Send real-time notification via Socket.IO
    const io = getIO();
    if (io) {
      const room = `user:${data.userId}`;
      console.log('🔔 Emitting notification to room:', room);
      
      io.to(room).emit('notification', {
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        fromUser: notification.fromUser,
        fromUsername: notification.fromUsername,
        metadata: notification.metadata,
        read: notification.read,
        createdAt: notification.createdAt,
      });
      
      console.log('📡 Notification emitted to Socket.IO');
    } else {
      console.warn('⚠️ Socket.IO not initialized');
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

export const createBulkNotifications = async (notifications: CreateNotificationData[]) => {
  try {
    const created = await Notification.insertMany(notifications);
    
    // Send real-time notifications
    const io = getIO();
    if (io) {
      created.forEach((notification) => {
        io.to(`user:${notification.userId}`).emit('notification', {
          id: notification._id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          actionUrl: notification.actionUrl,
          fromUser: notification.fromUser,
          fromUsername: notification.fromUsername,
          metadata: notification.metadata,
          read: notification.read,
          createdAt: notification.createdAt,
        });
      });
    }

    return created;
  } catch (error) {
    console.error('Create bulk notifications error:', error);
    throw error;
  }
};

export const markAsRead = async (notificationId: string, userId: string) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { read: true },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error('Mark as read error:', error);
    throw error;
  }
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const count = await Notification.countDocuments({
      userId,
      read: false,
    });
    return count;
  } catch (error) {
    console.error('Get unread count error:', error);
    return 0;
  }
};
