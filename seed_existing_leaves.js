import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const seedLeaveTypesForExistingCompanies = async () => {
    try {
        const companies = await prisma.company.findMany();
        let addedCount = 0;

        for (const company of companies) {
            const existingLeaves = await prisma.leaveType.findMany({
                where: { companyId: company.id }
            });

            if (existingLeaves.length === 0) {
                const defaultLeaves = [
                    { name: "Sick Leave", maxDays: 12, companyId: company.id },
                    { name: "Casual Leave", maxDays: 8, companyId: company.id },
                    { name: "Earned Leave", maxDays: 18, companyId: company.id },
                    { name: "Maternity Leave", maxDays: 182, companyId: company.id },
                    { name: "Paternity Leave", maxDays: 7, companyId: company.id },
                    { name: "Compensatory Off", maxDays: 6, companyId: company.id }
                ];

                await prisma.leaveType.createMany({
                    data: defaultLeaves,
                    skipDuplicates: true
                });
                console.log(`✅ Added 6 standard leave types to company: ${company.name}`);
                addedCount++;
            } else {
                console.log(`⏩ Company ${company.name} already has leave types. Skipping.`);
            }
        }

        console.log(`\n🎉 Process complete. Seeded ${addedCount} companies.`);
    } catch (error) {
        console.error("Error seeding leaves:", error);
    } finally {
        await prisma.$disconnect();
    }
};

seedLeaveTypesForExistingCompanies();
