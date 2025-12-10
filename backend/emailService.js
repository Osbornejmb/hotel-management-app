const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;

if (!resendApiKey || !resendFromEmail) {
  console.error('❌ RESEND_API_KEY or RESEND_FROM_EMAIL not configured in .env');
}

const resend = new Resend(resendApiKey);

const sendEmployeeCredentials = async (employee) => {
  try {
    if (!resendApiKey || !resendFromEmail) {
      console.error('❌ Resend is not configured. Check your environment variables.');
      return { success: false, message: 'Email service not configured' };
    }

    const { email, id, password, name } = employee;

    if (!email || !password) {
      console.error('❌ Missing required employee data for email:', { email, password });
      return { success: false, message: 'Missing employee data' };
    }

    console.log('📤 Sending email to:', email);
    const { data, error } = await resend.emails.send({
      from: resendFromEmail,
      to: email,
      subject: 'Your Hotel Management System Account Created',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 20px; border-radius: 5px;">
            <h2 style="color: #333;">Welcome to the Hotel Management System</h2>
            <p>Dear ${name || email},</p>
            <p>Your account has been successfully created. Below are your login credentials:</p>
            
            <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
              <p><strong>Employee ID:</strong> ${id}</p>
              <p><strong>Email:</strong> ${email}</p>
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
    });

    if (error) {
      console.error('❌ Error sending email:', error.message);
      return { success: false, message: `Email failed: ${error.message}` };
    }

    console.log('✅ Email sent successfully:', data.id);
    return { success: true, message: 'Email sent successfully', messageId: data.id };

  } catch (error) {
    console.error('❌ Unexpected error sending email:', error.message);
    return { success: false, message: `Email failed: ${error.message}` };
  }
};

const testEmail = async (testEmailAddress) => {
  try {
    if (!resendApiKey || !resendFromEmail) {
      console.error('❌ Resend is not configured. Check your environment variables.');
      return { success: false, message: 'Email service not configured' };
    }

    const { data, error } = await resend.emails.send({
      from: resendFromEmail,
      to: testEmailAddress,
      subject: 'Test Email - Hotel Management System',
      html: '<h1>Test Email</h1><p>If you received this, the email service is working correctly!</p>'
    });

    if (error) {
      console.error('❌ Test email failed:', error.message);
      return { success: false, message: `Test email failed: ${error.message}` };
    }
    
    console.log('✅ Test email sent successfully:', data.id);
    return { success: true, message: 'Test email sent', messageId: data.id };

  } catch (error) {
    console.error('❌ Unexpected error during test email:', error.message);
    return { success: false, message: `Test email failed: ${error.message}` };
  }
};

// If other files import it, you might need to export an empty function or update those files.


module.exports = { sendEmployeeCredentials, testEmail };
