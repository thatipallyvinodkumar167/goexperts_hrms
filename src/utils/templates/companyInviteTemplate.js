
export const companyInviteTemplate = (name, inviteLink) => {

    return ` <div style="font-family: Arial; padding: 20px;">
      <h2>Welcome to GoExperts HRMS 🚀</h2>  
       <p>Hello ${name},</p>

      <p>You have been invited to set up your company account.</p>

      <div style="background-color: #fff3cd; color: #856404; padding: 15px; border-radius: 5px; margin: 20px 0; border: 1px solid #ffeeba;">
        <h4 style="margin-top: 0;">📱 IMPORTANT: Please install our App first!</h4>
        <p style="margin-bottom: 0;">This activation link requires the GoExperts HRMS mobile app. Please download and install our app from the Play Store/App Store before clicking the link below.</p>
      </div>

      <p>Once the app is installed, click below to activate your account and set your password:</p>

      <div style="margin: 30px 0;">
        <a href="${inviteLink}" 
           style="background:#4CAF50;color:white;padding:12px 25px;text-decoration:none;border-radius:5px;font-weight:bold;">
           Activate Account in App
        </a>
      </div>

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