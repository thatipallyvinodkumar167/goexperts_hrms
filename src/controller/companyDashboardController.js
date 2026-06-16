import * as dashboardService from "../services/companyDashboardService.js";

/**
 * Get aggregated data for the Company Owner Dashboard.
 * Route: GET /api/company/dashboard
 */
export const getCompanyDashboard = async (req, res) => {
  try {
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({
        success: false,
        message: "User is not associated with a company",
      });
    }

    // Extract optional filters from query string
    const filters = {
      fromDate: req.query.fromDate,
      toDate: req.query.toDate,
      departmentId: req.query.departmentId,
      workLocation: req.query.workLocation,
    };

    const dashboardData = await dashboardService.getDashboardStats(companyId, filters, req.user, req.companyStatus);

    res.status(200).json({
      success: true,
      generatedAt: new Date().toISOString(),
      ...dashboardData,
    });
  } catch (error) {
    console.error("Get Company Dashboard Error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate dashboard data",
      error: error.message,
    });
  }
};
