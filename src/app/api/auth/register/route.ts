import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { z } from "zod";
import bcrypt from "bcryptjs";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = registerSchema.parse(body);
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();
    const trimmedPassword = password.trim();

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }

    // If client accidentally sends a bcrypt hash, store as-is to avoid double-hashing
    const looksHashed = trimmedPassword.startsWith("$2") && trimmedPassword.length >= 55;
    const hashedPassword = looksHashed
      ? trimmedPassword
      : await bcrypt.hash(trimmedPassword, 10);
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "Register:", looksHashed ? "received bcrypt hash from client" : "hashing raw password on server"
      );
    }

    // Create user
    const user = await db.user.create({
      data: {
        name: trimmedName,
        email: normalizedEmail,
        password: hashedPassword,
      },
    });

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      const msg = error.issues?.[0]?.message ?? "Validation error";
      return NextResponse.json({ message: msg }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
