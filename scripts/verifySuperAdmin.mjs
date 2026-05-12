import prismaPkg from "@prisma/client";
import bcrypt from "bcrypt";

const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

try {
  const email = "goexperts@admin";
  const plainPassword = "goexperts";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const existing = await prisma.user.findFirst({
    where: { email, role: "SUPER_ADMIN" },
    select: { id: true }
  });

  let user;

  if (existing) {
    user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name: "GoExperts Super Admin",
        password: hashedPassword,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        isEmailVerified: true,
        companyId: null
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
  } else {
    user = await prisma.user.create({
      data: {
        name: "GoExperts Super Admin",
        email,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        status: "ACTIVE",
        companyId: null,
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
  }

  console.log("Super admin ensured successfully:");
  console.log(JSON.stringify(user, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
