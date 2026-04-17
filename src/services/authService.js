import prisma from "../config/db.js";
import { generateToken } from "../utils/generateToken.js";
import { comparePassword } from "../utils/hashPassword.js";

export const loginUser = async ({ email, password }) => {

  // 1. Find user
  const user = await prisma.user.findUnique({
    where: { email }
  });

  // 2. Check if user exists
  if (!user) {
    throw new Error("User not found");
  }

  // 3. Compare password
  const isMatch = await comparePassword(password, user.password);

  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  // 4. Generate token
  const token = generateToken(user);

  // 5. Return response data
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