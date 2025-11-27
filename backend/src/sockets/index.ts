import { Server, Socket } from 'socket.io';

export const initializeSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join user room for private updates
    socket.on('join-user-room', (userId: string) => {
      socket.join(userId);
      console.log(`Socket ${socket.id} joined user room: ${userId}`);
    });

    // Join admin room
    socket.on('join-admin-room', () => {
      socket.join('admin-room');
      console.log(`Socket ${socket.id} joined admin room`);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
