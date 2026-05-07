import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Professional System Policies...");

  const policies = [
    {
      type: "TERMS_AND_CONDITIONS",
      version: "1.0.0",
      content: `
        <h1>Terms and Conditions</h1>
        <p>Welcome to GoExperts HRMS. By using our platform, you agree to the following terms:</p>
        
        <h3>1. Services Provided</h3>
        <p>GoExperts provides a cloud-based Human Resource Management System (HRMS) for company management, payroll, and employee onboarding.</p>

        <h3>2. Data Ownership</h3>
        <p>All employee data uploaded by the Company remains the exclusive property of the Company. GoExperts acts as a data processor.</p>

        <h3>3. User Responsibilities</h3>
        <p>Users are responsible for maintaining the confidentiality of their login credentials and for all activities that occur under their account.</p>

        <h3>4. Limitation of Liability</h3>
        <p>GoExperts shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use the service.</p>

        <h3>5. Termination</h3>
        <p>Either party may terminate the service agreement with a 30-day notice period as per the subscription plan.</p>
      `
    },
    {
      type: "PRIVACY_POLICY",
      version: "1.0.0",
      content: `
        <h1>Privacy Policy</h1>
        <p>At GoExperts, we prioritize the security and privacy of your data.</p>

        <h3>1. Data Collection</h3>
        <p>We collect minimal personal information required for HR operations, including names, emails, and employment details.</p>

        <h3>2. Data Security</h3>
        <p>All data is encrypted at rest using AES-256 and in transit using TLS 1.2+. We follow industry-standard security protocols.</p>

        <h3>3. Cookies</h3>
        <p>We use essential cookies to maintain user sessions and improve platform performance.</p>

        <h3>4. Data Sharing</h3>
        <p>We do NOT sell or share your personal data with third-party advertisers. Data is only shared with authorized service providers (e.g., SMTP for emails).</p>

        <h3>5. Your Rights</h3>
        <p>Users have the right to access, correct, or request deletion of their personal data in accordance with local data protection laws.</p>
      `
    }
  ];

  for (const policy of policies) {
    await prisma.systemPolicy.upsert({
      where: { type: policy.type },
      update: { content: policy.content, version: policy.version },
      create: { type: policy.type, content: policy.content, version: policy.version }
    });
    console.log(`✅ Seeded Policy: ${policy.type}`);
  }

  console.log("\n🚀 System Policies Seeded Successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
