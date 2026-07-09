import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { allowRoles } from "../middleware/roleMiddleware.js";
import {
  initiatePayment,
  handlePaymentCallback,
  getTransactionStatus
} from "../controller/paymentController.js";

const router = express.Router();

// 1. Initiate Payment (OWNER only)
router.post("/initiate", authMiddleware, allowRoles("OWNER"), initiatePayment);

// 2. Webhook Callback (Public, URL Encoded parser should be supported in server.js)
router.post("/webhook", express.urlencoded({ extended: true }), handlePaymentCallback);

// 3. Check status
router.get("/transactions/:transactionId/status", authMiddleware, getTransactionStatus);

export default router;
