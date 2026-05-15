import prisma from "../config/db";
import { createNotificationService } from "../services/notificationService"


export const createNotification = async(req, res) => {

    try {
        

        const data = await createNotificationService({
            ...req.body,
            sentById:req.user.id
        });

        res.status(201).json({
            success : true,
            ...data
        });

    } catch (error) {
        res.status(400).json({
            success : false,
            message : error.message
        });
        
    }
};


export const getCompanyNotifications = async (req, res) => {

    try {
        
        const data = await prisma.companyNotification.findMany({

            where : {
                companyId : req.user.companyId,
            },
            include : {
                Notification :true,
            },
            orderBy : {
                createdAt : "desc"
            }
        });

        res.status(200).json({
            success : true,
            data
        });

    } catch (error) {
        
        res.status(400).json({
            success : false,
            message : error.message
        });
    }

};


export const markAsRead = async (req, res) => {

    try {
        
        const {id} = req.params;

        await prisma.companyNotification.update({
            where : { id },
            data : {
                isRead : true,
                readAt : new Date()
            }
        });

        res.status(200).json({ success : true,
            message :"Notification marked as read"
        });

    } catch (error) {
        res.status(400).json({ success : false, message: error.message});
    }
};