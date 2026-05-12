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

//////////////////////////
// SYSTEM POLICIES
//////////////////////////

export const upsertSystemPolicy = async (req, res) => {
  try {
    const { type, content, version } = req.body;
    
    const data = await prisma.systemPolicy.upsert({
      where: { type },
      update: { content, version, updatedAt: new Date() },
      create: { type, content, version }
    });

    res.status(200).json({ success: true, message: `${type} updated successfully`, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getSystemPolicies = async (req, res) => {
  try {
    const data = await prisma.systemPolicy.findMany();
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const seedSystemData = async (req, res) => {
  try {
    const industries = [
      {
        name: "IT / Software",
        departments: ["Software Development", "DevOps", "QA", "HR", "Finance"],
        designations: [
          { title: "Junior Developer", level: 2 },
          { title: "Software Engineer", level: 3 },
          { title: "Senior Developer", level: 5 },
          { title: "Tech Lead", level: 7 }
        ],
        template: {
          name: "IT Standard (50/40/12/0.75)",
          basic: 50, hra: 40, pf: 12, esi: 0.75, empPf: 12, empEsi: 3.25
        }
      },
      {
        name: "Healthcare",
        departments: ["Nursing", "Surgery", "Pharmacy", "Admin"],
        designations: [
          { title: "Nurse", level: 3 },
          { title: "Physician", level: 5 },
          { title: "Surgeon", level: 8 }
        ],
        template: {
          name: "Healthcare Standard (55/35/12/0.75)",
          basic: 55, hra: 35, pf: 12, esi: 0.75, empPf: 12, empEsi: 3.25
        }
      }
    ];

    for (const ind of industries) {
      const industry = await prisma.industryType.upsert({
        where: { name: ind.name },
        update: {},
        create: {
          name: ind.name,
          departments: { create: ind.departments.map(d => ({ name: d })) },
          designations: { create: ind.designations.map(d => ({ title: d.title, level: d.level })) }
        }
      });

      if (ind.template) {
        await prisma.salaryTemplate.upsert({
          where: { industryTypeId: industry.id },
          update: {},
          create: {
            name: ind.template.name,
            basicPercentage: ind.template.basic,
            hraPercentageOfBasic: ind.template.hra,
            pfPercentage: ind.template.pf,
            esiPercentage: ind.template.esi,
            employerPfPercentage: ind.template.empPf,
            employerEsiPercentage: ind.template.empEsi,
            industryTypeId: industry.id
          }
        });
      }
    }

    res.status(200).json({ success: true, message: "System master data seeded successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
