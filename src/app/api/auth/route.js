import { NextResponse } from "next/server";
import { findUserByEmail, createUser } from "@/lib/user";
import { hashPassword, verifyPassword, createSession, logout } from "@/lib/auth";

// LOGIN / REGISTER HANDLER
export async function POST(req) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // 1. Check if user exists
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      // 🟢 USER EXISTS -> TRY TO LOGIN
      const isValid = await verifyPassword(password, existingUser.password);
      
      if (!isValid) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
      }

      // Create Session
      await createSession(existingUser);
      return NextResponse.json({ success: true, message: "Logged in successfully" });

    } else {
      //  USER NEW -> REGISTER AUTOMATICALLY
      const hashedPassword = await hashPassword(password);
      
      const newUser = await createUser({
        email,
        password: hashedPassword,
        name: name || "New User"
      });

      // Create Session
      await createSession(newUser);
      return NextResponse.json({ success: true, message: "Account created successfully" });
    }

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// LOGOUT HANDLER
export async function DELETE() {
  await logout();
  return NextResponse.json({ success: true });
}