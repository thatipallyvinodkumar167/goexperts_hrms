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

export const updateIndustryType = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const existingIndustry = await prisma.industryType.findUnique({ where: { id } });
    if (!existingIndustry) {
      return res.status(404).json({ success: false, message: "Industry type not found" });
    }

    const data = await prisma.industryType.update({
      where: { id },
      data: { name }
    });

    res.status(200).json({ success: true, message: "Industry type updated", data });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(400).json({ success: false, message: "Industry type name already exists" });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteIndustryType = async (req, res) => {
  try {
    const { id } = req.params;

    const existingIndustry = await prisma.industryType.findUnique({ where: { id } });
    if (!existingIndustry) {
      return res.status(404).json({ success: false, message: "Industry type not found" });
    }

    await prisma.industryType.delete({ where: { id } });
    res.status(200).json({ success: true, message: "Industry type deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////
// DEPARTMENT TEMPLATES
//////////////////////////

export const getDesignations = async (req, res) => {
  try {
    let { industryTypeId, departmentId } = req.query;
    const where = {};

    // 🏆 Industry Level Polish: Resolve company department ID to Template by Name
    if (departmentId) {
      const companyDept = await prisma.department.findUnique({
        where: { id: departmentId }
      });
      
      if (companyDept) {
        const template = await prisma.departmentTemplate.findFirst({
          where: { name: companyDept.name }
        });
        if (template) departmentId = template.id;
      }
    }

    if (industryTypeId) where.industryTypeId = industryTypeId;
    if (departmentId) where.departmentId = departmentId;

    let data = await prisma.designationTemplate.findMany({
      where,
      include: { department: true }
    });

    // 🚨 ULTIMATE FAILSAFE: If no designation templates exist for this department, return generic ones
    if (data.length === 0) {
      data = [
        { id: "gen-1", title: "Manager", level: "Senior" },
        { id: "gen-2", title: "Team Lead", level: "Mid" },
        { id: "gen-3", title: "Associate", level: "Junior" },
        { id: "gen-4", title: "Executive", level: "Entry" }
      ];
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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

export const updateDepartmentTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, industryTypeId } = req.body;

    if (!name && !industryTypeId) {
      return res.status(400).json({ success: false, message: "At least one field (name or industryTypeId) is required" });
    }

    const existingDepartment = await prisma.departmentTemplate.findUnique({ where: { id } });
    if (!existingDepartment) {
      return res.status(404).json({ success: false, message: "Department template not found" });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (industryTypeId) updateData.industryTypeId = industryTypeId;

    const data = await prisma.departmentTemplate.update({
      where: { id },
      data: updateData
    });

    res.status(200).json({ success: true, message: "Department template updated", data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

//////////////////////////
// DESIGNATION TEMPLATES
//////////////////////////

export const addDesignationTemplate = async (req, res) => {
  try {
    const { industryTypeId, departmentId, title, level } = req.body;
    const parsedLevel = Number(level);

    if (!title || !industryTypeId || isNaN(parsedLevel)) {
      return res.status(400).json({
        success: false,
        message: "title, industryTypeId and valid level are required"
      });
    }

    const data = await prisma.designationTemplate.create({
      data: {
        title,
        level: parsedLevel,
        industryType: { connect: { id: industryTypeId } },
        ...(departmentId ? { department: { connect: { id: departmentId } } } : {})
      }
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

export const updateDesignationTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, level } = req.body;
    
    const updateData = {};
    if (title) updateData.title = title;
    if (level !== undefined) updateData.level = Number(level);
    
    const data = await prisma.designationTemplate.update({
      where: { id },
      data: updateData
    });
    res.status(200).json({ success: true, message: "Designation template updated", data });
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
        id: "d0e987fe-f71e-4822-84c2-ad34cc0f69ad",
        name: "IT / Software",
        departments: ["Software Development", "DevOps", "QA", "HR", "Finance", "Product", "Design"],
        designations: [
          { title: "Junior Developer", level: 2 },
          { title: "Software Engineer", level: 3 },
          { title: "Senior Developer", level: 5 },
          { title: "Tech Lead", level: 7 },
          { title: "Architect", level: 9 }
        ],
        template: { name: "IT Standard", basic: 50, hra: 40, pf: 12, esi: 0.75, empPf: 12, empEsi: 3.25 }
      },
      {
        id: "405d6b2d-bdf8-48a6-b3d6-7862b32e7d41",
        name: "Healthcare / Medical",
        departments: ["Nursing", "Surgery", "Pharmacy", "Admin", "Radiology", "OPD"],
        designations: [
          { title: "Resident Doctor", level: 4 },
          { title: "Staff Nurse", level: 2 },
          { title: "Medical Officer", level: 5 }
        ],
        template: { name: "Medical Standard", basic: 45, hra: 35, pf: 12, esi: 0.75, empPf: 12, empEsi: 3.25 }
      },
      {
        id: "6c4c6b5d-ad25-4a74-bc29-502d9e16cdeb",
        name: "Finance / Banking",
        departments: ["Investment", "Compliance", "Retail Banking", "Risk", "Operations"],
        designations: [
          { title: "Relationship Manager", level: 3 },
          { title: "Branch Manager", level: 6 },
          { title: "Analyst", level: 2 }
        ],
        template: { name: "Finance Standard", basic: 50, hra: 40, pf: 12, esi: 0.75, empPf: 12, empEsi: 3.25 }
      },
      {
        id: "00d56702-549f-41a4-a8ba-d5e1ced74d88",
        name: "Legal / Consulting",
        departments: ["Corporate Law", "Litigation", "Compliance", "Consultancy"],
        designations: [{ title: "Legal Associate", level: 3 }, { title: "Senior Consultant", level: 5 }],
        template: { name: "Consulting Standard", basic: 50, hra: 40, pf: 12, esi: 0.75, empPf: 12, empEsi: 3.25 }
      },
      {
        id: "37d1515f-5f17-43ba-84e5-06bcf37e5429",
        name: "Manufacturing / Automotive",
        departments: ["Production", "Quality Control", "Logistics", "R&D"],
        designations: [{ title: "Plant Head", level: 8 }, { title: "Production Engineer", level: 3 }],
        template: { name: "Industrial Standard", basic: 40, hra: 30, pf: 12, esi: 0.75, empPf: 12, empEsi: 3.25 }
      },
      {
        id: "94cbb301-0edd-4f53-8a19-7fdd00142f5f",
        name: "Education / EdTech",
        departments: ["Academic", "Admissions", "Course Content", "Marketing"],
        designations: [{ title: "Educator", level: 3 }, { title: "Academic Dean", level: 8 }],
        template: { name: "EdTech Standard", basic: 50, hra: 40, pf: 12, esi: 0.75, empPf: 12, empEsi: 3.25 }
      },
      {
        id: "b48ace5f-fcc2-4e87-b54b-7f6aac7232c5",
        name: "Telecommunications",
        departments: ["Network Operations", "Broadband", "Support", "Engineering"],
        designations: [{ title: "Network Engineer", level: 3 }, { title: "Telecom Specialist", level: 4 }],
        template: { name: "Telecom Standard", basic: 45, hra: 35, pf: 12, esi: 0.75, empPf: 12, empEsi: 3.25 }
      },
      {
        id: "453ea47a-d2b5-46f9-b62a-99f3abd9c37f",
        name: "Retail / E-commerce",
        departments: ["Inventory", "Delivery", "Sourcing", "Digital Marketing"],
        designations: [{ title: "Store Manager", level: 4 }, { title: "Logistics Head", level: 6 }],
        template: { name: "Retail Standard", basic: 40, hra: 30, pf: 12, esi: 0.75, empPf: 12, empEsi: 3.25 }
      }
      // ... and more can be added here with the same pattern
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
