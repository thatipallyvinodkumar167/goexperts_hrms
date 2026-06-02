import cron from "node-cron";
import { midnightAttendanceCron } from "../services/attendanceService.js";

/**
 * Midnight Attendance Cron — Runs every day at 12:00 AM
 * 1. Finds all employees still checked in without checkout
 * 2. If daily work submitted → auto-close shift (PRESENT)
 * 3. If no daily work → mark ABSENT + send penalty email
 */
export const startMidnightAttendanceCron = () => {
  cron.schedule("0 0 * * *", async () => {
    console.log("⏰ [CRON] Midnight Attendance Sweep — Starting...");
    try {
      await midnightAttendanceCron();
      console.log("✅ [CRON] Midnight Attendance Sweep — Complete.");
    } catch (error) {
      console.error("❌ [CRON] Midnight Attendance Sweep Failed:", error.message);
    }
  }, {
    timezone: "Asia/Kolkata" // IST — adjust as needed
  });

  console.log("✅ Midnight Attendance Cron scheduled (runs at 12:00 AM IST daily).");
};
