import { Router } from 'express';
import { Types } from 'mongoose';
import { protect } from '@/middleware/auth';
import { upload } from '@/middleware/upload';
import { ChatRoom, Message, User, Content } from '@/models';
import { ChatRoomType, MessageStatus, MessageType } from '@/types';
import { getIO } from '@/socket';
import { createNotification } from '@/services/notificationService';

const router = Router();

const formatParticipant = (user: any) => ({
  _id: user._id.toString(),
  username: user.username,
  displayName: user.displayName || user.username,
  avatar: user.avatar || null,
});

const formatMessage = (message: any) => ({
  _id: message._id.toString(),
  chatRoom: message.chatRoom.toString(),
  type: message.type,
  content: message.content,
  mediaUrl: message.mediaUrl || null,
  status: message.status,
  createdAt: message.createdAt,
  sender: message.sender ? formatParticipant(message.sender) : null,
});

const formatRoom = async (
  room: any,
  currentUserId: string,
  currentUserObjectId: Types.ObjectId
) => {
  const unreadCount = await Message.countDocuments({
    chatRoom: room._id,
    sender: { $ne: currentUserObjectId },
    status: { $ne: MessageStatus.READ },
  });

  return {
    _id: room._id.toString(),
    type: room.type,
    name: room.name,
    description: room.description,
    avatar: room.avatar,
    lastActivity: room.lastActivity,
    unreadCount,
    participants: (room.participants || []).map(formatParticipant),
    lastMessage: room.lastMessage ? formatMessage(room.lastMessage) : null,
    createdAt: room.createdAt,
  };
};

router.get('/rooms', protect, async (req: any, res: any) => {
  try {
    const currentUserId = req.user._id.toString();
    const currentUserObjectId = new Types.ObjectId(currentUserId);
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 25, 100);

    const rooms = await ChatRoom.find({ participants: currentUserObjectId })
      .sort({ lastActivity: -1 })
      .limit(limit)
      .populate('participants', 'username displayName avatar')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username displayName avatar' },
      })
      .lean();

    const formatted = await Promise.all(
      rooms.map((room) => formatRoom(room, currentUserId, currentUserObjectId))
    );

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load chat rooms',
    });
  }
});

router.post('/direct', protect, async (req: any, res: any) => {
  try {
    const currentUserId = req.user._id.toString();
    const currentUserObjectId = new Types.ObjectId(currentUserId);
    const { username, userId } = req.body;

    let targetUser;
    if (userId) {
      if (!Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid userId provided',
        });
      }
      targetUser = await User.findById(userId).select('username displayName avatar');
    } else if (username) {
      targetUser = await User.findOne({ username }).select('username displayName avatar');
    } else {
      return res.status(400).json({
        success: false,
        message: 'username or userId is required',
      });
    }

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const targetUserId = targetUser._id.toString();

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot start a direct chat with yourself',
      });
    }

    const participantIds = [currentUserObjectId, targetUser._id];

    let room = await ChatRoom.findOne({
      type: ChatRoomType.DIRECT,
      participants: { $all: participantIds },
    })
      .populate('participants', 'username displayName avatar')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'username displayName avatar' },
      })
      .lean();

    if (!room) {
      const created = await ChatRoom.create({
        type: ChatRoomType.DIRECT,
        participants: participantIds,
        admins: participantIds,
        createdBy: currentUserObjectId,
        lastActivity: new Date(),
      });

      room = await ChatRoom.findById(created._id)
        .populate('participants', 'username displayName avatar')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'username displayName avatar' },
        })
        .lean();
    }

    if (!room) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create chat room',
      });
    }

    const formattedRoom = await formatRoom(room, currentUserId, currentUserObjectId);

    res.json({
      success: true,
      data: formattedRoom,
    });
  } catch (error: any) {
    console.error('Create direct chat error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create direct chat',
    });
  }
});

