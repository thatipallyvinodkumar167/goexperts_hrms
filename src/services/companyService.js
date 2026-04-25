import prisma from "../config/db.js";
import crypto from "crypto";
import { hashPassword } from "../utils/hashPassword.js";
import { assignTrialSubscription } from "./subscriptionService.js";

// ✅ NEW IMPORTS (ADDED)
import { sendEmail } from "../utils/sendEmail.js";
import { companyInviteTemplate } from "../utils/templates/companyInviteTemplate.js";

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
}) => {

  // check existing
  const existing = await prisma.company.findFirst({
    where: { email },
  });

  if (existing) {
    throw new Error("Company already exists");
  }

  // ✅ TOKEN GENERATION (NO CHANGE, BUT USED PROPERLY NOW)
  const rawToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

  const [, domain] = email.split("@");

  const result = await prisma.$transaction(async (tx) => {

    const company = await tx.company.create({
      data: {
        name,
        email,
        domain,
        ownerName,
        ownerEmail,
        location,

        // ✅ STATUS FLOW (IMPROVED)
        status: "INVITED",
        invitedAt: new Date(),

        createdById,
      },
    });

    const ownerUser = await tx.user.create({
      data: {
        name: ownerName,
        email: ownerEmail,
        password: "", // not set yet
        role: "OWNER",
        companyId: company.id,
        status: "INVITED",
      },
    });

    // ✅ STORE TOKEN (CORRECT)
    await tx.companyInvite.create({
      data: {
        email: ownerEmail,
        token: hashedToken,
        companyId: company.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    // ✅ SEND EMAIL (NEW - IMPORTANT)
    const inviteLink = `${process.env.FRONTEND_URL}/setup-account?token=${rawToken}`;

    await sendEmail(
      ownerEmail,
      "Activate Your Company Account",
      companyInviteTemplate(ownerName, inviteLink)
    );

    // ❌ REMOVED rawToken from return (SECURITY FIX)
    return { company, ownerUser };
  });

  return {
    ...result,
    message: "Invitation email sent successfully",
  };
};

//////////////////////////
// 2. SETUP ACCOUNT
//////////////////////////

export const setupCompanyAccount = async (token, password) => {

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const invite = await prisma.companyInvite.findFirst({
    where: {
      token: hashedToken,
      expiresAt: { gt: new Date() },
    },
  });

  if (!invite) {
    throw new Error("Invalid or expired token");
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

    // ✅ COMPANY EMAIL VERIFIED + ACTIVE
    await tx.company.update({
      where: { id: invite.companyId },
      data: {
        status: "ACTIVE",
        activatedAt: new Date(),
        lastActiveAt: new Date(), // ✅ ADDED
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

//////////////////////////
// 3. COMPLETE PROFILE
//////////////////////////

export const completeCompanyProfile = async (companyId, data) => {

  const updated = await prisma.company.update({
    where: { id: companyId },
    data: {
      ...data,
      isProfileCompleted: true,   // ✅ make sure field exists in schema
      status: "PENDING_APPROVAL",
    },
  });

  return updated;
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

  return prisma.company.update({
    where: { id: companyId },
    data: {
      status: "ACTIVE",
      activatedAt: new Date(),
      lastActiveAt: new Date(),
    },
  });
};

//////////////////////////
// 5. ADMIN VIEW
//////////////////////////

export const getCompaniesForAdmin = async () => {
  return prisma.company.findMany({
    include: {
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
