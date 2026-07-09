import { CompanyDocumentType } from "@prisma/client";
import prisma from "../config/db.js";

export const createNotificationService = async ({
    title,
    message,
    type,
    industryTypeIds,
    sentById
}) => {

    //create Notification 
    const notification = await prisma.notification.create({
        data : {
            title,
            message,
            type,
            sentById,

         industries : {
            create : industryTypeIds.map( (id) => ({
                industryTypeId : id
            }))
         }
        }

    });


    //find companies
    const companies = await prisma.company.findMany({ 
          where: {
      industryTypeId: {
        in: industryTypeIds
      }
    }
     });


     //create company notification
     await prisma.companyNotification.createMany({
        data : companies.map((company) => ({
            notificationId : notification.id,
            companyId : company.id 
        }))
     });

     return {
        message : "Notification sent successfully",
        totalCompanies :companies.length
    };

};