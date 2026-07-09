import {
  createCorrection,
  getCompanyRequests,
  decideCorrection,
} from "../services/correctionService.js";
import prisma from "../config/db.js";

// ─────────────────────────────────────────────────────────
// 1. EMPLOYEE — Create a correction request (raise ticket)
// ─────────────────────────────────────────────────────────
// POST /api/employee/:id/correction-request
export const createCorrectionRequest = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const { reason, fields, attachments } = req.body;

    if (!reason || !fields || Object.keys(fields).length === 0) {
      return res.status(400).json({
        success: false,
        message: '"reason" and at least one field to update are required.',
      });
    }

    // Verify employee belongs to the logged-in user
    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }
    if (employee.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only raise correction requests for your own profile.",
      });
    }

    // Block if employee already has a PENDING request
    const existingPending = await prisma.correctionRequest.findFirst({
      where: { employeeId, status: "PENDING" },
    });
    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: "You already have a pending correction request. Please wait for HR to review it before raising a new one.",
      });
    }

    const request = await createCorrection({ employeeId, reason, fields, attachments });

    return res.status(201).json({
      success: true,
      requestId: request.id,
      status: request.status,
      message: "Correction request submitted successfully. HR will review it within 48 hours.",
    });
  } catch (err) {
    console.error("createCorrectionRequest error:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────────────────
// 2. HR/OWNER — List all correction requests (with filter)
// ─────────────────────────────────────────────────────────
// GET /api/employee/correction-requests?status=PENDING
export const listCorrectionRequests = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized company context." });
    }

    const { status } = req.query; // optional: PENDING | APPROVED | REJECTED | COMPLETED

    const requests = await getCompanyRequests(companyId, { status });

    return res.status(200).json({
      success: true,
      total: requests.length,
      requests: requests.map((r) => ({
        id: r.id,
        status: r.status,
        reason: r.reason,
        fields: r.fields,
        attachments: r.attachments,
        hrNote: r.hrNote,
        createdAt: r.createdAt,
        approvedAt: r.approvedAt,
        reminderSentAt: r.reminderSentAt,
        escalatedToOwnerAt: r.escalatedToOwnerAt,
        hoursElapsed: Math.floor((Date.now() - new Date(r.createdAt).getTime()) / (1000 * 60 * 60)),
        employee: {
          id: r.employee.id,
          employeeCode: r.employee.employeeCode,
          firstName: r.employee.firstName,
          lastName: r.employee.lastName,
          email: r.employee.user?.email,
          department: r.employee.department?.name,
          designation: r.employee.designation?.title,
        },
      })),
    });
  } catch (err) {
    console.error("listCorrectionRequests error:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────────────────
// 3. EMPLOYEE — Get own correction requests history
// ─────────────────────────────────────────────────────────
// GET /api/employee/:id/correction-requests
export const getMyCorrectionRequests = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }
    if (employee.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    const requests = await prisma.correctionRequest.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      requests: requests.map((r) => ({
        id: r.id,
        reason: r.reason,
        fields: r.fields,
        attachments: r.attachments,
        status: r.status,
        hrNote: r.hrNote,
        createdAt: r.createdAt,
        approvedAt: r.approvedAt,
      })),
    });
  } catch (err) {
    console.error("getMyCorrectionRequests error:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal Server Error" });
  }
};

// ─────────────────────────────────────────────────────────
// 4. HR/OWNER — Approve or Reject a request
// ─────────────────────────────────────────────────────────
// PATCH /api/employee/correction-request/:requestId
export const decideCorrectionRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, hrNote } = req.body; // action = APPROVE | REJECT
    const companyId = req.user?.companyId;
    const hrUserId = req.user?.id;

    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized company context." });
    }
    if (!["APPROVE", "REJECT"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Use "APPROVE" or "REJECT".',
      });
    }
    if (action === "REJECT" && (!hrNote || hrNote.trim() === "")) {
      return res.status(400).json({
        success: false,
        message: "A rejection reason (hrNote) is required when rejecting a request.",
      });
    }

    // Find HR employee record
    const hrEmployee = await prisma.employee.findFirst({
      where: { userId: hrUserId, companyId },
    });

    const result = await decideCorrection({
      requestId,
      action,
      hrNote,
      hrEmployeeId: hrEmployee?.id || null,
      companyId,
    });

    return res.status(200).json({
      success: true,
      status: result.status,
      message: `Correction request ${result.status.toLowerCase()} successfully. Employee has been notified via email.`,
    });
  } catch (err) {
    console.error("decideCorrectionRequest error:", err);
    return res.status(400).json({ success: false, message: err.message || "Internal Server Error" });
  }
};
