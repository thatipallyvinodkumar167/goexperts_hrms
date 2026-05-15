import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const TEMPLATE_MAP = {
  'Software Development': '47c98e6e-1b68-4264-bb83-962aba758c82',
  'HR': '92dcb194-7647-445c-b8c2-184d25963e74',
  'Finance': '8b508649-156f-4bd0-973d-6347bc3d9805',
  'Machine Learning': '18bf6586-9b75-4409-a966-54ef1273736c'
};

async function main() {
  const designations = await prisma.designationTemplate.findMany();
  
  for (const desig of designations) {
    let targetDept = null;
    const title = desig.title.toLowerCase();

    if (title.includes('hr') || title.includes('recruiter') || title.includes('talent')) {
      targetDept = TEMPLATE_MAP['HR'];
    } else if (title.includes('tech') || title.includes('software') || title.includes('developer') || title.includes('architect') || title.includes('lead')) {
      targetDept = TEMPLATE_MAP['Software Development'];
    } else if (title.includes('finance') || title.includes('accountant') || title.includes('billing')) {
      targetDept = TEMPLATE_MAP['Finance'];
    } else if (title.includes('data scientist') || title.includes('ml')) {
      targetDept = TEMPLATE_MAP['Machine Learning'];
    }

    if (targetDept) {
      await prisma.designationTemplate.update({
        where: { id: desig.id },
        data: { departmentId: targetDept }
      });
      console.log(`Successfully Linked "${desig.title}" to template: ${targetDept}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
