import prisma from "../src/config/db.js";

const roles = ["EMPLOYEE", "HR"];
const now = new Date();

try {
  const users = await prisma.user.findMany({
    where: {
      role: { in: roles },
      deletedAt: null,
    },
    select: {
      id: true,
      role: true,
      email: true,
      employee: { select: { id: true } },
    },
  });

  const employeeIds = users
    .map((user) => user.employee?.id)
    .filter(Boolean);

  const result = await prisma.$transaction(async (tx) => {
    const employees = employeeIds.length
      ? await tx.employee.updateMany({
          where: { id: { in: employeeIds } },
          data: {
            deletedAt: now,
            status: "INACTIVE",
          },
        })
      : { count: 0 };

    const userUpdate = await tx.user.updateMany({
      where: {
        id: { in: users.map((user) => user.id) },
      },
      data: {
        deletedAt: now,
        status: "INACTIVE",
      },
    });

    return { employees, users: userUpdate };
  });

  console.log(JSON.stringify({
    softDeletedUsers: result.users.count,
    softDeletedEmployeeProfiles: result.employees.count,
    roles,
    emails: users.map((user) => ({ email: user.email, role: user.role })),
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
