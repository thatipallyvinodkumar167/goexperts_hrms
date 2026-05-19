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
const verifyFace = async (liveBase64, masterImageUrl) => {
  try {
    // 1. Convert base64 data to image buffer
    const base64Data = liveBase64.replace(/^data:image\/\w+;base64,/, "");
    const imgBuffer = Buffer.from(base64Data, 'base64');

    // 2. Load images into Node Canvas instances
    const liveImg = await loadImage(imgBuffer);
    const masterImg = await loadImage(masterImageUrl);

    // 3. Extract face landmarks and descriptors using the loaded models
    const liveDetection = await faceapi.detectSingleFace(liveImg, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    const masterDetection = await faceapi.detectSingleFace(masterImg, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!liveDetection) {
      throw new Error("Facial Recognition failed: No face detected in the live camera check.");
    }
    if (!masterDetection) {
      throw new Error("Master Verification failed: Official onboarding photo has no readable face. Contact HR.");
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

  return {
    message: `Clock-out Successful. Location validated within ${Math.round(distance)}m. Face matched at ${faceMatch.confidence}%.`,
    checkOut: attendance.checkOut
  };
};