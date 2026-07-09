export const resetPasswordTemplate = (name, resetLink) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <title>Reset Password</title>
  </head>
  <body style="margin:0; padding:0; font-family: Arial, sans-serif; background:#f4f6f8;">
    
    <table width="100%" bgcolor="#f4f6f8" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">

          <table width="600" bgcolor="#ffffff" cellpadding="20" cellspacing="0" style="margin-top:40px; border-radius:8px;">
            
            <!-- Header -->
            <tr>
              <td align="center" style="background:#4f46e5; color:#ffffff; border-radius:8px 8px 0 0;">
                <h2>HRMS Platform</h2>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td>
                <h3>Hello ${name},</h3>

                <p>
                  We received a request to reset your password. Click the button below to reset it.
                </p>

                <div style="text-align:center; margin:30px 0;">
                  <a href="${resetLink}" 
                     style="background:#4f46e5; color:#ffffff; padding:12px 20px; text-decoration:none; border-radius:5px;">
                    Reset Password
                  </a>
                </div>

                <p>
                  This link will expire in <strong>15 minutes</strong>.
                </p>

                <p>
                  If you did not request this, you can safely ignore this email.
                </p>

                <hr />

                <p style="font-size:12px; color:#888;">
                  If the button doesn't work, copy and paste this link:
                  <br/>
                  ${resetLink}
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="font-size:12px; color:#999;">
                © ${new Date().getFullYear()} HRMS SaaS. All rights reserved.
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;
};
