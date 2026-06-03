import prisma from "../config/db.js";
import faceapi from "../config/faceApi.js";
import { loadImage } from "canvas";
import { sendEmail } from "../utils/sendEmail.js";

// ─────────────────────────────────────────────────────────
// HAVERSINE FORMULA — Distance between 2 GPS coordinates
// Returns distance in METERS
// ─────────────────────────────────────────────────────────
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371e3;
  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);
  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// ─────────────────────────────────────────────────────────
// FACE RECOGNITION — Compare live selfie to master photo
// ─────────────────────────────────────────────────────────
const verifyFace = async (livePhotoInput, masterImageUrl) => {
  try {
    let liveImg;
    if (
      livePhotoInput.startsWith("http://") ||
      livePhotoInput.startsWith("https://")
    ) {
      liveImg = await loadImage(livePhotoInput);
    } else {
      const base64Data = livePhotoInput.replace(/^data:image\/\w+;base64,/, "");
      const imgBuffer = Buffer.from(base64Data, "base64");
      liveImg = await loadImage(imgBuffer);
    }
    const masterImg = await loadImage(masterImageUrl);
    const detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.2,
    });
    const liveDetection = await faceapi
      .detectSingleFace(liveImg, detectorOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();
    const masterDetection = await faceapi
      .detectSingleFace(masterImg, detectorOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!liveDetection)
      throw new Error(
        "Facial Recognition failed: No face detected in the live camera check."
      );
    if (!masterDetection)
      throw new Error("Face is not matching, please try again.");
    const distance = faceapi.euclideanDistance(
      liveDetection.descriptor,
      masterDetection.descriptor
    );
    const matchConfidence = 1 - distance;
    return {
      isMatch: distance <= 0.6,
      confidence: Math.max(0, Math.round(matchConfidence * 100)),
    };
  } catch (error) {
    throw new Error(error.message || "Failed during facial comparison process.");
  }
};

