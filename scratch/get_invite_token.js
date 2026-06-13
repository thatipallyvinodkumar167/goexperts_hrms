import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const latestInvite = await prisma.employeeInvite.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!latestInvite) {
    console.log("No employee invites found in the database.");
    return;
  }

  console.log("--- LATEST EMPLOYEE INVITE ---");
  console.log("Email:", latestInvite.email);
  console.log("Name:", latestInvite.name);
  console.log("Token to use in setup-password:");
  console.log(latestInvite.token);
  console.log("------------------------------");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
