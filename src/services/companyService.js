import prisma from "../config/db.js";
import crypto from "crypto";
import { hashPassword } from "../utils/hashPassword.js";
import { assignTrialSubscription } from "./subscriptionService.js";
import { seedCompanyMastersFromTemplate } from "./masterSeedService.js";
import { seedCompanyLeaveTypes } from "./leaveService.js";

// ✅ NEW IMPORTS (ADDED)
import { sendEmail } from "../utils/sendEmail.js";
import { companyInviteTemplate } from "../utils/templates/companyInviteTemplate.js";
import { companyActivationTemplate } from "../utils/templates/companyActivationTemplate.js";

//////////////////////////
// 1. CREATE COMPANY + INVITE
//////////////////////////

export const createCompanyWithInvite = async ({
  name,
  email,
  ownerName,
  ownerEmail,
  location,
  createdById,
  industryTypeId,
}) => {

  if (!email || !email.includes("@")) {
    throw new Error("Invalid company email address");
  }

  const normalizedCompanyEmail = email.trim().toLowerCase();
  const normalizedOwnerEmail = ownerEmail?.trim().toLowerCase();

  // check existing company email only
  const existing = await prisma.company.findFirst({
    where: { 
      OR: [
        { email: normalizedCompanyEmail }
      ].filter(Boolean)
    },
  });

  if (existing) {
    throw new Error("Company with this Email already exists");
  }

  // ✅ TOKEN GENERATION (NO CHANGE, BUT USED PROPERLY NOW)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  const result = await prisma.$transaction(async (tx) => {

    const company = await tx.company.create({
      data: {
        name,
        email: normalizedCompanyEmail,
        domain: null,
        ownerName,
        ownerEmail: normalizedOwnerEmail,
        industryTypeId: industryTypeId || null,

        // ✅ STATUS FLOW (IMPROVED)
        status: "INVITED",
        invitedAt: new Date(),

        createdById,
      },
    });

    const ownerUser = await tx.user.create({
      data: {
        name: ownerName || (normalizedOwnerEmail || normalizedCompanyEmail).split('@')[0],
        email: normalizedOwnerEmail || normalizedCompanyEmail,
        password: "", // not set yet
        role: "OWNER",
        companyId: company.id,
        status: "INVITED",
      },
    });

    // ✅ STORE TOKEN (CORRECT)
    await tx.companyInvite.create({
      data: {
        email: normalizedOwnerEmail || normalizedCompanyEmail,
        token: hashedToken,
        companyId: company.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // ❌ REMOVED rawToken from return (SECURITY FIX)
    // ⚠️ TEMPORARY FOR TESTING: Returning rawToken so user can test via Postman easily
    return { company, ownerUser, rawToken };
  });

  // ✅ SEND EMAIL (OUTSIDE TRANSACTION TO AVOID TIMEOUTS)
  const inviteLink = `${process.env.FRONTEND_URL}/setup-password?token=${rawToken}`;
  
  // Fire-and-forget email so API responds immediately even if SMTP is slow/unreachable.
  sendEmail(
    normalizedCompanyEmail,
    "Activate Your Company Account",
    companyInviteTemplate(ownerName, inviteLink)
  ).catch((error) => {
    console.error("Delayed Email Error:", error.message);
  });

  return {
    ...result,
    message : "Company created and invitation email triggered",
  };
};

//////////////////////////
// 2. SETUP ACCOUNT
//////////////////////////

export const setupCompanyAccount = async (token, password) => {

  const safeToken = token ? token.trim() : "";
  
  console.log("🛠️ setupCompanyAccount called with raw token:", safeToken);

  const hashedToken = crypto.createHash("sha256").update(safeToken).digest("hex");
  console.log("🛠️ Hashed token for DB lookup:", hashedToken);

  const invite = await prisma.companyInvite.findFirst({
    where: {
      token: hashedToken,
    },
  });

  if (!invite) {
    throw new Error("Invalid token");
  }

  if (invite.expiresAt < new Date()) {
    throw new Error("Token has expired");
  }

  if (invite.acceptedAt) {
    throw new Error("The password has already been set for this account");
  }

  const user = await prisma.user.findFirst({
    where: { email: invite.email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const hashedPassword = await hashPassword(password);

  await prisma.$transaction(async (tx) => {

    // ✅ USER ACTIVATE
    await tx.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        status: "ACTIVE",
        lastLoginAt: new Date(), // ✅ ADDED
      },
    });

    // ✅ COMPANY EMAIL VERIFIED + PENDING APPROVAL
    await tx.company.update({
      where: { id: invite.companyId },
      data: {
        status: "PENDING_APPROVAL",
        isEmailVerified: true,
        lastActiveAt: new Date(), 
      },
    });

    // ✅ MARK INVITE USED
    await tx.companyInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  });

  return { message: "Account setup successful" };
};

export const updateCompanyProfile = async (companyId, data, isSuperAdmin = false) => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  if (!isSuperAdmin && company.isProfileCompleted) {
    throw new Error("Onboarding is already completed");
  }

  const updateData = {
    email: data.email || undefined,
    ownerName: data.ownerName || undefined,
    ownerEmail: data.ownerEmail || undefined,
    domain: data.domain || undefined,
    legalName: data.legalName || undefined,
    phone: data.phone || undefined,
    website: data.website || undefined,
    companyLogo: data.companyLogo || undefined,
    linkedinUrl: data.linkedinUrl || undefined,
    industryType: data.industryTypeId ? { connect: { id: data.industryTypeId } } : undefined,
    companySize: data.companySize || undefined,
    foundedYear: data.foundedYear ? Number(data.foundedYear) : undefined,
    cinNumber: data.cinNumber || undefined,
    latitude: data.latitude ? parseFloat(data.latitude) : undefined,
    longitude: data.longitude ? parseFloat(data.longitude) : undefined,
    termsAndConditions: data.termsAndConditions || undefined,
    signature: data.signature || undefined,

    // Nested Update: Address details (added to onboarding)
    address: (data.addressLine1 || data.address || data.city || data.state || data.country || data.contry || data.pincode) ? {
      upsert: {
        create: {
          addressLine1: data.addressLine1 || data.address || "",
          addressLine2: data.addressLine2 || null,
          city: data.city || "",
          state: data.state || "",
          country: data.country || data.contry || "",
          pincode: data.pincode || "",
          landmark: data.landmark || null,
        },
        update: {
          addressLine1: data.addressLine1 || data.address || undefined,
          addressLine2: data.addressLine2 || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          country: data.country || data.contry || undefined,
          pincode: data.pincode || undefined,
          landmark: data.landmark || undefined,
        }
      }
    } : undefined,

    // Nested Update: HR Settings (Policy, Hours, Probation, Work Model, Employee Terms)
    hrSetting: (data.companyPolicy || data.workingHours || data.defaultProbationPeriod || data.workingDays || data.workModel || data.shiftType || data.employeeTerms) ? {
      upsert: {
        create: {
          companyPolicy: data.companyPolicy || null,
          employeeTerms: data.employeeTerms || null,
          workingHours: data.workingHours || "9:00 AM - 6:00 PM",
          workingDays: data.workingDays || "Monday - Friday",
          probationPeriod: parseInt(data.defaultProbationPeriod) || null,
          noticePeriod: parseInt(data.defaultNoticePeriod) || null,
          workModel: data.workModel || "On-site",
          shiftType: data.shiftType || "General",
        },
        update: {
          companyPolicy: data.companyPolicy || undefined,
          employeeTerms: data.employeeTerms || undefined,
          workingHours: data.workingHours || undefined,
          workingDays: data.workingDays || undefined,
          probationPeriod: data.defaultProbationPeriod ? parseInt(data.defaultProbationPeriod) : undefined,
          noticePeriod: data.defaultNoticePeriod ? parseInt(data.defaultNoticePeriod) : undefined,
          workModel: data.workModel || undefined,
          shiftType: data.shiftType || undefined,
        }
      }
    } : undefined,

    // Nested Update: Compliance & Statutory (PF, ESI, GST, CIN, Registrations)
    compliance: (data.gstNumber || data.panNumber || data.tanNumber || data.pfEnabled !== undefined || data.cinNumber || data.pfRegistrationNumber) ? {
      upsert: {
        create: {
          gstNumber: data.gstNumber || null,
          panNumber: data.panNumber || null,
          tanNumber: data.tanNumber || null,
          cinNumber: data.cinNumber || null,
          pfEnabled: data.pfEnabled === "true" || data.pfEnabled === true,
          pfPercentage: data.pfPercentage ? parseFloat(data.pfPercentage) : 12.0,
          pfRegistrationNumber: data.pfRegistrationNumber || null,
          esiEnabled: data.esiEnabled === "true" || data.esiEnabled === true,
          esiRegistrationNumber: data.esiRegistrationNumber || null,
          ptRegistrationNumber: data.ptRegistrationNumber || null,
        },
        update: {
          gstNumber: data.gstNumber || undefined,
          panNumber: data.panNumber || undefined,
          tanNumber: data.tanNumber || undefined,
          cinNumber: data.cinNumber || undefined,
          pfEnabled: data.pfEnabled !== undefined ? (data.pfEnabled === "true" || data.pfEnabled === true) : undefined,
          pfPercentage: data.pfPercentage ? parseFloat(data.pfPercentage) : undefined,
          pfRegistrationNumber: data.pfRegistrationNumber || undefined,
          esiEnabled: data.esiEnabled !== undefined ? (data.esiEnabled === "true" || data.esiEnabled === true) : undefined,
          esiRegistrationNumber: data.esiRegistrationNumber || undefined,
          ptRegistrationNumber: data.ptRegistrationNumber || undefined,
        }
      }
    } : undefined,

    // Nested Update: Payroll Settings
    payrollSetting: (data.currency || data.salaryCycle || data.payrollStartDay) ? {
      upsert: {
        create: {
          currency: data.currency || "INR",
          salaryCycle: data.salaryCycle || "Monthly",
          payrollStartDay: data.payrollStartDay ? Number(data.payrollStartDay) : 1,
          payrollEndDay: data.payrollEndDay ? Number(data.payrollEndDay) : 31,
        },
        update: {
          currency: data.currency || undefined,
          salaryCycle: data.salaryCycle || undefined,
          payrollStartDay: data.payrollStartDay ? Number(data.payrollStartDay) : undefined,
          payrollEndDay: data.payrollEndDay ? Number(data.payrollEndDay) : undefined,
        }
      }
    } : undefined,

    isProfileCompleted: true,
    status: "PENDING_APPROVAL",
  };

  const updatedCompany = await prisma.company.update({
    where: { id: companyId },
    data: updateData,
  });

  const documentsPayload = Array.isArray(data.documents) ? data.documents : [];
  if (documentsPayload.length) {
    await prisma.companyDocument.createMany({
      data: documentsPayload.map((doc) => ({
        companyId,
        name: doc.name,
        fileUrl: doc.fileUrl,
      })),
    });
  }

  return prisma.company.findUnique({
    where: { id: companyId },
    include: {
      documents: true,
      industryType: true,
    },
  });
};

