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

export const updatePlan = async (req, res) => {
  try {
    const plan = await subsService.updatePlan(req.params.id, req.body);
    res.status(200).json({ success: true, data: plan });
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

export const modifyCompanySubscription = async (req, res) => {
  try {
    const subscription = await subsService.updateCompanySubscription(req.params.id, req.body);
    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getPlan = async (req, res) => {
  try {
    const plan = await subsService.getPlanById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: "Plan not found" });
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAdminStatus = async (req, res) => {
  try {
    const stats = await subsService.getSubscriptionStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
