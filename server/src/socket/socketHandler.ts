import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { IJwtPayload, ISocketUser } from '@/types';

// Store active socket connections
const activeUsers = new Map<string, ISocketUser>();
const userSockets = new Map<string, string[]>(); // userId -> socketId[]

export const setupSocket = (io: SocketIOServer): void => {
  // Authentication middleware for Socket.IO
  io.use(async (socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as IJwtPayload;
      
      if (!decoded.userId) {
        return next(new Error('Authentication error: Invalid token'));
      }

      // Add user info to socket
      socket.data.userId = decoded.userId;
      socket.data.username = decoded.username;
      
      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, username } = socket.data;
    
    console.log(`👤 User ${username} connected (${socket.id})`);

    // Store user connection
    const socketUser: ISocketUser = {
      userId,
      username,
      socketId: socket.id,
      rooms: [],
      lastSeen: new Date(),
    };

    activeUsers.set(socket.id, socketUser);
    
    // Track multiple connections per user
    if (!userSockets.has(userId)) {
      userSockets.set(userId, []);
    }
    userSockets.get(userId)?.push(socket.id);

    // Emit user online status
    socket.broadcast.emit('user:online', {
      userId,
      username,
      isOnline: true,
      lastSeen: new Date(),
    });

    // Handle joining chat rooms
    socket.on('chat:join', (roomId: string) => {
      socket.join(roomId);
      socketUser.rooms.push(roomId);
      console.log(`💬 User ${username} joined room ${roomId}`);
    });

    // Handle leaving chat rooms
    socket.on('chat:leave', (roomId: string) => {
      socket.leave(roomId);
      socketUser.rooms = socketUser.rooms.filter(room => room !== roomId);
      console.log(`💬 User ${username} left room ${roomId}`);
    });

    // Handle sending messages
    socket.on('chat:message', (data: { roomId: string; message: any }) => {
      socket.to(data.roomId).emit('chat:message', {
        ...data.message,
        sender: { userId, username },
        timestamp: new Date(),
      });
    });

    // Handle message status updates
    socket.on('chat:message:status', (data: { messageId: string; status: string }) => {
      socket.broadcast.emit('chat:message:status', data);
    });

    // Handle typing indicators
    socket.on('chat:typing:start', (roomId: string) => {
      socket.to(roomId).emit('chat:typing:start', {
        userId,
        username,
        roomId,
      });
    });

    socket.on('chat:typing:stop', (roomId: string) => {
      socket.to(roomId).emit('chat:typing:stop', {
        userId,
        username,
        roomId,
      });
    });

    // Handle swap matching
    socket.on('swap:join', (data: { category?: string; theme?: string }) => {
      socket.join('swap-queue');
      socket.emit('swap:joined', { message: 'Joined swap queue' });
      console.log(`🔄 User ${username} joined swap queue`);
    });

    socket.on('swap:leave', () => {
      socket.leave('swap-queue');
      console.log(`🔄 User ${username} left swap queue`);
    });

    socket.on('swap:submit', (data: { swapId: string; mediaId: string }) => {
      socket.to(`swap-${data.swapId}`).emit('swap:partner:submitted', {
        swapId: data.swapId,
        partnerSubmitted: true,
      });
    });

    socket.on('swap:reveal', (data: { swapId: string }) => {
      socket.to(`swap-${data.swapId}`).emit('swap:reveal', {
        swapId: data.swapId,
        revealTime: new Date(),
      });
    });

    // Handle user status updates
    socket.on('user:status', (status: 'online' | 'away' | 'busy') => {
      socket.broadcast.emit('user:status', {
        userId,
        status,
        timestamp: new Date(),
      });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`👤 User ${username} disconnected: ${reason}`);
      
      // Remove from active users
      activeUsers.delete(socket.id);
      
      // Remove socket from user's socket list
      const userSocketList = userSockets.get(userId);
      if (userSocketList) {
        const updatedSockets = userSocketList.filter(id => id !== socket.id);
        if (updatedSockets.length === 0) {
          // User is completely offline
          userSockets.delete(userId);
          socket.broadcast.emit('user:offline', {
            userId,
            username,
            isOnline: false,
            lastSeen: new Date(),
          });
        } else {
          userSockets.set(userId, updatedSockets);
        }
      }
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error(`❌ Socket error for user ${username}:`, error);
    });
  });

  // Periodic cleanup of inactive connections
  setInterval(() => {
    const now = new Date();
    activeUsers.forEach((user, socketId) => {
      const timeDiff = now.getTime() - user.lastSeen.getTime();
      if (timeDiff > 30000) { // 30 seconds
        user.lastSeen = now;
      }
    });
  }, 30000);

  console.log('🔌 Socket.IO server initialized');
};

// Helper functions to get user info
export const getActiveUsers = (): ISocketUser[] => {
  return Array.from(activeUsers.values());
};

export const getUserSockets = (userId: string): string[] => {
  return userSockets.get(userId) || [];
};

export const isUserOnline = (userId: string): boolean => {
  return userSockets.has(userId) && userSockets.get(userId)!.length > 0;
};