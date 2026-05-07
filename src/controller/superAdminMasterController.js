import prisma from "../config/db.js";

//////////////////////////
// INDUSTRY TYPES
//////////////////////////

export const getAllIndustryTypes = async (req, res) => {
  try {
    const data = await prisma.industryType.findMany({
      include: {
        _count: {
          select: { departments: true, designations: true }
        }
      }
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getIndustryTypeDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await prisma.industryType.findUnique({
      where: { id },
      include: {
        departments: true,
        designations: true
      }
    });
    if (!data) return res.status(404).json({ success: false, message: "Industry type not found" });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createIndustryType = async (req, res) => {
  try {
    const { name } = req.body;
    const data = await prisma.industryType.create({ data: { name } });
    res.status(201).json({ success: true, message: "Industry type created", data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////
// DEPARTMENT TEMPLATES
//////////////////////////

export const addDepartmentTemplate = async (req, res) => {
  try {
    const { industryTypeId, name } = req.body;
    const data = await prisma.departmentTemplate.create({
      data: { name, industryTypeId }
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeDepartmentTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.departmentTemplate.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Department template removed" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////
// DESIGNATION TEMPLATES
//////////////////////////

export const addDesignationTemplate = async (req, res) => {
  try {
    const { industryTypeId, title, level } = req.body;
    const data = await prisma.designationTemplate.create({
      data: { title, level: Number(level), industryTypeId }
    });
    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeDesignationTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.designationTemplate.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Designation template removed" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
