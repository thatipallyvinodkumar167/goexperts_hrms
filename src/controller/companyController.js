import {
  createCompanyWithInvite,
  setupCompanyAccount,
  completeCompanyProfile,
  activateCompany,
  getCompaniesForAdmin,
  resendCompanyInvite,
  updateCompanyProfile,
  deleteCompany
} from "../services/companyService.js";

//////////////////////////
// GET ALL COMPANIES (SUPER ADMIN)
//////////////////////////

export const getAllCompanies = async (req, res) => {
  try {
    const data = await getCompaniesForAdmin();

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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

//////////////////////////
// SETUP ACCOUNT
//////////////////////////

export const setupAccount = async (req, res) => {
  try {
    const { token, password } = req.body;

    const result = await setupCompanyAccount(token, password);

    res.status(200).json({ success: true, ...result });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////
// COMPLETE PROFILE
//////////////////////////

export const completeProfile = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    const data = await completeCompanyProfile(companyId, req.body);

    res.status(200).json({
      success: true,
      message: "Profile completed",
      data,
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

    const data = await updateCompanyProfile(companyId, req.body);

    res.status(200).json({
      success: true,
      message: "Company profile updated successfully",
      data,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////
// ACTIVATE COMPANY
//////////////////////////

export const activateCompanyController = async (req, res) => {
  try {
    const { id } = req.params;

    const data = await activateCompany(id);

    res.status(200).json({
      success: true,
      message: "Company approved and activated successfully",
      data,
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

    const result = await deleteCompany(id);

    res.status(200).json({
      success: true,
      ...result,
    });

  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

