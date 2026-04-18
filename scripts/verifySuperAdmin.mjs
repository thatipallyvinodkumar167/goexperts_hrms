import prismaPkg from "@prisma/client";

const { PrismaClient } = prismaPkg;
const prisma = new PrismaClient();

try {
  const user = await prisma.user.findFirst({
    where: { email: "goexperts@admin", companyId: null },
    select: { id: true, name: true, email: true, role: true, companyId: true, status: true }
  });

  console.log(JSON.stringify(user, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
