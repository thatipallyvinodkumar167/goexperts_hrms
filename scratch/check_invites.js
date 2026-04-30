import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const invites = await prisma.companyInvite.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log("LATEST 5 INVITES:");
  for (const invite of invites) {
    console.log(`Email: ${invite.email}`);
    console.log(`Stored Token (Hashed): ${invite.token}`);
    console.log(`Expires At: ${invite.expiresAt}`);
    console.log(`Accepted At: ${invite.acceptedAt}`);
    console.log('---');
  }

  // To check if hashing is the issue, let's hash a test token
  const testRawToken = '071d5bb7a897a23cc80ea8777cf10de5039b7d27221764b064f4d8e653f7e991';
  const hashed = crypto.createHash("sha256").update(testRawToken).digest("hex");
  console.log(`Hash of ${testRawToken} is: ${hashed}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
