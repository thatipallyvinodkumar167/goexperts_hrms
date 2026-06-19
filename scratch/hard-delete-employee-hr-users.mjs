import prisma from "../src/config/db.js";

const roles = ["EMPLOYEE", "HR"];

try {
  const users = await prisma.user.findMany({
    where: { role: { in: roles } },
    select: {
      id: true,
      role: true,
      email: true,
      employee: { select: { id: true } },
    },
  });

  const userIds = users.map((user) => user.id);
  const employeeIds = users.map((user) => user.employee?.id).filter(Boolean);

  if (userIds.length === 0) {
    console.log(JSON.stringify({ hardDeletedUsers: 0, hardDeletedEmployeeProfiles: 0 }, null, 2));
    process.exit(0);
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.companyInvite.updateMany({
      where: { userId: { in: userIds } },
      data: { userId: null },
    });

    await tx.employeeInvite.updateMany({
      where: { userId: { in: userIds } },
      data: { userId: null },
    });

    await tx.auditLog.deleteMany({
      where: { userId: { in: userIds } },
    });

    await tx.passwordResetToken.deleteMany({
      where: { userId: { in: userIds } },
    });

    if (employeeIds.length > 0) {
      await tx.correctionRequest.updateMany({
        where: { approvedBy: { in: employeeIds } },
        data: { approvedBy: null },
      });

      await tx.employee.updateMany({
        where: { managerId: { in: employeeIds } },
        data: { managerId: null },
      });
    }

    await tx.hR.deleteMany({
      where: { userId: { in: userIds } },
    });

    const deletedEmployees = await tx.employee.deleteMany({
      where: { userId: { in: userIds } },
    });

    const deletedUsers = await tx.user.deleteMany({
      where: { id: { in: userIds } },
    });

    return { deletedEmployees, deletedUsers };
  }, { timeout: 30000 });

  console.log(JSON.stringify({
    hardDeletedUsers: result.deletedUsers.count,
    hardDeletedEmployeeProfiles: result.deletedEmployees.count,
    roles,
    emails: users.map((user) => ({ email: user.email, role: user.role })),
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
