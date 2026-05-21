import { 
  clockInService, 
  clockOutService, 
  getEmployeeAttendanceHistory, 
  getCompanyAttendanceHistory 
} from "../services/attendanceService.js";

/**
 * Validates and records daily employee Clock-In
 */
export const clockIn = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const livePhoto = req.file ? req.file.path : req.body.livePhoto;
    const userId = req.user?.id;
    const companyId = req.user?.companyId;

    if (!userId || !companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized company context." });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: "Valid coordinates are required for geo-fencing." });
    }

    if (!livePhoto) {
      return res.status(400).json({ success: false, message: "Face selfie capture is required." });
    }

    const result = await clockInService(userId, companyId, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      livePhoto
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Validates and records daily employee Clock-Out
 */
export const clockOut = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const livePhoto = req.file ? req.file.path : req.body.livePhoto;
    const userId = req.user?.id;
    const companyId = req.user?.companyId;

    if (!userId || !companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized company context." });
    }

    if (!latitude || !longitude) {
      return res.status(400).json({ success: false, message: "Valid coordinates are required for geo-fencing." });
    }

    if (!livePhoto) {
      return res.status(400).json({ success: false, message: "Face selfie capture is required." });
    }

    const result = await clockOutService(userId, companyId, {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      livePhoto
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Retrieves logged-in employee's monthly attendance history
 */
export const getMyAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated." });
    }

    const today = new Date();
    const queryMonth = req.query.month ? parseInt(req.query.month) : today.getMonth() + 1;
    const queryYear = req.query.year ? parseInt(req.query.year) : today.getFullYear();

    if (isNaN(queryMonth) || queryMonth < 1 || queryMonth > 12) {
      return res.status(400).json({ success: false, message: "Invalid month parameter. Must be 1-12." });
    }
    if (isNaN(queryYear) || queryYear < 2000) {
      return res.status(400).json({ success: false, message: "Invalid year parameter." });
    }

    const result = await getEmployeeAttendanceHistory(userId, queryMonth, queryYear);
    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * Retrieves daily company-wide attendance logs (HR/Admin)
 */
export const getCompanyAttendance = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized company context." });
    }

    const dateStr = req.query.date; // Expecting YYYY-MM-DD
    const result = await getCompanyAttendanceHistory(companyId, dateStr);

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

