import { NextResponse } from "next/server";
import { getProducts, createProduct } from "@/lib/products"; 

// ---------------------------------------------------------
// 1. GET ALL PRODUCTS (GET /api/products)
// ---------------------------------------------------------
export async function GET() {
  try {
    const products = await getProducts();
    
    return NextResponse.json(products, { 
      status: 200, 
      headers: { 'Cache-Control': 'no-store' } 
    });

  } catch (error) {
    console.error("API GET Error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

// ---------------------------------------------------------
// 2. CREATE PRODUCT (POST /api/products)
// ---------------------------------------------------------
export async function POST(request) {
  try {
    const body = await request.json();

    if (!body.name || !body.price) {
      return NextResponse.json({ error: "Name and Price are required" }, { status: 400 });
    }

    const result = await createProduct(body);

    if (result.success) {
      return NextResponse.json({ message: "Product created", id: result.newId }, { status: 201 });
    } else {
      return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
    }
  } catch (error) {
    console.error("API POST Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}