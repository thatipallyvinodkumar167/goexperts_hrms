import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const dept = await prisma.department.findUnique({
    where: { id: '26d43f81-c76b-4012-ac3b-79356078c56c' }
  });
  console.log(JSON.stringify(dept));
}

main().catch(console.error).finally(() => prisma.$disconnect());