// ──────────────────────────────────────────────
// CATEGORY-WISE SETTINGS UPDATES
// ──────────────────────────────────────────────

export const updateBasicSettings = async (companyId, data) => {
  const updateData = {
    // Exclude email and domain as per user request
    ownerName: data.ownerName || undefined,
    ownerEmail: data.ownerEmail || undefined,
    legalName: data.legalName || undefined,
    phone: data.phone || undefined,
    website: data.website || undefined,
    companyLogo: data.companyLogo || undefined,
    linkedinUrl: data.linkedinUrl || undefined,
    companySize: data.companySize || undefined,
    foundedYear: data.foundedYear ? Number(data.foundedYear) : undefined,
    latitude: data.latitude ? parseFloat(data.latitude) : undefined,
    longitude: data.longitude ? parseFloat(data.longitude) : undefined,
    
    address: (data.addressLine1 || data.city || data.state || data.country || data.pincode) ? {
      upsert: {
        create: {
          addressLine1: data.addressLine1 || "",
          addressLine2: data.addressLine2 || null,
          city: data.city || "",
          state: data.state || "",
          country: data.country || "",
          pincode: data.pincode || "",
          landmark: data.landmark || null,
        },
        update: {
          addressLine1: data.addressLine1 || undefined,
          addressLine2: data.addressLine2 || undefined,
          city: data.city || undefined,
          state: data.state || undefined,
          country: data.country || undefined,
          pincode: data.pincode || undefined,
          landmark: data.landmark || undefined,
        }
      }
    } : undefined,
  };

  return prisma.company.update({
    where: { id: companyId },
    data: updateData,
  });
};

