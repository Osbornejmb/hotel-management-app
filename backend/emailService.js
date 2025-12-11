const sgMail = require('@sendgrid/mail');

const senderEmail = process.env.SMTP_EMAIL || 'noreply@hotelmanagement.com';
const senderName = process.env.SENDER_NAME || "Hotel Management System";
const sendgridApiKey = process.env.SENDGRID_API_KEY;

if (!sendgridApiKey) {
  console.error('❌ SENDGRID_API_KEY missing in .env');
} else {
  sgMail.setApiKey(sendgridApiKey);
  console.log('✅ SendGrid API Key loaded');
}

//send employee credentials email
const sendEmployeeCredentials = async (employee) => {
  try {
    if (!sendgridApiKey) {
      return { success: false, message: "Email service not configured - missing SENDGRID_API_KEY" };
    }

    const { email, id, password, name } = employee;

    if (!email || !password) {
      return { success: false, message: "Missing employee data" };
    }

    console.log("📤 Sending email to:", email);

    const msg = {
      to: email,
      from: senderEmail,
      replyTo: senderEmail,
      subject: "Your Hotel Management System Account Created",
      html: `
        <div style="font-family: Arial; background:#f4f4f4; padding:20px;">
          <div style="max-width:600px; margin:auto; background:white; padding:20px; border-radius:5px;">
            <h2 style="color:#333;">Welcome to the Hotel Management System</h2>
            <p>Dear ${name || email},</p>
            <p>Your account has been successfully created. Below are your login credentials:</p>

            <div style="background:#f9f9f9; padding:15px; border-left:4px solid #007bff; margin:20px 0;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
            </div>

            <p>Please log in here:</p>
            <p><a href="https://hotel-management-app-s3.vercel.app/login" style="color:#007bff;"><strong>Login to System</strong></a></p>

            <p style="color:#888; font-size:12px;">Please change your password after first login.</p>
          </div>
        </div>
      `
    };

    const result = await sgMail.send(msg);
    
    console.log("✅ Email sent successfully!");
    console.log("Message ID:", result[0].headers['x-message-id']);
    return { success: true, message: "Email sent successfully" };

  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    console.error("Error details:", error.response?.body || error);
    
    // Provide helpful guidance
    let suggestion = "Email failed: " + error.message;
    if (error.code === 'ENOTFOUND') {
      suggestion += "\n💡 Check: Network connectivity to SendGrid";
    } else if (error.message.includes('Invalid email')) {
      suggestion += "\n💡 Check: Recipient email address is valid";
    } else if (error.message.includes('API Key')) {
      suggestion += "\n💡 Check: SENDGRID_API_KEY is correct and active";
    }
    
    return { success: false, message: suggestion };
  }
};

// Test email function (for debugging)
const testEmail = async (testEmailAddress) => {
  try {
    console.log("🧪 Testing email with:", testEmailAddress);
    const result = await sendEmployeeCredentials({
      email: testEmailAddress,
      password: "TestPassword123!",
      name: "Test User",
      id: "test"
    });
    return result;
  } catch (error) {
    console.error("Test email error:", error);
    return { success: false, message: error.message };
  }
};

module.exports = { sendEmployeeCredentials, testEmail };