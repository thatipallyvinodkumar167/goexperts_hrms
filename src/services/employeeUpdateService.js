import prisma from "../config/db.js";

/**
 * Self-service update – limited fields that an employee can modify.
 * Allows updates to contact info, emergency contacts, address, etc.
 * Does NOT allow changes to payroll, compliance, or legal declarations.
 */
export const updateSelfService = async (employeeId, data) => {
  const employee = await prisma.employee.findUnique({ where: { id: employeeId } });
  if (!employee) throw new Error("Employee profile not found");

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
    if (data.bankDetails) {
      await tx.employeeBank.upsert({
        where: { employeeId: employee.id },
        update: data.bankDetails,
        create: { employeeId: employee.id, ...data.bankDetails }
      });
    }
    if (data.compliance) {
      await tx.employeeCompliance.upsert({
        where: { employeeId: employee.id },
        update: data.compliance,
        create: { employeeId: employee.id, ...data.compliance }
      });
    }
    if (data.nominee) {
      const nomineeData = { ...data.nominee };
      if (nomineeData.dob) nomineeData.dob = new Date(nomineeData.dob);
      await tx.employeeNominee.upsert({
        where: { employeeId: employee.id },
        update: nomineeData,
        create: { employeeId: employee.id, ...nomineeData }
      });
    }
    if (data.emergencyContacts) {
      await tx.employeeEmergencyContact.deleteMany({ where: { employeeId: employee.id } });
      if (Array.isArray(data.emergencyContacts) && data.emergencyContacts.length > 0) {
        await tx.employeeEmergencyContact.createMany({
          data: data.emergencyContacts.map(contact => ({
            employeeId: employee.id,
            contactPersonName: contact.contactPersonName,
            relationship: contact.relationship,
            contactNumber: contact.contactNumber,
            alternateContact: contact.alternateContact,
            address: contact.address
          }))
        });
      }
    }
    if (data.educations) {
      await tx.employeeEducation.deleteMany({ where: { employeeId: employee.id } });
      if (Array.isArray(data.educations) && data.educations.length > 0) {
        await tx.employeeEducation.createMany({
          data: data.educations.map(edu => ({
            employeeId: employee.id,
            degree: edu.degree,
            specialization: edu.specialization,
            college: edu.college,
            university: edu.university,
            percentage: edu.percentage,
            cgpa: edu.cgpa,
            startYear: edu.startYear,
            endYear: edu.endYear
          }))
        });
      }
    }
    if (data.experiences) {
      await tx.employeeExperience.deleteMany({ where: { employeeId: employee.id } });
      if (Array.isArray(data.experiences) && data.experiences.length > 0) {
        await tx.employeeExperience.createMany({
          data: data.experiences.map(exp => ({
            employeeId: employee.id,
            companyName: exp.companyName,
            role: exp.role || exp.designation,
            startDate: exp.startDate ? new Date(exp.startDate) : null,
            endDate: exp.endDate ? new Date(exp.endDate) : null,
            totalYears: exp.totalYears || exp.totalExperience,
            technologies: exp.technologies,
            responsibilities: exp.responsibilities
          }))
        });
      }
    }
    return await tx.employee.findUnique({ where: { id: employee.id } });
  }, { timeout: 20000 });

  return tx;
};

