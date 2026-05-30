export const companyActivationTemplate = (ownerName, companyName, loginLink, industryName) => {
  let industryBullets = "";
  const nameLower = (industryName || "").toLowerCase();

  if (nameLower.includes("software") || nameLower.includes("it") || nameLower.includes("information technology")) {
    industryBullets = `
      <li>Invite your developers, designers, and project managers.</li>
      <li>Configure engineering departments, agile squads, and tech roles.</li>
      <li>Set up hybrid/remote work models and flexible developer shifts.</li>
      <li>Track sprint-based attendance and software team logs.</li>
    `;
  } else if (nameLower.includes("medical") || nameLower.includes("healthcare") || nameLower.includes("hospital")) {
    industryBullets = `
      <li>Invite your doctors, nursing staff, and medical assistants.</li>
      <li>Define clinical departments, ward units, and healthcare roles.</li>
      <li>Create complex rotational shifts for 24/7 hospital duty coverage.</li>
      <li>Manage healthcare leaves, compliance, and emergency contact registries.</li>
    `;
  } else if (nameLower.includes("finance") || nameLower.includes("banking") || nameLower.includes("insurance")) {
    industryBullets = `
      <li>Invite your accountants, auditors, and financial advisors.</li>
      <li>Define finance departments, advisory teams, and branch designations.</li>
      <li>Configure payroll structures, EPF/ESI statutory deductions, and tax compliance.</li>
      <li>Track secure attendance across your brick-and-mortar branches.</li>
    `;
  } else if (nameLower.includes("manufacturing") || nameLower.includes("automotive") || nameLower.includes("factory")) {
    industryBullets = `
      <li>Invite your factory managers, engineers, and assembly line workers.</li>
      <li>Set up plant divisions, factory lines, and operational designations.</li>
      <li>Set up multi-shift rosters (morning, evening, and night shift rotations).</li>
      <li>Track assembly-floor attendance and warehouse shift logs.</li>
    `;
  } else if (nameLower.includes("legal") || nameLower.includes("consulting") || nameLower.includes("advisory")) {
    industryBullets = `
      <li>Invite your attorneys, consultants, and legal assistants.</li>
      <li>Define practice groups, advisory teams, and professional roles.</li>
      <li>Enable billable hours configuration, timesheets, and client logs.</li>
      <li>Manage professional leave cycles and standard client consulting terms.</li>
    `;
  } else if (nameLower.includes("robotics") || nameLower.includes("ai") || nameLower.includes("artificial")) {
    industryBullets = `
      <li>Invite your robotics engineers, AI researchers, and technical staff.</li>
      <li>Define R&D divisions, hardware lab teams, and research designations.</li>
      <li>Configure flexible shift cycles and hardware laboratory access logs.</li>
      <li>Manage technical leave structures and daily clock-in validations.</li>
    `;
  } else {
    // Default fallback
    industryBullets = `
      <li>Add and invite your HRs, managers, and employee teams.</li>
      <li>Set up your company departments, designations, and leave rules.</li>
      <li>Configure employee shifts and start tracking real-time attendance.</li>
      <li>Manage payroll settings, employee directories, and daily logs.</li>
    `;
  }

  const industryTag = industryName 
    ? `<span style="background-color: #E0F2FE; color: #0369A1; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-left: 8px;">${industryName}</span>` 
    : "";

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #10B981; margin: 0; font-size: 28px;">🎉 Company Activated!</h2>
        <p style="color: #4B5563; font-size: 16px; margin-top: 8px;">Welcome to GoExperts HRMS family</p>
      </div>

      <p style="font-size: 16px; color: #1F2937; line-height: 1.6;">Hello <strong>${ownerName}</strong>,</p>
      
      <p style="font-size: 15px; color: #4B5563; line-height: 1.6;">
        We are thrilled to inform you that your company, <strong>${companyName}</strong> ${industryTag}, has been successfully approved and activated by our admin team!
      </p>

      <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #065F46; font-size: 16px;">🚀 Customized steps for your industry:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 14px; line-height: 1.6;">
          ${industryBullets}
        </ul>
      </div>

      <p style="font-size: 15px; color: #4B5563; line-height: 1.6;">
        You can now log in to your dashboard to begin setting up your workplace:
      </p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${loginLink}" 
           style="background-color: #10B981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.2);">
           Go to Dashboard
        </a>
      </div>

      <hr style="border: 0; border-top: 1px solid #E5E7EB; margin: 32px 0;" />
      
      <p style="color: #9CA3AF; font-size: 12px; line-height: 1.5; text-align: center;">
        If you have any questions or need onboarding assistance, feel free to reply to this email or reach out to us at <strong>support@goexperts.com</strong>.
      </p>

      <p style="color: #4B5563; font-size: 14px; font-weight: bold; margin-top: 24px; text-align: center;">
        Best Regards,<br/>
        <span style="color: #10B981;">GoExperts HRMS Team</span>
      </p>
    </div>
  `;
};
