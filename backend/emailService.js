const nodemailer = require('nodemailer');

const senderEmail = process.env.SMTP_EMAIL;
const senderPassword = process.env.SMTP_PASSWORD;
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = process.env.SMTP_PORT || 587;
const senderName = process.env.SENDER_NAME || "Hotel Management System";

if (!senderEmail || !senderPassword) {
  console.error('❌ SMTP credentials missing in .env');
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for other ports
  auth: {
    user: senderEmail,
    pass: senderPassword
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
    
    console.log("✅ Email sent:", info.response);
    return { success: true, message: "Email sent successfully" };

  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, message: "Email failed: " + error.message };
  }
};

module.exports = { sendEmployeeCredentials };