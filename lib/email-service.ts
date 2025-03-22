import nodemailer from "nodemailer";

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
    ? 'Verify your email for Quiz Platform'
    : 'Reset your password for Quiz Platform';
  
  const text = type === 'signup'
    ? `Your verification code is: ${otp}. It will expire in 10 minutes.`
    : `Your password reset code is: ${otp}. It will expire in 10 minutes.`;

  return transporter.sendMail({
    from: `"Quiz Platform" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #242b3d; padding: 20px; text-align: center; color: #b388ff;">
          <h1>${subject}</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #eee;">
          <p>Here is your ${type === 'signup' ? 'verification' : 'password reset'} code:</p>
          <div style="margin: 20px 0; padding: 10px; background-color: #f0f0f0; font-size: 24px; text-align: center; letter-spacing: 5px;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `,
  });
}