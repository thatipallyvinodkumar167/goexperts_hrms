import { Server } from 'socket.io';

let io = null;

/**
 * Called from `server.js` – creates a Socket.io instance
 * and registers the minimal connection logic.
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);

    /**
     * The frontend must emit a `join` event after authentication:
     *   socket.emit('join', { role: 'HR' | 'EMPLOYEE', userId: '<employeeId>' });
     */
    socket.on('join', ({ role, userId }) => {
      if (role === 'HR' || role === 'OWNER') socket.join('role_HR');
      if (userId) socket.join(`user_${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected:', socket.id);
    });
  });

  return io;
};

export { io };
