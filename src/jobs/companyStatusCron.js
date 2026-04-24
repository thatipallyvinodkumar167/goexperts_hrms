import cron from "node-cron";
import prisma from "../config/db.js";



export const companyStatusCron = () => {
    cron.schedule("0 0 * * *", async () => {
        console.log("running company status cron");


        try {

   const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

   const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      users: {
        select: {
          role: true,
          lastLoginAt: true,
        },
      },
    },
   });

   for (const company of companies) {

    const activeUsers = company.users.filter(
        (user) => 
        ["OWNER","HR"].includes(user.role) && 
        user.lastLoginAt &&
        user.lastLoginAt > thirtyDaysAgo
    );

    if (activeUsers.length === 0) {
        await prisma.company.update({
            where : {id:company.id},
            data : {status : "INACTIVE", inactiveAt: new Date()}
        });

        console.log(`company inactive : ${company.name}`);
    }
   }

   console.log("cron completed");



        } catch (error) {
           console.error("cron error :", error.message);
        }


    }, {
      timezone: "Asia/Kolkata",
    });

    console.log("company status cron scheduled: 0 0 * * * (Asia/Kolkata)");
};
