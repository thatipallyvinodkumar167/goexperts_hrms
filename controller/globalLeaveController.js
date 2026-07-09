import * as globalLeaveService from '../services/globalLeaveService.js';

export const createGlobalLeaveType = async (req, res) => {
    try {
        const data = req.body;
        if (!data.name || !data.maxDays) {
            return res.status(400).json({ success: false, message: "Name and maxDays are required" });
        }
        const leaveType = await globalLeaveService.createGlobalLeaveType(data);
        res.status(201).json({ success: true, data: leaveType });
    } catch (error) {
        console.error("Create Global Leave Error:", error);
        res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};

export const getAllGlobalLeaveTypes = async (req, res) => {
    try {
        const leaveTypes = await globalLeaveService.getAllGlobalLeaveTypes();
        res.status(200).json({ success: true, data: leaveTypes });
    } catch (error) {
        console.error("Get Global Leaves Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const updateGlobalLeaveType = async (req, res) => {
    try {
        const id = req.params.id;
        const data = req.body;
        const updated = await globalLeaveService.updateGlobalLeaveType(id, data);
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error("Update Global Leave Error:", error);
        res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};

export const deleteGlobalLeaveType = async (req, res) => {
    try {
        const id = req.params.id;
        await globalLeaveService.deleteGlobalLeaveType(id);
        res.status(200).json({ success: true, message: "Global Leave Type deleted" });
    } catch (error) {
        console.error("Delete Global Leave Error:", error);
        res.status(500).json({ success: false, message: error.message || "Internal server error" });
    }
};
