import prisma from "../config/db.js";
import { sendEmail } from "../utils/sendEmail.js";

// ─────────────────────────────────────────────────────────
// HELPER — Full employee include for correction requests
// ─────────────────────────────────────────────────────────
const correctionInclude = {
  employee: {
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      department: { select: { name: true } },
      designation: { select: { title: true } },
      company: {
        include: {
          users: { select: { id: true, name: true, email: true, role: true } },
        },
      },
    },
  },
};

// ─────────────────────────────────────────────────────────
// HELPER — Format correction fields for email display
// ─────────────────────────────────────────────────────────
const formatFieldsForEmail = (fields) => {
  try {
    const entries = Object.entries(fields);
    if (entries.length === 0) return "<p>No fields specified.</p>";
    return `
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:6px;">
        <tr style="background:#f0f0f0;">
          <th style="padding:10px;text-align:left;font-weight:bold;">Field</th>
          <th style="padding:10px;text-align:left;font-weight:bold;">New Value</th>
        </tr>
        ${entries
          .map(
            ([key, value], i) => `
          <tr style="background:${i % 2 === 0 ? "#fff" : "#f9f9f9"}">
            <td style="padding:10px;font-weight:bold;text-transform:capitalize;">${key.replace(/([A-Z])/g, " $1").trim()}</td>
            <td style="padding:10px;">${typeof value === "object" ? JSON.stringify(value, null, 2) : value}</td>
          </tr>`
          )
          .join("")}
      </table>`;
  } catch {
    return "<p>See attached request for field details.</p>";
  }
};

