import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function fixCompanyStatuses() {
  console.log("🛠️ Starting Company Status Fix Script...");

  try {
    // 1. Find all companies that are ACTIVE but haven't completed their profile
    // These are likely the ones that bypassed approval in the old flow
    const companiesToFix = await prisma.company.findMany({
      where: {
        status: "ACTIVE",
        isProfileCompleted: false,
      },
      include: {
        users: {
          where: { role: "OWNER" }
        }
      }
    });

    console.log(`🔍 Found ${companiesToFix.length} companies to fix.`);

    for (const company of companiesToFix) {
      console.log(`Processing: ${company.name} (${company.email})`);

      // If they have an owner who has set a password (not "password"), mark email as verified
      const hasPasswordSet = company.users.length > 0 && company.users[0].password !== "password";

      await prisma.company.update({
        where: { id: company.id },
        data: {
          status: "PENDING_APPROVAL",
          isEmailVerified: hasPasswordSet,
          activatedAt: null, // Reset activation date as they aren't officially approved yet
        },
      });

      console.log(`✅ ${company.name} moved to PENDING_APPROVAL.`);
    }

    console.log("\n✨ All statuses fixed successfully!");
  } catch (error) {
    console.error("❌ Error fixing statuses:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCompanyStatuses();
