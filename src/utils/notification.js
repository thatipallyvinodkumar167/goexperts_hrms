import { io } from '../socket.js'; // the socket.io server instance

/**
 * Send a notification to every HR client.
 * HR clients must join the `role_HR` room when they connect.
 */
export const notifyHr = async (requestId, employeeId, reason) => {
  const title = 'New correction request';
  const body = `Employee ${employeeId}: ${reason}`;
  if(io) {
    io.to('role_HR').emit('correction-request', { requestId, title, body });
  }
};

/**
 * Send a one‑to‑one notification (push or socket) to a specific employee.
 * The client should join a room named `user_<employeeId>`.
 */
export const notifyUser = async (employeeId, title, body) => {
  if(io) {
    io.to(`user_${employeeId}`).emit('push', { title, body });
  }
};
