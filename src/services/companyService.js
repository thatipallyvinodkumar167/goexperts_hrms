import prisma from "../config/db.js";
import { hashPassword } from "../utils/hashPassword.js";


export const createCompanyService = async ({
    name,
    email,
    domain,
    location,
    password,
    adminName,
    adminEmail,
    createdById

}) => {
    const normalizedDomain = domain?.trim().toLowerCase() || null;
    const normalizedLocation = location?.trim() || null;

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

    if (normalizedDomain) {
        const existingDomain = await prisma.company.findFirst({
            where: { domain: normalizedDomain }
        });
        if (existingDomain) {
            throw new Error("company domain already exists");
        }
    }

    const hashedPassword = await hashPassword(password);

    const result = await prisma.$transaction( async (tx) => {
        
        const company = await tx.company.create({
           data : { name,
            email,
            domain: normalizedDomain,
            location: normalizedLocation,
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
