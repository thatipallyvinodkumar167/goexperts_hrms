import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.departmentTemplate.findMany();
  console.log(JSON.stringify(templates));
}

main().catch(console.error).finally(() => prisma.$disconnect());
