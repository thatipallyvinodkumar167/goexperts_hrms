import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const plans = [
    {
      name: "Basic",
      price: 0,
      duration: 30, // 30 days trial
      features: JSON.stringify(["Up to 10 Employees", "Basic Attendance", "Email Support"])
    },
    {
      name: "Standard",
      price: 49.99,
      duration: 30,
      features: JSON.stringify(["Up to 50 Employees", "Payroll Management", "Priority Support"])
    },
    {
      name: "Premium",
      price: 99.99,
      duration: 365,
      features: JSON.stringify(["Unlimited Employees", "Advanced Analytics", "Dedicated Account Manager"])
    }
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { id: plan.name }, // This is a trick since id is UUID, we can't use where easily, 
                                // but we can check existence by name first.
      update: {},
      create: {
        name: plan.name,
        price: plan.price,
        duration: plan.duration,
        features: plan.features
      },
       where: { id: '00000000-0000-0000-0000-000000000000' } // fake uuid for create
    });
  }
}

// Correcting the seed logic to check by Name
async function seedByNames() {
    const plans = [
        { name: "Basic", price: 0, duration: 30, features: { employees: 10, support: "Email" } },
        { name: "Standard", price: 49.99, duration: 30, features: { employees: 50, support: "Priority" } },
        { name: "Premium", price: 99.99, duration: 365, features: { employees: "Unlimited", support: "Dedicated" } }
    ];

    for (const p of plans) {
        const existing = await prisma.subscriptionPlan.findFirst({ where: { name: p.name } });
        if (!existing) {
            await prisma.subscriptionPlan.create({ data: p });
            console.log(`Created ${p.name} plan`);
        }
    }
}

seedByNames().finally(() => prisma.$disconnect());
