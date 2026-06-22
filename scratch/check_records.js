import prisma from "../src/config/db.js";

async function main() {
  const email = 'thatipallyvinod@gmail.com';
  
  const user = await prisma.user.findFirst({ where: { email } });
  console.log('User Record:', user);
  
  const offer = await prisma.offerLetter.findFirst({ where: { employeeEmail: email } });
  console.log('Offer Record:', offer);
  
  const invite = await prisma.employeeInvite.findFirst({ where: { email } });
  console.log('Invite Record:', invite);
}

main().finally(() => prisma.$disconnect());
