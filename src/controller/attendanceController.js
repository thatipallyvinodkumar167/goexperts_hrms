import {
  clockInService,
  clockOutService,
  submitDailyWorkService,
  heartbeatService,
  getEmployeeAttendanceHistory,
  getCompanyAttendanceHistory,
  verifyFlaggedAttendanceService,
} from "../services/attendanceService.js";

// ─────────────────────────────────────────────────────────
// 1. CLOCK IN
// ─────────────────────────────────────────────────────────
export const clockIn = async (req, res) => {
  try {
    const { latitude, longitude, requestedWorkType } = req.body;
    const livePhoto = req.file ? req.file.path : req.body.livePhoto;
    const userId = req.user?.id;
    const companyId = req.user?.companyId;

    if (!userId || !companyId)
      return res.status(401).json({ success: false, message: "Unauthorized company context." });

    if (!latitude || !longitude)
      return res.status(400).json({ success: false, message: "Valid coordinates are required." });

    const result = await clockInService(userId, companyId, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      livePhoto,
      requestedWorkType, // "WFO" or "WFH" (required for HYBRID employees)
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// 2. CLOCK OUT
// ─────────────────────────────────────────────────────────
export const clockOut = async (req, res) => {
  try {
    const { latitude, longitude, dailyWorkSummary, checkoutReason } = req.body;
    const userId = req.user?.id;
    const companyId = req.user?.companyId;

    if (!userId || !companyId)
      return res.status(401).json({ success: false, message: "Unauthorized company context." });

    if (!latitude || !longitude)
      return res.status(400).json({ success: false, message: "Valid coordinates are required." });

    const result = await clockOutService(userId, companyId, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      dailyWorkSummary,
      checkoutReason,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// 3. SUBMIT DAILY WORK (standalone)
// ─────────────────────────────────────────────────────────
export const submitDailyWork = async (req, res) => {
  try {
    const { dailyWorkSummary } = req.body;
    const userId = req.user?.id;

    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized." });

    const result = await submitDailyWorkService(userId, { dailyWorkSummary });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// 4. HEARTBEAT (WFH Geofence — every 10 mins)
// ─────────────────────────────────────────────────────────
export const heartbeat = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user?.id;
    const companyId = req.user?.companyId;

    if (!userId || !companyId)
      return res.status(401).json({ success: false, message: "Unauthorized." });

    if (!latitude || !longitude)
      return res.status(400).json({ success: false, message: "Coordinates are required." });

    const result = await heartbeatService(userId, companyId, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// 5. MY ATTENDANCE HISTORY
// ─────────────────────────────────────────────────────────
export const getMyAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated." });

    const { month, year, fromDate, toDate, sort } = req.query;

    // Optional validations for month and year if they are explicitly passed
    if (month && (isNaN(parseInt(month)) || parseInt(month) < 1 || parseInt(month) > 12)) {
      return res.status(400).json({ success: false, message: "Invalid month parameter. Must be 1-12." });
    }
    if (year && (isNaN(parseInt(year)) || parseInt(year) < 2000)) {
      return res.status(400).json({ success: false, message: "Invalid year parameter." });
    }

    const result = await getEmployeeAttendanceHistory(userId, {
      month,
      year,
      fromDate,
      toDate,
      sort,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// 6. COMPANY ATTENDANCE (HR view)
// ─────────────────────────────────────────────────────────
export const getCompanyAttendance = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId)
      return res.status(401).json({ success: false, message: "Unauthorized company context." });

    const { date, month, year, fromDate, toDate, sort } = req.query;

    const result = await getCompanyAttendanceHistory(companyId, {
      date,
      month,
      year,
      fromDate,
      toDate,
      sort,
    });
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// 7. VERIFY FLAGGED ATTENDANCE (HR view)
// ─────────────────────────────────────────────────────────
export const verifyFlaggedAttendance = async (req, res) => {
  try {
    const hrUserId = req.user?.id;
    const companyId = req.user?.companyId;
    const { attendanceId, action, remarks } = req.body;

    if (!hrUserId || !companyId)
      return res.status(401).json({ success: false, message: "Unauthorized company context." });

    if (!attendanceId || !action)
      return res.status(400).json({ success: false, message: "attendanceId and action (APPROVE/REJECT) are required." });

    const result = await verifyFlaggedAttendanceService(hrUserId, companyId, {
      attendanceId,
      action,
      remarks,
    });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