// ─────────────────────────────────────────────────────────
// 1. EMPLOYEE CREATES A CORRECTION REQUEST
// ─────────────────────────────────────────────────────────
export const createCorrection = async ({ employeeId, reason, fields, attachments }) => {
  const request = await prisma.correctionRequest.create({
    data: {
      employeeId,
      requestedBy: employeeId,
      reason,
      fields,
      attachments: attachments ?? [],
    },
    include: correctionInclude,
  });

  const emp = request.employee;
  const empName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.user?.name || "Employee";
  const empCode = emp.employeeCode;
  const dept = emp.department?.name || "N/A";
  const designation = emp.designation?.title || "N/A";

  // Collect HR and OWNER emails from the company
  const hrOwnerUsers = (emp.company?.users || []).filter(
    (u) => u.role === "HR" || u.role === "OWNER"
  );

  const fieldsHtml = formatFieldsForEmail(fields);
  const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });

  const hrEmailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:8px;">
      <h2 style="color:#1565c0;">📋 New Profile Correction Request</h2>
      <p>A correction request has been submitted and requires your review.</p>

      <h3 style="color:#333;border-bottom:2px solid #e0e0e0;padding-bottom:8px;">Employee Details</h3>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:6px;">
        <tr style="background:#f0f0f0;"><td style="padding:10px;font-weight:bold;">Name</td><td style="padding:10px;">${empName}</td></tr>
        <tr><td style="padding:10px;font-weight:bold;">Employee Code</td><td style="padding:10px;">${empCode}</td></tr>
        <tr style="background:#f0f0f0;"><td style="padding:10px;font-weight:bold;">Department</td><td style="padding:10px;">${dept}</td></tr>
        <tr><td style="padding:10px;font-weight:bold;">Designation</td><td style="padding:10px;">${designation}</td></tr>
        <tr style="background:#f0f0f0;"><td style="padding:10px;font-weight:bold;">Submitted At</td><td style="padding:10px;">${submittedAt}</td></tr>
      </table>

      <h3 style="color:#333;border-bottom:2px solid #e0e0e0;padding-bottom:8px;margin-top:20px;">Reason for Request</h3>
      <div style="background:#e3f2fd;padding:14px;border-radius:6px;border-left:4px solid #1565c0;">
        "${reason}"
      </div>

      <h3 style="color:#333;border-bottom:2px solid #e0e0e0;padding-bottom:8px;margin-top:20px;">Fields to Update</h3>
      ${fieldsHtml}

      <div style="background:#fff3e0;padding:14px;border-radius:6px;border-left:4px solid #ff9800;margin-top:20px;">
        <strong>⏰ SLA Reminder:</strong> Please review and act within <strong>48 hours</strong>. If not reviewed within 48 hours, a reminder will be sent. After 72 hours, this request will be escalated to the Owner.
      </div>

      <p style="margin-top:20px;">Please log in to the HRMS dashboard to <strong>Approve</strong> or <strong>Reject</strong> this request.</p>
      <p>Regards,<br/><strong>HRMS Automated System</strong></p>
    </div>`;

  for (const hrUser of hrOwnerUsers) {
    sendEmail(
      hrUser.email,
      `📋 New Correction Request — ${empName} (${empCode})`,
      hrEmailHtml
    ).catch(console.error);
  }

  return request;
};

// ─────────────────────────────────────────────────────────
// 2. GET ALL CORRECTION REQUESTS (HR view — company scoped)
// ─────────────────────────────────────────────────────────
export const getCompanyRequests = async (companyId, { status } = {}) => {
  const where = {
    employee: { companyId },
  };
  if (status) where.status = status;

  return prisma.correctionRequest.findMany({
    where,
    include: {
      employee: {
        include: {
          user: { select: { id: true, name: true, email: true } },
          department: { select: { name: true } },
          designation: { select: { title: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

// ─────────────────────────────────────────────────────────
// 3. HR APPROVES OR REJECTS A REQUEST
// ─────────────────────────────────────────────────────────
export const decideCorrection = async ({ requestId, action, hrNote, hrEmployeeId, companyId }) => {
  const correctionRequest = await prisma.correctionRequest.findFirst({
    where: { id: requestId, employee: { companyId } },
    include: correctionInclude,
  });

  if (!correctionRequest) throw new Error("Correction request not found or unauthorized.");
  if (correctionRequest.status !== "PENDING")
    throw new Error(`This request is already ${correctionRequest.status.toLowerCase()}.`);

  const emp = correctionRequest.employee;
  const empName = `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.user?.name;
  const empEmail = emp.user?.email;
  const fields = correctionRequest.fields;

  // ── APPROVE ──────────────────────────────────────────
  if (action === "APPROVE") {
    // Apply the requested field changes directly to employee tables
    await applyFieldUpdates(emp.id, fields);

    await prisma.correctionRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        hrNote: hrNote || null,
        approvedBy: hrEmployeeId || null,
        approvedAt: new Date(),
      },
    });

    // Email employee — approved
    const approvedHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:8px;">
        <h2 style="color:#2e7d32;">✅ Correction Request Approved</h2>
        <p>Dear <strong>${empName}</strong>,</p>
        <p>Your profile correction request has been <strong>approved</strong> by HR. Your profile has been updated with the requested changes.</p>

        <h3 style="color:#333;border-bottom:2px solid #e0e0e0;padding-bottom:8px;">Fields Updated</h3>
        ${formatFieldsForEmail(fields)}

        ${hrNote ? `<div style="background:#e8f5e9;padding:14px;border-radius:6px;border-left:4px solid #2e7d32;margin-top:16px;"><strong>HR Note:</strong> ${hrNote}</div>` : ""}

        <p style="margin-top:20px;">Your profile is now up to date. If you see any discrepancies, please raise a new correction request.</p>
        <p>Regards,<br/><strong>HR Team</strong></p>
      </div>`;

    if (empEmail) {
      sendEmail(empEmail, "✅ Your Correction Request Has Been Approved", approvedHtml).catch(console.error);
    }

    return { status: "APPROVED", employeeId: emp.id };
  }

  // ── REJECT ──────────────────────────────────────────
  if (action === "REJECT") {
    await prisma.correctionRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        hrNote: hrNote || null,
        approvedBy: hrEmployeeId || null,
        approvedAt: new Date(),
      },
    });

    // Email employee — rejected
    const rejectedHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:8px;">
        <h2 style="color:#c62828;">❌ Correction Request Rejected</h2>
        <p>Dear <strong>${empName}</strong>,</p>
        <p>Your profile correction request has been <strong>rejected</strong> by HR.</p>

        <h3 style="color:#333;border-bottom:2px solid #e0e0e0;padding-bottom:8px;">Fields Requested</h3>
        ${formatFieldsForEmail(fields)}

        <div style="background:#ffebee;padding:14px;border-radius:6px;border-left:4px solid #c62828;margin-top:16px;">
          <strong>Reason for Rejection:</strong><br/>
          ${hrNote || "No reason provided by HR."}
        </div>

        <p style="margin-top:20px;">If you believe this is incorrect, please contact HR directly or raise a new request with supporting documents.</p>
        <p>Regards,<br/><strong>HR Team</strong></p>
      </div>`;

    if (empEmail) {
      sendEmail(empEmail, "❌ Your Correction Request Has Been Rejected", rejectedHtml).catch(console.error);
    }

    return { status: "REJECTED", employeeId: emp.id };
  }

  throw new Error("Invalid action. Use APPROVE or REJECT.");
};

