import {
  createCompanyWithInvite,
  setupCompanyAccount,
  activateCompany,
  getCompaniesForAdmin,
  getCompanyProfile,
  resendCompanyInvite,
  updateCompanyProfile,
  updateBasicSettings,
  updateHrSettings,
  updatePayrollSettings,
  updateComplianceSettings,
  deleteCompany,
  getSoftDeletedCompanies,
  getPendingApprovalCompanies,
  getPendingApprovalCompanyById
} from "../services/companyService.js";
import prisma from "../config/db.js";
import fs from "fs";

//////////////////////////
// GET ALL COMPANIES (SUPER ADMIN)
//////////////////////////

export const getAllCompanies = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await getCompaniesForAdmin(page, limit);

    res.status(200).json({
      success: true,
      count: result.data.length,
      total: result.total,
      data: result.data,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : result.total,
      totalPages: limit ? Math.ceil(result.total / Number(limit)) : 1
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//////////////////////////
// SUPER ADMIN DASHBOARD
//////////////////////////

export const getSuperAdminDashboard = async (req, res) => {
  try {
    const [
      totalCompanies,
      activeCompanies,
      pendingCompanies,
      softDeletedCompanies,
      activeSubscriptions
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: "ACTIVE" } }),
      prisma.company.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.company.count({ where: { status: "INACTIVE" } }),
      prisma.subscription.count({ where: { endDate: { gt: new Date() } } })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalCompanies,
        activeCompanies,
        pendingCompanies,
        softDeletedCompanies,
        activeSubscriptions
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSoftDeletedCompaniesController = async (req, res) => {
  try {
    const data = await getSoftDeletedCompanies();

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingApprovalCompaniesController = async (req, res) => {
  try {
    const data = await getPendingApprovalCompanies();

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getPendingApprovalCompanyByIdController = async (req, res) => {
  try {
    const data = await getPendingApprovalCompanyById(req.params.id);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(error.message === "Company not found" ? 404 : 500).json({ success: false, message: error.message });
  }
};

//////////////////////////
// CREATE COMPANY
//////////////////////////

export const createCompany = async (req, res) => {
  try {
    const data = await createCompanyWithInvite({
      ...req.body,
      createdById: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Company invited successfully",
      inviteToken: data.rawToken, // for testing
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateCompanyProfileController = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = id || req.user.companyId;

    if (!companyId) throw new Error("Company ID is required");

    // Security check: If an ID is provided in params, only Super Admin can use it.
    // If no ID is provided, the user updates their own company.
    if (id && req.user.role !== "SUPER_ADMIN") {
        return res.status(403).json({ success: false, message: "Forbidden: You can only update your own company" });
    }

    const files = req.files || {};
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const documents = [];

    const gstFile = files.gstProof?.[0];
    const panFile = files.panProof?.[0];
    const tanFile = files.tanProof?.[0];
    const logoFile = files.logo?.[0];
    const regFile = files.regCertificate?.[0];
    const signatureFile = files.signature?.[0];

    if (gstFile?.path) {
      documents.push({ name: "GST_CERTIFICATE", fileUrl: gstFile.path });
    }
    if (panFile?.path) {
      documents.push({ name: "PAN_CARD", fileUrl: panFile.path });
    }
    if (tanFile?.path) {
      documents.push({ name: "TAN_CERTIFICATE", fileUrl: tanFile.path });
    }
    if (regFile?.path) {
      documents.push({ name: "INCORPORATION_CERTIFICATE", fileUrl: regFile.path });
    }

    const payload = {
      ...req.body,
      companyLogo: logoFile ? logoFile.path : req.body.companyLogo,
      signature: signatureFile ? signatureFile.path : req.body.signature,
      documents: [...(Array.isArray(req.body.documents) ? req.body.documents : []), ...documents],
    };

    const data = await updateCompanyProfile(companyId, payload, req.user.role === "SUPER_ADMIN");

    res.status(200).json({
      success: true,
      message: "Company profile updated successfully",
      isprofilecompleted: data.isProfileCompleted,
      isFullRegistered: data.isProfileCompleted
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────
// CATEGORY-WISE SETTINGS CONTROLLERS
// ──────────────────────────────────────────────

export const updateBasicSettingsController = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) throw new Error("Company ID is required");

    const logoFile = req.files?.logo?.[0];
    const payload = {
      ...req.body,
      companyLogo: logoFile ? logoFile.path : undefined,
    };

    await updateBasicSettings(companyId, payload, req.user.role === "SUPER_ADMIN");

    res.status(200).json({ success: true, message: "Basic settings updated successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateHrSettingsController = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) throw new Error("Company ID is required");

    await updateHrSettings(companyId, req.body);

    res.status(200).json({ success: true, message: "HR settings updated successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updatePayrollSettingsController = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) throw new Error("Company ID is required");

    await updatePayrollSettings(companyId, req.body);

    res.status(200).json({ success: true, message: "Payroll settings updated successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateComplianceSettingsController = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) throw new Error("Company ID is required");

    await updateComplianceSettings(companyId, req.body, req.user.role === "SUPER_ADMIN");

    res.status(200).json({ success: true, message: "Compliance settings updated successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCompanyProfileController = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = id || req.user.companyId;

    if (!companyId) throw new Error("Company ID is required");
    if (id && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden: You can only view your own company" });
    }

    const data = await getCompanyProfile(companyId);
    if (!data) {
      return res.status(404).json({ success: false, message: "Company not found" });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const uploadCompanyDocumentsController = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = id || req.user.companyId;

    if (!companyId) throw new Error("Company ID is required");
    if (id && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Forbidden: You can only upload for your own company" });
    }

    const files = req.files || {};
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const mappings = [
      { field: "gstProof", type: "GST_CERTIFICATE" },
      { field: "panProof", type: "PAN_CARD" },
      { field: "tanProof", type: "TAN_CERTIFICATE" },
    ];

    const docsToInsert = [];
    for (const m of mappings) {
      const file = files[m.field]?.[0];
      if (file) {
        docsToInsert.push({
          companyId,
          name: m.type,
          fileUrl: `${baseUrl}/uploads/company-docs/${file.filename}`,
        });
      }
    }

    if (!docsToInsert.length) {
      return res.status(400).json({ success: false, message: "No document images provided" });
    }

    await prisma.$transaction(
      docsToInsert.map((doc) =>
        prisma.companyDocument.upsert({
          where: {
            companyId_name: {
              companyId,
              name: doc.name,
            },
          },
          update: {
            fileUrl: doc.fileUrl,
            status: "PENDING",
            uploadedAt: new Date(),
          },
          create: {
            companyId,
            name: doc.name,
            fileUrl: doc.fileUrl,
          },
        })
      )
    );

    res.status(200).json({
      success: true,
      message: "Company documents uploaded successfully",
      data: docsToInsert,
    });
  } catch (error) {
    const files = req.files || {};
    Object.values(files).flat().forEach((file) => {
      if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////
// // ACTIVATE COMPANY
// //////////////////////////

export const activateCompanyController = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await activateCompany(id);

    res.status(200).json({
      success: true,
      message: "Company approved and activated successfully",
      status: company.status
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////
// RESEND INVITATION
//////////////////////////

export const resendInvitation = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await resendCompanyInvite(id);

    res.status(200).json({
      success: true,
      ...result,
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////
// DELETE COMPANY
//////////////////////////

export const removeCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.query; // e.g., ?type=hard or ?type=soft

    const result = await deleteCompany(id, type);

    res.status(200).json({
      success: true,
      ...result,
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////
// RESTORE COMPANY
//////////////////////////

export const restoreCompany = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Dynamically import the service function to avoid circular dependency issues if any
    const { restoreCompanyService } = await import("../services/companyService.js");
    const result = await restoreCompanyService(id);

    res.status(200).json({
      success: true,
      ...result,
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const uploadCompanyLogoController = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!req.file) throw new Error("Logo image is required");

    const data = await prisma.company.update({
      where: { id: companyId },
      data: { companyLogo: req.file.path } // Cloudinary URL is in req.file.path
    });

    res.status(200).json({
      success: true,
      message: "Company logo uploaded successfully",
      logoUrl: req.file.path,
      data
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
