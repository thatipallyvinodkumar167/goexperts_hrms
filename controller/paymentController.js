import * as paymentService from "../services/paymentService.js";

/**
 * Initiates payment session
 */
export const initiatePayment = async (req, res) => {
  try {
    const { planId, customerName, customerEmail, customerPhone } = req.body;
    
    // Safety check: Company ID must be present on User object (companyOwner/HR)
    const companyId = req.user.companyId;
    if (!companyId) {
      return res.status(400).json({ success: false, message: "User is not associated with any company" });
    }

    if (!planId || !customerName || !customerEmail || !customerPhone) {
      return res.status(400).json({ success: false, message: "planId, customerName, customerEmail and customerPhone are required" });
    }

    const data = await paymentService.initiatePaymentSession({
      companyId,
      planId,
      customerName,
      customerEmail,
      customerPhone
    });

    res.status(200).json({
      success: true,
      message: "Payment session initiated successfully",
      data
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/**
 * Handle Easebuzz Webhook/Callback response
 * Since Easebuzz sends form-urlencoded data, this endpoint should process it and redirect the browser back to Frontend URL
 */
export const handlePaymentCallback = async (req, res) => {
  try {
    const transaction = await paymentService.verifyAndCompletePayment(req.body);
    
    const frontendUrl = process.env.FRONTEND_URL || "https://bevisionhrms.goexperts.in";

    if (transaction.status === "SUCCESS") {
      return res.redirect(`${frontendUrl.replace(/\/$/, "")}/payment/success?txnid=${transaction.txnId}`);
    } else {
      return res.redirect(`${frontendUrl.replace(/\/$/, "")}/payment/failure?txnid=${transaction.txnId}`);
    }
  } catch (error) {
    // If verification fails completely (e.g. invalid signature)
    res.status(400).send(`Signature verification error: ${error.message}`);
  }
};

/**
 * Get transaction status by ID
 */
export const getTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const companyId = req.user.companyId;

    if (!companyId) {
      return res.status(400).json({ success: false, message: "User is not associated with any company" });
    }

    const data = await paymentService.fetchTransactionStatus(transactionId, companyId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
