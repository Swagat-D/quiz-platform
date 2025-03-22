// app/api/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { saveOTP } from "@/lib/otp-service";
import { sendOTPEmail } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user (unverified)
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: false,
      },
    });

    // Generate and save OTP
    const otp = await saveOTP(email, 'signup');
    
    // Send OTP email
    await sendOTPEmail(email, otp, 'signup');

    return NextResponse.json(
      { 
        user: { 
          id: user.id, 
          name: user.name, 
          email: user.email 
        },
        message: "Registration initiated. Please verify your email." 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}