
export const companyInviteTemplate = (name, inviteLink) => {

    return ` <div style="font-family: Arial; padding: 20px;">
      <h2>Welcome to GoExperts HRMS 🚀</h2>  
       <p>Hello ${name},</p>

      <p>You have been invited to join your company account.</p>

      <p>Click below to activate your account:</p>

      <a href="${inviteLink}" 
         style="background:#4CAF50;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">
         Activate Account
      </a>

      <p>This link will expire in 24 hours.</p>
      <p style="color: #666; font-size: 12px;">
        If this link has expired, please contact our support team at 
        <strong>support@goexperts.com</strong> to request a new invitation.
      </p>

      <br/>
      <p>Regards,<br/>GoExperts Team</p>
    </div>
  `;
};