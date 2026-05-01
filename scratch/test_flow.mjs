// Using global fetch (Node 18+ built-in)

const BASE = "http://localhost:5000/api";

// ─── helpers ────────────────────────────────────────
const log = (label, res, body) => {
  const ok = res.status < 300 ? "✅" : "❌";
  console.log(`\n${ok} [${res.status}] ${label}`);
  console.log("   →", JSON.stringify(body).slice(0, 200));
};

// ─── SUPER ADMIN LOGIN ───────────────────────────────
async function superAdminLogin() {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "goexperts@admin", password: "Admin@1234" }),
  });
  const body = await res.json();
  log("Super Admin Login", res, body);
  return body.token;
}

// ─── CREATE COMPANY ──────────────────────────────────
async function createCompany(adminToken) {
  const ts = Date.now();
  const res = await fetch(`${BASE}/company/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({
      name: `FlowTest Corp ${ts}`,
      email: `flowtest${ts}@testco.com`,
      ownerName: "Test Owner",
      location: "Hyderabad",
    }),
  });
  const body = await res.json();
  log("Create Company", res, body);
  return { inviteToken: body.inviteToken, companyEmail: `flowtest${ts}@testco.com` };
}

// ─── SETUP ACCOUNT ───────────────────────────────────
async function setupAccount(token) {
  const res = await fetch(`${BASE}/company/setup-account`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password: "Test@1234" }),
  });
  const body = await res.json();
  log("Setup Account", res, body);
  return body;
}

// ─── OWNER LOGIN ─────────────────────────────────────
async function ownerLogin(email) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "Test@1234" }),
  });
  const body = await res.json();
  log("Owner Login", res, body);
  return body;
}

// ─── TRY ADD EMPLOYEE (should be blocked) ────────────
async function tryAddEmployee(ownerToken, label) {
  const res = await fetch(`${BASE}/employee/create`, {  // singular: /employee
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ownerToken}` },
    body: JSON.stringify({ name: "Test Emp", email: "emp@test.com", role: "EMPLOYEE" }),
  });
  let body;
  const text = await res.text();
  try { body = JSON.parse(text); } catch { body = { raw: text.slice(0, 100) }; }
  log(`Add Employee (${label})`, res, body);
  return body;
}

// ─── ACTIVATE COMPANY ────────────────────────────────
async function activateCompany(adminToken, companyId) {
  const res = await fetch(`${BASE}/company/activate/${companyId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
  });
  const body = await res.json();
  log("Activate Company (Super Admin)", res, body);
}

// ─── TEST SUSPENDED COMPANY ──────────────────────────
async function testSuspended(adminToken, ownerToken, companyId) {
  // Manually suspend the company
  console.log("\n\n🔴 Manually suspending company to test SUSPENDED guard...");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  await prisma.company.update({ where: { id: companyId }, data: { status: "SUSPENDED" } });
  await prisma.$disconnect();

  await tryAddEmployee(ownerToken, "SUSPENDED - should be blocked");
}

// ─── TEST SUBSCRIPTION EXPIRED ───────────────────────
async function testExpiredSub(adminToken, ownerToken, companyId) {
  console.log("\n\n⏰ Setting subscription endDate to past to simulate expiry...");
  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();
  // Reactivate first
  await prisma.company.update({ where: { id: companyId }, data: { status: "ACTIVE" } });
  // Expire the subscription
  await prisma.subscription.updateMany({
    where: { companyId },
    data: { endDate: new Date("2020-01-01") },
  });
  await prisma.$disconnect();

  await tryAddEmployee(ownerToken, "SUBSCRIPTION EXPIRED - should be blocked");
}

// ─── RUN ALL TESTS ───────────────────────────────────
async function runTests() {
  console.log("═══════════════════════════════════════");
  console.log("  HRMS BUSINESS FLOW - AUTOMATED TEST  ");
  console.log("═══════════════════════════════════════");

  try {
    const adminToken = await superAdminLogin();
    if (!adminToken) return console.log("❌ Cannot proceed without admin token.");

    const { inviteToken, companyEmail } = await createCompany(adminToken);
    if (!inviteToken) return console.log("❌ No inviteToken in response.");

    await setupAccount(inviteToken);

    const loginData = await ownerLogin(companyEmail);
    const ownerToken = loginData.token;
    const companyId = loginData.user?.companyId;

    console.log(`\n📌 Company Status after setup: ${loginData.user?.companyStatus}`);

    await tryAddEmployee(ownerToken, "PENDING_APPROVAL - should be blocked");

    await activateCompany(adminToken, companyId);

    await tryAddEmployee(ownerToken, "ACTIVE with subscription - should succeed or fail on validation");

    await testSuspended(adminToken, ownerToken, companyId);
    await testExpiredSub(adminToken, ownerToken, companyId);

    console.log("\n\n═══════════════════════════════════════");
    console.log("        ALL TESTS COMPLETE              ");
    console.log("═══════════════════════════════════════");
  } catch (err) {
    console.error("💥 Test crashed:", err.message);
  }
}

runTests();
