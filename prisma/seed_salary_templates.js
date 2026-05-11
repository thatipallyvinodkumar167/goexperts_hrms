import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding salary templates...");

  const industries = await prisma.industryType.findMany();

  if (industries.length === 0) {
    console.log("No industry types found. Please run industry seed first.");
    return;
  }

  const templates = [
    {
      name: "IT Standard (50/40/12/0.75)",
      basicPercentage: 50,
      hraPercentageOfBasic: 40,
      pfPercentage: 12,
      esiPercentage: 0.75,
      employerPfPercentage: 12,
      employerEsiPercentage: 3.25,
      industryName: "IT / Software",
    },
    {
      name: "Manufacturing Standard (60/30/12/0.75)",
      basicPercentage: 60,
      hraPercentageOfBasic: 30,
      pfPercentage: 12,
      esiPercentage: 0.75,
      employerPfPercentage: 12,
      employerEsiPercentage: 3.25,
      industryName: "Manufacturing",
    },
    {
      name: "Healthcare Standard (55/35/12/0.75)",
      basicPercentage: 55,
      hraPercentageOfBasic: 35,
      pfPercentage: 12,
      esiPercentage: 0.75,
      employerPfPercentage: 12,
      employerEsiPercentage: 3.25,
      industryName: "Healthcare",
    },
     {
      name: "Retail Standard (45/45/12/0.75)",
      basicPercentage: 45,
      hraPercentageOfBasic: 45,
      pfPercentage: 12,
      esiPercentage: 0.75,
      employerPfPercentage: 12,
      employerEsiPercentage: 3.25,
      industryName: "Retail / E-commerce",
    }
  ];

  for (const t of templates) {
    const industry = industries.find((i) => i.name === t.industryName);
    if (industry) {
      await prisma.salaryTemplate.upsert({
        where: { industryTypeId: industry.id },
        update: {
          name: t.name,
          basicPercentage: t.basicPercentage,
          hraPercentageOfBasic: t.hraPercentageOfBasic,
          pfPercentage: t.pfPercentage,
          esiPercentage: t.esiPercentage,
          employerPfPercentage: t.employerPfPercentage,
          employerEsiPercentage: t.employerEsiPercentage,
        },
        create: {
          name: t.name,
          basicPercentage: t.basicPercentage,
          hraPercentageOfBasic: t.hraPercentageOfBasic,
          pfPercentage: t.pfPercentage,
          esiPercentage: t.esiPercentage,
          employerPfPercentage: t.employerPfPercentage,
          employerEsiPercentage: t.employerEsiPercentage,
          industryTypeId: industry.id,
        },
      });
      console.log(`Updated/Created template for ${t.industryName}`);
    } else {
        console.log(`Industry ${t.industryName} not found, skipping template.`);
    }
  }

  console.log("Seeding completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
