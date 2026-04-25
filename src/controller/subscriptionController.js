import * as subsService from "../services/subscriptionService.js";

export const addPlan = async (req, res) => {
  try {
    const plan = await subsService.createPlan(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removePlan = async (req, res) => {
  try {
    await subsService.deletePlan(req.params.id);
    res.status(200).json({ success: true, message: "Plan deleted" });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPlans = async (req, res) => {
  try {
    const plans = await subsService.getAllPlans();
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAdminStats = async (req, res) => {
  try {
    const stats = await subsService.getSubscriptionStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
