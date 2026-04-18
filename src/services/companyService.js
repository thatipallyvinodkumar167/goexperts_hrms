import prisma from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";

export const createCompanyService = async ({
  companyName,
  companyEmail,
  domain,
  password,
  adminName,
  adminEmail,
  createdById,
}) => {
  const hashedPassword = await hashPassword(password);

  return prisma.$transaction(async (tx) => {
    const company = await tx.company.create({
      data: {
        name: companyName,
        email: companyEmail,
        domain: domain || null,
        createdById,
      },
    });

    const adminUser = await tx.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "COMPANY_ADMIN",
        companyId: company.id,
      },
    });

    return { company, adminUser };
  });
};
