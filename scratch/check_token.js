import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const tokenFromUser = "781c4f5e6d5d7bd7ab34f1a26a2e090a09f9122a1e6d0509667e7e1d59221e96";
  const hashedToken = crypto.createHash("sha256").update(tokenFromUser).digest("hex");
  
  console.log("User's Token:", tokenFromUser);
  console.log("Hashed Token:", hashedToken);

  const invite1 = await prisma.companyInvite.findFirst({
    where: { token: tokenFromUser }
  });
  if (invite1) console.log("Found user token directly in DB (this means they copied from DB)!");

  const invite2 = await prisma.companyInvite.findFirst({
    where: { token: hashedToken }
  });
  if (invite2) console.log("Found hashed token in DB (this means user token is raw and valid)!");

  if (!invite1 && !invite2) {
     console.log("Token not found anywhere in DB.");
     
     // Let's print the top 2 tokens to see what's actually there
     const invites = await prisma.companyInvite.findMany({
         orderBy: { createdAt: 'desc' },
         take: 2
     });
     console.log("Latest tokens in DB:", invites.map(i => i.token));
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
