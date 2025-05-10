import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    // Check authentication status
    const session = await getServerSession(authOptions);
    const isAuthenticated = !!session?.user?.email;
    
    // Parse the request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }
    
    const { name, email, message } = body;
    
    // At this point, we have valid data and authentication is verified
    // Generate a unique submission ID
    const submissionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    const ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
    
    // Create a simplified log of the message details
    console.log("Contact form submission:", { 
      name, 
      email, 
      messageLength: message.length,
      isAuthenticated, 
      userId: isAuthenticated ? session?.user?.id : null,
      submissionId,
      ipAddress
    });

    // Validate the form data
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
    
    if (!email.includes('@')) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }
    
    // If authenticated, verify email matches session
    if (isAuthenticated && email !== session?.user?.email) {
      return NextResponse.json(
        { error: "Email address doesn't match your account" },
        { status: 403 }
      );
    }
    
    // At this point, we have valid data and authentication is verified
    // Create a simplified log of the message details
    console.log("Contact form submission:", { 
      name, 
      email, 
      messageLength: message.length,
      isAuthenticated, 
      userId: isAuthenticated ? session?.user?.id : null 
    });
    
    // Try to send email if email settings are configured
    let emailSent = false;
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      try {
        // Only attempt to send email if we have the required env variables
        const transporter = nodemailer.createTransport({
          host: process.env.EMAIL_HOST,
          port: Number(process.env.EMAIL_PORT) || 587,
          secure: process.env.EMAIL_SECURE === 'true',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
        });
        
        // Send notification email
        await transporter.sendMail({
          from: `"DevQuizWare" <${process.env.EMAIL_USER}>`,
          to: process.env.CONTACT_EMAIL || process.env.EMAIL_USER,
          subject: `New Contact Form Message from ${name}`,
          text: `
Name: ${name}
Email: ${email}
User Type: ${isAuthenticated ? 'Authenticated User' : 'Guest User'}
${isAuthenticated ? `User ID: ${session?.user?.id}` : ''}

Message:
${message}

Submission ID: ${submissionId}
IP: ${ipAddress}
          `,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 5px; overflow: hidden;">
              <div style="background-color: #242b3d; padding: 20px; text-align: center;">
                <h1 style="color: #b388ff; margin: 0; font-size: 24px;">New Contact Form Message</h1>
              </div>
              
              <div style="padding: 20px;">
                <h2 style="color: #333; font-size: 18px; margin-top: 0;">Sender Information:</h2>
                
                <p style="margin-bottom: 8px;"><strong>Name:</strong> ${name}</p>
                
                <p style="margin-bottom: 8px; display: flex; align-items: center;">
                  <strong>Email:</strong> 
                  <a href="mailto:${email}" style="color: #2563eb; margin-left: 5px;">${email}</a>
                  ${isAuthenticated ? 
                    '<span style="background-color: #00796b; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; margin-left: 10px; display: inline-block;">Authenticated User</span>' : 
                    ''}
                </p>
                
                <h2 style="color: #333; font-size: 18px; margin-top: 24px; border-top: 1px solid #eee; padding-top: 20px;">Message:</h2>
                
                <p style="white-space: pre-line; margin-bottom: 20px; color: #333; background-color: #f9f9f9; padding: 12px; border-radius: 4px;">${message}</p>
                
                <div style="font-size: 12px; color: #666; margin-top: 30px; padding-top: 10px; border-top: 1px solid #eee;">
                  <p style="margin: 2px 0;">Submission ID: ${submissionId}</p>
                  <p style="margin: 2px 0;">IP: ${ipAddress}</p>
                </div>
              </div>
              
              <div style="padding: 15px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #666;">
                <p style="margin: 0;">This message was sent from the DevQuizWare contact form.</p>
              </div>
            </div>
          `,
        });
        
        emailSent = true;
        
        // Also send a confirmation email to the user
        await transporter.sendMail({
          from: `"DevQuizWare Team" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: "We've Received Your Message - DevQuizWare",
          text: `
Dear ${name},

Thank you for contacting us! This email confirms that we've received your message and will get back to you as soon as possible.

Your message:
"${message}"

Best regards,
The DevQuizWare Team
          `,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 5px; overflow: hidden;">
              <div style="background-color: #242b3d; padding: 20px; text-align: center;">
                <h1 style="color: #b388ff; margin: 0; font-size: 24px;">Message Received</h1>
              </div>
              
              <div style="padding: 20px;">
                <p style="color: #333;">Dear ${name},</p>
                
                <p style="color: #333;">Thank you for contacting us! This email confirms that we've received your message and will get back to you as soon as possible.</p>
                
                <h3 style="color: #333; margin-top: 20px;">Your message:</h3>
                <p style="white-space: pre-line; color: #333; background-color: #f9f9f9; padding: 12px; border-radius: 4px; font-style: italic;">${message}</p>
                
                <p style="color: #333; margin-top: 20px;">Best regards,<br>The DevQuizWare Team</p>
              </div>
              
              <div style="padding: 15px; background-color: #f5f5f5; text-align: center; font-size: 12px; color: #666;">
                <p style="margin: 0;">This is an automated confirmation. Please do not reply to this email.</p>
              </div>
            </div>
          `,
        });
        
        console.log("Contact form email sent successfully");


      } catch (emailError) {
        // Log email error but don't fail the request
        console.error("Failed to send contact form email:", emailError);
      }
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: "Your message has been received. Thank you for contacting us!",
      emailSent,
      authenticated: isAuthenticated
    });
  } catch (error) {
    console.error("Error in contact form API:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}