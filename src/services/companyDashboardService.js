import prisma from "../config/db.js";

/**
 * Get aggregated stats for the Company Owner Dashboard.
 * Supports filtering by date range, departmentId, and workLocation.
 */
export const getDashboardStats = async (companyId, filters = {}, user = null, companyStatus = null) => {
  const now = new Date();
  
  // ============================================================
  // EMPLOYEE DASHBOARD - Completely personal, lightweight response
  // ============================================================
  if (user?.role === 'EMPLOYEE') {
    return await getEmployeeDashboard(companyId, user, now);
  }

  // ============================================================
  // OWNER / HR DASHBOARD - Company-wide stats
  // ============================================================
  
  if (companyStatus === "PENDING_APPROVAL") {
    return {
      message: "Your account is pending approval from the Admin. You will be notified once it is activated.",
      isPending: true,
      totalEmployees: 0,
      activeEmployees: 0,
      newJoinees: 0,
      attrition: 0,
      presentToday: 0,
      absentToday: 0,
      lateToday: 0,
      halfDayToday: 0,
      totalLeaveRequests: 0,
      pendingLeaveRequests: 0,
      approvedLeaveRequests: 0,
      rejectedLeaveRequests: 0,
      departmentStats: [],
      attendanceTrends: [],
      upcomingBirthdays: [],
      recentActivities: []
    };
  }

  // 1. Process Filters
  const { fromDate, toDate, departmentId, workLocation } = filters;
  
  // Date range parsing (Default to today)
  let startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  let endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  
  if (fromDate) startOfDay = new Date(fromDate);
  if (toDate) {
    endOfDay = new Date(toDate);
    endOfDay.setHours(23, 59, 59, 999);
  }

  const daysInFilter = Math.max(1, Math.ceil((endOfDay - startOfDay) / (1000 * 60 * 60 * 24)));

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

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
    attendanceStats,
    approvedLeavesCount,
    pendingLeavesCount,
    pendingCorrectionsCount,
    pendingBgvCount,
    departmentHeadcounts,
    workModelHeadcounts,
    companySubscription,
    recentOnboardings,
    newEmployeesThisMonth
  ] = await Promise.all([
    // 2.1 Total Active Employees
    prisma.employee.count({ where: employeeWhere }),

    // 2.2 Attendance Breakdown (All-time or filtered)
    prisma.attendance.groupBy({
      by: ['status'],
      where: attendanceWhere,
      _count: { id: true },
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
    }),

    // 2.11 New Employees This Month
    prisma.employee.count({
      where: {
        companyId,
        joiningDate: { gte: startOfMonth }
      }
    })
  ]);

  // 3. Process & Format Data

  // --- Attendance Calculation ---
  let presentCount = 0;
  let absentCount = 0;
  let earlyExitCount = 0;

  attendanceStats.forEach(stat => {
    const count = stat._count.id;
    
    if (stat.status === 'PRESENT' || stat.status === 'HALF_DAY') presentCount += count;
    if (stat.status === 'ABSENT') absentCount += count;
    if (stat.status === 'EARLY_EXIT') earlyExitCount += count;
  });
  
  // Total expected attendance = active employees * number of days in the filter
  const expectedAttendance = totalEmployeesCount * daysInFilter;

  const attendanceRate = expectedAttendance > 0 
    ? Math.round((presentCount / expectedAttendance) * 100) 
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
    value: 1840000,
    formatted: "₹18.4L",
    dueInDays: 5
  };

  // --- HR/Employee Personal Attendance ---
  let selfAttendance = null;
  if (user && user.role !== 'OWNER') {
    const employee = await prisma.employee.findUnique({ where: { userId: user.id } });
    if (employee) {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const todaysRecord = await prisma.attendance.findFirst({
        where: {
          employeeId: employee.id,
          date: { gte: todayStart, lte: todayEnd }
        }
      });
      
      selfAttendance = todaysRecord ? {
        id: todaysRecord.id,
        checkInTime: todaysRecord.checkInTime,
        checkOutTime: todaysRecord.checkOutTime,
        status: todaysRecord.status,
        workTypeForToday: todaysRecord.workTypeForToday
      } : {
        checkInTime: null,
        checkOutTime: null,
        status: 'NOT_CHECKED_IN'
      };
    }
  }

  // 4. Construct Final JSON
  return {
    kpis: {
      totalEmployees: {
        value: totalEmployeesCount,
        trend: `+${newEmployeesThisMonth} this month`, 
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
    ...(user?.role === 'OWNER' ? { subscription: subData } : { selfAttendance }),
    todaysAttendance: {
      date: startOfDay.toISOString().split('T')[0],
      totalExpected: expectedAttendance,
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

/**
 * Employee Dashboard - Personal stats only
 * Returns: check-in/out, monthly attendance, leave balance, pending corrections
 */
const getEmployeeDashboard = async (companyId, user, now) => {
  // Find the employee record
  const employee = await prisma.employee.findUnique({
    where: { userId: user.id },
    include: {
      department: { select: { name: true } },
      designation: { select: { name: true } },
    }
  });

  if (!employee) {
    throw new Error("Employee record not found");
  }

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Run all queries in parallel
  const [
    todaysRecord,
    monthlyAttendance,
    totalLeavesApproved,
    pendingLeaves,
    pendingCorrections,
    leaveTypes
  ] = await Promise.all([
    // 1. Today's check-in/out record
    prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: { gte: todayStart, lte: todayEnd }
      }
    }),

    // 2. This month's attendance grouped by status
    prisma.attendance.groupBy({
      by: ['status'],
      where: {
        employeeId: employee.id,
        date: { gte: startOfMonth, lte: endOfMonth }
      },
      _count: { id: true }
    }),

    // 3. Total approved leaves this year
    prisma.leave.count({
      where: {
        employeeId: employee.id,
        status: "APPROVED",
        fromDate: { gte: new Date(now.getFullYear(), 0, 1) }
      }
    }),

    // 4. Pending leave requests
    prisma.leave.count({
      where: { employeeId: employee.id, status: "PENDING" }
    }),

    // 5. Pending correction requests
    prisma.correctionRequest.count({
      where: { employeeId: employee.id, status: "PENDING" }
    }),

    // 6. Leave types with max days for balance calculation
    prisma.leaveType.findMany({
      where: { companyId },
      select: { id: true, name: true, maxDays: true }
    })
  ]);

  // --- Self Attendance (Check In / Check Out) ---
  const selfAttendance = todaysRecord ? {
    id: todaysRecord.id,
    checkInTime: todaysRecord.checkInTime,
    checkOutTime: todaysRecord.checkOutTime,
    status: todaysRecord.status,
    workTypeForToday: todaysRecord.workTypeForToday
  } : {
    checkInTime: null,
    checkOutTime: null,
    status: 'NOT_CHECKED_IN'
  };

  // --- Monthly Attendance Summary ---
  let presentDays = 0;
  let absentDays = 0;
  let halfDays = 0;
  let earlyExits = 0;

  monthlyAttendance.forEach(stat => {
    const count = stat._count.id;
    if (stat.status === 'PRESENT') presentDays += count;
    if (stat.status === 'HALF_DAY') halfDays += count;
    if (stat.status === 'ABSENT') absentDays += count;
    if (stat.status === 'EARLY_EXIT') earlyExits += count;
  });

  // --- Leave Balance ---
  const usedLeavesPerType = await prisma.leave.groupBy({
    by: ['leaveTypeId'],
    where: {
      employeeId: employee.id,
      status: "APPROVED",
      fromDate: { gte: new Date(now.getFullYear(), 0, 1) }
    },
    _count: { id: true }
  });

  const usedMap = {};
  usedLeavesPerType.forEach(item => { usedMap[item.leaveTypeId] = item._count.id; });

  const leaveBalance = leaveTypes.map(lt => ({
    type: lt.name,
    total: lt.maxDays,
    used: usedMap[lt.id] || 0,
    remaining: lt.maxDays - (usedMap[lt.id] || 0)
  }));

  // --- Working days so far this month ---
  const dayOfMonth = now.getDate();

  return {
    employee: {
      id: employee.id,
      name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim(),
      employeeCode: employee.employeeCode,
      department: employee.department?.name || null,
      designation: employee.designation?.name || null,
      workModel: employee.workModel,
      profilePhoto: employee.profilePhoto
    },
    selfAttendance,
    monthlyAttendance: {
      month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
      dayOfMonth,
      present: presentDays,
      absent: absentDays,
      halfDays,
      earlyExits,
      attendanceRate: dayOfMonth > 0 ? Math.round((presentDays / dayOfMonth) * 100) : 0
    },
    leaveBalance,
    pendingActions: {
      total: pendingLeaves + pendingCorrections,
      items: [
        { type: "LEAVE_REQUESTS", count: pendingLeaves, label: "My Pending Leaves" },
        { type: "CORRECTION_REQUESTS", count: pendingCorrections, label: "My Pending Corrections" }
      ]
    }
  };
};
