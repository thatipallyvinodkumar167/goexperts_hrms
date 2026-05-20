import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const seedCompanyLeaveTypes = async (companyId) => {
    // Fetch global templates created by Super Admin
    const globalTemplates = await prisma.globalLeaveType.findMany();
    
    if (globalTemplates.length > 0) {
        const companyLeaves = globalTemplates.map(template => ({
            name: template.name,
            maxDays: template.maxDays,
            companyId: companyId
        }));

        // Auto-seed from global templates
        await prisma.leaveType.createMany({
            data: companyLeaves,
            skipDuplicates: true
        });
    }
};

// ==========================================
// 1. LEAVE TYPE MANAGEMENT (HR/ADMIN)
// ==========================================

export const createLeaveType = async (companyId, data) => {
    return await prisma.leaveType.create({
        data: {
            name: data.name,
            maxDays: data.maxDays,
            companyId: companyId
        }
    });
};

export const getCompanyLeaveTypes = async (companyId) => {
    return await prisma.leaveType.findMany({
        where: { companyId }
    });
};

export const updateLeaveType = async (leaveTypeId, companyId, data) => {
    const leaveType = await prisma.leaveType.findFirst({
        where: { id: leaveTypeId, companyId }
    });
    if (!leaveType) throw new Error("Leave type not found");

    return await prisma.leaveType.update({
        where: { id: leaveTypeId },
        data: {
            name: data.name,
            maxDays: data.maxDays
        }
    });
};

// ==========================================
// 2. LEAVE APPLICATION & BALANCES (EMPLOYEES)
// ==========================================

export const getEmployeeLeaveBalances = async (employeeId, companyId) => {
    const leaveTypes = await prisma.leaveType.findMany({
        where: { companyId }
    });

    const approvedLeaves = await prisma.leave.findMany({
        where: {
            employeeId,
            status: 'APPROVED'
        }
    });

    // Calculate taken days per leave type
    const leaveBalances = leaveTypes.map(type => {
        const takenLeavesForType = approvedLeaves.filter(l => l.leaveTypeId === type.id);
        
        let daysTaken = 0;
        takenLeavesForType.forEach(leave => {
            const start = new Date(leave.fromDate);
            const end = new Date(leave.toDate);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
            daysTaken += diffDays;
        });

        return {
            leaveTypeId: type.id,
            name: type.name,
            maxDays: type.maxDays,
            takenDays: daysTaken,
            remainingDays: type.maxDays - daysTaken
        };
    });

    return leaveBalances;
};

export const applyLeave = async (employeeId, companyId, data) => {
    // 1. Calculate requested days
    const start = new Date(data.fromDate);
    const end = new Date(data.toDate);
    const diffTime = Math.abs(end - start);
    const requestedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // 2. Check current balance
    const balances = await getEmployeeLeaveBalances(employeeId, companyId);
    const specificBalance = balances.find(b => b.leaveTypeId === data.leaveTypeId);

    if (!specificBalance) {
        throw new Error("Invalid leave type for this company");
    }

    if (requestedDays > specificBalance.remainingDays) {
        throw new Error(`Insufficient leave balance. You requested ${requestedDays} days but only have ${specificBalance.remainingDays} days left.`);
    }

    // 3. Create Leave Request
    return await prisma.leave.create({
        data: {
            employeeId: employeeId,
            leaveTypeId: data.leaveTypeId,
            fromDate: start,
            toDate: end,
            reason: data.reason || "",
            status: 'PENDING'
        }
    });
};

export const getEmployeeLeaveHistory = async (employeeId) => {
    return await prisma.leave.findMany({
        where: { employeeId },
        include: {
            leaveType: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};

// ==========================================
// 3. LEAVE APPROVAL (HR/ADMIN)
// ==========================================

export const getCompanyLeaveRequests = async (companyId, status = null) => {
    const whereClause = {
        employee: { companyId: companyId }
    };
    
    if (status) {
        whereClause.status = status;
    }

    return await prisma.leave.findMany({
        where: whereClause,
        include: {
            employee: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            },
            leaveType: true
        },
        orderBy: {
            createdAt: 'desc'
        }
    });
};

export const updateLeaveStatus = async (leaveId, companyId, status) => {
    // Ensure the leave belongs to an employee in this company
    const leaveRequest = await prisma.leave.findFirst({
        where: {
            id: leaveId,
            employee: { companyId: companyId }
        }
    });

    if (!leaveRequest) throw new Error("Leave request not found or access denied");

    return await prisma.leave.update({
        where: { id: leaveId },
        data: { status }
    });
};
