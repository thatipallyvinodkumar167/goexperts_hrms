import prisma from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";


export const createCompanyService = async ({
    name,
    email,
    domain,
    password,
    adminName,
    adminEmail,
    createdById

}) => {

    //checking company is there or not 
    const existingCompany = await prisma.company.findFirst({where : {email}});


    if(existingCompany){
        throw new Error("company already exist");
    }

    //checking company admin email is there or not 
    const existingAdmin = await prisma.user.findFirst({where : {email : adminEmail, companyId : null}});

    if(existingAdmin){
        throw new Error("admin user already existing");
    }

    const hashedPassword = await hashPassword(password);

    const result = await prisma.$transaction( async (tx) => {
        
        const company = await tx.company.create({
           data : { name,
            email,
            domain,
            createdById
           }  
        });

        const adminUser = await tx.user.create({
            data : {
                name : adminName,
                email : adminEmail,
                password : hashedPassword,
                role : "COMPANY_ADMIN",
                companyId : company.id
            }
        });

        await tx.auditLog.create({
            data :{
                userId : createdById,
                action : "CREATE",
                module : "COMPANY",

            }
        });

        return {company, adminUser};

    } );
return result;
}
