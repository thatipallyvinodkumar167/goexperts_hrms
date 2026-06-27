/**
 * ─────────────────────────────────────────────────────────────────────────────
 * EMPLOYEE FULL INCLUDE CONFIG
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This is the SINGLE SOURCE OF TRUTH for fetching complete employee data.
 *
 * ✅ HOW TO USE:
 *    import { employeeFullInclude } from "../config/employeeIncludes.js";
 *    prisma.employee.findFirst({ where: { ... }, include: employeeFullInclude })
 *
 * ✅ WHEN YOU ADD A NEW FEATURE:
 *    If you add a new model linked to Employee in schema.prisma, just add it here:
 *
 *    Example — you added a new model `EmployeeAward`:
 *      1. In schema.prisma → add `awards EmployeeAward[]` to Employee model
 *      2. Here → add `awards: true,` under "── ADD NEW RELATIONS BELOW ──"
 *      3. Done — getEmployeeByCode and all consumers auto-get the new data ✅
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const employeeFullInclude = {

  // ── User account (login info, role, status) ──────────────────────────────
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      profileLogo: true,
      companyId: true,
      isEmailVerified: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
    },
  },

  // ── Company the employee belongs to (with all sub-details) ───────────────
  company: {
    include: {
      industryType: true,       // Industry type name & metadata
      address: true,            // Company address
      compliance: true,         // GST, PAN, TAN, CIN, PF%, ESI%
      hrSetting: true,          // Working hours, notice period, leave cycle
      payrollSetting: true,     // Currency, salary cycle, payroll dates
      systemSetting: true,      // Timezone, date format, language
      directors: true,          // Company directors list
    },
  },

  // ── Department & Designation ─────────────────────────────────────────────
  department: true,
  designation: true,

  // ── Personal details ─────────────────────────────────────────────────────
  personal: true,               // Phone, DOB, gender, address, blood group

  // ── Bank & financial ─────────────────────────────────────────────────────
  bankDetails: true,            // Bank name, account no., IFSC, UPI

  // ── Statutory compliance ─────────────────────────────────────────────────
  compliance: true,             // PF no., ESI no., UAN, insurance policy

  // ── Documents ────────────────────────────────────────────────────────────
  documents: true,              // All uploaded documents (name, URL, status)

  // ── Education history ────────────────────────────────────────────────────
  educations: true,

  // ── Work experience ──────────────────────────────────────────────────────
  experiences: true,

  // ── Emergency contacts ───────────────────────────────────────────────────
  emergencyContacts: true,

  // ── Skills & certifications ──────────────────────────────────────────────
  skills: true,                 // Primary, secondary skills, GitHub, LinkedIn

  // ── Nominee ──────────────────────────────────────────────────────────────
  nominee: true,

  // ── Offer letter ─────────────────────────────────────────────────────────
  offerLetter: true,            // Position, CTC, joining date, status

  // ── Joining letter ───────────────────────────────────────────────────────
  joiningLetter: true,

  // ── Salary structure ─────────────────────────────────────────────────────
  salaryStructure: true,        // Basic, HRA, allowances, PF, ESI, net salary

  // ── Payroll history (sorted latest first) ────────────────────────────────
  payrolls: {
    orderBy: { year: "desc" },
  },

  // ── Leave records with leave type ────────────────────────────────────────
  leaves: {
    include: { leaveType: true },
    orderBy: { createdAt: "desc" },
  },

  // ── Recent attendance (last 30 days) ─────────────────────────────────────
  attendances: {
    orderBy: { date: "desc" },
    take: 30,
  },

  // ── Correction requests raised by this employee ──────────────────────────
  correctionRequests: {
    orderBy: { createdAt: "desc" },
    take: 20,
  },

  // ── Subordinates (employees this person manages) ─────────────────────────
  subordinates: {
    select: {
      userId: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      user: { select: { name: true, email: true, role: true } },
      designation: { select: { title: true } },
    },
  },

  // ── Manager info ─────────────────────────────────────────────────────────
  manager: {
    select: {
      userId: true,
      employeeCode: true,
      firstName: true,
      lastName: true,
      user: { select: { name: true, email: true, role: true } },
      designation: { select: { title: true } },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // ✅ ADD NEW RELATIONS BELOW THIS LINE
  // When you add a new model linked to Employee (e.g. EmployeeAward, EmployeeGoal),
  // just add one line here:
  //
  //   awards: true,
  //   goals: { orderBy: { createdAt: "desc" } },
  //
  // ─────────────────────────────────────────────────────────────────────────
};


/**
 * Lightweight version — just the core identity fields.
 * Use this for list views where full detail is not needed.
 */
export const employeeLightInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      profileLogo: true,
    },
  },
  department: true,
  designation: true,
  personal: { select: { phone: true, gender: true } },
};
