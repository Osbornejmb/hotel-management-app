const nodemailer = require('nodemailer');

let transporter;

const initializeTransporter = () => {
  try {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      console.error('❌ EMAIL_USER or EMAIL_PASSWORD not configured in .env');
      return null;
    }

    console.log('📧 Initializing transporter with email:', emailUser);

    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailUser,
        pass: emailPassword.trim() // Remove any spaces
      }
    });

    return transporter;
  } catch (error) {
    console.error('❌ Failed to initialize transporter:', error.message);
    return null;
  }
};

// Initialize on startup
transporter = initializeTransporter();

const sendEmployeeCredentials = async (employee) => {
  try {
    // Verify transporter is ready
    if (!transporter) {
      console.log('🔄 Reinitializing transporter...');
      transporter = initializeTransporter();
    }

    if (!transporter) {
      console.error('❌ Email transporter is not ready. Check your email configuration and credentials.');
      return { success: false, message: 'Email service not configured' };
    }

    const { email, username, id, password, name } = employee;

    if (!email || !username || !password) {
      console.error('❌ Missing required employee data for email:', { email, username, password });
      return { success: false, message: 'Missing employee data' };
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your Hotel Management System Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333;">Welcome to the Hotel Management System</h2>
            <p>Dear ${name || username},</p>
            <p>Your account has been successfully created. Below are your login credentials:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
              <p><strong>Employee ID:</strong> ${id}</p>
              <p><strong>Username:</strong> ${username}</p>
              <p><strong>Password:</strong> ${password}</p>
            </div>

            <p style="color: #666;">Please use these credentials to log in to the system at:</p>
            <p><strong><a href="https://hotel-management-app-s3.vercel.app/login" style="color: #007bff;">Login to System</a></strong></p>

            <p style="color: #999; font-size: 12px; margin-top: 20px;">
              <strong>Security Note:</strong> Please change your password after your first login for security purposes.
            </p>
          </div>
        </div>
      `
    };

    console.log('📤 Sending email to:', email);
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', info.messageId);
    return { success: true, message: 'Email sent successfully', messageId: info.messageId };

  } catch (error) {
    console.error('❌ Error sending email:', error.message);
    // Return error but don't throw - let the API still succeed
    return { success: false, message: `Email failed: ${error.message}` };
  }
};


// Test email function
const testEmail = async (testEmailAddress) => {
  try {
    if (!transporter) {
      transporter = initializeTransporter();
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: testEmailAddress,
      subject: 'Test Email - Hotel Management System',
      html: '<h1>Test Email</h1><p>If you received this, the email service is working correctly!</p>'
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully');
    return { success: true, message: 'Test email sent', messageId: info.messageId };
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
    return { success: false, message: `Test email failed: ${error.message}` };
  }
};

module.exports = { sendEmployeeCredentials, testEmail, initializeTransporter };