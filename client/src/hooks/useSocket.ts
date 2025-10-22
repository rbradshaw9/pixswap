import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';

let socket: Socket | null = null;
let listenersAttached = false;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const token = useAuthStore((state) => state.token);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const previousTokenRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

    if (!socket) {
      socket = io(socketUrl, {
        withCredentials: true,
        transports: ['websocket', 'polling'],
        autoConnect: false,
      });
    }

    if (socket && !listenersAttached) {
      socket.on('connect', () => {
        console.log('🔌 Socket connected:', socket?.id);
        setIsConnected(true);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        setIsConnected(false);
      });

      socket.on('connect_error', (error) => {
        console.error('🔌 Socket connection error:', error);
      });

      listenersAttached = true;
    }

    const authToken = token || undefined;
    const previousToken = previousTokenRef.current;

    if (socket) {
      socket.auth = authToken ? { token: authToken } : {};

      const tokenChanged = previousToken !== authToken;

      if (!socket.connected) {
        socket.connect();
      } else if (tokenChanged) {
        socket.disconnect();
        socket.connect();
      }
    }

    previousTokenRef.current = authToken;

    return () => {
      // We intentionally keep the socket connection alive across component unmounts
    };
  }, [token, hasHydrated]);

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    listenersAttached = false;
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
