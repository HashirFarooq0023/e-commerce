import { NextResponse } from "next/server";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    // 1. Check Admin Auth
    const session = await getSession();
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Query: Get Customers + Order Stats + Address Info
    // We use subqueries for phone/city to pick the first available address 
    // without creating duplicate rows that would break the SUM() calculation.
    const query = `
      SELECT 
        u.id, 
        u.name, 
        u.email, 
        u.created_at,
        COUNT(DISTINCT o.id) as total_orders,
        COALESCE(SUM(o.total_amount), 0) as total_spent,
        (SELECT phone1 FROM addresses WHERE user_id = u.id LIMIT 1) as phone,
        (SELECT city FROM addresses WHERE user_id = u.id LIMIT 1) as city,
        (SELECT province FROM addresses WHERE user_id = u.id LIMIT 1) as province
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.role != 'admin'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `;

    const [customers] = await db.execute(query);

    return NextResponse.json(customers);

  } catch (error) {
    console.error("Fetch Customers Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}