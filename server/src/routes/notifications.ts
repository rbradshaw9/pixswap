import { Router } from 'express';
import { protect } from '@/middleware/auth';
import { Notification } from '@/models/Notification';

const router = Router();

// Get user's notifications
router.get('/', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const { limit = 50, skip = 0, unreadOnly = false } = req.query;

    const query: any = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .skip(parseInt(skip as string))
      .lean();

    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get notifications',
    });
  }
});

// Get unread count
router.get('/unread-count', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const count = await Notification.countDocuments({
      userId,
      read: false,
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get unread count',
    });
  }
});

// Mark notification as read
router.patch('/:id/read', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    console.error('Mark notification read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark notification as read',
    });
  }
});

// Mark all as read
router.patch('/mark-all-read', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;

    await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error: any) {
    console.error('Mark all read error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to mark all as read',
    });
  }
});

// Delete notification
router.delete('/:id', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error: any) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete notification',
    });
  }
});

// Delete all read notifications
router.delete('/clear-read', protect, async (req: any, res: any) => {
  try {
    const userId = req.user._id;

    await Notification.deleteMany({
      userId,
      read: true,
    });

    res.json({
      success: true,
      message: 'Read notifications cleared',
    });
  } catch (error: any) {
    console.error('Clear read notifications error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to clear notifications',
    });
  }
});

export default router;
