// Test: Update Super Admin Profile Logo

const BASE = "http://localhost:5000/api";

// Step 1: Login as Super Admin
const loginRes = await fetch(`${BASE}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "goexperts@admin", password: "Admin@1234" }),
});
const loginData = await loginRes.json();
const token = loginData.token;
console.log("Login:", loginRes.status === 200 ? "✅ OK" : "❌ Failed", loginData.message);

// Step 2: Update profile with an HTTPS logo URL
const updateRes = await fetch(`${BASE}/auth/update-profile`, {
  method: "PUT",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({
    name: "GoExperts Admin",
    profileLogo: "https://cdn.example.com/logo.png"
  }),
});
const updateData = await updateRes.json();
console.log("Update Profile:", updateRes.status === 200 ? "✅ OK" : "❌ Failed", updateData.message || updateData);
if (updateData.user) {
  console.log("  → profileLogo saved:", updateData.user.profileLogo);
}