// ─────────────────────────────────────────────────────────
// HELPER — Apply approved field changes to employee tables
// ─────────────────────────────────────────────────────────
const applyFieldUpdates = async (employeeId, fields) => {
  const {
    personal,
    bankDetails,
    compliance,
    nominee,
    emergencyContacts,
    educations,
    experiences,
    skills,
    firstName,
    lastName,
    profilePhoto,
    documents,
  } = fields;

  // Top-level employee fields
  const topLevelData = {};
  if (firstName !== undefined) topLevelData.firstName = firstName;
  if (lastName !== undefined) topLevelData.lastName = lastName;
  if (profilePhoto !== undefined) topLevelData.profilePhoto = profilePhoto;

  if (Object.keys(topLevelData).length > 0) {
    await prisma.employee.update({ where: { id: employeeId }, data: topLevelData });
  }

  // Personal details
  if (personal) {
    await prisma.employeePersonal.upsert({
      where: { employeeId },
      update: personal,
      create: { employeeId, ...personal },
    });
  }

  // Bank details
  if (bankDetails) {
    await prisma.employeeBank.upsert({
      where: { employeeId },
      update: bankDetails,
      create: { employeeId, ...bankDetails },
    });
  }

  // Compliance (PAN, PF, ESI, UAN)
  if (compliance) {
    await prisma.employeeCompliance.upsert({
      where: { employeeId },
      update: compliance,
      create: { employeeId, ...compliance },
    });
  }

  // Nominee
  if (nominee) {
    await prisma.employeeNominee.upsert({
      where: { employeeId },
      update: nominee,
      create: { employeeId, ...nominee },
    });
  }

  // Skills
  if (skills) {
    await prisma.employeeSkill.upsert({
      where: { employeeId },
      update: skills,
      create: { employeeId, ...skills },
    });
  }

  // Emergency contacts — replace all
  if (emergencyContacts && Array.isArray(emergencyContacts)) {
    await prisma.employeeEmergencyContact.deleteMany({ where: { employeeId } });
    await prisma.employeeEmergencyContact.createMany({
      data: emergencyContacts.map((ec) => ({ employeeId, ...ec })),
    });
  }

  // Educations — replace all
  if (educations && Array.isArray(educations)) {
    await prisma.employeeEducation.deleteMany({ where: { employeeId } });
    await prisma.employeeEducation.createMany({
      data: educations.map((e) => ({ employeeId, ...e })),
    });
  }

  // Experiences — replace all
  if (experiences && Array.isArray(experiences)) {
    await prisma.employeeExperience.deleteMany({ where: { employeeId } });
    await prisma.employeeExperience.createMany({
      data: experiences.map((e) => ({ employeeId, ...e })),
    });
  }

  // Documents — append new documents (deduplication is handled at read-time)
  if (documents && Array.isArray(documents)) {
    await prisma.employeeDocument.createMany({
      data: documents.map((doc) => ({
        employeeId,
        name: doc.name,
        fileUrl: doc.fileUrl,
        status: doc.status || "PENDING"
      }))
    });
  }
};
