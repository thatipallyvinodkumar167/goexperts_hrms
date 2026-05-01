import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const email = "bhanu@testing.com";
  
  // Clean up old
  await prisma.companyInvite.deleteMany({ where: { email } });
  
  // Create a new company
  let company = await prisma.company.findFirst({ where: { email } });
  if (!company) {
      company = await prisma.company.create({
          data: {
              name: "Testing Corp",
              email: email,
              createdById: "super_admin_id_placeholder", // Assuming this doesn't strictly foreign key check, or we need a real ID
              status: "INVITED"
          }
      });
  }

  // Generate RAW token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  await prisma.companyInvite.create({
      data: {
          email: email,
          token: hashedToken,
          companyId: company.id,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
  });

  // Also make sure a user exists
  let user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
      user = await prisma.user.create({
          data: {
              name: "Bhanu",
              email: email,
              password: "",
              role: "OWNER",
              companyId: company.id
          }
      });
  }

  console.log("=== SUCCESS ===");
  console.log("RAW TOKEN FOR POSTMAN:", rawToken);
  console.log("===============");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
