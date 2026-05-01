// Test: Upload profile logo via multipart/form-data using node built-ins
import fs from "fs";
import path from "path";
import crypto from "crypto";

const BASE = "http://localhost:5000/api";

// Step 1: Login
const loginRes = await fetch(`${BASE}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "goexperts@admin", password: "Admin@1234" }),
});
const { token } = await loginRes.json();
console.log("Login:", loginRes.status === 200 ? "✅ OK" : "❌ Failed");

// Step 2: Build multipart body manually
const boundary = `----FormBoundary${crypto.randomBytes(8).toString("hex")}`;
const imagePath = "scratch/test.png";
const imageBuffer = fs.readFileSync(imagePath);
const filename = path.basename(imagePath);

const body = Buffer.concat([
  Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="profileLogo"; filename="${filename}"\r\nContent-Type: image/png\r\n\r\n`),
  imageBuffer,
  Buffer.from(`\r\n--${boundary}--\r\n`),
]);

const uploadRes = await fetch(`${BASE}/auth/upload-profile-logo`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": `multipart/form-data; boundary=${boundary}`,
    "Content-Length": body.length,
  },
  body,
});

const uploadData = await uploadRes.json();
console.log("Upload:", uploadRes.status === 200 ? "✅ OK" : `❌ Failed (${uploadRes.status})`, uploadData.message || JSON.stringify(uploadData));
if (uploadData.profileLogo) {
  console.log("  → Image URL:", uploadData.profileLogo);

  // Step 3: Verify the image URL is publicly accessible
  const imgRes = await fetch(uploadData.profileLogo);
  console.log("Image URL Accessible:", imgRes.status === 200 ? "✅ YES - Works!" : `❌ NO - Status ${imgRes.status}`);
}
