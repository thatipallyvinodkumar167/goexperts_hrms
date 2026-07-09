
export const inviteReminderTemplate = (name, inviteLink) => {

    return ` <div style="font-family: Arial; padding: 20px;">
      <h2>Action Required: Account Setup Reminder ⏳</h2>  
       <p>Hello ${name},</p>

      <p>This is a friendly reminder to complete your company account setup on <strong>GoExperts HRMS</strong>.</p>

      <p>Your invitation link is set to expire in approximately <strong>10 hours</strong>. Please complete the setup now to avoid needing a new invitation.</p>

      <p>Click below to activate your account:</p>

      <a href="${inviteLink}" 
         style="background:#FF9800;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;font-weight:bold;">
         Complete Setup Now
      </a>

      <p style="color: #666; font-size: 12px;">
        If this link has expired, please contact our support team at 
        <strong>support@goexperts.com</strong> to request a new invitation.
      </p> 

      <br/>
      <p>Regards,<br/>GoExperts Team</p>
    </div>
  `;
};
