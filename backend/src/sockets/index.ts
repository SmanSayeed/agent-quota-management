import { Server as SocketIOServer } from 'socket.io';

export const initializeSocket = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join user-specific room
    socket.on('join-user-room', (userId: string) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join admin room for passport updates
    socket.on('join-admin-room', () => {
      socket.join('admin-room');
      console.log(`Admin joined admin-room`);
    });

    // Join agents room for pool updates
    socket.on('join-agents-room', () => {
      socket.join('agents-room');
      console.log(`Agent joined agents-room`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Helper functions to emit events
export const emitPoolUpdate = (io: SocketIOServer, availableQuota: number) => {
  io.to('agents-room').emit('pool-updated', { availableQuota });
};

export const emitQuotaBalanceUpdate = (io: SocketIOServer, userId: string, newBalance: number) => {
  io.to(`user:${userId}`).emit('quota-balance-updated', { quotaBalance: newBalance });
};

export const emitCreditBalanceUpdate = (io: SocketIOServer, userId: string, newBalance: number) => {
  io.to(`user:${userId}`).emit('credit-balance-updated', { creditBalance: newBalance });
};

export const emitNewPassport = (io: SocketIOServer, passport: any) => {
  io.to('admin-room').emit('new-passport', passport);
};

export const emitPassportUpdate = (io: SocketIOServer, passport: any) => {
  io.to('admin-room').emit('passport-updated', passport);
};
