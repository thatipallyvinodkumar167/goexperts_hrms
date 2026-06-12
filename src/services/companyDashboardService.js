import prisma from "../config/db.js";

/**
 * Get aggregated stats for the Company Owner Dashboard.
 * Supports filtering by date range, departmentId, and workLocation.
 */
export const getDashboardStats = async (companyId, filters = {}) => {
  const now = new Date();
  
  // 1. Process Filters
  const { fromDate, toDate, departmentId, workLocation } = filters;
  
  // Date range parsing
  let startOfDay = new Date(now.setHours(0, 0, 0, 0));
  let endOfDay = new Date(now.setHours(23, 59, 59, 999));
  
  if (fromDate) startOfDay = new Date(fromDate);
  if (toDate) {
    endOfDay = new Date(toDate);
    endOfDay.setHours(23, 59, 59, 999);
  }

  // Base Employee Where Clause
  const employeeWhere = {
    companyId,
    status: "ACTIVE", // Only count active employees
    ...(departmentId && { departmentId }),
    ...(workLocation && { workLocation }),
  };

  // Base Attendance Where Clause
  const attendanceWhere = {
    employee: employeeWhere,
    date: {
      gte: startOfDay,
      lte: endOfDay,
    },
  };

  // 2. Execute parallel queries for performance
  const [
    totalEmployeesCount,
    todayAttendanceRecords,
    approvedLeavesCount,
    pendingLeavesCount,
    pendingCorrectionsCount,
    pendingBgvCount,
    departmentHeadcounts,
    workModelHeadcounts,
    companySubscription,
    recentOnboardings
  ] = await Promise.all([
    // 2.1 Total Active Employees
    prisma.employee.count({ where: employeeWhere }),

    // 2.2 Today's Attendance Breakdown
    prisma.attendance.findMany({
      where: attendanceWhere,
      select: { status: true },
    }),

    // 2.3 Approved Leaves (overlap with selected date range)
    prisma.leave.count({
      where: {
        employee: employeeWhere,
        status: "APPROVED",
        fromDate: { lte: endOfDay },
        toDate: { gte: startOfDay },
      },
    }),

    // 2.4 Pending Actions - Leaves
    prisma.leave.count({
      where: { employee: employeeWhere, status: "PENDING" },
    }),

    // 2.5 Pending Actions - Corrections
    prisma.correctionRequest.count({
      where: { employee: employeeWhere, status: "PENDING" },
    }),

    // 2.6 Pending Actions - BGV
    prisma.employee.count({
      where: { ...employeeWhere, bgvStatus: "PENDING" },
    }),

    // 2.7 Charts - Department Headcount
    prisma.employee.groupBy({
      by: ["departmentId"],
      where: employeeWhere,
      _count: { id: true },
    }),

    // 2.8 Charts - Work Model Split
    prisma.employee.groupBy({
      by: ["workModel"],
      where: employeeWhere,
      _count: { id: true },
    }),

    // 2.9 Subscription Info
    prisma.subscription.findFirst({
      where: { companyId, endDate: { gte: now } },
      include: { plan: true },
      orderBy: { endDate: "desc" },
    }),

    // 2.10 Recent Activity (Onboardings)
    prisma.employee.findMany({
      where: { companyId },
      orderBy: { joiningDate: 'desc' },
      take: 3,
      select: { firstName: true, lastName: true, joiningDate: true, user: { select: { name: true } } }
    })
  ]);

  // 3. Process & Format Data

  // --- Attendance Calculation ---
  let presentCount = 0;
  let absentCount = 0;
  let earlyExitCount = 0;

  todayAttendanceRecords.forEach(record => {
    if (record.status === 'PRESENT' || record.status === 'HALF_DAY') presentCount++;
    if (record.status === 'ABSENT') absentCount++;
    if (record.status === 'EARLY_EXIT') earlyExitCount++;
  });
  
  const attendanceRate = totalEmployeesCount > 0 
    ? Math.round((presentCount / totalEmployeesCount) * 100) 
    : 0;

  // --- Department Names Mapping ---
  // We need department names, not just IDs
  const deptIds = departmentHeadcounts.map(d => d.departmentId);
  const departments = await prisma.department.findMany({
    where: { id: { in: deptIds } },
    select: { id: true, name: true }
  });
  const deptMap = {};
  departments.forEach(d => { deptMap[d.id] = d.name; });

  const formattedDeptHeadcount = departmentHeadcounts.map(item => ({
    department: deptMap[item.departmentId] || 'Unknown',
    count: item._count.id
  }));

  // --- Work Model Mapping ---
  const workModelSplit = {
    WFO: 0,
    WFH: 0,
    HYBRID: 0
  };
  workModelHeadcounts.forEach(item => {
    if (workModelSplit[item.workModel] !== undefined) {
      workModelSplit[item.workModel] = item._count.id;
    }
  });

  // --- Subscription Logic ---
  let subData = null;
  if (companySubscription) {
    const start = new Date(companySubscription.startDate).getTime();
    const end = new Date(companySubscription.endDate).getTime();
    const current = Date.now();
    
    let daysRemaining = Math.max(0, Math.ceil((end - current) / (1000 * 60 * 60 * 24)));
    let usagePercentage = 0;
    
    if (end > start) {
      usagePercentage = Math.min(100, Math.max(0, ((current - start) / (end - start)) * 100));
    }

    subData = {
      planName: companySubscription.plan?.name || "Custom Plan",
      status: companySubscription.status,
      validUntil: companySubscription.endDate,
      daysRemaining,
      usagePercentage: Math.round(usagePercentage)
    };
  }

  // --- Recent Activity Formatting ---
  // Simulating an activity feed using recent onboardings
  const recentActivity = recentOnboardings.map((emp, index) => {
    const name = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.user?.name || "New Employee";
    return {
      id: `onboard_${index}`,
      type: "ONBOARDING",
      title: `${name} joined the company`,
      timestamp: emp.joiningDate,
      iconType: "info"
    };
  });

  // Placeholder for Payroll
  // For a real app, this would query a Payroll cycle table.
  const payrollDue = {
    value: 0,
    formatted: "₹0",
    dueInDays: 0
  };

  // 4. Construct Final JSON
  return {
    kpis: {
      totalEmployees: {
        value: totalEmployeesCount,
        trend: "Up to date", 
        trendDirection: "up" 
      },
      attendanceRate: {
        value: attendanceRate,
        label: "Present Today"
      },
      onLeaveToday: {
        value: approvedLeavesCount,
        label: "Approved Leaves"
      },
      payrollDue
    },
    subscription: subData,
    todaysAttendance: {
      date: startOfDay.toISOString().split('T')[0],
      totalExpected: totalEmployeesCount,
      breakdown: {
        present: presentCount,
        absent: absentCount,
        onLeave: approvedLeavesCount, // Overlap
        earlyExit: earlyExitCount
      }
    },
    charts: {
      departmentHeadcount: formattedDeptHeadcount,
      workModelSplit
    },
    pendingActions: {
      total: pendingLeavesCount + pendingCorrectionsCount + pendingBgvCount,
      items: [
        { type: "LEAVE_REQUESTS", count: pendingLeavesCount, label: "Leave Requests" },
        { type: "CORRECTION_REQUESTS", count: pendingCorrectionsCount, label: "Correction Requests" },
        { type: "BGV_PENDING", count: pendingBgvCount, label: "BGV Pending" }
      ]
    },
    recentActivity
  };
};
