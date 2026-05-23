import { updateSelfService, updateByAdminService } from "../services/employeeUpdateService.js";

/**
 * Employee updates their own profile (limited fields).
 */
export const updateSelf = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;
    const result = await updateSelfService(userId, data);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Admin/HR updates any employee profile (full fields).
 */
export const updateByAdmin = async (req, res) => {
  try {
    const employeeId = Number(req.params.id);
    const data = req.body;
    const adminId = req.user.id; // the admin performing the action
    const result = await updateByAdminService(employeeId, data, adminId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
