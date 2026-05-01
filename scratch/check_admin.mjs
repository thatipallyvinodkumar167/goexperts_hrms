import prisma from "../src/config/db.js";

const admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
if (admin) {
  console.log("Super Admin found:");
  console.log("  Email:", admin.email);
  console.log("  Status:", admin.status);
  console.log("  Has Password:", !!admin.password);
} else {
  console.log("No Super Admin found in DB!");
}
await prisma.$disconnect();
