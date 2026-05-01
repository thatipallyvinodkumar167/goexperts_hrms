import prisma from "../src/config/db.js";
import { comparePassword } from "../src/utils/hashPassword.js";

const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });

const passwords = ["Admin@1234", "admin@1234", "Admin@123", "GoExperts@123", "superadmin", "Admin1234", "GoExperts@1234"];

for (const pwd of passwords) {
  const match = await comparePassword(pwd, admin.password);
  if (match) {
    console.log("✅ Correct password found:", pwd);
    break;
  } else {
    console.log("❌ Not:", pwd);
  }
}

await prisma.$disconnect();
