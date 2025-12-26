import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();

    //  If no session exists, User is a Guest
    if (!session) {
      return NextResponse.json({ user: null });
    }

    //  If logged in, return user details
    return NextResponse.json({ 
      user: { 
        id: session.userId, 
        email: session.email, 
        name: session.name,
        role: session.role 
      } 
    });
  } catch (error) {
    console.error("Session Check Error:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}