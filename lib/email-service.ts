import nodemailer from "nodemailer";
import { generateEmailTemplate, generatePlainTextEmail } from "./email-template";

// Configure transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendOTPEmail(to: string, otp: string, type: 'signup' | 'reset') {
  const subject = type === 'signup' 
    ? 'Verify your email for DevQuizWare'
    : 'Reset your password for DevQuizWare';
  
  const title = type === 'signup'
    ? 'Email Verification'
    : 'Password Reset';
  
  const htmlContent = `
    <p>Your ${type === 'signup' ? 'verification' : 'password reset'} code is:</p>
    <div style="margin: 20px 0; padding: 10px; background-color: #f0f0f0; font-size: 24px; text-align: center; letter-spacing: 5px; font-family: monospace; font-weight: bold; border-radius: 4px;">
      ${otp}
    </div>
    <p>This code will expire in 10 minutes.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;
  
  const plainTextContent = `
Your ${type === 'signup' ? 'verification' : 'password reset'} code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this, please ignore this email.
  `;
  
  // Generate the email HTML and plain text using our template
  const htmlEmail = generateEmailTemplate(title, htmlContent);
  const plainTextEmail = generatePlainTextEmail(title, plainTextContent);

  return transporter.sendMail({
    from: `"DevQuizWare" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text: plainTextEmail,
    html: htmlEmail,
  });
}