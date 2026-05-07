import prisma from "../config/db.js";

/**
 * Automatically seeds a company's Master Data (Departments/Designations) 
 * based on their selected Industry Type template.
 */
export const seedCompanyMastersFromTemplate = async (companyId, industryTypeId) => {
  try {
    console.log(`🛠️ Auto-seeding masters for company ${companyId} using industry ${industryTypeId}`);

    // 1. Fetch the Industry Template
    const industry = await prisma.industryType.findUnique({
      where: { id: industryTypeId },
      include: {
        departments: true,
        designations: true,
      },
    });

    if (!industry) {
      console.warn("⚠️ No industry template found for ID:", industryTypeId);
      return;
    }

    // 2. Check if company already has masters (to avoid duplicates)
    const existingDepts = await prisma.department.count({ where: { companyId } });
    if (existingDepts > 0) {
      console.log("ℹ️ Company already has departments, skipping auto-seed.");
      return;
    }

    // 3. Create Departments for the Company
    if (industry.departments.length > 0) {
      await prisma.department.createMany({
        data: industry.departments.map((d) => ({
          name: d.name,
          companyId,
        })),
      });
      console.log(`✅ Seeded ${industry.departments.length} departments.`);
    }

    // 4. Create Designations for the Company
    if (industry.designations.length > 0) {
      await prisma.designation.createMany({
        data: industry.designations.map((d) => ({
          title: d.title,
          level: d.level,
          companyId,
        })),
      });
      console.log(`✅ Seeded ${industry.designations.length} designations.`);
    }

  } catch (error) {
    console.error("❌ Error auto-seeding company masters:", error.message);
    // We don't throw here to avoid blocking the main activation flow, 
    // but in production you might want more robust error handling.
  }
};
