import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { RoomSocketEvents, GameSocketEvents } from '@/types/socket';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

type Namespace = 'room' | 'game';

export function useSocket(namespace: Namespace) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return;
    }

    // Create socket connection to namespace
    const socket = io(`${SOCKET_URL}/${namespace}`, {
      auth: {
        token,
      },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log(`[${namespace}] Connected`);
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log(`[${namespace}] Disconnected`);
      setIsConnected(false);
    });

    socket.on('error', (error: any) => {
      console.error(`[${namespace}] Error:`, error);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [namespace]);

  return {
    socket: socketRef.current,
    isConnected,
  };
}

