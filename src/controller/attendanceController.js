import { clockInService, clockOutService } from "../services/attendanceService.js";

/**
 * Validates and records daily employee Clock-In
 */
export const clockIn = async (req, res) => {
  try {
    const { latitude, longitude, livePhoto } = req.body;
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
    const { latitude, longitude, livePhoto } = req.body;
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
