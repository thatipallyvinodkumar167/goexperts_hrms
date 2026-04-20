// import prisma from "../config/db.js";
// import { hashPassword } from "../utils/hashPassword.js";

// const SUPER_ADMIN_EMAIL = "goexperts@admin";
// const SUPER_ADMIN_PASSWORD = "goexperts";
// const SUPER_ADMIN_NAME = "GoExperts Super Admin";

// export const ensureSuperAdmin = async () => {
//   const hashedPassword = await hashPassword(SUPER_ADMIN_PASSWORD);

//   const existingSuperAdmin = await prisma.user.findFirst({
//     where: {
//       email: SUPER_ADMIN_EMAIL,
//       companyId: null,
//     },
//   });

//   if (existingSuperAdmin) {
//     await prisma.user.update({
//       where: { id: existingSuperAdmin.id },
//       data: {
//         name: SUPER_ADMIN_NAME,
//         password: hashedPassword,
//         role: "SUPER_ADMIN",
//         companyId: null,
//       },
//     });
//     return;
//   }

//   await prisma.user.create({
//     data: {
//       name: SUPER_ADMIN_NAME,
//       email: SUPER_ADMIN_EMAIL,
//       password: hashedPassword,
//       role: "SUPER_ADMIN",
//       companyId: null,
//     },
//   });
// };
