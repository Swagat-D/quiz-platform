import { getDb } from './mongodb';

// Generate a random 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Save OTP to database
export async function saveOTP(email: string, type: 'signup' | 'reset'): Promise<string> {
  const db = await getDb();
  const otpCollection = db.collection('otps');
  
  const otp = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Delete any existing OTPs for this email and type
  await otpCollection.deleteMany({ email, type });

  // Create new OTP
  await otpCollection.insertOne({
    email,
    code: otp,
    expiresAt,
    type,
    createdAt: new Date()
  });

  return otp;
}

// Verify OTP
export async function verifyOTP(email: string, code: string, type: 'signup' | 'reset'): Promise<boolean> {
  const db = await getDb();
  const otpCollection = db.collection('otps');
  
  const otpRecord = await otpCollection.findOne({
    email,
    code,
    type,
    expiresAt: { $gt: new Date() }
  });

  if (!otpRecord) {
    return false;
  }

  // Delete the OTP record once used
  await otpCollection.deleteOne({ _id: otpRecord._id });

  return true;
}