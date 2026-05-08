import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const companyId = '980e2ec4-8341-4a33-bcf3-06dd9018cd15';
    
    console.log("Creating dummy department and designation for company...");

    const dept = await prisma.department.create({
        data: {
            name: "Engineering",
            companyId: companyId
        }
    });

    const desig = await prisma.designation.create({
        data: {
            title: "Software Engineer",
            level: 1,
            companyId: companyId
        }
    });

    console.log('\n--- USE THESE IDS IN POSTMAN ---');
    console.log(`"departmentId": "${dept.id}"`);
    console.log(`"designationId": "${desig.id}"`);
    console.log('--------------------------------');
}

main().finally(() => prisma.$disconnect());
