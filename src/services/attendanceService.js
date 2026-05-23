import prisma from "../config/db.js";
import faceapi from "../config/faceApi.js";
import { loadImage } from "canvas";

/**
 * Calculates the shortest distance between two points on the Earth's surface
 * using the Haversine formula. Returns the distance in meters.
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371e3; // Earth's mean radius in meters

  const phi1 = toRad(lat1);
  const phi2 = toRad(lat2);
  const deltaPhi = toRad(lat2 - lat1);
  const deltaLambda = toRad(lon2 - lon1);

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Compares a live base64 selfie with the master Cloudinary profile image URL
 * using Euclidean Distance calculation between facial landmarks.
 */
const verifyFace = async (livePhotoInput, masterImageUrl) => {
  try {
    // 1. Load live image — supports both URLs (from Cloudinary upload) and base64 data URIs
    let liveImg;
    if (livePhotoInput.startsWith("http://") || livePhotoInput.startsWith("https://")) {
      // Cloudinary URL (multer uploaded the file) — load directly
      liveImg = await loadImage(livePhotoInput);
    } else {
      // Base64 data URI (sent via JSON body) — decode to buffer first
      const base64Data = livePhotoInput.replace(/^data:image\/\w+;base64,/, "");
      const imgBuffer = Buffer.from(base64Data, 'base64');
      liveImg = await loadImage(imgBuffer);
    }

    // 2. Load master image from Cloudinary URL
    const masterImg = await loadImage(masterImageUrl);

    // 3. Extract face landmarks and descriptors using the loaded models
    const detectorOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 });
    
    const liveDetection = await faceapi.detectSingleFace(liveImg, detectorOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

    const masterDetection = await faceapi.detectSingleFace(masterImg, detectorOptions)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!liveDetection) {
      throw new Error("Facial Recognition failed: No face detected in the live camera check.");
    }
    if (!masterDetection) {
      throw new Error("Face is not matching try again");
    }

    // 4. Compute Euclidean Distance
    const distance = faceapi.euclideanDistance(liveDetection.descriptor, masterDetection.descriptor);
    const matchConfidence = 1 - distance;

    return {
      isMatch: distance <= 0.6, // 0.6 is standard threshold, lower is stricter
      confidence: Math.max(0, Math.round(matchConfidence * 100))
    };
  } catch (error) {
    throw new Error(error.message || "Failed during facial comparison process.");
  }
};

/**
 * Core Clock-In Service
 */
export const clockInService = async (userId, companyId, { latitude, longitude, livePhoto }) => {
  // 1. Verify employee context
  const employee = await prisma.employee.findUnique({
    where: { userId },
    include: { user: true }
  });
  if (!employee) throw new Error("Employee profile details missing.");

  // 2. Fetch company location settings
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });
  if (!company) throw new Error("Company registered context is invalid.");
  if (!company.latitude || !company.longitude) {
    throw new Error("Company registered location coordinates are not configured. Contact admin.");
  }

  // 3. Stage 1: Geo-Fencing location validation
  const distance = calculateDistance(
    latitude,
    longitude,
    company.latitude,
    company.longitude
  );

  // Maximum allowed radius: 50 meters
  if (distance > 50) {
    throw new Error(`Location check failed: You are ${Math.round(distance)} meters away from the office.`);
  }

  // 4. Stage 2: Facial Verification validation
  const masterPhoto = employee.profilePhoto || employee.user?.profileLogo;
  if (!masterPhoto) {
    throw new Error("Profile picture missing. Please update your onboarding photo to clock-in.");
  }

  const faceMatch = await verifyFace(livePhoto, masterPhoto);
  if (!faceMatch.isMatch) {
    throw new Error(`Face Match Rejected: Verification score (${faceMatch.confidence}%) is below the secure threshold.`);
  }

  // 5. Create or update today's daily attendance sheet record
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  let attendance = await prisma.attendance.findFirst({
    where: {
      employeeId: employee.id,
      date: {
        gte: todayStart,
        lte: todayEnd
      }
    }
  });

  if (attendance) {
    // Already checked in, update check-in time or leave intact
    attendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkIn: new Date(),
        status: "PRESENT"
      }
    });
  } else {
    // Fresh daily clock-in creation
    attendance = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date: todayStart,
        checkIn: new Date(),
        status: "PRESENT"
      }
    });
  }

  return {
    message: `Verification Successful. Location validated within ${Math.round(distance)}m. Face matched at ${faceMatch.confidence}%.`,
    checkIn: attendance.checkIn
  };
};

/**
 * Core Clock-Out Service
 */
