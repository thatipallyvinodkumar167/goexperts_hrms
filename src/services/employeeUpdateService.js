import prisma from "../config/db.js";

/**
 * Self-service update – limited fields that an employee can modify.
 * Allows updates to contact info, emergency contacts, address, etc.
 * Does NOT allow changes to payroll, compliance, or legal declarations.
 */
export const updateSelfService = async (userId, data) => {
  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw new Error("Employee profile not found");

  // Allowed top‑level fields for self‑service
  const allowed = [
    "personal",
    "contact",
    "skills",
    "profilePhoto"
  ];

  // Prepare update operations for each allowed section if present in `data`
  const tx = await prisma.$transaction(async (tx) => {
    if (data.profilePhoto) {
      await tx.employee.update({
        where: { id: employee.id },
        data: { profilePhoto: data.profilePhoto }
      });
    }
    if (data.personal) {
      await tx.employeePersonal.upsert({
        where: { employeeId: employee.id },
        update: data.personal,
        create: { employeeId: employee.id, ...data.personal }
      });
    }
    if (data.contact) {
      await tx.employeePersonal.update({
        where: { employeeId: employee.id },
        data: {
          personalEmail: data.contact.personalEmail,
          phone: data.contact.phone,
          alternatePhone: data.contact.alternatePhone,
          addressLine1: data.contact.addressLine1,
          addressLine2: data.contact.addressLine2,
          city: data.contact.city,
          state: data.contact.state,
          country: data.contact.country,
          pincode: data.contact.pincode
        }
      });
    }
    if (data.skills) {
      await tx.employeeSkill.upsert({
        where: { employeeId: employee.id },
        update: data.skills,
        create: { employeeId: employee.id, ...data.skills }
      });
    }
    return await tx.employee.findUnique({ where: { id: employee.id } });
  });

  return tx;
};

