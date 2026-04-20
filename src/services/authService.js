import prisma from "../config/db.js";
import { generateToken } from "../utils/generateToken.js";
import { comparePassword } from "../utils/hashPassword.js";

export const loginUser = async ({ email, password, companyId = null } = {}) => {
  if (!email || !password) {
    throw new Error("email and password are required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  // 1. Super admin login path (no company)
  const superAdmin = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      companyId: null,
      role: "SUPER_ADMIN"
    }
  });

  if (superAdmin) {
    const isSuperAdminPasswordValid = await comparePassword(password, superAdmin.password);
    if (!isSuperAdminPasswordValid) {
      throw new Error("Invalid credentials");
    }

    const token = generateToken(superAdmin);
    return {
      user: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        role: superAdmin.role,
        companyId: superAdmin.companyId
      },
      token
    };
  }

  // 2. Company user login path (resolve company from email domain)
  const emailParts = normalizedEmail.split("@");
  if (emailParts.length !== 2 || !emailParts[1]) {
    throw new Error("Invalid email format");
  }

  const emailDomain = emailParts[1];
  const company = await prisma.company.findFirst({
    where: { domain: emailDomain },
    select: { id: true }
  });

  if (!company) {
    throw new Error("Company not found for this email domain");
  }

  const effectiveCompanyId = companyId ?? company.id;

  // 3. Find company user
  const user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
      companyId: effectiveCompanyId
    }
  });

  // 4. Check if user exists
  if (!user) {
    throw new Error("User not found");
  }

  // 5. Compare password
  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // 6. Generate token
  const token = generateToken(user);

  // 7. Return response data
  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId
    },
    token
  };
};
