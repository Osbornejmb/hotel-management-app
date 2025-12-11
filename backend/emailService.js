const nodemailer = require('nodemailer');

const senderEmail = process.env.SMTP_EMAIL;
const senderPassword = process.env.SMTP_PASSWORD;
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = process.env.SMTP_PORT || 587;
const senderName = process.env.SENDER_NAME || "Hotel Management System";

if (!senderEmail || !senderPassword) {
  console.error('❌ SMTP credentials missing in .env');
}

// Create transporter with improved settings
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for other ports
  auth: {
    user: senderEmail,
    pass: senderPassword
  },
  tls: {
    rejectUnauthorized: false // Allow self-signed certificates
  }
});

// Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Error:', error);
  } else {
    console.log('✅ SMTP Server Ready');
  }
});

//send employee credentials email
const sendEmployeeCredentials = async (employee) => {
  try {
    if (!senderEmail || !senderPassword) {
      return { success: false, message: "Email service not configured" };
    }

    const { email, id, password, name } = employee;

    if (!email || !password) {
      return { success: false, message: "Missing employee data" };
    }

    console.log("📤 Sending email to:", email);

    const mailOptions = {
      from: `${senderName} <${senderEmail}>`,
      to: email,
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

    const info = await transporter.sendMail(mailOptions);
    
    console.log("✅ Email sent successfully!");
    console.log("Response:", info.response);
    console.log("Message ID:", info.messageId);
    return { success: true, message: "Email sent successfully" };

  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    console.error("Error details:", error);
    return { success: false, message: "Email failed: " + error.message };
  }
};

// Test email function (for debugging)
const testEmail = async (testEmail) => {
  try {
    console.log("🧪 Testing email with:", testEmail);
    const result = await sendEmployeeCredentials({
      email: testEmail,
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