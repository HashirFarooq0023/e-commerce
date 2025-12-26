import { NextResponse } from "next/server";
import { getAllCategories } from "@/lib/products";

export async function GET() {
  try {
    // Fetch distinct categories from your DB
    const categories = await getAllCategories();
    
    // Return them as JSON so the Cart Page can read them
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}