import prismaPkg from "@prisma/client";
import bcrypt from "bcrypt";

const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

try {
  const email = "goexperts@admin";
  const plainPassword = "goexperts";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const user = await prisma.user.upsert({
    where: {
      email_companyId: {
        email,
        companyId: null
      }
    },
    create: {
      name: "GoExperts Super Admin",
      email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      companyId: null,
      isEmailVerified: true
    },
    update: {
      name: "GoExperts Super Admin",
      password: hashedPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      isEmailVerified: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      companyId: true,
      status: true,
      isEmailVerified: true
    }
  });

  console.log("Super admin ensured successfully:");
  console.log(JSON.stringify(user, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
