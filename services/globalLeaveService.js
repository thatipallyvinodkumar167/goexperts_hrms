import prisma from "../config/db.js";

export const createGlobalLeaveType = async (data) => {
    return await prisma.globalLeaveType.create({
        data: {
            name: data.name,
            maxDays: data.maxDays
        }
    });
};

export const getAllGlobalLeaveTypes = async () => {
    return await prisma.globalLeaveType.findMany({
        orderBy: {
            createdAt: 'asc'
        }
    });
};

export const updateGlobalLeaveType = async (id, data) => {
    return await prisma.globalLeaveType.update({
        where: { id },
        data: {
            name: data.name,
            maxDays: data.maxDays
        }
    });
};

export const deleteGlobalLeaveType = async (id) => {
    return await prisma.globalLeaveType.delete({
        where: { id }
    });
};
