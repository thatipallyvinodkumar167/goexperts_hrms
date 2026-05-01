import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = "31bhanu03@gmail.com";
  console.log("Looking up invites for:", email);
  
  const invites = await prisma.companyInvite.findMany({
    where: { email: email },
    orderBy: { createdAt: 'desc' }
  });
  
  if (invites.length === 0) {
      console.log("No invites found for this email.");
  } else {
      for (const invite of invites) {
          console.log(`Invite ID: ${invite.id}`);
          console.log(`Stored Hashed Token: ${invite.token}`);
          console.log(`Expires At: ${invite.expiresAt}`);
          console.log(`Accepted At: ${invite.acceptedAt}`);
          console.log('---');
      }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