export const updateHrSettings = async (companyId, data) => {
  return prisma.company.update({
    where: { id: companyId },
    data: {
      hrSetting: {
        upsert: {
          create: {
            workingHours: data.workingHours || "9:00 AM - 6:00 PM",
            workingDays: data.workingDays || "Monday - Friday",
            probationPeriod: data.defaultProbationPeriod ? parseInt(data.defaultProbationPeriod) : null,
            noticePeriod: data.defaultNoticePeriod ? parseInt(data.defaultNoticePeriod) : null,
            leaveCycle: data.leaveCycle || "Jan-Dec",
            workModel: data.workModel || "On-site",
            shiftType: data.shiftType || "General",
            companyPolicy: data.companyPolicy || null,
            employeeTerms: data.employeeTerms || null,
          },
          update: {
            workingHours: data.workingHours || undefined,
            workingDays: data.workingDays || undefined,
            probationPeriod: data.defaultProbationPeriod ? parseInt(data.defaultProbationPeriod) : undefined,
            noticePeriod: data.defaultNoticePeriod ? parseInt(data.defaultNoticePeriod) : undefined,
            leaveCycle: data.leaveCycle || undefined,
            workModel: data.workModel || undefined,
            shiftType: data.shiftType || undefined,
            companyPolicy: data.companyPolicy || undefined,
            employeeTerms: data.employeeTerms || undefined,
          }
        }
      }
    }
  });
};

