// app/api/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { saveOTP } from "@/lib/otp-service";
import { sendOTPEmail } from "@/lib/email-service";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();
    
    const db = await getDb();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user (unverified)
    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Generate and save OTP
    const otp = await saveOTP(email, 'signup');
    
    // Send OTP email
    await sendOTPEmail(email, otp, 'signup');

    return NextResponse.json(
      { 
        user: { 
          id: result.insertedId.toString(), 
          name, 
          email 
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