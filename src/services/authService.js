import prisma from "../config/db.js";
import { generateToken } from "../utils/generateToken.js";
import { comparePassword } from "../utils/hashPassword.js";

export const loginUser = async ({ email, password } = {}) => {
  if (!email || !password) {
    throw new Error("email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Super admin login path (no company context)
  const superAdmin = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      companyId: null,
      role: "SUPER_ADMIN",
    },
  });

  if (superAdmin) {
    const isMatch = await comparePassword(password, superAdmin.password);
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    return {
      user: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        companyId: superAdmin.companyId,
      },
      token: generateToken(superAdmin),
    };
  }

  // Company user login path (derive company from email domain)
  const [, emailDomain] = normalizedEmail.split("@");
  if (!emailDomain) {
    throw new Error("Invalid email format");
  }

  const company = await prisma.company.findFirst({
    where: {
      domain: emailDomain,
      status: "ACTIVE",
    },
    select: { id: true },
  });

  if (!company) {
    throw new Error("Company not found for this email domain");
  }

  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      companyId: company.id,
      status: "ACTIVE",
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    },
    token: generateToken(user),
  };
};