export const updatePayrollSettings = async (companyId, data) => {
  return prisma.company.update({
    where: { id: companyId },
    data: {
      payrollSetting: {
        upsert: {
          create: {
            currency: data.currency || "INR",
            salaryCycle: data.salaryCycle || "Monthly",
            payrollStartDay: data.payrollStartDay ? Number(data.payrollStartDay) : 1,
            payrollEndDay: data.payrollEndDay ? Number(data.payrollEndDay) : 31,
          },
          update: {
            currency: data.currency || undefined,
            salaryCycle: data.salaryCycle || undefined,
            payrollStartDay: data.payrollStartDay ? Number(data.payrollStartDay) : undefined,
            payrollEndDay: data.payrollEndDay ? Number(data.payrollEndDay) : undefined,
          }
        }
      }
    }
  });
};

export const updateComplianceSettings = async (companyId, data) => {
  return prisma.company.update({
    where: { id: companyId },
    data: {
      compliance: {
        upsert: {
          create: {
            gstNumber: data.gstNumber || null,
            panNumber: data.panNumber || null,
            tanNumber: data.tanNumber || null,
            cinNumber: data.cinNumber || null,
            pfEnabled: data.pfEnabled === "true" || data.pfEnabled === true,
            pfPercentage: data.pfPercentage ? parseFloat(data.pfPercentage) : 12.0,
            pfRegistrationNumber: data.pfRegistrationNumber || null,
            esiEnabled: data.esiEnabled === "true" || data.esiEnabled === true,
            esiRegistrationNumber: data.esiRegistrationNumber || null,
            ptRegistrationNumber: data.ptRegistrationNumber || null,
          },
          update: {
            gstNumber: data.gstNumber || undefined,
            panNumber: data.panNumber || undefined,
            tanNumber: data.tanNumber || undefined,
            cinNumber: data.cinNumber || undefined,
            pfEnabled: data.pfEnabled !== undefined ? (data.pfEnabled === "true" || data.pfEnabled === true) : undefined,
            pfPercentage: data.pfPercentage ? parseFloat(data.pfPercentage) : undefined,
            pfRegistrationNumber: data.pfRegistrationNumber || undefined,
            esiEnabled: data.esiEnabled !== undefined ? (data.esiEnabled === "true" || data.esiEnabled === true) : undefined,
            esiRegistrationNumber: data.esiRegistrationNumber || undefined,
            ptRegistrationNumber: data.ptRegistrationNumber || undefined,
          }
        }
      }
    }
  });
};

