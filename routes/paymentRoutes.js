import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import { paymentLimiter } from "../middleware/rateLimiter.js";
import {
  initiatePayment,
  handlePaymentCallback,
  getTransactionStatus
} from "../controller/paymentController.js";

const router = express.Router();

// 🔒 Payment Limiter: max 3 attempts per IP per 15 min (card-testing fraud protection)
router.post("/initiate", authMiddleware, allowRoles("OWNER"), paymentLimiter, initiatePayment);

// 2. Webhook Callback (Public, URL Encoded parser should be supported in server.js)
router.post("/webhook", express.urlencoded({ extended: true }), handlePaymentCallback);

// 3. Check status
router.get("/transactions/:transactionId/status", authMiddleware, getTransactionStatus);

export default router;
