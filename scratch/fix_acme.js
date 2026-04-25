import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst({
    where: { email: 'contact@acme.com' }
  });

  if (company) {
    await prisma.company.update({
      where: { id: company.id },
      data: {
        domain: 'acme.com',
        status: 'ACTIVE'
      }
    });
    console.log('Fixed Acme company record');
  } else {
    console.log('Acme company not found');
  }
}

main().finally(() => prisma.$disconnect());