router.get('/rooms/:roomId/messages', protect, async (req: any, res: any) => {
  try {
    const { roomId } = req.params;
    if (!Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roomId',
      });
    }

    const currentUserId = req.user._id.toString();
    const currentUserObjectId = new Types.ObjectId(currentUserId);

    const room = await ChatRoom.findById(roomId).select('participants');
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    const isParticipant = room.participants.some((participant) =>
      participant.toString() === currentUserId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat room',
      });
    }

    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);

    const messages = await Message.find({ chatRoom: roomId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('sender', 'username displayName avatar')
      .lean();

    await Message.updateMany(
      {
        chatRoom: roomId,
        sender: { $ne: currentUserObjectId },
        status: { $ne: MessageStatus.READ },
      },
      { status: MessageStatus.READ }
    );

    const formatted = messages
      .reverse()
      .map((message) => formatMessage(message));

    res.json({
      success: true,
      data: formatted,
    });
  } catch (error: any) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to load messages',
    });
  }
});

router.post('/rooms/:roomId/messages', protect, async (req: any, res: any) => {
  try {
    const { roomId } = req.params;
    if (!Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roomId',
      });
    }

    const currentUserId = req.user._id.toString();
    const currentUserObjectId = new Types.ObjectId(currentUserId);
    const { content, type = MessageType.TEXT } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    const room = await ChatRoom.findById(roomId).select('participants type');
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    const isParticipant = room.participants.some((participant) =>
      participant.toString() === currentUserId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat room',
      });
    }

    const message = await Message.create({
      sender: currentUserObjectId,
      chatRoom: roomId,
      type,
      content: content.trim(),
      status: MessageStatus.SENT,
    });

    await ChatRoom.findByIdAndUpdate(roomId, {
      lastMessage: message._id,
      lastActivity: new Date(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username displayName avatar')
      .lean();

    const formattedMessage = formatMessage(populatedMessage);

    const io = getIO();
    io.to(roomId).emit('chat:message:new', {
      roomId,
      message: formattedMessage,
    });

    const otherParticipants = room.participants
      .map((participant: any) => participant.toString())
      .filter((participantId: string) => participantId !== currentUserId);

    await Promise.all(
      otherParticipants.map((participantId: string) =>
        createNotification({
          userId: participantId,
          type: 'system',
          title: 'New Message',
          message: `${req.user.username} sent you a message`,
          actionUrl: `/messages/${req.user.username}`,
          fromUser: currentUserId,
          fromUsername: req.user.username,
        }).catch((notificationError) =>
          console.error('Failed to create message notification:', notificationError)
        )
      )
    );

    res.json({
      success: true,
      data: formattedMessage,
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send message',
    });
  }
});

// Send media message (upload new file)
router.post('/rooms/:roomId/messages/media', protect, upload.single('file'), async (req: any, res: any) => {
  try {
    const { roomId } = req.params;
    if (!Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roomId',
      });
    }

    const currentUserId = req.user._id.toString();
    const currentUserObjectId = new Types.ObjectId(currentUserId);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const room = await ChatRoom.findById(roomId).select('participants type');
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    const isParticipant = room.participants.some((participant) =>
      participant.toString() === currentUserId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat room',
      });
    }

    const { expiryMinutes } = req.body;
    const mediaUrl = req.file.path;
    const mediaType = req.file.mimetype.startsWith('image') ? MessageType.IMAGE : MessageType.VIDEO;

    let expiresAt: Date | undefined;
    if (expiryMinutes !== undefined && expiryMinutes !== null && expiryMinutes !== '') {
      const minutes = parseInt(expiryMinutes, 10);
      if (minutes === 0) {
        // "After seen" - we'll set this when the message is read
        expiresAt = undefined;
      } else if (minutes > 0) {
        expiresAt = new Date(Date.now() + minutes * 60 * 1000);
      }
    }

    const message = await Message.create({
      sender: currentUserObjectId,
      chatRoom: roomId,
      type: mediaType,
      content: req.body.content || '',
      mediaUrl,
      expiresAt,
      status: MessageStatus.SENT,
    });

    await ChatRoom.findByIdAndUpdate(roomId, {
      lastMessage: message._id,
      lastActivity: new Date(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username displayName avatar')
      .lean();

    const formattedMessage = formatMessage(populatedMessage);

    const io = getIO();
    io.to(roomId).emit('chat:message:new', {
      roomId,
      message: formattedMessage,
    });

    const otherParticipants = room.participants
      .map((participant: any) => participant.toString())
      .filter((participantId: string) => participantId !== currentUserId);

    await Promise.all(
      otherParticipants.map((participantId: string) =>
        createNotification({
          userId: participantId,
          type: 'system',
          title: 'New Message',
          message: `${req.user.username} sent you media`,
          actionUrl: `/messages/${req.user.username}`,
          fromUser: currentUserId,
          fromUsername: req.user.username,
        }).catch((notificationError) =>
          console.error('Failed to create message notification:', notificationError)
        )
      )
    );

    res.json({
      success: true,
      data: formattedMessage,
    });
  } catch (error: any) {
    console.error('Send media message error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send media message',
    });
  }
});

