import prisma from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";



//
export const createCompanyService = async ({
    name,
    email,
    domain,
    location,
    companyLogo,
    ownerName,
    ownerEmail,
    ownerPhone,
    password,
    adminName,
    createdById

}) => {
    const normalizedDomain = domain?.trim().toLowerCase() || null;
    const normalizedLocation = location?.trim() || null;
    const normalizedCompanyLogo = companyLogo?.trim() || null;
    const normalizedOwnerName = ownerName?.trim() || adminName?.trim() || null;
    const normalizedOwnerEmail = ownerEmail?.trim().toLowerCase() || email?.trim().toLowerCase() || null;
    const normalizedOwnerPhone = ownerPhone?.trim() || null;

    //checking company is there or not 
    const existingCompany = await prisma.company.findFirst({where : {email}});


    if(existingCompany){
        throw new Error("company already exist");
    }

    //checking company admin email is there or not 
    const existingAdmin = await prisma.user.findFirst({where : {email, companyId : null}});

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
            ownerName: normalizedOwnerName,
            ownerEmail: normalizedOwnerEmail,
            ownerPhone: normalizedOwnerPhone,
            domain: normalizedDomain,
            location: normalizedLocation,
            companyLogo: normalizedCompanyLogo,
            createdById
           }  
        });

        const adminUser = await tx.user.create({
            data : {
                name : adminName,
                email,
                password : hashedPassword,
                role : "OWNER",
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

//get all company
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

//get company by id
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

//update company 
export const updateCompanyService = async ({
  id,
  name,
  email,
  ownerName,
  ownerEmail,
  ownerPhone,
  domain,
  location,
  companyLogo,
  adminName,
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

  const adminUser = existing.users.find((u) => u.role === "OWNER");
  if (!adminUser) {
    throw new Error("company owner not found");
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

  if (email) {
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email,
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
        ownerName: ownerName ?? existing.ownerName,
        ownerEmail: ownerEmail ?? existing.ownerEmail,
        ownerPhone: ownerPhone ?? existing.ownerPhone,
        domain: normalizedDomain,
        location: location ?? existing.location,
        companyLogo: companyLogo ?? existing.companyLogo,
      },
    });

    const updatedAdmin = await tx.user.update({
      where: { id: adminUser.id },
      data: {
        name: adminName ?? adminUser.name,
        email: email ?? adminUser.email,
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


//delete company
export const deleteCompanyService = async ({ id, deletedById }) => {
  const company = await prisma.company.findUnique({
    where: { id },
  });

  if (!company) {
    throw new Error("company not found");
  }

  await prisma.$transaction(async (tx) => {
    const deleteManyIfExists = async (delegateName, args) => {
      const delegate = tx[delegateName];
      if (delegate && typeof delegate.deleteMany === "function") {
        await delegate.deleteMany(args);
      }
    };

    const deleteIfExists = async (delegateName, args) => {
      const delegate = tx[delegateName];
      if (delegate && typeof delegate.delete === "function") {
        await delegate.delete(args);
      }
    };

    // Collect company user ids for cleanup of user-bound tables.
    const companyUsers = await tx.user.findMany({
      where: { companyId: id },
      select: { id: true },
    });
    const companyUserIds = companyUsers.map((u) => u.id);

    // Employee tree cleanup.
    await deleteManyIfExists("attendance", {
      where: { employee: { user: { companyId: id } } },
    });
    await deleteManyIfExists("leave", {
      where: { employee: { user: { companyId: id } } },
    });
    await deleteManyIfExists("payroll", {
      where: { employee: { user: { companyId: id } } },
    });
    await deleteManyIfExists("employeeExperience", {
      where: { employee: { user: { companyId: id } } },
    });
    await deleteManyIfExists("employeePersonal", {
      where: { employee: { user: { companyId: id } } },
    });
    await deleteManyIfExists("joiningLetter", {
      where: { employee: { user: { companyId: id } } },
    });
    await deleteManyIfExists("employee", {
      where: { user: { companyId: id } },
    });

    // Candidate pipeline cleanup.
    await deleteManyIfExists("interview", {
      where: { candidate: { companyId: id } },
    });
    await deleteManyIfExists("offerLetter", {
      where: { candidate: { companyId: id } },
    });
    await deleteManyIfExists("candidate", {
      where: { companyId: id },
    });

    // Company-level cleanup.
    await deleteManyIfExists("subscription", {
      where: { companyId: id },
    });
    await deleteManyIfExists("leaveType", {
      where: { companyId: id },
    });
    await deleteManyIfExists("department", {
      where: { companyId: id },
    });
    await deleteManyIfExists("designation", {
      where: { companyId: id },
    });

    // User-bound cleanup for company users.
    if (companyUserIds.length > 0) {
      await deleteManyIfExists("passwordResetToken", {
        where: { userId: { in: companyUserIds } },
      });
      await deleteManyIfExists("auditLog", {
        where: { userId: { in: companyUserIds } },
      });
      // Prisma naming can be `hr` or `hR` depending on generated client shape.
      if (tx.hr && typeof tx.hr.deleteMany === "function") {
        await tx.hr.deleteMany({ where: { userId: { in: companyUserIds } } });
      } else if (tx.hR && typeof tx.hR.deleteMany === "function") {
        await tx.hR.deleteMany({ where: { userId: { in: companyUserIds } } });
      }
    }

    // Finally remove company users and company.
    await deleteManyIfExists("user", {
      where: { companyId: id },
    });

    await deleteIfExists("company", {
      where: { id },
    });

    if (tx.auditLog && typeof tx.auditLog.create === "function") {
      await tx.auditLog.create({
        data: {
          userId: deletedById,
          action: "DELETE",
          module: "COMPANY",
        },
      });
    }
  }, {
    maxWait: 10000,
    timeout: 60000,
  });
};
