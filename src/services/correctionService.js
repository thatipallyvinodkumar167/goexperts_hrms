import prisma from '../config/db.js';

/**
 * Create a new correction request.
 */
export const createCorrection = async ({ employeeId, reason, fields, attachments }) => {
  return prisma.correctionRequest.create({
    data: {
      employeeId,
      requestedBy: employeeId,
      reason,
      fields,
      attachments: attachments ?? [],
    },
  });
};

/**
 * Return all pending correction requests (HR view).
 */
export const getPending = async () => {
  return prisma.correctionRequest.findMany({
    where: { status: 'PENDING' },
    include: {
      employee: { select: { id: true, userId: true, email: true, firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Approve or reject a request.
 *
 * @param {Object} param0
 *   - requestId   : string
 *   - action      : 'APPROVE' | 'REJECT'
 *   - hrNote      : optional string
 *   - hrId        : string (HR employee id)
 */
export const decideCorrection = async ({ requestId, action, hrNote, hrId }) => {
  const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
  return prisma.correctionRequest.update({
    where: { id: requestId },
    data: {
      status: newStatus,
      hrNote,
      approvedBy: hrId,
      approvedAt: new Date(),
    },
  });
};
