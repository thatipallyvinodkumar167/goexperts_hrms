import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const industryId = "d0e987fe-f71e-4822-84c2-ad34cc0f69ad"; // IT Industry
  
  const departments = await prisma.departmentTemplate.findMany({
    where: { industryTypeId: industryId }
  });
  
  const designations = await prisma.designationTemplate.findMany({
    where: { industryTypeId: industryId }
  });

  console.log("DEPARTMENTS:", JSON.stringify(departments));
  console.log("DESIGNATIONS:", JSON.stringify(designations));
}

main().finally(() => prisma.$disconnect());
