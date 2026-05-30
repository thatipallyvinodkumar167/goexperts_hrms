import { updateSelfService } from "../services/employeeUpdateService.js";
import prisma from "../config/db.js";

/**
 * GET /api/employee/self
 * Employee fetches their own full profile.
 */
export const getSelf = async (req, res) => {
  try {
    const { id } = req.params; // Get Employee ID from path
    const userId = req.user.id;

    const employee = await prisma.employee.findUnique({
      where: { id },
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

    // Verify the logged-in user matches this employee profile
    if (employee.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to view this profile.",
      });
    }

    // Smart fallback: fix null names
    if (!employee.firstName && employee.user?.name) {
      const parts = employee.user.name.trim().split(/\s+/);
      employee.firstName = parts[0] || "";
      employee.lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
    }

    const formattedEmployee = {
      id: employee.id,
      companyId: employee.companyId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      profilePhoto: employee.profilePhoto,
      onboardingCompleted: employee.onboardingCompleted,
      status: employee.status,
      user: employee.user ? {
        id: employee.user.id,
        name: employee.user.name,
        email: employee.user.email,
        role: employee.user.role,
        status: employee.user.status,
        lastLoginAt: employee.user.lastLoginAt,
      } : null,
      personal: employee.personal ? {
        personalEmail: employee.personal.personalEmail,
        phone: employee.personal.phone,
        alternatePhone: employee.personal.alternatePhone,
        address: employee.personal.address,
        city: employee.personal.city,
        state: employee.personal.state,
        country: employee.personal.country,
        pincode: employee.personal.pincode,
        gender: employee.personal.gender,
        dob: employee.personal.dob,
        maritalStatus: employee.personal.maritalStatus,
        bloodGroup: employee.personal.bloodGroup,
        nationality: employee.personal.nationality,
      } : null,
      emergencyContacts: (employee.emergencyContacts || []).map(contact => ({
        contactPersonName: contact.contactPersonName,
        relationship: contact.relationship,
        contactNumber: contact.contactNumber,
        alternateContact: contact.alternateContact,
        address: contact.address,
      })),
      educations: (employee.educations || []).map(edu => ({
        degree: edu.degree,
        specialization: edu.specialization,
        college: edu.college,
        university: edu.university,
        percentage: edu.percentage,
        startYear: edu.startYear,
        endYear: edu.endYear,
      })),
      experiences: (employee.experiences || []).map(exp => ({
        companyName: exp.companyName,
        role: exp.role,
        startDate: exp.startDate,
        endDate: exp.endDate,
        totalYears: exp.totalYears,
      })),
      skills: employee.skills ? {
        primarySkills: employee.skills.primarySkills,
        secondarySkills: employee.skills.secondarySkills,
        certifications: employee.skills.certifications,
        languagesKnown: employee.skills.languagesKnown,
        linkedinUrl: employee.skills.linkedinUrl,
        githubUrl: employee.skills.githubUrl,
        portfolioUrl: employee.skills.portfolioUrl,
      } : null,
      bankDetails: employee.bankDetails ? {
        bankName: employee.bankDetails.bankName,
        accountHolderName: employee.bankDetails.accountHolderName,
        accountNumber: employee.bankDetails.accountNumber,
        ifscCode: employee.bankDetails.ifscCode,
        branchName: employee.bankDetails.branchName,
        upiId: employee.bankDetails.upiId,
      } : null,
      nominee: employee.nominee ? {
        nomineeName: employee.nominee.nomineeName,
        relationship: employee.nominee.relationship,
        dob: employee.nominee.dob,
        gender: employee.nominee.gender,
        phone: employee.nominee.phone,
        email: employee.nominee.email,
        aadhaarNumber: employee.nominee.aadhaarNumber,
        panNumber: employee.nominee.panNumber,
        nomineePercentage: employee.nominee.nomineePercentage,
        address: employee.nominee.address,
      } : null,
      compliance: employee.compliance ? {
        pfNumber: employee.compliance.pfNumber,
        esiNumber: employee.compliance.esiNumber,
        uanNumber: employee.compliance.uanNumber,
      } : null,
      documents: (employee.documents || []).map(doc => ({
        name: doc.name,
        fileUrl: doc.fileUrl,
        status: doc.status,
      })),
      department: employee.department ? {
        name: employee.department.name,
      } : null,
      designation: employee.designation ? {
        title: employee.designation.title,
        level: employee.designation.level,
      } : null,
      correctionRequests: (employee.correctionRequests || []).map(cr => ({
        id: cr.id,
        reason: cr.reason,
        status: cr.status,
        createdAt: cr.createdAt,
      })),
    };

    res.status(200).json({ success: true, data: formattedEmployee });
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
    const { id } = req.params; // Get Employee ID from path
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

    // Get the employee record by ID (UUID)
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    // Verify the logged-in user matches this employee profile
    if (employee.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this profile.",
      });
    }

    // 1️⃣ Determine if request updates any restricted fields requiring HR approval
    const restrictedKeys = ["bankDetails", "compliance", "nominee", "emergencyContacts", "educations", "experiences"];
    const hasRestrictedKeys = Object.keys(data).some(key => restrictedKeys.includes(key));

    if (!hasRestrictedKeys) {
      // Direct personal edit - allowed directly without HR approval
      const result = await updateSelfService(employee.id, data);
      return res.status(200).json({ success: true, data: result, message: "Personal details updated successfully." });
    }

    // 2️⃣ Verify there is an APPROVED request for this employee since restricted keys are modified
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
        message: "No approved correction request – you cannot edit restricted data.",
      });
    }

    // 3️⃣ Apply the self-service update
    const result = await updateSelfService(employee.id, data);

    // 4️⃣ Mark the request as COMPLETED
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
