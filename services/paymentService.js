import prisma from "../config/db.js";
import { EZ } from "../config/easebuzz.js";
import crypto from "crypto";
import axios from "axios";

/**
 * Initiates a payment session with Easebuzz
 */
export const initiatePaymentSession = async ({ companyId, planId, customerName, customerEmail, customerPhone }) => {
  // 1. Fetch Subscription Plan to get the price
  const plan = await prisma.subscriptionPlan.findUnique({
    where: { id: planId }
  });

  if (!plan) {
    throw new Error("Subscription plan not found");
  }

  const amount = plan.price.toFixed(2);
  const txnId = "TXN_" + crypto.randomBytes(8).toString("hex").toUpperCase();

  // 2. Generate Hash
  const hash = EZ.generateRequestHash({
    txnid: txnId,
    amount,
    productinfo: plan.name,
    firstname: customerName,
    email: customerEmail,
    udf1: planId, // Pass plan ID in udf1
    udf2: companyId // Pass company ID in udf2
  });

  // 3. Prepare Easebuzz Initiate API Request
  const endpoint = `${EZ.apiUrl.replace(/\/$/, "")}/payment/initiate`;
  
  const formData = new URLSearchParams();
  formData.append("key", EZ.key);
  formData.append("txnid", txnId);
  formData.append("amount", amount);
  formData.append("productinfo", plan.name);
  formData.append("firstname", customerName);
  formData.append("email", customerEmail);
  formData.append("phone", customerPhone);
  formData.append("surl", `${process.env.FRONTEND_URL || "https://goexperts-hrms-coun.onrender.com"}/api/payments/webhook`);
  formData.append("furl", `${process.env.FRONTEND_URL || "https://goexperts-hrms-coun.onrender.com"}/api/payments/webhook`);
  formData.append("hash", hash);
  formData.append("udf1", planId);
  formData.append("udf2", companyId);

  // 4. Create local pending transaction
  // Temp accessKey before getting it from Easebuzz
  const tempAccessKey = `TEMP_${txnId}`;
  const transaction = await prisma.transaction.create({
    data: {
      companyId,
      planId,
      amount: parseFloat(amount),
      currency: "INR",
      txnId,
      accessKey: tempAccessKey,
      status: "PENDING",
      hash
    }
  });

  // 5. Call Easebuzz to fetch access_key
  try {
    const response = await axios.post(endpoint, formData.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    if (response.data && response.data.status === 1) {
      const accessKey = response.data.data;
      
      // Update transaction with actual access key
      const updatedTxn = await prisma.transaction.update({
        where: { id: transaction.id },
        data: { accessKey }
      });

      return {
        transactionId: updatedTxn.txnId,
        amount: updatedTxn.amount,
        currency: updatedTxn.currency,
        gatewayConfig: {
          accessKey,
          key: EZ.key,
          txnid: txnId,
          amount,
          productinfo: plan.name,
          firstname: customerName,
          email: customerEmail,
          phone: customerPhone,
          hash,
          surl: `${process.env.FRONTEND_URL || "https://goexperts-hrms-coun.onrender.com"}/api/payments/webhook`,
          furl: `${process.env.FRONTEND_URL || "https://goexperts-hrms-coun.onrender.com"}/api/payments/webhook`
        }
      };
    } else {
      // Cleanup transaction on failure
      await prisma.transaction.delete({ where: { id: transaction.id } });
      throw new Error(response.data.data || "Failed to retrieve access key from Easebuzz");
    }
  } catch (error) {
    // Cleanup transaction on failure
    try {
      await prisma.transaction.delete({ where: { id: transaction.id } });
    } catch (e) {}
    throw new Error(`Easebuzz Gateway Error: ${error.message}`);
  }
};

/**
 * Verifies webhook response and completes payment
 */
export const verifyAndCompletePayment = async (callbackData) => {
  // 1. Verify Hash
  const isValid = EZ.verifyResponseHash(callbackData);
  if (!isValid) {
    throw new Error("Invalid payment signature / hash mismatch");
  }

  const { txnid, status, udf1: planId, udf2: companyId } = callbackData;

  // 2. Fetch the transaction
  const txn = await prisma.transaction.findUnique({
    where: { txnId: txnid }
  });

  if (!txn) {
    throw new Error("Transaction not found");
  }

  // If already processed, ignore (prevent duplicate subscription extensions)
  if (txn.status !== "PENDING") {
    return txn;
  }

  // 3. Process subscription and transaction update inside a transaction block
  if (status === "success") {
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    });

    if (!plan) throw new Error("Plan not found");

    // Subscription Duration (Defaulting to 1 year/365 days unless specified differently)
    const durationDays = plan.durationDays || 365;

    await prisma.$transaction(async (tx) => {
      // Check if active subscription exists
      const activeSub = await tx.subscription.findFirst({
        where: {
          companyId,
          endDate: { gt: new Date() }
        },
        orderBy: { endDate: "desc" }
      });

      let startDate = new Date();
      let endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      // Extend subscription if one is active
      if (activeSub) {
        startDate = new Date(activeSub.endDate);
        endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
      }

      // Create new subscription entry
      await tx.subscription.create({
        data: {
          companyId,
          planId,
          startDate,
          endDate
        }
      });

      // Update Transaction to SUCCESS
      await tx.transaction.update({
        where: { id: txn.id },
        data: { status: "SUCCESS" }
      });
    });

    return { ...txn, status: "SUCCESS" };
  } else {
    // Update Transaction to FAILED
    const updated = await prisma.transaction.update({
      where: { id: txn.id },
      data: { status: "FAILED" }
    });
    return updated;
  }
};

/**
 * Gets transaction status
 */
export const fetchTransactionStatus = async (txnId, companyId) => {
  const transaction = await prisma.transaction.findFirst({
    where: {
      txnId,
      companyId
    },
    include: {
      plan: true
    }
  });

  if (!transaction) {
    throw new Error("Transaction not found");
  }

  return transaction;
};
