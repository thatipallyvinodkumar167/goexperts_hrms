import prisma from "../src/config/db.js";

try {
  const counts = await prisma.user.groupBy({
    by: ["role"],
    where: {
      role: { in: ["EMPLOYEE", "HR"] },
      deletedAt: null,
    },
    _count: { _all: true },
  });

  console.log(JSON.stringify(counts, null, 2));
} finally {
  await prisma.$disconnect();
}
