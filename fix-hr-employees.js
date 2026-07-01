import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing existing HR users without Employee records...');

  // Find all HR users that don't have an Employee record
  const hrUsers = await prisma.user.findMany({
    where: { role: 'HR' },
    include: { employee: true }
  });

  let fixed = 0;

  for (const user of hrUsers) {
    if (!user.employee) {
      console.log(`Creating Employee record for HR user: ${user.email}`);

      // Find department and designation for their company
      const dept = await prisma.department.findFirst({ where: { companyId: user.companyId } });
      const desig = await prisma.designation.findFirst({ where: { companyId: user.companyId } });

      if (!dept || !desig) {
        console.warn(`  ⚠️ No department/designation found for company ${user.companyId}, skipping...`);
        continue;
      }

      await prisma.employee.create({
        data: {
          userId: user.id,
          companyId: user.companyId,
          employeeCode: `HR-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          departmentId: dept.id,
          designationId: desig.id,
          joiningDate: user.createdAt,
          employmentType: 'EXPERIENCED',
          workModel: 'WFO',
        }
      });

      // Also ensure HR record exists
      const existingHR = await prisma.hR.findUnique({ where: { userId: user.id } });
      if (!existingHR) {
        await prisma.hR.create({
          data: {
            userId: user.id,
            permissions: {
              canManageEmployees: true,
              canManageAttendance: true,
              canManageLeaves: true,
              canManagePayroll: true
            }
          }
        });
      }

      fixed++;
      console.log(`  ✅ Fixed HR user: ${user.email}`);
    } else {
      console.log(`  ✓ HR user ${user.email} already has an Employee record`);
    }
  }

  console.log(`\nDone! Fixed ${fixed} HR user(s).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
