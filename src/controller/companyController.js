import {
  createCompanyService,
  getAllCompaniesService,
  getCompanyByIdService,
  updateCompanyService,
  deleteCompanyService,
} from "../services/companyService.js";

export const createCompany = async (req, res) => {
  try {
    const result = await createCompanyService({
      ...req.body,
      createdById: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "company created successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    const companies = await getAllCompaniesService();

    res.status(200).json({
      success: true,
      count: companies.length,
      data: companies,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const company = await getCompanyByIdService(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "company not found",
      });
    }

    res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateCompany = async (req, res) => {
  try {
    const result = await updateCompanyService({
      id: req.params.id,
      ...req.body,
      updatedById: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Company updated successfully",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    await deleteCompanyService({
      id: req.params.id,
      deletedById: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "Company deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
