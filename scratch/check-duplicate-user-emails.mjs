import prisma from "../src/config/db.js";

try {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, companyId: true },
  });

  const byEmail = new Map();
  for (const user of users) {
    const email = user.email.toLowerCase();
    byEmail.set(email, [...(byEmail.get(email) || []), user]);
  }

  const duplicates = [...byEmail.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([email, entries]) => ({ email, entries }));

  console.log(JSON.stringify(duplicates, null, 2));
} finally {
  await prisma.$disconnect();
}
