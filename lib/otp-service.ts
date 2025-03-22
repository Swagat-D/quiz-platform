// lib/otp-service.ts
import { prisma } from "@/lib/prisma";

// Generate a random 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Save OTP to database
export async function saveOTP(email: string, type: 'signup' | 'reset'): Promise<string> {
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete any existing OTPs for this email and type
  await prisma.oTP.deleteMany({
    where: { email, type },
  });

  // Create new OTP
  await prisma.oTP.create({
    data: {
      email,
      code: otp,
      expiresAt,
      type,
    },
  });

  return otp;
}

// Verify OTP
export async function verifyOTP(email: string, code: string, type: 'signup' | 'reset'): Promise<boolean> {
  const otpRecord = await prisma.oTP.findFirst({
    where: {
      email,
      code,
      type,
      expiresAt: { gt: new Date() },
    },
  });

  if (!otpRecord) {
    return false;
  }

  // Delete the OTP record once used
  await prisma.oTP.delete({
    where: { id: otpRecord.id },
  });

  return true;
}