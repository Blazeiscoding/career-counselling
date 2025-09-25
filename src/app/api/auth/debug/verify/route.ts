import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  // Only allow in development for safety
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ ok: false, error: "Not available in production" }, { status: 403 });
  }

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "email and password required" }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const trimmedPassword = String(password).trim();

    const user = await db.user.findUnique({ where: { email: normalizedEmail } });
    if (!user || !user.password) {
      return NextResponse.json({ ok: false, found: false });
    }

    const looksHashed = user.password.startsWith("$2");
    const match = await bcrypt.compare(trimmedPassword, user.password);

    return NextResponse.json({ ok: true, found: true, looksHashed, match, hashPrefix: user.password.slice(0, 4), hashLen: user.password.length });
  } catch (err) {
    return NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 });
  }
}
