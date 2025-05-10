import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { verifyOTP } from "@/lib/otp-service";

export async function POST(req: Request) {
  try {
    const { email, otp, type } = await req.json();
    
    if (type !== 'signup' && type !== 'reset') {
      return NextResponse.json(
        { error: "Invalid OTP type" },
        { status: 400 }
      );
    }

    // Verify OTP
    const isValid = await verifyOTP(email, otp, type as 'signup' | 'reset');
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 400 }
      );
    }
    
    // If it's a signup verification, mark the user as verified
    if (type === 'signup') {
      const db = await getDb();
      await db.collection('users').updateOne(
        { email },
        { 
          $set: { 
            emailVerified: true,
            updatedAt: new Date()
          } 
        }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        message: type === 'signup' ? "Email verified successfully" : "OTP verified successfully"
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 500 }
    );
  }
}