import { updateSelfService } from "../services/employeeUpdateService.js";

/**
 * Employee updates their own profile (limited fields).
 */
export const updateSelf = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;
    
    // If a profile photo was uploaded via multer (Cloudinary), add it to the data
    if (req.file && req.file.path) {
      data.profilePhoto = req.file.path;
    }

    const result = await updateSelfService(userId, data);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

