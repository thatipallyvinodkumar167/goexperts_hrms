import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const updatedEmployee = await prisma.employee.updateMany({
    where: { companyId: '83fc6706-297b-44a0-8369-8976a3685aca' },
    data: { status: 'ACTIVE' },
  });
  console.log('Updated employees:', updatedEmployee.count);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
