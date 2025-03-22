import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveOTP } from "@/lib/otp-service";
import { sendOTPEmail } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    const { email, type } = await req.json();
    
    if (type !== 'signup' && type !== 'reset') {
      return NextResponse.json(
        { error: "Invalid OTP type" },
        { status: 400 }
      );
    }
    
    // For password reset, check if user exists
    if (type === 'reset') {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        );
      }
    }

    // Generate and save OTP
    const otp = await saveOTP(email, type as 'signup' | 'reset');
    
    // Send OTP email
    await sendOTPEmail(email, otp, type as 'signup' | 'reset');

    return NextResponse.json(
      { 
        success: true,
        message: `OTP sent to ${email}` 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}