import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DEPT_MAP = {
  'Software Development': '26d43f81-c76b-4012-ac3b-79356078c56c',
  'HR': '98be2180-3691-48f1-90fc-2017b8542f3d',
  'Product': 'b346d3c8-6edf-4a2b-a212-b81b91726429',
  'QA': 'c0d0863d-277a-4343-8b29-7a7be8767dc5',
  'Finance': 'd1e29052-61c9-4d96-abca-27c26f831451'
};

async function main() {
  const designations = await prisma.designationTemplate.findMany();
  
  for (const desig of designations) {
    let targetDept = null;
    const title = desig.title.toLowerCase();

    if (title.includes('hr') || title.includes('recruiter') || title.includes('talent')) {
      targetDept = DEPT_MAP['HR'];
    } else if (title.includes('tech') || title.includes('software') || title.includes('developer') || title.includes('architect')) {
      targetDept = DEPT_MAP['Software Development'];
    } else if (title.includes('finance') || title.includes('accountant') || title.includes('billing')) {
      targetDept = DEPT_MAP['Finance'];
    } else if (title.includes('product') || title.includes('data scientist')) {
      targetDept = DEPT_MAP['Product'];
    } else if (title.includes('qa') || title.includes('test')) {
      targetDept = DEPT_MAP['QA'];
    }

    if (targetDept) {
      await prisma.designationTemplate.update({
        where: { id: desig.id },
        data: { departmentId: targetDept }
      });
      console.log(`Linked "${desig.title}" to department ID: ${targetDept}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