// ─────────────────────────────────────────────────────────
// HELPER — Format date as "DD MMM YYYY"
// ─────────────────────────────────────────────────────────
const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─────────────────────────────────────────────────────────
// HELPER — Format time as "HH:MM AM/PM"
// ─────────────────────────────────────────────────────────
const formatTime = (date) => {
  return new Date(date).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// ─────────────────────────────────────────────────────────
// HELPER — Calculate working hours from two timestamps
// ─────────────────────────────────────────────────────────
const calcWorkingHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return "0h 0m";
  const durationMs = new Date(checkOut) - new Date(checkIn);
  const totalMinutes = Math.floor(durationMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

// ─────────────────────────────────────────────────────────
// HELPER — Shift end minutes from company working hours string
// ─────────────────────────────────────────────────────────
const getShiftEndMinutes = (workingHoursStr) => {
  const parts = (workingHoursStr || "9:00 AM - 6:00 PM").split("-");
  const endPart = parts[1]?.trim() || "6:00 PM";
  const match = endPart.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  return 18 * 60; // default 6:00 PM
};

const getShiftStartMinutes = (workingHoursStr) => {
  const match = (workingHoursStr || "9:00 AM").match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  return 9 * 60;
};

const isWeekend = (date, workingDaysStr) => {
  const day = date.getDay();
  const cleanStr = (workingDaysStr || "Monday - Friday").toLowerCase();
  if (
    cleanStr.includes("monday - friday") ||
    cleanStr.includes("mon-fri")
  ) {
    return day === 0 || day === 6;
  }
  if (
    cleanStr.includes("monday - saturday") ||
    cleanStr.includes("mon-sat")
  ) {
    return day === 0;
  }
  return day === 0 || day === 6;
};

// ─────────────────────────────────────────────────────────
// EMAIL: Geofence breach auto-checkout
// ─────────────────────────────────────────────────────────
const sendGeofenceBreachEmail = async (employee, attendance, company) => {
  const empName = `${employee.firstName} ${employee.lastName}`;
  const hrEmail = company?.users?.find((u) => u.role === "HR")?.email || company?.email;
  const totalHours = calcWorkingHours(attendance.checkIn, new Date());

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:8px;">
      <h2 style="color:#d32f2f;">⚠️ Work Session Auto-Ended</h2>
      <p>Dear <strong>${empName}</strong>,</p>
      <p>This is an automated notification from <strong>${company.name}</strong>.</p>
      <p>We detected that you moved outside your designated <strong>1km work radius</strong> at <strong>${formatTime(new Date())}</strong> on <strong>${formatDate(new Date())}</strong>.</p>
      <p>As a result, your work session has been <strong>automatically ended.</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#fff;border-radius:6px;">
        <tr style="background:#f0f0f0;">
          <td style="padding:10px;font-weight:bold;">Check-In Time</td>
          <td style="padding:10px;">${formatTime(attendance.checkIn)}</td>
        </tr>
        <tr>
          <td style="padding:10px;font-weight:bold;">Auto Check-Out Time</td>
          <td style="padding:10px;">${formatTime(new Date())}</td>
        </tr>
        <tr style="background:#f0f0f0;">
          <td style="padding:10px;font-weight:bold;">Total Hours Worked</td>
          <td style="padding:10px;">${totalHours}</td>
        </tr>
      </table>
      <div style="background:#fff3e0;padding:14px;border-radius:6px;border-left:4px solid #ff9800;">
        <strong>⚠️ Action Required:</strong><br/>
        Please open the HRMS app and <strong>submit your Daily Work Summary before 12:00 AM tonight.</strong><br/>
        If you do not submit it, your attendance for today will be marked as <strong>Absent.</strong>
      </div>
      <p style="color:#888;font-size:12px;margin-top:20px;">If you believe this was a mistake, please contact HR at <a href="mailto:${hrEmail}">${hrEmail}</a>.</p>
      <p>Regards,<br/><strong>${company.name} — HR Team</strong></p>
    </div>
  `;
  await sendEmail(employee.user.email, `Work Session Auto-Ended — ${formatDate(new Date())}`, html);
};

// ─────────────────────────────────────────────────────────
// EMAIL: Early checkout — notify HR
// ─────────────────────────────────────────────────────────
const sendEarlyCheckoutEmailToHR = async (employee, attendance, company, checkoutReason, dailyWorkSummary, shiftEndTime) => {
  const empName = `${employee.firstName} ${employee.lastName}`;
  const hrEmail = company?.users?.find((u) => u.role === "HR")?.email || company?.email;
  const checkOutTime = new Date();
  const totalHours = calcWorkingHours(attendance.checkIn, checkOutTime);
  const checkInMinutes = new Date(attendance.checkIn).getHours() * 60 + new Date(attendance.checkIn).getMinutes();
  const checkOutMinutes = checkOutTime.getHours() * 60 + checkOutTime.getMinutes();
  const shiftEndMinutes = getShiftEndMinutes(shiftEndTime);
  const hoursShort = Math.floor((shiftEndMinutes - checkOutMinutes) / 60) + "h " + ((shiftEndMinutes - checkOutMinutes) % 60) + "m";

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:8px;">
      <h2 style="color:#e65100;">🔔 Early Check-Out Alert</h2>
      <p>Dear <strong>${hrEmail ? "HR Team" : "Admin"}</strong>,</p>
      <p>This is an automated notification from <strong>${company.name} HRMS</strong>. The following employee has checked out early today.</p>
      
      <h3 style="color:#333;border-bottom:2px solid #e0e0e0;padding-bottom:8px;">Employee Details</h3>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:6px;">
        <tr style="background:#f0f0f0;">
          <td style="padding:10px;font-weight:bold;">Name</td>
          <td style="padding:10px;">${empName}</td>
        </tr>
        <tr>
          <td style="padding:10px;font-weight:bold;">Employee ID</td>
          <td style="padding:10px;">${employee.employeeCode}</td>
        </tr>
        <tr style="background:#f0f0f0;">
          <td style="padding:10px;font-weight:bold;">Department</td>
          <td style="padding:10px;">${employee.department?.name || "N/A"}</td>
        </tr>
        <tr>
          <td style="padding:10px;font-weight:bold;">Designation</td>
          <td style="padding:10px;">${employee.designation?.title || "N/A"}</td>
        </tr>
      </table>

      <h3 style="color:#333;border-bottom:2px solid #e0e0e0;padding-bottom:8px;margin-top:20px;">Attendance Details</h3>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:6px;">
        <tr style="background:#f0f0f0;">
          <td style="padding:10px;font-weight:bold;">Date</td>
          <td style="padding:10px;">${formatDate(new Date())}</td>
        </tr>
        <tr>
          <td style="padding:10px;font-weight:bold;">Check-In Time</td>
          <td style="padding:10px;">${formatTime(attendance.checkIn)}</td>
        </tr>
        <tr style="background:#f0f0f0;">
          <td style="padding:10px;font-weight:bold;">Early Check-Out Time</td>
          <td style="padding:10px;">${formatTime(checkOutTime)}</td>
        </tr>
        <tr>
          <td style="padding:10px;font-weight:bold;">Scheduled End Time</td>
          <td style="padding:10px;">${shiftEndTime}</td>
        </tr>
        <tr style="background:#f0f0f0;">
          <td style="padding:10px;font-weight:bold;">Total Hours Worked</td>
          <td style="padding:10px;">${totalHours}</td>
        </tr>
        <tr>
          <td style="padding:10px;font-weight:bold;">Hours Short</td>
          <td style="padding:10px;color:#d32f2f;font-weight:bold;">${hoursShort}</td>
        </tr>
      </table>

      <h3 style="color:#333;border-bottom:2px solid #e0e0e0;padding-bottom:8px;margin-top:20px;">Early Leave Reason</h3>
      <div style="background:#fff3e0;padding:14px;border-radius:6px;border-left:4px solid #ff9800;">
        "${checkoutReason}"
      </div>

      <h3 style="color:#333;border-bottom:2px solid #e0e0e0;padding-bottom:8px;margin-top:20px;">Daily Work Summary</h3>
      <div style="background:#e8f5e9;padding:14px;border-radius:6px;border-left:4px solid #4caf50;">
        "${dailyWorkSummary}"
      </div>

      <p style="margin-top:20px;">Please review this in the Attendance Dashboard and take appropriate action if required.</p>
      <p>Regards,<br/><strong>${company.name} — HRMS Automated System</strong></p>
    </div>
  `;
  if (hrEmail) {
    await sendEmail(hrEmail, `Early Check-Out Alert — ${empName} — ${formatDate(new Date())}`, html);
  }
};

// ─────────────────────────────────────────────────────────
// EMAIL: Midnight penalty — absent for no work submission
// ─────────────────────────────────────────────────────────
const sendAbsentPenaltyEmail = async (employee, company) => {
  const empName = `${employee.firstName} ${employee.lastName}`;
  const hrEmail = company?.users?.find((u) => u.role === "HR")?.email || company?.email;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:8px;">
      <h2 style="color:#d32f2f;">❌ Attendance Marked Absent</h2>
      <p>Dear <strong>${empName}</strong>,</p>
      <p>This is an automated notification from <strong>${company.name}</strong>.</p>
      <p>Our records show that you checked in today but did <strong>not submit your Daily Work Summary</strong> before 12:00 AM.</p>
      <div style="background:#ffebee;padding:14px;border-radius:6px;border-left:4px solid #d32f2f;margin:16px 0;">
        <strong>As a result, your attendance for <u>${formatDate(new Date())}</u> has been marked as <u>Absent</u>.</strong>
      </div>
      <p>If you believe this is an error, please contact your HR at <a href="mailto:${hrEmail}">${hrEmail}</a>.</p>
      <p>Regards,<br/><strong>${company.name} — HR Team</strong></p>
    </div>
  `;
  await sendEmail(employee.user.email, `Attendance Marked Absent — ${formatDate(new Date())}`, html);
};

// ─────────────────────────────────────────────────────────
// 1. CLOCK IN SERVICE
// ─────────────────────────────────────────────────────────
export const clockInService = async (userId, companyId, { latitude, longitude, livePhoto, requestedWorkType }) => {
  const employee = await prisma.employee.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!employee) throw new Error("Employee profile details missing.");

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { hrSetting: true },
  });
  if (!company) throw new Error("Company registered context is invalid.");

  // Prevent double check-in
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const existingAttendance = await prisma.attendance.findFirst({
    where: { employeeId: employee.id, date: { gte: todayStart, lte: todayEnd } },
  });
  if (existingAttendance?.checkIn) {
    throw new Error("You have already checked in for today.");
  }

  // ── Determine actual work type ──
  let effectiveWorkType = employee.workModel; // WFO, WFH, or HYBRID
  if (employee.workModel === "HYBRID") {
    // For HYBRID, Flutter sends requestedWorkType = "WFO" or "WFH"
    if (!requestedWorkType || !["WFO", "WFH"].includes(requestedWorkType)) {
      throw new Error('Hybrid employees must specify where they are working today: "WFO" or "WFH".');
    }
    effectiveWorkType = requestedWorkType;
  }

  let attendanceData = {
    employeeId: employee.id,
    date: todayStart,
    checkIn: new Date(),
    workTypeForToday: effectiveWorkType,
  };

  // ── WFO: Office GPS + Face Recognition ──
  if (effectiveWorkType === "WFO") {
    if (!company.latitude || !company.longitude) {
      throw new Error("Company office location is not configured. Contact admin.");
    }
    const distance = calculateDistance(latitude, longitude, company.latitude, company.longitude);
    if (distance > 100) {
      throw new Error(`Location check failed: You are ${Math.round(distance)} meters away from the office. You must be within 100 meters to check in.`);
    }

    // Face recognition for WFO
    const masterPhoto = employee.faceVerificationPhoto || employee.profilePhoto || employee.user?.profileLogo;
    if (!masterPhoto) throw new Error("Profile picture missing. Please update your photo to clock in.");

    attendanceData.checkInSelfie = livePhoto;
    const currentAttempts = (existingAttendance?.faceMatchAttempts || 0) + 1;

    try {
      const faceMatch = await verifyFace(livePhoto, masterPhoto);
      attendanceData.faceMatchScore = faceMatch.confidence;
      attendanceData.faceMatchAttempts = currentAttempts;

      if (!faceMatch.isMatch) {
        if (currentAttempts < 3) {
          if (existingAttendance) {
            await prisma.attendance.update({
              where: { id: existingAttendance.id },
              data: { faceMatchAttempts: currentAttempts }
            });
          } else {
            await prisma.attendance.create({
              data: {
                employeeId: employee.id,
                date: todayStart,
                status: "ABSENT",
                faceMatchAttempts: currentAttempts
              }
            });
          }
          throw new Error(`Face mismatch. Attempt ${currentAttempts}/2 failed. Please retry check-in.`);
        }

        // 3rd attempt failed -> Allow check-in, set PENDING_VERIFICATION
        attendanceData.status = "PENDING_VERIFICATION";
        return processCheckin(
          existingAttendance,
          attendanceData,
          `Face mismatch on attempt ${currentAttempts}. Check-in allowed but flagged for HR review.`
        );
      }

      // Successful match
      attendanceData.status = "PRESENT";
      attendanceData.faceMatchAttempts = currentAttempts;
      return processCheckin(
        existingAttendance,
        attendanceData,
        `Location validated within ${Math.round(distance)}m. Face matched successfully at ${faceMatch.confidence}%.`
      );
    } catch (faceError) {
      if (faceError.message.includes("Attempt")) {
        throw faceError;
      }

      attendanceData.faceMatchScore = 0;
      attendanceData.faceMatchAttempts = currentAttempts;

      if (currentAttempts < 3) {
        if (existingAttendance) {
          await prisma.attendance.update({
            where: { id: existingAttendance.id },
            data: { faceMatchAttempts: currentAttempts }
          });
        } else {
          await prisma.attendance.create({
            data: {
              employeeId: employee.id,
              date: todayStart,
              status: "ABSENT",
              faceMatchAttempts: currentAttempts
            }
          });
        }
        throw new Error(`Facial recognition error: ${faceError.message}. Attempt ${currentAttempts}/2 failed. Please retry check-in.`);
      }

      // 3rd attempt has error -> Allow check-in, set PENDING_VERIFICATION
      attendanceData.status = "PENDING_VERIFICATION";
      return processCheckin(
        existingAttendance,
        attendanceData,
        `Location validated. Face verification error: ${faceError.message}. Flagged for HR review.`
      );
    }
  }

  // ── WFH: Lock Home Base GPS ──
  if (effectiveWorkType === "WFH") {
    attendanceData.status = "PRESENT";
    attendanceData.checkInLat = latitude;
    attendanceData.checkInLng = longitude;
    if (livePhoto) {
      attendanceData.checkInSelfie = livePhoto;
    }
    return processCheckin(existingAttendance, attendanceData, `WFH Check-In successful. Home base locked at your current location.`);
  }
};

const processCheckin = async (existingAttendance, data, message) => {
  let attendance;
  if (existingAttendance) {
    attendance = await prisma.attendance.update({ where: { id: existingAttendance.id }, data });
  } else {
    attendance = await prisma.attendance.create({ data });
  }
  return { message, checkIn: attendance.checkIn, workType: attendance.workTypeForToday, status: attendance.status };
};

// ─────────────────────────────────────────────────────────
// 2. CLOCK OUT SERVICE
// ─────────────────────────────────────────────────────────
export const clockOutService = async (userId, companyId, { latitude, longitude, dailyWorkSummary, checkoutReason }) => {
  const employee = await prisma.employee.findUnique({
    where: { userId },
    include: {
      user: true,
      department: true,
      designation: true,
    },
  });
  if (!employee) throw new Error("Employee profile details missing.");

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      hrSetting: true,
      users: { select: { role: true, email: true } },
    },
  });
  if (!company) throw new Error("Company registered context is invalid.");

  // Find today's attendance
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const attendance = await prisma.attendance.findFirst({
    where: { employeeId: employee.id, date: { gte: todayStart, lte: todayEnd } },
  });
  if (!attendance || !attendance.checkIn) {
    throw new Error("You have not checked in today. Please check in first.");
  }
  if (attendance.checkOut) {
    throw new Error("You have already checked out for today.");
  }

  // ── MANDATORY: Daily Work Summary ──
  if (!dailyWorkSummary || dailyWorkSummary.trim() === "") {
    throw new Error("You must submit your Daily Work Summary before you can check out.");
  }

  const workingHoursStr = company.hrSetting?.workingHours || "9:00 AM - 6:00 PM";
  const shiftEndMinutes = getShiftEndMinutes(workingHoursStr);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const isEarly = currentMinutes < shiftEndMinutes;

  // ── If early, checkoutReason is mandatory ──
  if (isEarly && (!checkoutReason || checkoutReason.trim() === "")) {
    const shiftEndStr = company.hrSetting?.workingHours?.split("-")[1]?.trim() || "6:00 PM";
    throw new Error(`Your shift ends at ${shiftEndStr}. Early check-out requires a reason.`);
  }

  const updateData = {
    checkOut: now,
    checkOutLat: latitude || null,
    checkOutLng: longitude || null,
    dailyWorkSummary: dailyWorkSummary.trim(),
    workSubmittedAt: now,
    checkoutReason: checkoutReason?.trim() || null,
    isEarlyCheckout: isEarly,
    status: isEarly ? "EARLY_EXIT" : "PRESENT",
  };

  const updated = await prisma.attendance.update({
    where: { id: attendance.id },
    data: updateData,
  });

  const workingHours = calcWorkingHours(updated.checkIn, updated.checkOut);

  // ── Send email to HR if early check-out ──
  if (isEarly) {
    sendEarlyCheckoutEmailToHR(employee, attendance, company, checkoutReason, dailyWorkSummary, workingHoursStr).catch(console.error);
  }

  return {
    message: isEarly
      ? "Early check-out recorded. Your HR has been notified."
      : "Check-out successful. Have a great evening!",
    checkIn: updated.checkIn,
    checkOut: updated.checkOut,
    workingHours,
    isEarlyCheckout: isEarly,
    dailyWorkSubmitted: true,
  };
};

// ─────────────────────────────────────────────────────────
// 3. SUBMIT DAILY WORK (standalone, for auto-checkout cases)
// ─────────────────────────────────────────────────────────
export const submitDailyWorkService = async (userId, { dailyWorkSummary }) => {
  if (!dailyWorkSummary || dailyWorkSummary.trim() === "") {
    throw new Error("Daily work summary cannot be empty.");
  }

  const employee = await prisma.employee.findUnique({ where: { userId } });
  if (!employee) throw new Error("Employee not found.");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const attendance = await prisma.attendance.findFirst({
    where: { employeeId: employee.id, date: { gte: todayStart, lte: todayEnd } },
  });
  if (!attendance) throw new Error("No attendance record found for today.");
  if (attendance.dailyWorkSummary) throw new Error("Daily work summary has already been submitted for today.");

  await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      dailyWorkSummary: dailyWorkSummary.trim(),
      workSubmittedAt: new Date(),
    },
  });

  return { message: "Daily work summary submitted successfully." };
};

// ─────────────────────────────────────────────────────────
// 4. HEARTBEAT — WFH Geofence Check (every 10 mins)
// ─────────────────────────────────────────────────────────
export const heartbeatService = async (userId, companyId, { latitude, longitude }) => {
  const employee = await prisma.employee.findUnique({
    where: { userId },
    include: { user: true },
  });
  if (!employee) throw new Error("Employee not found.");

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      users: { select: { role: true, email: true } },
    },
  });

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const attendance = await prisma.attendance.findFirst({
    where: { employeeId: employee.id, date: { gte: todayStart, lte: todayEnd } },
  });

  // Only run geofence check for active WFH check-ins
  if (!attendance || !attendance.checkIn || attendance.checkOut) {
    return { status: "NO_ACTIVE_SESSION" };
  }
  if (attendance.workTypeForToday !== "WFH") {
    return { status: "WFO_NO_GEOFENCE" };
  }
  if (!attendance.checkInLat || !attendance.checkInLng) {
    return { status: "NO_HOME_BASE" };
  }

  const distance = calculateDistance(latitude, longitude, attendance.checkInLat, attendance.checkInLng);

  // 1 km = 1000 meters
  if (distance > 1000) {
    // AUTO-CHECKOUT
    await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: new Date(),
        checkOutLat: latitude,
        checkOutLng: longitude,
        isAutoCheckout: true,
        checkoutReason: `System Auto-Checkout: Employee moved ${Math.round(distance)}m away from the 1km WFH radius.`,
        status: "EARLY_EXIT",
      },
    });

    // Send email to employee
    sendGeofenceBreachEmail(employee, attendance, company).catch(console.error);

    return {
      status: "GEOFENCE_BREACH",
      autoCheckedOut: true,
      distance: Math.round(distance),
      message: `You have been automatically checked out because you moved ${Math.round(distance)} meters away from your work area.`,
    };
  }

  return {
    status: "WITHIN_RANGE",
    distance: Math.round(distance),
    message: "Location verified. You are within the work zone.",
  };
};

// ─────────────────────────────────────────────────────────
// 5. MIDNIGHT CRON — Mark Absent + Send Email
// ─────────────────────────────────────────────────────────
export const midnightAttendanceCron = async () => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Find all employees still checked in without checkout
  const unclosedAttendances = await prisma.attendance.findMany({
    where: {
      date: { gte: todayStart, lte: todayEnd },
      checkIn: { not: null },
      checkOut: null,
    },
    include: {
      employee: {
        include: {
          user: true,
          company: {
            include: { users: { select: { role: true, email: true } } },
          },
        },
      },
    },
  });

  for (const attendance of unclosedAttendances) {
    const hasSubmittedWork = !!attendance.dailyWorkSummary;

    if (hasSubmittedWork) {
      // Work was submitted — auto-close shift, keep as PRESENT
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: new Date(),
          isAutoCheckout: true,
          checkoutReason: "System Auto-Checkout: Midnight sweep — shift auto-closed.",
        },
      });
    } else {
      // No work submitted — mark ABSENT and send email
      await prisma.attendance.update({
        where: { id: attendance.id },
        data: {
          checkOut: new Date(),
          status: "ABSENT",
          isAutoCheckout: true,
          checkoutReason: "System Auto-Checkout: No daily work submitted. Marked as Absent.",
        },
      });
      sendAbsentPenaltyEmail(attendance.employee, attendance.employee.company).catch(console.error);
    }
  }

  console.log(`✅ Midnight cron complete: ${unclosedAttendances.length} attendance records processed.`);
};

// ─────────────────────────────────────────────────────────
// 6. EMPLOYEE ATTENDANCE HISTORY
// ─────────────────────────────────────────────────────────
export const getEmployeeAttendanceHistory = async (userId, { month, year, fromDate, toDate, sort = "desc" }) => {
  const employee = await prisma.employee.findUnique({
    where: { userId },
    include: { company: { include: { hrSetting: true } } },
  });
  if (!employee) throw new Error("Employee profile details missing.");

  let startDate, endDate;

  if (fromDate && toDate) {
    startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);
  } else {
    const today = new Date();
    const targetMonth = month ? parseInt(month) : today.getMonth() + 1;
    const targetYear = year ? parseInt(year) : today.getFullYear();

    startDate = new Date(targetYear, targetMonth - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(targetYear, targetMonth, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  const attendanceRecords = await prisma.attendance.findMany({
    where: { employeeId: employee.id, date: { gte: startDate, lte: endDate } },
    orderBy: { date: "asc" },
  });

  const approvedLeaves = await prisma.leave.findMany({
    where: {
      employeeId: employee.id,
      status: "APPROVED",
      OR: [{ fromDate: { lte: endDate }, toDate: { gte: startDate } }],
    },
  });

  const workingHoursSetting = employee.company?.hrSetting?.workingHours || "9:00 AM - 6:00 PM";
  const workingDaysSetting = employee.company?.hrSetting?.workingDays || "Monday - Friday";
  const shiftStartMinutes = getShiftStartMinutes(workingHoursSetting);

  const dailyRecords = [];
  let totalPresent = 0, totalAbsent = 0, totalHalfDays = 0;
  let totalLeaves = 0, totalWeekOffs = 0, totalLate = 0, totalEarlyExit = 0;
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  let current = new Date(startDate);
  while (current <= endDate) {
    const currentDate = new Date(current);
    const dateStr = currentDate.toISOString().split("T")[0];
    const record = attendanceRecords.find((r) => new Date(r.date).toISOString().split("T")[0] === dateStr);
    const isOnLeave = approvedLeaves.some((l) => {
      const from = new Date(l.fromDate); from.setHours(0, 0, 0, 0);
      const to = new Date(l.toDate); to.setHours(23, 59, 59, 999);
      return currentDate >= from && currentDate <= to;
    });
    const isWeekendDay = isWeekend(currentDate, workingDaysSetting);

    let status = "ABSENT", checkIn = null, checkOut = null;
    let workingHours = "0h 0m", isLateDay = false;

    if (record) {
      checkIn = record.checkIn;
      checkOut = record.checkOut;
      if (checkIn && checkOut) {
        workingHours = calcWorkingHours(checkIn, checkOut);
      }
      if (checkIn) {
        const checkInTime = new Date(checkIn);
        const checkInMinutes = checkInTime.getHours() * 60 + checkInTime.getMinutes();
        if (checkInMinutes > shiftStartMinutes + 15) { isLateDay = true; totalLate++; }
      }
      if (record.status === "ABSENT") {
        status = "ABSENT"; totalAbsent++;
      } else if (record.status === "EARLY_EXIT") {
        status = "EARLY_EXIT"; totalEarlyExit++;
      } else if (record.status === "PENDING_VERIFICATION") {
        status = "PENDING_VERIFICATION";
      } else if (checkIn && checkOut) {
        const durationMs = new Date(checkOut) - new Date(checkIn);
        if (durationMs < 4.5 * 60 * 60 * 1000) {
          status = "HALF_DAY"; totalHalfDays++;
        } else {
          status = "PRESENT"; totalPresent++;
        }
      } else {
        status = "PRESENT"; totalPresent++;
      }
    } else {
      if (isOnLeave) { status = "LEAVE"; totalLeaves++; }
      else if (isWeekendDay) { status = "WEEK_OFF"; totalWeekOffs++; }
      else if (currentDate > today) { status = "FUTURE"; }
      else { status = "ABSENT"; totalAbsent++; }
    }

    dailyRecords.push({
      date: dateStr,
      dayOfWeek: currentDate.toLocaleDateString("en-US", { weekday: "long" }),
      status,
      workTypeForToday: record?.workTypeForToday || null,
      checkIn,
      checkOut,
      workingHours,
      isLate: isLateDay,
      isEarlyCheckout: record?.isEarlyCheckout || false,
      isAutoCheckout: record?.isAutoCheckout || false,
      checkoutReason: record?.checkoutReason || null,
      dailyWorkSummary: record?.dailyWorkSummary || null,
    });

    current.setDate(current.getDate() + 1);
  }

  // Sort dailyRecords
  if (sort === "asc") {
    dailyRecords.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else {
    dailyRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  return {
    summary: {
      startDate: startDate.toISOString().split("T")[0],
      endDate: endDate.toISOString().split("T")[0],
      totalDays: dailyRecords.length,
      totalWorkingDays: dailyRecords.length - totalWeekOffs,
      present: totalPresent,
      absent: totalAbsent,
      halfDays: totalHalfDays,
      earlyExits: totalEarlyExit,
      leaves: totalLeaves,
      weekOffs: totalWeekOffs,
      late: totalLate,
    },
    history: dailyRecords,
  };
};

// ─────────────────────────────────────────────────────────
// 7. COMPANY ATTENDANCE HISTORY (HR VIEW)
// ─────────────────────────────────────────────────────────
const querySingleDayCompanyAttendance = async (companyId, targetDate, filters = {}) => {
  const { status, employeeId, search } = filters;
  const startOfDay = new Date(targetDate); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate); endOfDay.setHours(23, 59, 59, 999);

  const employeeWhere = { companyId, status: "ACTIVE" };
  if (employeeId) {
    employeeWhere.id = employeeId;
  }
  if (search) {
    employeeWhere.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { user: { email: { contains: search } } }
    ];
  }

  const employees = await prisma.employee.findMany({
    where: employeeWhere,
    include: { user: true },
  });

  const attendanceRecords = await prisma.attendance.findMany({
    where: { employee: { companyId }, date: { gte: startOfDay, lte: endOfDay } },
  });

  const approvedLeaves = await prisma.leave.findMany({
    where: {
      employee: { companyId },
      status: "APPROVED",
      fromDate: { lte: endOfDay },
      toDate: { gte: startOfDay },
    },
  });

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { hrSetting: true },
  });

  const workingDaysSetting = company?.hrSetting?.workingDays || "Monday - Friday";
  const isWeekendDay = isWeekend(targetDate, workingDaysSetting);

  let presentCount = 0, absentCount = 0, leaveCount = 0, halfDayCount = 0, earlyExitCount = 0;

  let records = employees.map((emp) => {
    const record = attendanceRecords.find((r) => r.employeeId === emp.id);
    const leave = approvedLeaves.find((l) => l.employeeId === emp.id);

    let statusVal = "ABSENT", checkIn = null, checkOut = null, workingHours = "0h 0m";

    if (record) {
      checkIn = record.checkIn;
      checkOut = record.checkOut;
      if (checkIn && checkOut) workingHours = calcWorkingHours(checkIn, checkOut);

      if (record.status === "ABSENT") { statusVal = "ABSENT"; absentCount++; }
      else if (record.status === "EARLY_EXIT") { statusVal = "EARLY_EXIT"; earlyExitCount++; }
      else if (record.status === "PENDING_VERIFICATION") { statusVal = "PENDING_VERIFICATION"; }
      else if (checkIn && checkOut) {
        const durationMs = new Date(checkOut) - new Date(checkIn);
        if (durationMs < 4.5 * 60 * 60 * 1000) { statusVal = "HALF_DAY"; halfDayCount++; }
        else { statusVal = "PRESENT"; presentCount++; }
      } else { statusVal = "PRESENT"; presentCount++; }
    } else if (leave) { statusVal = "LEAVE"; leaveCount++; }
    else if (isWeekendDay) { statusVal = "WEEK_OFF"; }
    else { statusVal = "ABSENT"; absentCount++; }

    return {
      employeeId: emp.id,
      employeeCode: emp.employeeCode,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.user?.email || "",
      workModel: emp.workModel,
      designation: emp.designation,
      status: statusVal,
      workTypeForToday: record?.workTypeForToday || null,
      checkIn,
      checkOut,
      workingHours,
      isEarlyCheckout: record?.isEarlyCheckout || false,
      isAutoCheckout: record?.isAutoCheckout || false,
      checkoutReason: record?.checkoutReason || null,
      dailyWorkSummary: record?.dailyWorkSummary || null,
      checkInSelfie: record?.checkInSelfie || null,
      faceMatchScore: record?.faceMatchScore || null,
      masterFacePhoto: emp.faceVerificationPhoto || emp.profilePhoto || emp.user?.profileLogo || null,
    };
  });

  if (status) {
    records = records.filter(r => r.status.toUpperCase() === status.toUpperCase());
  }

  return {
    date: targetDate.toISOString().split("T")[0],
    summary: {
      totalEmployees: employees.length,
      present: presentCount,
      absent: absentCount,
      onLeave: leaveCount,
      halfDays: halfDayCount,
      earlyExits: earlyExitCount,
      isWeekend: isWeekendDay,
    },
    records,
  };
};

export const getCompanyAttendanceHistory = async (companyId, { date, fromDate, toDate, month, year, sort = "desc", status, employeeId, search }) => {
  const isRangeMode = (fromDate && toDate) || month || year;
  const filters = { status, employeeId, search };

  if (!isRangeMode) {
    const targetDate = date ? new Date(date) : new Date();
    return await querySingleDayCompanyAttendance(companyId, targetDate, filters);
  }

  let startDate, endDate;
  if (fromDate && toDate) {
    startDate = new Date(fromDate);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(toDate);
    endDate.setHours(23, 59, 59, 999);
  } else {
    const today = new Date();
    const targetMonth = month ? parseInt(month) : today.getMonth() + 1;
    const targetYear = year ? parseInt(year) : today.getFullYear();

    startDate = new Date(targetYear, targetMonth - 1, 1);
    startDate.setHours(0, 0, 0, 0);
    endDate = new Date(targetYear, targetMonth, 0);
    endDate.setHours(23, 59, 59, 999);
  }

  const dailyHistoryList = [];
  let current = new Date(startDate);
  while (current <= endDate) {
    const targetDate = new Date(current);
    const dailyData = await querySingleDayCompanyAttendance(companyId, targetDate, filters);
    
    // Only include this day in the list if there are matching records (filters applied)
    if (dailyData.records.length > 0) {
      dailyHistoryList.push(dailyData);
    }
    current.setDate(current.getDate() + 1);
  }

  if (sort === "asc") {
    dailyHistoryList.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else {
    dailyHistoryList.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  return dailyHistoryList;
};

// ─────────────────────────────────────────────────────────
// 8. VERIFY FLAGGED ATTENDANCE (HR/OWNER Verification)
// ─────────────────────────────────────────────────────────
export const verifyFlaggedAttendanceService = async (hrUserId, companyId, { attendanceId, action, remarks }) => {
  if (!["APPROVE", "REJECT"].includes(action)) {
    throw new Error("Invalid action. Action must be APPROVE or REJECT.");
  }

  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: {
      employee: {
        include: {
          user: true,
          company: true,
        },
      },
    },
  });

  if (!attendance) {
    throw new Error("Attendance record not found.");
  }

  if (attendance.employee.companyId !== companyId) {
    throw new Error("Unauthorized: Attendance record belongs to another company.");
  }

  if (attendance.status !== "PENDING_VERIFICATION") {
    throw new Error("This attendance record is not pending verification.");
  }

  let updatedStatus;
  let checkoutReasonText = attendance.checkoutReason;

  if (action === "APPROVE") {
    updatedStatus = attendance.isEarlyCheckout ? "EARLY_EXIT" : "PRESENT";
  } else {
    updatedStatus = "ABSENT";
    checkoutReasonText = remarks ? `Rejected by HR: ${remarks}` : "Rejected by HR due to face mismatch.";
  }

  const updated = await prisma.attendance.update({
    where: { id: attendanceId },
    data: {
      status: updatedStatus,
      checkoutReason: checkoutReasonText,
      verifiedBy: hrUserId,
      verifiedAt: new Date(),
    },
  });

  // If rejected, notify the employee via email
  if (action === "REJECT") {
    const empName = `${attendance.employee.firstName} ${attendance.employee.lastName}`;
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:20px;border-radius:8px;">
        <h2 style="color:#d32f2f;">❌ Attendance Verification Rejected</h2>
        <p>Dear <strong>${empName}</strong>,</p>
        <p>Your check-in on <strong>${formatDate(attendance.date)}</strong> has been <strong>rejected by HR</strong> due to a face verification failure/mismatch.</p>
        <div style="background:#ffebee;padding:14px;border-radius:6px;border-left:4px solid #d32f2f;margin:16px 0;">
          <strong>Status:</strong> Marked as Absent<br/>
          <strong>Reason:</strong> ${remarks || "Face mismatch / verification failed."}
        </div>
        <p>If you believe this is an error, please contact HR immediately.</p>
        <p>Regards,<br/><strong>HR Team</strong></p>
      </div>
    `;
    sendEmail(attendance.employee.user.email, `Attendance Verification Rejected — ${formatDate(attendance.date)}`, html).catch(console.error);
  }

  return {
    message: `Attendance record successfully ${action === "APPROVE" ? "approved" : "rejected"}.`,
    attendanceId: updated.id,
    status: updated.status,
  };
};