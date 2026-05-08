import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const companyId = '980e2ec4-8341-4a33-bcf3-06dd9018cd15';
    
    const depts = await prisma.department.findMany({
        where: { companyId },
        take: 1
    });
    
    const desigs = await prisma.designation.findMany({
        where: { companyId },
        take: 1
    });
    
    console.log('Valid Department ID:', depts.length > 0 ? depts[0].id : 'None found');
    console.log('Valid Designation ID:', desigs.length > 0 ? desigs[0].id : 'None found');
}

main().finally(() => prisma.$disconnect());
