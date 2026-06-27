import { createEmployeeService } from "../services/createEmployeeService.js"
import prisma from "../config/db.js";
import { employeeFullInclude } from "../config/employeeIncludes.js";

//create emp
export const createEmployee = async (req, res) => {
  try {
    
    const data = await createEmployeeService({
      ...req.body,
      createdBy: req.user,
    });

    res.status(201).json({ success: true, message: "Employee created successfully", data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


//get all emps
export const getAllEmployees = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const roleQuery = req.query?.role;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid company context" });
    }

    const allowedRoles = ["HR", "EMPLOYEE", "MANAGER"];
    let roleFilter = undefined;

    if (roleQuery) {
      const requestedRoles = String(roleQuery)
        .split(",")
        .map((role) => role.trim().toUpperCase())
        .filter(Boolean);

      const invalidRoles = requestedRoles.filter((role) => !allowedRoles.includes(role));
      if (invalidRoles.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid role filter: ${invalidRoles.join(", ")}. Allowed roles: ${allowedRoles.join(", ")}`
        });
      }

      roleFilter = requestedRoles;
    }

    const employees = await prisma.employee.findMany({
      where: {
        deletedAt: null,
        user: {
          companyId,
          deletedAt: null,
          ...(roleFilter ? { role: { in: roleFilter } } : {})
        }
      },
      include: { user: true, department: true, designation: true },
      orderBy: { user: { createdAt: "desc" } },
    });

    // Smart Fallback: Map through and fix null names
    const sanitizedEmployees = employees.map(emp => {
      if (!emp.firstName && emp.user?.name) {
        const parts = emp.user.name.trim().split(/\s+/);
        emp.firstName = parts[0] || "";
        emp.lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
      }
      return emp;
    });

    res.status(200).json({ success: true, data: sanitizedEmployees });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


//get emp by id
export const getEmployeeById = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { id } = req.params;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid company context" });
    }

    const employee = await prisma.employee.findFirst({
      where: { userId: id, deletedAt: null, user: { companyId, deletedAt: null } },
      include: { user: true, personal: true, experience: true, department: true, designation: true },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Smart Fallback: Fix null names for single record
    if (!employee.firstName && employee.user?.name) {
      const parts = employee.user.name.trim().split(/\s+/);
      employee.firstName = parts[0] || "";
      employee.lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


// get employee/HR by employeeCode — returns ALL data including full company details
export const getEmployeeByCode = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { code } = req.params;

    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid company context" });
    }

    // Uses employeeFullInclude from src/config/employeeIncludes.js
    // To add a new relation → just update that file. No changes needed here.
    const employee = await prisma.employee.findFirst({
      where: {
        employeeCode: code,
        deletedAt: null,
        user: { companyId, deletedAt: null },
      },
      include: employeeFullInclude,
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: `No employee found with code: ${code}` });
    }

    // Smart Fallback: Fix null names
    if (!employee.firstName && employee.user?.name) {
      const parts = employee.user.name.trim().split(/\s+/);
      employee.firstName = parts[0] || "";
      employee.lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
    }

    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};






//update emp by id
export const updateEmployee = async (req, res) => {
  res.status(501).json({ success: false, message: "Update employee not implemented yet" });
};


// Soft delete employee or HR
export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const requesterRole = req.user.role;

    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid company context" });
    }

    // Fetch the target employee and user details
    const employee = await prisma.employee.findFirst({
      where: { id, user: { companyId } },
      include: { user: true }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Prevent duplicate deletion
    if (employee.deletedAt) {
      return res.status(400).json({ success: false, message: "Employee is already soft-deleted" });
    }

    const targetRole = employee.user.role;

    // Validate role constraints
    if (requesterRole === "HR") {
      // HR can only delete Employees
      if (targetRole !== "EMPLOYEE") {
        return res.status(403).json({ 
          success: false, 
          message: "Forbidden: HR can only delete employee accounts, not other HRs or Owners" 
        });
      }
    } else if (requesterRole !== "OWNER") {
      return res.status(403).json({ success: false, message: "Forbidden: Unauthorized to delete accounts" });
    }

    const now = new Date();
    await prisma.$transaction([
      prisma.employee.update({
        where: { id: employee.id },
        data: {
          deletedAt: now,
          status: "INACTIVE"
        }
      }),
      prisma.user.update({
        where: { id: employee.userId },
        data: {
          deletedAt: now,
          status: "INACTIVE"
        }
      })
    ]);

    res.status(200).json({ success: true, message: `${targetRole} soft-deleted successfully` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


// Get list of soft-deleted Employees/HRs
export const getDeletedEmployeesList = async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const requesterRole = req.user.role;

    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid company context" });
    }

    // Role-based visibility
    let roleFilter = undefined;
    if (requesterRole === "HR") {
      roleFilter = ["EMPLOYEE"];
    } else if (requesterRole === "OWNER") {
      roleFilter = ["EMPLOYEE", "HR"];
    } else {
      return res.status(403).json({ success: false, message: "Forbidden: Unauthorized to view deleted list" });
    }

    const deletedEmployees = await prisma.employee.findMany({
      where: {
        deletedAt: { not: null },
        user: {
          companyId,
          role: { in: roleFilter }
        }
      },
      include: { user: true, department: true, designation: true },
      orderBy: { deletedAt: "desc" }
    });

    res.status(200).json({ success: true, data: deletedEmployees });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


// Restore a soft-deleted employee or HR
export const restoreEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const companyId = req.user.companyId;
    const requesterRole = req.user.role;

    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid company context" });
    }

    // Fetch the target employee (must be currently deleted)
    const employee = await prisma.employee.findFirst({
      where: { id, user: { companyId }, deletedAt: { not: null } },
      include: { user: true }
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Deleted employee not found" });
    }

    const targetRole = employee.user.role;

    // Validate role constraints
    if (requesterRole === "HR") {
      if (targetRole !== "EMPLOYEE") {
        return res.status(403).json({ 
          success: false, 
          message: "Forbidden: HR can only restore employee accounts, not HRs" 
        });
      }
    } else if (requesterRole !== "OWNER") {
      return res.status(403).json({ success: false, message: "Forbidden: Unauthorized to restore accounts" });
    }

    // Determine the status to restore back to
    const restoredStatus = employee.onboardingCompleted ? "ACTIVE" : "INVITED";

    await prisma.$transaction([
      prisma.employee.update({
        where: { id: employee.id },
        data: {
          deletedAt: null,
          status: restoredStatus
        }
      }),
      prisma.user.update({
        where: { id: employee.userId },
        data: {
          deletedAt: null,
          status: restoredStatus
        }
      })
    ]);

    res.status(200).json({ success: true, message: `${targetRole} restored successfully` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────
// UPDATE EMPLOYEE WORK MODEL (HR / OWNER only)
// ─────────────────────────────────────────────────────────
export const updateWorkModel = async (req, res) => {
  try {
    const { id } = req.params; // employee ID
    const { workModel, expectedOfficeDays } = req.body;
    const companyId = req.user?.companyId;

    if (!workModel || !["WFO", "WFH", "HYBRID"].includes(workModel)) {
      return res.status(400).json({
        success: false,
        message: 'workModel must be one of: "WFO", "WFH", "HYBRID"'
      });
    }

    if (workModel === "HYBRID" && (!expectedOfficeDays || isNaN(expectedOfficeDays))) {
      return res.status(400).json({
        success: false,
        message: "expectedOfficeDays is required for HYBRID work model (e.g., 3)"
      });
    }

    // Verify the employee belongs to this company
    const employee = await prisma.employee.findFirst({
      where: { id, companyId }
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found in your company." });
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        workModel,
        expectedOfficeDays: workModel === "HYBRID" ? parseInt(expectedOfficeDays) : null
      },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        workModel: true,
        expectedOfficeDays: true
      }
    });

    return res.status(200).json({
      success: true,
      message: `Work model updated to ${workModel} successfully.`,
      data: updated
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
