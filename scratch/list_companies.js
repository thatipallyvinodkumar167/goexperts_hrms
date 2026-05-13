import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const companies = await prisma.company.findMany({
    select: { id: true, name: true, email: true }
  });
  console.log("COMPANIES_FOUND:", JSON.stringify(companies));
}

main().finally(() => prisma.$disconnect());
