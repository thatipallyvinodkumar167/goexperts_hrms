import cron from "node-cron";
import prisma from "../config/db.js";
import { sendEmail } from "../utils/sendEmail.js";

// ─────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────
const formatDate = (date) =>
  new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit", month: "short", year: "numeric"
  });

const getWeekStartEnd = () => {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { weekStart: monday, weekEnd: sunday };
};

// ─────────────────────────────────────────────────────────
// MID-WEEK REMINDER EMAIL (Wednesday)
// ─────────────────────────────────────────────────────────
const sendMidWeekReminder = async (employee, actualOfficeDays, expectedOfficeDays, remainingWorkDays, company) => {
  const empName = `${employee.firstName} ${employee.lastName}`;
  const shortfall = expectedOfficeDays - actualOfficeDays;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:8px;">
      <h2 style="color:#1565C0;">📅 Office Attendance Reminder</h2>
      <p>Dear <strong>${empName}</strong>,</p>
      <p>This is a friendly reminder from <strong>${company.name}</strong>.</p>
      <div style="background:#e3f2fd;padding:14px;border-radius:6px;border-left:4px solid #1565C0;margin:16px 0;">
        You have attended the office <strong>${actualOfficeDays} of ${expectedOfficeDays} required days</strong> this week.<br/>
        You have <strong>${remainingWorkDays} working day(s)</strong> left to meet your office attendance quota.
      </div>
      <p>Please plan your office visits accordingly to meet your weekly target.</p>
      <p>Regards,<br/><strong>${company.name} — HR Team</strong></p>
    </div>
  `;
  await sendEmail(
    employee.user.email,
    `Office Attendance Reminder — ${shortfall} day(s) remaining this week`,
    html
  );
};

// ─────────────────────────────────────────────────────────
// FRIDAY END-OF-WEEK PENALTY EMAIL — To Employee
// ─────────────────────────────────────────────────────────
const sendWeeklyQuotaMissedEmail = async (employee, actualOfficeDays, expectedOfficeDays, weekStart, weekEnd, company) => {
  const empName = `${employee.firstName} ${employee.lastName}`;
  const shortfall = expectedOfficeDays - actualOfficeDays;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:8px;">
      <h2 style="color:#d32f2f;">⚠️ Office Attendance Quota Not Met</h2>
      <p>Dear <strong>${empName}</strong>,</p>
      <p>This is an automated notification from <strong>${company.name}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:6px;margin:16px 0;">
        <tr style="background:#f0f0f0;">
          <td style="padding:10px;font-weight:bold;">Week</td>
          <td style="padding:10px;">${formatDate(weekStart)} — ${formatDate(weekEnd)}</td>
        </tr>
        <tr>
          <td style="padding:10px;font-weight:bold;">Required Office Days</td>
          <td style="padding:10px;">${expectedOfficeDays} days</td>
        </tr>
        <tr style="background:#f0f0f0;">
          <td style="padding:10px;font-weight:bold;">Actual Office Days</td>
          <td style="padding:10px;">${actualOfficeDays} days</td>
        </tr>
        <tr>
          <td style="padding:10px;font-weight:bold;color:#d32f2f;">Shortfall</td>
          <td style="padding:10px;color:#d32f2f;font-weight:bold;">${shortfall} day(s)</td>
        </tr>
      </table>
      <div style="background:#ffebee;padding:14px;border-radius:6px;border-left:4px solid #d32f2f;">
        This has been flagged in your attendance record. Please contact your HR Manager for further guidance.
      </div>
      <p>Regards,<br/><strong>${company.name} — HR Team</strong></p>
    </div>
  `;
  await sendEmail(
    employee.user.email,
    `Office Attendance Quota Not Met — Week of ${formatDate(weekStart)}`,
    html
  );
};

