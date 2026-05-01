import prisma from "../src/config/db.js";
import { hashPassword } from "../src/utils/hashPassword.js";

const newPassword = "Admin@1234";
const hashed = await hashPassword(newPassword);

const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
await prisma.user.update({
  where: { id: admin.id },
  data: { password: hashed }
});

console.log("✅ Super Admin password reset to: Admin@1234");
await prisma.$disconnect();
