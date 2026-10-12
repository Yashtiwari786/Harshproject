const nodemailer = require('nodemailer');

/**
 * Configure Nodemailer Transporter
 * Supports Gmail with App Password, or standard SMTP.
 */
const createTransporter = () => {
  const gmailUser = process.env.GMAIL_USER || (process.env.SMTP_USER && process.env.SMTP_USER.includes('@gmail.com') ? process.env.SMTP_USER : null);
  const gmailAppPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASSWORD;

  // 1. Direct Gmail Configuration (Preferred when app password provided)
  if (gmailUser && gmailAppPass) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPass.replace(/\s+/g, ''), // Clean any pasted spaces
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  // 2. Standard Custom SMTP Configuration
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  return null;
};

const transporter = createTransporter();

// Check transporter on startup (skipped on Vercel to avoid cold-start latency)
if (transporter && process.env.VERCEL !== '1') {
  transporter.verify((error) => {
    if (error) {
      console.warn(`[Nodemailer Notice] Transporter configured but verify returned: ${error.message}`);
      console.info(`[Nodemailer Tip] For Gmail, ensure you use a 16-character Google App Password (not your normal password).`);
    } else {
      console.log(`[Nodemailer Ready] ✅ Live email transport connected and ready to send OTP emails.`);
    }
  });
} else if (!transporter) {
  console.info(`[Nodemailer Info] No Gmail App Password or SMTP set in .env. Emails & OTPs will log to the terminal console during development.`);
}

/**
 * Send an email with fallback to development console logger
 */
const sendEmail = async ({ to, subject, html, text }) => {
  const fromEmail = process.env.GMAIL_USER || process.env.FROM_EMAIL || 'noreply@college.edu';
  const fromName = 'Lost2Found Campus';

  if (!transporter) {
    console.log(`\n╔════════════════════════════════════════════════════════════════════════════════╗`);
    console.log(`║ 📧 [DEV EMAIL SIMULATOR]                                                       ║`);
    console.log(`║ TO:      ${to.padEnd(68)} ║`);
    console.log(`║ SUBJECT: ${subject.padEnd(68)} ║`);
    console.log(`╟────────────────────────────────────────────────────────────────────────────────╢`);
    console.log(text || html.replace(/<[^>]*>?/gm, ' '));
    console.log(`╚════════════════════════════════════════════════════════════════════════════════╝\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>?/gm, ' '),
      html,
    });
    console.log(`[Email Sent] ✅ Live email successfully delivered to ${to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Email Error] Failed to send email to ${to}:`, error.message);
    // Even if sending fails (e.g. invalid app pass), log to console so testing is never blocked
    console.log(`[Fallback Terminal Notice] Email content for ${to}:\n${text || html}`);
    return { success: false, error: error.message };
  }
};

/**
 * Send OTP Verification Email with modern responsive HTML styling
 */
const sendOTPEmail = async (email, otpCode) => {
  const subject = `🔐 ${otpCode} is your Lost2Found Verification Code`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #4f46e5 0%, #312e81 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
        .header h1 { margin: 0 0 6px 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }
        .header p { margin: 0; opacity: 0.85; font-size: 14px; }
        .body { padding: 32px 28px; }
        .greeting { font-size: 16px; color: #1e293b; margin-bottom: 16px; font-weight: 600; }
        .text { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
        .otp-container { background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4f46e5; margin: 0; }
        .otp-note { font-size: 12px; color: #94a3b8; margin-top: 8px; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>Lost2Found</h1>
          <p>Campus Lost & Found Verification</p>
        </div>
        <div class="body">
          <div class="greeting">Hello,</div>
          <div class="text">
            Thank you for registering with <strong>Lost2Found</strong>. Please enter the one-time verification code below to verify your college email and activate your account:
          </div>
          <div class="otp-container">
            <div class="otp-code">${otpCode}</div>
            <div class="otp-note">Valid for 10 minutes • Do not share this code</div>
          </div>
          <div class="text">
            If you did not request this verification code, you can safely ignore this email.
          </div>
        </div>
        <div class="footer">
          © 2026 Lost2Found Campus Management System. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({ to: email, subject, html, text: `Your Lost2Found verification code is: ${otpCode}. It expires in 10 minutes.` });
};

/**
 * Send Handover Approval Email with Verification Code
 */
const sendHandoverEmail = async (email, claimantName, itemTitle, handoverCode, location) => {
  const subject = `🎉 Claim Approved! Handover Code: ${handoverCode}`;
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
        .card { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
        .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; padding: 32px 24px; text-align: center; }
        .body { padding: 32px 28px; }
        .code-box { background: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
        .code { font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #047857; margin: 0; }
        .instructions { background: #f8fafc; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 13px; color: #475569; }
        .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1 style="margin:0 0 6px 0; font-size:24px;">Claim Approved! 🎉</h1>
          <p style="margin:0; opacity:0.9; font-size:14px;">Your ownership has been verified</p>
        </div>
        <div class="body">
          <p style="font-size:15px; color:#1e293b;">Dear <strong>${claimantName}</strong>,</p>
          <p style="font-size:14px; color:#64748b; line-height:1.6;">
            Your ownership claim for <strong>"${itemTitle}"</strong> was approved by campus security/staff.
          </p>
          <div class="code-box">
            <div style="font-size:12px; color:#065f46; font-weight:700; text-transform:uppercase; margin-bottom:4px;">Handover Verification Code</div>
            <div class="code">${handoverCode}</div>
          </div>
          <div class="instructions">
            <strong style="display:block; margin-bottom:8px; color:#1e293b;">Collection Steps:</strong>
            1. Visit collection point: <strong>${location || 'Campus Security Office'}</strong><br>
            2. Bring your official physical Student / College ID card.<br>
            3. Present the verification code <strong>${handoverCode}</strong> to complete the handover.
          </div>
        </div>
        <div class="footer">
          © 2026 Lost2Found Campus System
        </div>
      </div>
    </body>
    </html>
  `;
  return sendEmail({
    to: email,
    subject,
    html,
    text: `Your claim for "${itemTitle}" was approved! Your handover code is ${handoverCode}. Collect at ${location || 'Campus Security Office'} with your student ID.`,
  });
};

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendHandoverEmail,
};