// ─────────────────────────────────────────────────────────
// FRIDAY END-OF-WEEK ALERT EMAIL — To HR
// ─────────────────────────────────────────────────────────
const sendWeeklyAlertToHR = async (hrEmail, violators, weekStart, weekEnd, company) => {
  const rows = violators.map(v => `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${v.firstName} ${v.lastName}</td>
      <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${v.employeeCode}</td>
      <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${v.expectedOfficeDays} days</td>
      <td style="padding:10px;border-bottom:1px solid #f0f0f0;">${v.actualOfficeDays} days</td>
      <td style="padding:10px;border-bottom:1px solid #f0f0f0;color:#d32f2f;font-weight:bold;">${v.expectedOfficeDays - v.actualOfficeDays} day(s) short</td>
    </tr>
  `).join("");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:8px;">
      <h2 style="color:#d32f2f;">📊 Weekly Hybrid Attendance Report</h2>
      <p>Dear HR Team,</p>
      <p>The following Hybrid employees did <strong>not meet their office attendance quota</strong> for the week of <strong>${formatDate(weekStart)} — ${formatDate(weekEnd)}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:6px;margin:16px 0;">
        <thead>
          <tr style="background:#d32f2f;color:#fff;">
            <th style="padding:10px;text-align:left;">Name</th>
            <th style="padding:10px;text-align:left;">Employee ID</th>
            <th style="padding:10px;text-align:left;">Required</th>
            <th style="padding:10px;text-align:left;">Attended</th>
            <th style="padding:10px;text-align:left;">Shortfall</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p>Please review these records in the Attendance Dashboard and take appropriate action (Warning / Leave Without Pay).</p>
      <p>Regards,<br/><strong>${company.name} — HRMS Automated System</strong></p>
    </div>
  `;
  await sendEmail(hrEmail, `Weekly Hybrid Attendance Report — Week of ${formatDate(weekStart)}`, html);
};

// ─────────────────────────────────────────────────────────
// CORE: Run the weekly hybrid check for all companies
// ─────────────────────────────────────────────────────────
const runHybridQuotaCheck = async () => {
  const { weekStart, weekEnd } = getWeekStartEnd();

  // Get all HYBRID employees across all companies
  const hybridEmployees = await prisma.employee.findMany({
    where: {
      workModel: "HYBRID",
      status: "ACTIVE",
      expectedOfficeDays: { not: null }
    },
    include: {
      user: true,
      company: {
        include: {
          users: { select: { role: true, email: true } }
        }
      }
    }
  });

  console.log(`🔍 [Hybrid Cron] Checking ${hybridEmployees.length} hybrid employees...`);

  // Group violators by company for the HR alert
  const violatorsByCompany = {};

  for (const employee of hybridEmployees) {
    // Count how many days this week they checked in as WFO
    const officeDays = await prisma.attendance.count({
      where: {
        employeeId: employee.id,
        workTypeForToday: "WFO",
        date: { gte: weekStart, lte: weekEnd }
      }
    });

    const expected = employee.expectedOfficeDays;
    const actual = officeDays;

    if (actual < expected) {
      // Quota missed — send email to employee
      await sendWeeklyQuotaMissedEmail(
        employee, actual, expected, weekStart, weekEnd, employee.company
      ).catch(console.error);

      // Group for HR summary email
      const companyId = employee.companyId;
      if (!violatorsByCompany[companyId]) {
        violatorsByCompany[companyId] = {
          company: employee.company,
          hrEmail: employee.company.users.find(u => u.role === "HR")?.email || employee.company.email,
          violators: []
        };
      }
      violatorsByCompany[companyId].violators.push({
        ...employee,
        actualOfficeDays: actual
      });
    }
  }

  // Send HR summary alert per company
  for (const companyId in violatorsByCompany) {
    const { company, hrEmail, violators } = violatorsByCompany[companyId];
    if (hrEmail && violators.length > 0) {
      await sendWeeklyAlertToHR(hrEmail, violators, weekStart, weekEnd, company).catch(console.error);
    }
  }

  console.log(`✅ [Hybrid Cron] Complete. ${Object.keys(violatorsByCompany).length} companies had quota violations.`);
};

// ─────────────────────────────────────────────────────────
// SCHEDULE BOTH CRONS
// ─────────────────────────────────────────────────────────
export const startHybridQuotaCron = () => {
  // 1. Mid-week reminder — Every Wednesday at 10:00 AM IST
  cron.schedule("0 10 * * 3", async () => {
    console.log("⏰ [CRON] Mid-Week Hybrid Reminder — Starting...");
    const { weekStart, weekEnd } = getWeekStartEnd();
    const today = new Date();
    const dayOfWeek = today.getDay();
    const remainingWorkDays = 5 - dayOfWeek; // Days left till Friday

    const hybridEmployees = await prisma.employee.findMany({
      where: { workModel: "HYBRID", status: "ACTIVE", expectedOfficeDays: { not: null } },
      include: { user: true, company: true }
    });

    for (const employee of hybridEmployees) {
      const officeDays = await prisma.attendance.count({
        where: {
          employeeId: employee.id,
          workTypeForToday: "WFO",
          date: { gte: weekStart, lte: weekEnd }
        }
      });

      const expected = employee.expectedOfficeDays;
      if (officeDays < Math.ceil(expected / 2)) {
        await sendMidWeekReminder(employee, officeDays, expected, remainingWorkDays, employee.company)
          .catch(console.error);
      }
    }
    console.log("✅ [CRON] Mid-Week Hybrid Reminder — Complete.");
  }, { timezone: "Asia/Kolkata" });

  // 2. End-of-week sweep — Every Friday at 11:59 PM IST
  cron.schedule("59 23 * * 5", async () => {
    console.log("⏰ [CRON] Friday Hybrid Quota Sweep — Starting...");
    await runHybridQuotaCheck();
    console.log("✅ [CRON] Friday Hybrid Quota Sweep — Complete.");
  }, { timezone: "Asia/Kolkata" });

  console.log("✅ Hybrid Quota Cron scheduled (Wednesday 10AM reminder + Friday 11:59PM sweep).");
};
