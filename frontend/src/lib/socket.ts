import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initializeSocket = (userId: string, role: string) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    withCredentials: true,
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected');
    
    // Join user-specific room
    socket?.emit('join-user-room', userId);
    
    // Join role-specific rooms
    if (role === 'superadmin' || role === 'admin') {
      socket?.emit('join-admin-room');
    }
    if (role === 'agent') {
      socket?.emit('join-agents-room');
    }

    // Join pool updates room
    if (['superadmin', 'admin', 'agent'].includes(role)) {
      socket?.emit('join-pool-room', role);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔌 Socket disconnected');
  });

  return socket;
};

export const getSocket = () => {
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
