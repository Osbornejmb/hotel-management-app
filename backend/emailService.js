const nodemailer = require('nodemailer');

// Check for required environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.warn('⚠️ EMAIL_USER or EMAIL_PASSWORD environment variables are missing.');
  if (!process.env.EMAIL_USER) console.warn('EMAIL_USER is missing.');
  if (!process.env.EMAIL_PASSWORD) console.warn('EMAIL_PASSWORD is missing.');
}

let transporter;
try {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  console.log('✅ Nodemailer transporter created.');
} catch (err) {
  console.error('❌ Failed to create transporter:', err && err.message ? err.message : err);
}

// Verify transporter before sending emails   
const verifyTransporter = async () => {
  if (!transporter) {
    console.error('❌ Transporter is not defined.');
    return false;
  }
  try {
    await transporter.verify();
    console.log('✅ Transporter verified and ready.');
    return true;
  } catch (err) {
    console.error('❌ Transporter verification failed:', err && err.message ? err.message : err);
    return false;
  }
};

// Test email function
const testEmail = async () => {
  console.log('🧪 Testing email configuration...');
  console.log('EMAIL_USER exists:', !!process.env.EMAIL_USER);
  
  if (!transporter) {
    console.log('❌ Transporter not created');
    return false;
  }
  
  try {
    await transporter.verify();
    console.log('✅ Transporter verification passed');
    
    // Try sending a test email to yourself
    const testMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'Test Email from Hotel System',
      text: 'This is a test email from your hotel management system.',
      html: '<p>This is a <strong>test email</strong> from your hotel management system.</p>'
    };
    
    const info = await transporter.sendMail(testMailOptions);
    console.log('✅ Test email sent successfully!');
    console.log(`📧 Message ID: ${info.messageId}`);
    return true;
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
};

// Email template for employee credentials
const sendEmployeeCredentials = async (employeeData) => {
  const { email, name, username, password, employeeId } = employeeData;

  // Validate required fields
  if (!email || !name) {
    return { success: false, error: 'Email and name are required' };
  }

  // Check if environment variables are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email credentials not configured');
    return { 
      success: false, 
      error: 'Email service not configured. Please check environment variables.' 
    };
  }

  // Check transporter before sending
  const isTransporterReady = await verifyTransporter();
  if (!isTransporterReady) {
    return { success: false, error: 'Email transporter is not ready. Check your email configuration and credentials.' };
  }

  const mailOptions = {
    from: `"Hotel Management System" <${process.env.EMAIL_USER}>`,
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
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Credentials email sent to ${email}`);
    console.log(`📧 Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Error sending email:', error && error.message ? error.message : error);
    
    // More specific error messages
    let userFriendlyError = 'Failed to send email. Please try again.';
    
    if (error.code === 'EAUTH') {
      userFriendlyError = 'Email authentication failed. Please check email credentials (use App Password, not regular password).';
    } else if (error.code === 'EENVELOPE') {
      userFriendlyError = 'Invalid email address. Please check the recipient email.';
    } else if (error.code === 'ECONNECTION') {
      userFriendlyError = 'Cannot connect to email service. Please check your internet connection.';
    }
    
    return { 
      success: false, 
      error: userFriendlyError,
      technicalError: error.message 
    };
  }
};

module.exports = {
  sendEmployeeCredentials,
  testEmail,
  verifyTransporter
};