export const companyActivationTemplate = (ownerName, companyName, loginLink) => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #10B981; margin: 0; font-size: 28px;">🎉 Company Activated!</h2>
        <p style="color: #4B5563; font-size: 16px; margin-top: 8px;">Welcome to GoExperts HRMS family</p>
      </div>

      <p style="font-size: 16px; color: #1F2937; line-height: 1.6;">Hello <strong>${ownerName}</strong>,</p>
      
      <p style="font-size: 15px; color: #4B5563; line-height: 1.6;">
        We are thrilled to inform you that your company, <strong>${companyName}</strong>, has been successfully approved and activated by our admin team!
      </p>

      <div style="background-color: #ECFDF5; border-left: 4px solid #10B981; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <h4 style="margin: 0 0 8px 0; color: #065F46; font-size: 16px;">🚀 What you can do now:</h4>
        <ul style="margin: 0; padding-left: 20px; color: #047857; font-size: 14px; line-height: 1.6;">
          <li>Add and invite your HRs, Managers, and Employees.</li>
          <li>Set up departments, designations, and leave policies.</li>
          <li>Configure employee shifts and start tracking real-time attendance.</li>
          <li>Run payroll and manage employee directory.</li>
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
