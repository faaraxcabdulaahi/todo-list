import { auth } from "@/app/lib/auth";
import prisma from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

// Validation schema
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedData.error.errors },
        { status: 400 }
      );
    }
    
    const { name, email, password } = validatedData.data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    // Create user using BetterAuth
    const { data, error } = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });
    
    if (error) {
      console.error("BetterAuth error:", error);
      return NextResponse.json(
        { error: error.message || "Registration failed" },
        { status: 400 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: "Registration successful! Please check your email to verify your account.",
      userId: data.user.id,
      requiresVerification: !data.user.emailVerified,
    }, { status: 201 });
    
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}