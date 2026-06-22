import prisma from "../src/config/db.js";

async function main() {
  const offer = await prisma.offerLetter.findFirst({
    where: { employeeEmail: 'thatipallyvinod@gmail.com' }
  });
  console.log('Offer in new DB:', offer);
}

main().finally(() => prisma.$disconnect());
