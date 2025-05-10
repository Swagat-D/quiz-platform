import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Clear all auth-related cookies
    const cookieStore = await cookies();
    
    // Get all cookies
    const allCookies = cookieStore.getAll();
    
    // Find and delete all auth-related cookies
    for (const cookie of allCookies) {
      if (cookie.name.startsWith('next-auth') || 
          cookie.name === '__Secure-next-auth.session-token' || 
          cookie.name === '__Host-next-auth.csrf-token') {
        cookieStore.delete(cookie.name);
      }
    }
    
    return NextResponse.json(
      { success: true, message: "Logged out successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}