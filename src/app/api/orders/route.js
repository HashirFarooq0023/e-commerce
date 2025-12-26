import { NextResponse } from "next/server";
import { updateOrderStatus, getOrders, createOrder } from "@/lib/orders";
import { getSession } from "@/lib/auth"; 

// ------------------------------------------
// 1. CREATE ORDER (Public / User)
// ------------------------------------------
export async function POST(req) {
  try {
    const body = await req.json();
    const { items, totalAmount, shippingAddress, customerName, email } = body;

    // 1. Validate Input
    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!shippingAddress || !shippingAddress.city) {
      return NextResponse.json({ error: "Address is missing" }, { status: 400 });
    }

    // 2. Security Check: Determine Real User ID
    const session = await getSession();
    const userId = session ? session.userId : "guest";
    const finalEmail = session ? session.email : email;

    // 3. Prepare Data
    const orderPayload = {
      userId,
      email: finalEmail,
      items,
      totalAmount,
      shippingAddress: {
        ...shippingAddress,
        name: customerName
      }
    };

    // 4. Save to DB
    const result = await createOrder(orderPayload);

    if (!result.success) {
      return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
    }

    return NextResponse.json({ success: true, orderId: result.orderId });

  } catch (error) {
    console.error("API Order Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ------------------------------------------
// 2. GET ORDERS (Admin Only)
// ------------------------------------------
export async function GET(req) {
  try {
    // 1. Auth Check
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Extract Params
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // 3. Call the Logic Function
    const orders = await getOrders({ filter, startDate, endDate });

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


// 3. PUT: Update order status (Admin Only)
export async function PUT(req) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, status } = await req.json();

    if (!orderId || !status) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Call the library function
    const success = await updateOrderStatus(orderId, status);

    if (!success) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Status updated to ${status}` });

  } catch (error) {
    console.error("PUT Status Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}