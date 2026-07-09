import admin, { isFirebaseInitialized } from "../config/firebase.js";

/**
 * Send a push notification to a single FCM token
 */
export const sendFCMToToken = async ({ token, title, body, data = {} }) => {
  if (!token) return { success: false, reason: "No FCM token" };
  
  if (!isFirebaseInitialized) {
    console.warn("FCM skipped: Firebase is not initialized.");
    return { success: false, reason: "Firebase not initialized" };
  }

  try {
    const response = await admin.messaging().send({
      token,
      notification: { title, body },
      data: {
        ...Object.fromEntries(
          Object.entries(data).map(([k, v]) => [k, String(v)])
        ),
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
      android: {
        priority: "high",
        notification: { sound: "default", channelId: "hrms_notifications" },
      },
      apns: {
        payload: { aps: { sound: "default", badge: 1 } },
      },
    });
    return { success: true, messageId: response };
  } catch (error) {
    // Token may be expired or invalid — silently log
    console.error(`FCM send failed for token ${token?.slice(0, 20)}...:`, error.message);
    return { success: false, reason: error.message };
  }
};

/**
 * Send a push notification to MULTIPLE FCM tokens (batch)
 * Returns { successCount, failureCount, results }
 */
export const sendFCMToMultipleTokens = async ({ tokens, title, body, data = {} }) => {
  const validTokens = tokens.filter(Boolean);
  if (!validTokens.length) return { successCount: 0, failureCount: 0, results: [] };

  if (!isFirebaseInitialized) {
    console.warn("FCM skipped: Firebase is not initialized.");
    return { successCount: 0, failureCount: validTokens.length, results: [] };
  }

  const message = {
    notification: { title, body },
    data: {
      ...Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
      click_action: "FLUTTER_NOTIFICATION_CLICK",
    },
    android: {
      priority: "high",
      notification: { sound: "default", channelId: "hrms_notifications" },
    },
    apns: {
      payload: { aps: { sound: "default", badge: 1 } },
    },
  };

  // Firebase allows max 500 tokens per batch
  const BATCH_SIZE = 500;
  let successCount = 0;
  let failureCount = 0;
  const results = [];

  for (let i = 0; i < validTokens.length; i += BATCH_SIZE) {
    const batch = validTokens.slice(i, i + BATCH_SIZE);
    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: batch,
        ...message,
      });
      successCount += response.successCount;
      failureCount += response.failureCount;
      results.push(...response.responses.map((r, idx) => ({
        token: batch[idx]?.slice(0, 20) + "...",
        success: r.success,
        error: r.error?.message || null,
      })));
    } catch (error) {
      console.error("FCM multicast batch failed:", error.message);
      failureCount += batch.length;
    }
  }

  return { successCount, failureCount, results };
};
