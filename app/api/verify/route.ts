import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();
    
    // In a real application, you would verify OTP against stored value
    // For this example, we'll just mark the user as verified
    
    const user = await prisma.user.update({
      where: { email },
      data: { emailVerified: true },
    });

    return NextResponse.json(
      { 
        success: true,
        message: "Email verified successfully" 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}