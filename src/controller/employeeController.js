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
    if (!companyId) {
      return res.status(400).json({ success: false, message: "Invalid company context" });
    }

    const employees = await prisma.employee.findMany({
      where: { user: { companyId } },
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
