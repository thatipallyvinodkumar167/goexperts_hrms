import prisma from "../src/config/db.js";
import { getCompanyAttendanceHistory } from "../src/services/attendanceService.js";

async function runTest() {
  try {
    // 1. Fetch a company that has active employees
    const company = await prisma.company.findFirst({
      where: {
        employees: {
          some: {
            status: "ACTIVE"
          }
        }
      },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });

    if (!company) {
      console.log("No companies with active employees found in database. Let's test with any company.");
      const anyCompany = await prisma.company.findFirst();
      if (!anyCompany) {
        console.log("No companies found in database.");
        return;
      }
      console.log(`Testing with Company: ${anyCompany.id} (${anyCompany.name || 'unnamed'})`);
      await testCompany(anyCompany.id);
    } else {
      console.log(`Testing with Company: ${company.id} (${company.name}), Active Employees: ${company._count.employees}`);
      await testCompany(company.id);
    }
  } catch (error) {
    console.error("Test failed with error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

async function testCompany(companyId) {
  // Test case 1: Retrieve without pagination parameters (should return all records)
  console.log("\n--- TEST CASE 1: Default (No Pagination) ---");
  const resultDefault = await getCompanyAttendanceHistory(companyId, {});
  console.log("Pagination block exists?:", !!resultDefault.pagination);
  console.log("Total records returned:", resultDefault.records?.length);
  if (resultDefault.records && resultDefault.records.length > 0) {
    console.log("First employee record:", resultDefault.records[0].firstName, resultDefault.records[0].lastName);
  }

  // Test case 2: Retrieve with page=1 & limit=2
  console.log("\n--- TEST CASE 2: Paginated (page=1, limit=2) ---");
  const resultPaginated1 = await getCompanyAttendanceHistory(companyId, { page: 1, limit: 2 });
  console.log("Result object keys:", Object.keys(resultPaginated1));
  console.log("Pagination Metadata:", resultPaginated1.pagination);
  console.log("Records length on page 1:", resultPaginated1.records?.length);

  // Test case 3: Retrieve with page=2 & limit=2
  console.log("\n--- TEST CASE 3: Paginated (page=2, limit=2) ---");
  const resultPaginated2 = await getCompanyAttendanceHistory(companyId, { page: 2, limit: 2 });
  console.log("Pagination Metadata:", resultPaginated2.pagination);
  console.log("Records length on page 2:", resultPaginated2.records?.length);
  if (resultPaginated2.records && resultPaginated2.records.length > 0) {
    console.log("First employee on page 2:", resultPaginated2.records[0].firstName, resultPaginated2.records[0].lastName);
  }
}

runTest();
