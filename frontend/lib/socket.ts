import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export const getSocket = (token?: string): Socket => {
  if (!socket || !socket.connected) {
    socket = io(SOCKET_URL, {
      auth: {
        token: token || localStorage.getItem('token'),
      },
      transports: ['websocket'],
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