export const clockOutService = async (userId, companyId, { latitude, longitude, livePhoto }) => {
  // 1. Verify employee context
  const employee = await prisma.employee.findUnique({
    where: { userId },
    include: { user: true }
  });
  if (!employee) throw new Error("Employee profile details missing.");

  // 2. Fetch company location settings
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });
  if (!company) throw new Error("Company registered context is invalid.");
  if (!company.latitude || !company.longitude) {
    throw new Error("Company registered location coordinates are not configured.");
  }

  // 3. Stage 1: Geo-Fencing location validation
  const distance = calculateDistance(
    latitude,
    longitude,
    company.latitude,
    company.longitude
  );

  if (distance > 50) {
    throw new Error(`Location check failed: You are ${Math.round(distance)} meters away from the office.`);
  }

  // 4. Stage 2: Facial Verification validation
  const masterPhoto = employee.profilePhoto || employee.user?.profileLogo;
  if (!masterPhoto) {
    throw new Error("Profile picture missing. Please update your onboarding photo to clock-out.");
  }

  const faceMatch = await verifyFace(livePhoto, masterPhoto);
  if (!faceMatch.isMatch) {
    throw new Error(`Face Match Rejected: Verification score (${faceMatch.confidence}%) is below the secure threshold.`);
  }

  // 5. Update clock-out in today's daily attendance sheet record
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  let attendance = await prisma.attendance.findFirst({
    where: {
      employeeId: employee.id,
      date: {
        gte: todayStart,
        lte: todayEnd
      }
    }
  });

  if (!attendance) {
    // Employee forgot to clock-in first
    attendance = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date: todayStart,
        checkOut: new Date(),
        status: "PRESENT"
      }
    });
  } else {
    // Update daily check-out
    attendance = await prisma.attendance.update({
      where: { id: attendance.id },
      data: {
        checkOut: new Date()
      }
    });
  }

  // Calculate working hours dynamically in the backend
  let workingHours = "0h 0m";
  if (attendance.checkIn && attendance.checkOut) {
    const durationMs = new Date(attendance.checkOut) - new Date(attendance.checkIn);
    const totalMinutes = Math.floor(durationMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    workingHours = `${hours}h ${minutes}m`;
  }

  return {
    message: `Clock-out Successful. Location validated within ${Math.round(distance)}m. Face matched at ${faceMatch.confidence}%.`,
    checkIn: attendance.checkIn,
    checkOut: attendance.checkOut,
    workingHours
  };
};

/**
 * Parses company working hours string (e.g., "9:00 AM - 6:00 PM") and returns shift start minutes from midnight.
 */
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
  return 9 * 60; // default 9:00 AM (540 minutes)
};

/**
 * Checks if a specific date is a weekend based on company working days setting.
 */
const isWeekend = (date, workingDaysStr) => {
  const day = date.getDay(); // 0: Sunday, 6: Saturday
  const cleanStr = (workingDaysStr || "Monday - Friday").toLowerCase();
  
  if (cleanStr.includes("monday - friday") || cleanStr.includes("mon-fri")) {
    return day === 0 || day === 6; // Sunday and Saturday
  }
  if (cleanStr.includes("monday - saturday") || cleanStr.includes("mon-sat")) {
    return day === 0; // Only Sunday
  }
  return day === 0 || day === 6; // Default Sat/Sun
};

/**
 * Gets attendance history for a single employee (Monthly Summary + Daily Breakdown)
 */