//////////////////////////
// 4. ACTIVATE COMPANY
//////////////////////////

export const activateCompany = async (companyId) => {

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { subscriptions: true },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  // ❌ REMOVED isEmailVerified check (you don't have this field)
  // ✔ Instead rely on status flow

  if (company.status !== "PENDING_APPROVAL" && company.status !== "ACTIVE") {
    throw new Error("Company not ready for activation");
  }

  if (!company.subscriptions.length) {
    await assignTrialSubscription(companyId);
  }

  // ✅ AUTO-SEED MASTER DATA (Departments/Designations)
  if (company.industryTypeId) {
    await seedCompanyMastersFromTemplate(companyId, company.industryTypeId);
  }

  // ✅ AUTO-SEED LEAVE TYPES
  await seedCompanyLeaveTypes(companyId);

  const updatedCompany = await prisma.company.update({
    where: { id: companyId },
    data: {
      status: "ACTIVE",
      activatedAt: new Date(),
      lastActiveAt: new Date(),
    },
  });

  // ✅ Send email notification to Owner about company activation
  const recipientEmail = company.ownerEmail || company.email;
  if (recipientEmail) {
    const loginLink = `${process.env.FRONTEND_URL}/login`;
    sendEmail(
      recipientEmail,
      "Your Company Account has been Activated!",
      companyActivationTemplate(company.ownerName || "Owner", company.name, loginLink)
    ).catch((err) => console.error("Activation Email Failed:", err.message));
  }

  return updatedCompany;
};

//////////////////////////
// 5. ADMIN VIEW
//////////////////////////

export const getCompaniesForAdmin = async () => {
  return prisma.company.findMany({
    where: {
      status: { not: "INACTIVE" } // Only get active/invited companies
    },
    include: {
      industryType: true,
      subscriptions: {
        include: { plan: true },
        orderBy: { endDate: "desc" },
        take: 1,
      },
      createdBy: {
        select: { name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getSoftDeletedCompanies = async () => {
  return prisma.company.findMany({
    where: {
      status: "INACTIVE"
    },
    include: {
      createdBy: {
        select: { name: true, email: true }
      }
    },
    orderBy: { deletedAt: "desc" },
  });
};

export const getCompanyProfile = async (companyId) => {
  return prisma.company.findUnique({
    where: { id: companyId },
    include: {
      documents: true,
      industryType: true,
      subscriptions: {
        include: { plan: true },
        orderBy: { endDate: "desc" },
        take: 1,
      },
    },
  });
};

//////////////////////////
// 6. RESEND INVITE
//////////////////////////

export const resendCompanyInvite = async (companyId) => {

  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  // Only allow resend if not already active
  if (company.status !== "INVITED") {
    throw new Error(`Cannot resend invite. Company status is ${company.status}`);
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  // Update existing invite or create new one
  await prisma.companyInvite.deleteMany({
    where: { companyId: company.id }
  });

  await prisma.companyInvite.create({
    data: {
      email: company.email,
      token: hashedToken,
      companyId: company.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const inviteLink = `${process.env.FRONTEND_URL}/setup-password?token=${rawToken}`;
  
  await sendEmail(
    company.email,
    "New Activation Link - GoExperts HRMS",
    companyInviteTemplate(company.ownerName, inviteLink)
  );

  return { message: "New invitation link sent successfully" };
};

//////////////////////////
// 7. DELETE COMPANY
//////////////////////////

export const deleteCompany = async (companyId, type = "soft") => {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
  });

  if (!company) {
    throw new Error("Company not found");
  }

  if (type === "hard") {
    // Hard Delete: Because we added onDelete: Cascade to the schema, 
    // deleting the company will automatically clean up all related records in the database.
    await prisma.company.delete({
      where: { id: companyId },
    });
    return { message: "Company and all related data permanently deleted successfully" };
  } else {
    // Soft Delete: Mark as inactive and set deletedAt
    await prisma.company.update({
      where: { id: companyId },
      data: {
        status: "INACTIVE",
        deletedAt: new Date(),
      },
    });
    return { message: "Company has been soft deleted successfully (marked as inactive)" };
  }
};
