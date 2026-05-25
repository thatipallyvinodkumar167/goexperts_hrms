import { updateSelfService } from "../services/employeeUpdateService.js";
import prisma from "../config/db.js";

/**
 * GET /api/employee/self
 * Employee fetches their own full profile.
 */
export const getSelf = async (req, res) => {
  try {
    const userId = req.user.id;

    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            profileLogo: true,
            lastLoginAt: true,
          },
        },
        personal: true,
        emergencyContacts: true,
        educations: true,
        experiences: true,
        skills: true,
        bankDetails: true,
        nominee: true,
        compliance: true,
        documents: true,
        department: true,
        designation: true,
        joiningLetter: true,
        salaryStructure: true,
        correctionRequests: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found." });
    }

    // Smart fallback: fix null names
    if (!employee.firstName && employee.user?.name) {
      const parts = employee.user.name.trim().split(/\s+/);
      employee.firstName = parts[0] || "";
      employee.lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    console.error("getSelf error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/employee/self
 * Employee updates their own profile (limited fields).
 * Allowed only after HR approval via CorrectionRequest.
 * Accepts multipart/form-data for profileLogo file upload.
 */
export const updateSelf = async (req, res) => {
  try {
    const userId = req.user.id;

    // If the body comes as multipart/form-data, the JSON fields
    // may arrive as a stringified "data" field.
    let data = req.body;
    if (typeof req.body.data === "string") {
      data = JSON.parse(req.body.data);
    }

    // If a profile photo was uploaded via multer (Cloudinary), add it
    if (req.file && req.file.path) {
      data.profilePhoto = req.file.path;
    }

    // Get the employee record for this user
    const employee = await prisma.employee.findUnique({
      where: { userId },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    // 1️⃣ Verify there is an APPROVED request for this employee
    const approvedRequest = await prisma.correctionRequest.findFirst({
      where: {
        employeeId: employee.id,
        status: "APPROVED",
      },
      orderBy: { approvedAt: "desc" },
    });

    if (!approvedRequest) {
      return res.status(403).json({
        success: false,
        message: "No approved correction request – you cannot edit data.",
      });
    }

    // 2️⃣ Apply the self-service update
    const result = await updateSelfService(userId, data);

    // 3️⃣ Mark the request as COMPLETED
    await prisma.correctionRequest.update({
      where: { id: approvedRequest.id },
      data: { status: "COMPLETED" },
    });

    res.status(200).json({ success: true, data: result, message: "Profile updated successfully." });
  } catch (error) {
    console.error("updateSelf error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};
