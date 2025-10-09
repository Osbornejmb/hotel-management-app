const nodemailer = require('nodemailer');

// FIX: Changed createTransporter to createTransport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Email template for employee credentials
const sendEmployeeCredentials = async (employeeData) => {
  const { email, name, username, password, employeeId } = employeeData;

  // Validate required fields
  if (!email || !name) {
    return { success: false, error: 'Email and name are required' };
  }

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your Employee Account Credentials',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { background: #f8fafc; padding: 20px; border-radius: 0 0 8px 8px; }
          .credentials { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .credential-item { margin: 10px 0; }
          .label { font-weight: bold; color: #374151; }
          .warning { background: #fef3c7; padding: 10px; border-radius: 4px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Our Team!</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your employee account has been created successfully. Here are your login credentials:</p>
            
            <div class="credentials">
              <div class="credential-item">
                <span class="label">Employee ID:</span> ${employeeId}
              </div>
              <div class="credential-item">
                <span class="label">Username:</span> ${username}
              </div>
              <div class="credential-item">
                <span class="label">Password:</span> ${password}
              </div>
            </div>

            <div class="warning">
              <strong>Important:</strong> For security reasons, please change your password after your first login.
            </div>

            <p>You can access the system at: <a href="${process.env.APP_URL || 'http://localhost:3000'}">${process.env.APP_URL || 'http://localhost:3000'}</a></p>
            
            <div class="footer">
              <p>If you have any questions, please contact the HR department.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Credentials email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendEmployeeCredentials,
};