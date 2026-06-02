import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findUnique({
    where: { id: "bea8c794-ba6f-4679-9cad-aaa178a24dd2" }
  });
  console.log("Company:", company);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
