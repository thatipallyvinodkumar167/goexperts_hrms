import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up duplicate company documents...');
  
  // Find all documents
  const allDocs = await prisma.companyDocument.findMany({
    orderBy: { uploadedAt: 'desc' }, // keep the latest one
  });

  const seen = new Set();
  const toDelete = [];

  for (const doc of allDocs) {
    const key = `${doc.companyId}_${doc.name}`;
    if (seen.has(key)) {
      toDelete.push(doc.id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    console.log(`Found ${toDelete.length} duplicates. Deleting...`);
    await prisma.companyDocument.deleteMany({
      where: { id: { in: toDelete } },
    });
    console.log('Cleanup complete!');
  } else {
    console.log('No duplicates found.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
