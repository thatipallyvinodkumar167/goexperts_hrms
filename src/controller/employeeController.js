import { createEmployeeService } from "../services/createEmployeeService.js"
import prisma from "../config/db.js";

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
        user: {
          companyId,
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
      where: { id, user: { companyId } },
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


//update emp by id
export const updateEmployee = async (req, res) => {
  res.status(501).json({ success: false, message: "Update employee not implemented yet" });
};

export const deleteEmployee = async (req, res) => {
  res.status(501).json({ success: false, message: "Delete employee not implemented yet" });
};
