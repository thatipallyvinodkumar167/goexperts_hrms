export const subscriptionReminderTemplate = (ownerName, companyName, planName, daysRemaining, expirationDate) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="text-align: center; padding: 20px;">
        <img src="cid:companylogo" alt="GoExperts Logo" style="max-height: 50px;">
      </div>
      
      <h2 style="color: #2c3e50;">Subscription Expiring Soon!</h2>
      
      <p>Hello <strong>${ownerName || 'Valued Customer'}</strong>,</p>
      
      <p>This is a friendly reminder that your company's (<strong>${companyName}</strong>) subscription for the <strong>${planName}</strong> plan is set to expire in exactly <strong>${daysRemaining} days</strong> (on ${expirationDate}).</p>
      
      <p>To ensure uninterrupted access to the GoExperts HRMS platform and avoid any data access issues for your team, please make sure your subscription is renewed before it expires.</p>

      <p>If you have any questions or need assistance, feel free to reply to this email.</p>
      
      <p>Best regards,<br>The GoExperts Team</p>
    </div>
  `;
};
