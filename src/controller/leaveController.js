import * as leaveService from '../services/leaveService.js';

// ==========================================
// 1. LEAVE TYPE MANAGEMENT (HR/ADMIN)
// ==========================================

export const createLeaveType = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const data = req.body; // { name: "Sick Leave", maxDays: 12 }

        if (!data.name || !data.maxDays) {
            return res.status(400).json({ success: false, message: "Name and maxDays are required" });
        }

        const leaveType = await leaveService.createLeaveType(companyId, data);
        res.status(201).json({ success: true, data: leaveType });
    } catch (error) {
        console.error("Create Leave Type Error:", error);
        res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};

export const getCompanyLeaveTypes = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const leaveTypes = await leaveService.getCompanyLeaveTypes(companyId);
        res.status(200).json({ success: true, data: leaveTypes });
    } catch (error) {
        console.error("Get Leave Types Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const updateLeaveType = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const leaveTypeId = req.params.id;
        const data = req.body;

        const updated = await leaveService.updateLeaveType(leaveTypeId, companyId, data);
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error("Update Leave Type Error:", error);
        res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};

// ==========================================
// 2. LEAVE APPLICATION & BALANCES (EMPLOYEES)
// ==========================================

export const getLeaveBalances = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const companyId = req.user.companyId;
        const balances = await leaveService.getEmployeeLeaveBalances(employeeId, companyId);
        res.status(200).json({ success: true, data: balances });
    } catch (error) {
        console.error("Get Leave Balances Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const applyLeave = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const companyId = req.user.companyId;
        const data = req.body; // { leaveTypeId, fromDate, toDate, reason }

        if (!data.leaveTypeId || !data.fromDate || !data.toDate) {
            return res.status(400).json({ success: false, message: "leaveTypeId, fromDate, and toDate are required" });
        }

        const newLeave = await leaveService.applyLeave(employeeId, companyId, data);
        res.status(201).json({ success: true, message: "Leave applied successfully", data: newLeave });
    } catch (error) {
        console.error("Apply Leave Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getMyLeaveHistory = async (req, res) => {
    try {
        const employeeId = req.user.id;
        const history = await leaveService.getEmployeeLeaveHistory(employeeId);
        res.status(200).json({ success: true, data: history });
    } catch (error) {
        console.error("Get Leave History Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// ==========================================
// 3. LEAVE APPROVAL (HR/ADMIN)
// ==========================================

export const getCompanyLeaveRequests = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const { status } = req.query; // optional filtering by ?status=PENDING
        
        const requests = await leaveService.getCompanyLeaveRequests(companyId, status);
        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        console.error("Get Company Leave Requests Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const updateLeaveStatus = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const leaveId = req.params.id;
        const { status } = req.body; // APPROVED, REJECTED, CANCELLED

        if (!['APPROVED', 'REJECTED', 'CANCELLED'].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const updatedLeave = await leaveService.updateLeaveStatus(leaveId, companyId, status);
        res.status(200).json({ success: true, message: `Leave ${status.toLowerCase()} successfully`, data: updatedLeave });
    } catch (error) {
        console.error("Update Leave Status Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};