// Send existing content as message
router.post('/rooms/:roomId/messages/existing', protect, async (req: any, res: any) => {
  try {
    const { roomId } = req.params;
    if (!Types.ObjectId.isValid(roomId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid roomId',
      });
    }

    const currentUserId = req.user._id.toString();
    const currentUserObjectId = new Types.ObjectId(currentUserId);
    const { contentId, expiryMinutes } = req.body;

    if (!contentId || !Types.ObjectId.isValid(contentId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid contentId is required',
      });
    }

    const room = await ChatRoom.findById(roomId).select('participants type');
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Chat room not found',
      });
    }

    const isParticipant = room.participants.some((participant) =>
      participant.toString() === currentUserId
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this chat room',
      });
    }

    const content = await Content.findById(contentId);
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    if (content.userId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'You can only share your own content',
      });
    }

    const mediaType = content.mediaType === 'image' ? MessageType.IMAGE : MessageType.VIDEO;

    let expiresAt: Date | undefined;
    if (expiryMinutes !== undefined && expiryMinutes !== null && expiryMinutes !== '') {
      const minutes = parseInt(expiryMinutes, 10);
      if (minutes === 0) {
        // "After seen" - we'll set this when the message is read
        expiresAt = undefined;
      } else if (minutes > 0) {
        expiresAt = new Date(Date.now() + minutes * 60 * 1000);
      }
    }

    const message = await Message.create({
      sender: currentUserObjectId,
      chatRoom: roomId,
      type: mediaType,
      content: req.body.content || '',
      mediaUrl: content.mediaUrl,
      expiresAt,
      status: MessageStatus.SENT,
    });

    await ChatRoom.findByIdAndUpdate(roomId, {
      lastMessage: message._id,
      lastActivity: new Date(),
    });

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'username displayName avatar')
      .lean();

    const formattedMessage = formatMessage(populatedMessage);

    const io = getIO();
    io.to(roomId).emit('chat:message:new', {
      roomId,
      message: formattedMessage,
    });

    const otherParticipants = room.participants
      .map((participant: any) => participant.toString())
      .filter((participantId: string) => participantId !== currentUserId);

    await Promise.all(
      otherParticipants.map((participantId: string) =>
        createNotification({
          userId: participantId,
          type: 'system',
          title: 'New Message',
          message: `${req.user.username} sent you media`,
          actionUrl: `/messages/${req.user.username}`,
          fromUser: currentUserId,
          fromUsername: req.user.username,
        }).catch((notificationError) =>
          console.error('Failed to create message notification:', notificationError)
        )
      )
    );

    res.json({
      success: true,
      data: formattedMessage,
    });
  } catch (error: any) {
    console.error('Send existing content message error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send media message',
    });
  }
});

export default router;