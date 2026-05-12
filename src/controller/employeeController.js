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

    res.status(200).json({ success: true, data: employees });
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
