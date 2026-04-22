import prisma from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";



//
export const createCompanyService = async ({
    name,
    email,
    domain,
    location,
    password,
    adminName,
    adminEmail,
    createdById

}) => {
    const normalizedDomain = domain?.trim().toLowerCase() || null;
    const normalizedLocation = location?.trim() || null;

    //checking company is there or not 
    const existingCompany = await prisma.company.findFirst({where : {email}});


    if(existingCompany){
        throw new Error("company already exist");
    }

    //checking company admin email is there or not 
    const existingAdmin = await prisma.user.findFirst({where : {email : adminEmail, companyId : null}});

    if(existingAdmin){
        throw new Error("admin user already existing");
    }

    if (normalizedDomain) {
        const existingDomain = await prisma.company.findFirst({
            where: { domain: normalizedDomain }
        });
        if (existingDomain) {
            throw new Error("company domain already exists");
        }
    }

    const hashedPassword = await hashPassword(password);

    const result = await prisma.$transaction( async (tx) => {
        
        const company = await tx.company.create({
           data : { name,
            email,
            domain: normalizedDomain,
            location: normalizedLocation,
            createdById
           }  
        });

        const adminUser = await tx.user.create({
            data : {
                name : adminName,
                email : adminEmail,
                password : hashedPassword,
                role : "COMPANY_ADMIN",
                companyId : company.id
            }
        });

        await tx.auditLog.create({
            data :{
                userId : createdById,
                action : "CREATE",
                module : "COMPANY",

            }
        });

        return {company, adminUser};

    } );
return result;
};

export const getAllCompaniesService = async () => {
  return prisma.company.findMany({
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      departments: true,
      designations: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getCompanyByIdService = async (id) => {
  return prisma.company.findUnique({
    where: { id },
    include: {
      users: true,
      departments: true,
      designations: true,
      leaveTypes: true,
      subscriptions: true,
    },
  });
};

export const updateCompanyService = async ({
  id,
  name,
  email,
  domain,
  location,
  adminName,
  adminEmail,
  updatedById,
}) => {
  const existing = await prisma.company.findUnique({
    where: { id },
    include: {
      users: true,
    },
  });

  if (!existing) {
    throw new Error("company not found");
  }

  const adminUser = existing.users.find((u) => u.role === "COMPANY_ADMIN");
  if (!adminUser) {
    throw new Error("company admin not found");
  }

  let normalizedDomain = existing.domain;
  if (typeof domain === "string") {
    normalizedDomain = domain.trim().toLowerCase() || null;
  }

  if (normalizedDomain) {
    const existingDomain = await prisma.company.findFirst({
      where: {
        domain: normalizedDomain,
        NOT: { id },
      },
    });

    if (existingDomain) {
      throw new Error("Domain already in use");
    }
  }

  if (adminEmail) {
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: adminEmail,
        NOT: { id: adminUser.id },
      },
    });

    if (existingAdmin) {
      throw new Error("Admin email already exists");
    }
  }

  return prisma.$transaction(async (tx) => {
    const updatedCompany = await tx.company.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        email: email ?? existing.email,
        domain: normalizedDomain,
        location: location ?? existing.location,
      },
    });

    const updatedAdmin = await tx.user.update({
      where: { id: adminUser.id },
      data: {
        name: adminName ?? adminUser.name,
        email: adminEmail ?? adminUser.email,
      },
    });

    await tx.auditLog.create({
      data: {
        userId: updatedById,
        action: "UPDATE",
        module: "COMPANY",
      },
    });

    return { updatedCompany, updatedAdmin };
  });
};

export const deleteCompanyService = async ({ id, deletedById }) => {
  const company = await prisma.company.findUnique({
    where: { id },
  });

  if (!company) {
    throw new Error("company not found");
  }

  await prisma.$transaction(async (tx) => {
    // Collect company user ids for cleanup of user-bound tables.
    const companyUsers = await tx.user.findMany({
      where: { companyId: id },
      select: { id: true },
    });
    const companyUserIds = companyUsers.map((u) => u.id);

    // Employee tree cleanup.
    await tx.attendance.deleteMany({
      where: { employee: { user: { companyId: id } } },
    });
    await tx.leave.deleteMany({
      where: { employee: { user: { companyId: id } } },
    });
    await tx.payroll.deleteMany({
      where: { employee: { user: { companyId: id } } },
    });
    await tx.employeeExperience.deleteMany({
      where: { employee: { user: { companyId: id } } },
    });
    await tx.employeePersonal.deleteMany({
      where: { employee: { user: { companyId: id } } },
    });
    await tx.joiningLetter.deleteMany({
      where: { employee: { user: { companyId: id } } },
    });
    await tx.employee.deleteMany({
      where: { user: { companyId: id } },
    });

    // Candidate pipeline cleanup.
    await tx.interview.deleteMany({
      where: { candidate: { companyId: id } },
    });
    await tx.offerLetter.deleteMany({
      where: { candidate: { companyId: id } },
    });
    await tx.candidate.deleteMany({
      where: { companyId: id },
    });

    // Company-level cleanup.
    await tx.subscription.deleteMany({
      where: { companyId: id },
    });
    await tx.leaveType.deleteMany({
      where: { companyId: id },
    });
    await tx.department.deleteMany({
      where: { companyId: id },
    });
    await tx.designation.deleteMany({
      where: { companyId: id },
    });

    // User-bound cleanup for company users.
    if (companyUserIds.length > 0) {
      await tx.passwordResetToken.deleteMany({
        where: { userId: { in: companyUserIds } },
      });
      await tx.auditLog.deleteMany({
        where: { userId: { in: companyUserIds } },
      });
      await tx.hR.deleteMany({
        where: { userId: { in: companyUserIds } },
      });
    }

    // Finally remove company users and company.
    await tx.user.deleteMany({
      where: { companyId: id },
    });

    await tx.company.delete({
      where: { id },
    });

    await tx.auditLog.create({
      data: {
        userId: deletedById,
        action: "DELETE",
        module: "COMPANY",
      },
    });
  });
};
