import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Find the most recently created employee
  const employee = await prisma.employee.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { joiningDate: 'desc' },
    include: { user: true }
  });

  if (!employee) {
    console.log("No ACTIVE employees found.");
    return;
  }

  const payload = {
    id: employee.userId,
    role: employee.user.role,
    companyId: employee.companyId
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });

  console.log("--- EMPLOYEE TOKEN ---");
  console.log("Email:", employee.user.email);
  console.log("Role:", employee.user.role);
  console.log("Company ID:", employee.companyId);
  console.log("Employee ID:", employee.id);
  console.log("Token:");
  console.log(token);
  console.log("----------------------");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
