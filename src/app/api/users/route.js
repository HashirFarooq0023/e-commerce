import { NextResponse } from "next/server";
import { syncUser } from "@/lib/users"; 

export async function POST(req) {
  try {
    const { clerkId, email, name } = await req.json();

    if (!clerkId || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Call the library function
    const result = await syncUser(clerkId, email, name);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, action: result.action });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}