export const getEmployeeAttendanceHistory = async (userId, month, year) => {
  const employee = await prisma.employee.findUnique({
    where: { userId },
    include: {
      company: {
        include: { hrSetting: true }
      }
    }
  });

  if (!employee) throw new Error("Employee profile details missing.");

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  // Fetch actual attendance records
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      employeeId: employee.id,
      date: {
        gte: startOfMonth,
        lte: endOfMonth
      }
    },
    orderBy: { date: 'asc' }
  });

  // Fetch approved leaves
  const approvedLeaves = await prisma.leave.findMany({
    where: {
      employeeId: employee.id,
      status: 'APPROVED',
      OR: [
        {
          fromDate: { lte: endOfMonth },
          toDate: { gte: startOfMonth }
        }
      ]
    }
  });

  const dailyRecords = [];
  let totalPresent = 0;
  let totalAbsent = 0;
  let totalHalfDays = 0;
  let totalLeaves = 0;
  let totalWeekOffs = 0;
  let totalLate = 0;

  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const workingHoursSetting = employee.company?.hrSetting?.workingHours || "9:00 AM - 6:00 PM";
  const workingDaysSetting = employee.company?.hrSetting?.workingDays || "Monday - Friday";
  const shiftStartMinutes = getShiftStartMinutes(workingHoursSetting);

  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month - 1, day);
    const dateStr = currentDate.toISOString().split('T')[0];

    // Find if there is an attendance record for this day
    const record = attendanceRecords.find(r => {
      const rDateStr = new Date(r.date).toISOString().split('T')[0];
      return rDateStr === dateStr;
    });

    // Check if employee was on approved leave this day
    const isOnLeave = approvedLeaves.some(l => {
      const from = new Date(l.fromDate);
      from.setHours(0, 0, 0, 0);
      const to = new Date(l.toDate);
      to.setHours(23, 59, 59, 999);
      return currentDate >= from && currentDate <= to;
    });

    const isWeekendDay = isWeekend(currentDate, workingDaysSetting);

    let status = "ABSENT";
    let checkIn = null;
    let checkOut = null;
    let workingHours = "0h 0m";
    let isLateDay = false;

    if (record) {
      checkIn = record.checkIn;
      checkOut = record.checkOut;
      
      // Calculate working hours dynamically
      let durationMs = 0;
      if (checkIn && checkOut) {
        durationMs = new Date(checkOut) - new Date(checkIn);
        const totalMinutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        workingHours = `${hours}h ${minutes}m`;
      }

      // Check if late check-in (grace period 15 mins)
      if (checkIn) {
        const checkInTime = new Date(checkIn);
        const checkInMinutes = checkInTime.getHours() * 60 + checkInTime.getMinutes();
        if (checkInMinutes > (shiftStartMinutes + 15)) {
          isLateDay = true;
          totalLate++;
        }
      }

      // Determine Status
      if (checkIn && checkOut && durationMs < 4.5 * 60 * 60 * 1000) {
        status = "HALF_DAY";
        totalHalfDays++;
      } else {
        status = "PRESENT";
        totalPresent++;
      }
    } else {
      // No attendance record
      if (isOnLeave) {
        status = "LEAVE";
        totalLeaves++;
      } else if (isWeekendDay) {
        status = "WEEK_OFF";
        totalWeekOffs++;
      } else {
        // If date is in the future, don't mark as absent yet
        if (currentDate > today) {
          status = "FUTURE";
        } else {
          status = "ABSENT";
          totalAbsent++;
        }
      }
    }

    dailyRecords.push({
      date: dateStr,
      dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' }),
      status,
      checkIn,
      checkOut,
      workingHours,
      isLate: isLateDay
    });
  }

  return {
    summary: {
      month,
      year,
      totalWorkingDays: daysInMonth - totalWeekOffs,
      present: totalPresent,
      absent: totalAbsent,
      halfDays: totalHalfDays,
      leaves: totalLeaves,
      weekOffs: totalWeekOffs,
      late: totalLate
    },
    history: dailyRecords
  };
};

/**
 * Gets daily company-wide attendance log for HR / Admin
 */
export const getCompanyAttendanceHistory = async (companyId, dateStr) => {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch all active employees
  const employees = await prisma.employee.findMany({
    where: {
      companyId,
      status: "ACTIVE"
    },
    include: {
      user: true
    }
  });

  // Fetch attendance records for today
  const attendanceRecords = await prisma.attendance.findMany({
    where: {
      employee: { companyId },
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });

  // Fetch approved leaves overlapping today
  const approvedLeaves = await prisma.leave.findMany({
    where: {
      employee: { companyId },
      status: 'APPROVED',
      fromDate: { lte: endOfDay },
      toDate: { gte: startOfDay }
    }
  });

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { hrSetting: true }
  });

  const workingDaysSetting = company?.hrSetting?.workingDays || "Monday - Friday";
  const isWeekendDay = isWeekend(targetDate, workingDaysSetting);

  let presentCount = 0;
  let absentCount = 0;
  let leaveCount = 0;
  let halfDayCount = 0;

  const records = employees.map(emp => {
    const record = attendanceRecords.find(r => r.employeeId === emp.id);
    const leave = approvedLeaves.find(l => l.employeeId === emp.id);

    let status = "ABSENT";
    let checkIn = null;
    let checkOut = null;
    let workingHours = "0h 0m";

    if (record) {
      checkIn = record.checkIn;
      checkOut = record.checkOut;

      let durationMs = 0;
      if (checkIn && checkOut) {
        durationMs = new Date(checkOut) - new Date(checkIn);
        const totalMinutes = Math.floor(durationMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        workingHours = `${hours}h ${minutes}m`;
      }

      if (checkIn && checkOut && durationMs < 4.5 * 60 * 60 * 1000) {
        status = "HALF_DAY";
        halfDayCount++;
      } else {
        status = "PRESENT";
        presentCount++;
      }
    } else if (leave) {
      status = "LEAVE";
      leaveCount++;
    } else if (isWeekendDay) {
      status = "WEEK_OFF";
    } else {
      status = "ABSENT";
      absentCount++;
    }

    return {
      employeeId: emp.id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.user?.email || "",
      designation: emp.designation,
      status,
      checkIn,
      checkOut,
      workingHours
    };
  });

  return {
    date: targetDate.toISOString().split('T')[0],
    summary: {
      totalEmployees: employees.length,
      present: presentCount,
      absent: absentCount,
      onLeave: leaveCount,
      halfDays: halfDayCount,
      isWeekend: isWeekendDay
    },
    records
  };
};