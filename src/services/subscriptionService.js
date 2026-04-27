import prisma from "../config/db.js";

// 1. Manage Plans (Super Admin)
export const createPlan = async (data) => {
  return prisma.subscriptionPlan.create({ data });
};

export const deletePlan = async (planId) => {
  return prisma.subscriptionPlan.delete({ where: { id: planId } });
};

export const updatePlan = async (planId, data) => {
  return prisma.subscriptionPlan.update({
    where: { id: planId },
    data
  });
};

export const getAllPlans = async () => {
  return prisma.subscriptionPlan.findMany();
};

export const getPlanById = async (planId) => {
  return prisma.subscriptionPlan.findUnique({
    where: { id: planId }
  });
};

// 2. Assign Basic Subscription (30 Days)
export const assignTrialSubscription = async (companyId) => {
  const basicPlan = await prisma.subscriptionPlan.findFirst({
    where: { name: "Basic" }
  });

  if (!basicPlan) throw new Error("Basic plan not configured");

  return prisma.subscription.create({
    data: {
      companyId,
      planId: basicPlan.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    }
  });
};

// 3. Subscription Stats (Super Admin)
export const getSubscriptionStats = async () => {
  const totalActive = await prisma.subscription.count({
    where: { endDate: { gt: new Date() } }
  });

  const plans = await prisma.subscriptionPlan.findMany({
    include: {
      _count: {
        select: { subscriptions: true }
      }
    }
  });

  return { totalActive, plans };
};

// 4. Update Company Subscription (Super Admin)
export const updateCompanySubscription = async (subscriptionId, data) => {
  return prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      planId: data.planId,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
    }
  });
};
