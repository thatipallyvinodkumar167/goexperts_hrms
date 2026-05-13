import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Smart Master Seeding (Linked Dropdowns)...");

  console.log("🧹 Cleaning up old templates...");
  // 1. Delete templates (not linked to activated companies yet)
  await prisma.designationTemplate.deleteMany({});
  await prisma.departmentTemplate.deleteMany({});
  await prisma.salaryTemplate.deleteMany({});
  // Note: We DO NOT delete subscription plans because they are linked to active companies

  const industriesData = [
    {
      id: "d0e987fe-f71e-4822-84c2-ad34cc0f69ad",
      name: "IT / Software",
      departments: [
        {
          name: "Software Development",
          designations: [
            { title: "Junior Developer", level: 2 },
            { title: "Software Engineer", level: 3 },
            { title: "Senior Developer", level: 5 },
            { title: "Tech Lead", level: 7 },
            { title: "Architect", level: 9 }
          ]
        },
        {
          name: "HR",
          designations: [
            { title: "HR Coordinator", level: 2 },
            { title: "HR Manager", level: 6 },
            { title: "HR Director", level: 9 }
          ]
        },
        {
          name: "Finance",
          designations: [
            { title: "Accountant", level: 3 },
            { title: "Finance Head", level: 8 }
          ]
        }
      ]
    }
  ];

  for (const ind of industriesData) {
    console.log(`📦 Seeding Industry: ${ind.name}...`);
    const industry = await prisma.industryType.upsert({
      where: { id: ind.id },
      update: { name: ind.name },
      create: { id: ind.id, name: ind.name }
    });

    for (const dept of ind.departments) {
      console.log(`  🏢 Creating Dept: ${dept.name}...`);
      const department = await prisma.departmentTemplate.create({
        data: { name: dept.name, industryTypeId: industry.id }
      });

      for (const des of dept.designations) {
        await prisma.designationTemplate.create({
          data: { 
            title: des.title, 
            level: des.level, 
            industryTypeId: industry.id,
            departmentId: department.id
          }
        });
      }
    }
  }

  console.log("💳 Upserting Subscription Plans (Safe Mode)...");
  const plans = [
    { name: "BASIC", price: 0, duration: 365, features: { employees: 50, modules: ["Core HR"] } },
    { name: "PRO", price: 99, duration: 365, features: { employees: 200, modules: ["Payroll"] } },
    { name: "ENTERPRISE", price: 499, duration: 365, features: { employees: 10000, modules: ["All"] } }
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: plan,
      create: plan
    });
  }

  console.log("✅ Smart Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
