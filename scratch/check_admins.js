import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkAdmins() {
  const admins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN" },
    select: { email: true, name: true, status: true }
  });
  console.log("SUPER_ADMINS_FOUND:", JSON.stringify(admins));
}

checkAdmins().finally(() => prisma.$disconnect());
