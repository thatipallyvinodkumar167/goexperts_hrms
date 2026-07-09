import admin from "firebase-admin";

let isFirebaseInitialized = false;

// Initialize Firebase Admin SDK once
// Add these vars to your .env file:
//   FIREBASE_PROJECT_ID=your-project-id
//   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxx@your-project.iam.gserviceaccount.com
//   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
      isFirebaseInitialized = true;
      console.log("🔥 Firebase Admin SDK initialized successfully.");
    } catch (error) {
      console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
    }
  } else {
    console.warn("⚠️ Firebase credentials missing in .env. FCM push notifications are disabled.");
  }
} else {
  isFirebaseInitialized = true;
}

export { isFirebaseInitialized };
export default admin;
