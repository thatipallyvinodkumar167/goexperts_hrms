import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting Direct Master Seeding (Full Refresh)...");

  // 1. Wipe old templates to prevent duplicates
  console.log("🧹 Cleaning up old templates...");
  await prisma.designationTemplate.deleteMany({});
  await prisma.departmentTemplate.deleteMany({});
  await prisma.salaryTemplate.deleteMany({});
  await prisma.subscriptionPlan.deleteMany({}); // Wipe old plans too

  const industriesData = [
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
      ]
    },
    {
      id: "405d6b2d-bdf8-48a6-b3d6-7862b32e7d41",
      name: "Healthcare / Medical",
      departments: ["Nursing", "Surgery", "Pharmacy", "Admin", "Radiology", "OPD"],
      designations: [
        { title: "Resident Doctor", level: 4 },
        { title: "Staff Nurse", level: 2 },
        { title: "Medical Officer", level: 5 }
      ]
    },
    {
      id: "6c4c6b5d-ad25-4a74-bc29-502d9e16cdeb",
      name: "Finance / Banking",
      departments: ["Investment", "Compliance", "Retail Banking", "Risk", "Operations"],
      designations: [
        { title: "Relationship Manager", level: 3 },
        { title: "Branch Manager", level: 6 },
        { title: "Analyst", level: 2 }
      ]
    },
    {
      id: "00d56702-549f-41a4-a8ba-d5e1ced74d88",
      name: "Legal / Consulting",
      departments: ["Corporate Law", "Litigation", "Compliance", "Consultancy"],
      designations: [{ title: "Legal Associate", level: 3 }, { title: "Senior Consultant", level: 5 }]
    },
    {
      id: "37d1515f-5f17-43ba-84e5-06bcf37e5429",
      name: "Manufacturing / Automotive",
      departments: ["Production", "Quality Control", "Logistics", "R&D"],
      designations: [{ title: "Plant Head", level: 8 }, { title: "Production Engineer", level: 3 }]
    }
  ];

  for (const ind of industriesData) {
    console.log(`📦 Seeding Industry: ${ind.name}...`);
    const industry = await prisma.industryType.upsert({
      where: { id: ind.id },
      update: { name: ind.name },
      create: { id: ind.id, name: ind.name }
    });
    await Promise.all(ind.departments.map(name => prisma.departmentTemplate.create({ data: { name, industryTypeId: industry.id } })));
    await Promise.all(ind.designations.map(des => prisma.designationTemplate.create({ data: { title: des.title, level: des.level, industryTypeId: industry.id } })));
  }

  // 4. Create Subscription Plans
  console.log("💳 Seeding Subscription Plans...");
  const plans = [
    { name: "BASIC", price: 0, duration: 365, features: { employees: 50, modules: ["Core HR", "Attendance"] } },
    { name: "PRO", price: 99, duration: 365, features: { employees: 200, modules: ["Payroll", "Performance"] } },
    { name: "ENTERPRISE", price: 499, duration: 365, features: { employees: 10000, modules: ["All"] } }
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.create({ data: plan });
  }

  console.log("✅ Database Master Seeding Completed Successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
