import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Extending all company subscriptions by 1 year for testing...');
  
  const subscriptions = await prisma.subscription.findMany();

  if (subscriptions.length === 0) {
    console.log('No subscriptions found in the database.');
    return;
  }

  for (const sub of subscriptions) {
    const newEndDate = new Date(sub.endDate);
    newEndDate.setFullYear(newEndDate.getFullYear() + 1); // Extend by 1 year

    await prisma.subscription.update({
      where: { id: sub.id },
      data: { endDate: newEndDate },
    });
  }

  console.log(`Successfully extended ${subscriptions.length} subscriptions by 1 year!`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
