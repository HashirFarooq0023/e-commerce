import db from "./db";

// ==========================================
// 1. CREATE ORDER (For Checkout)
// ==========================================
export async function createOrder(orderData) {
  const { items, totalAmount, shippingAddress, userId, email } = orderData;
  
  // Get a specific connection for the transaction
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    let addressId = null;
    let finalUserId = userId === "guest" ? null : userId;

    // A. Save Address if User is Logged In
    if (finalUserId) {
      const addressQuery = `
        INSERT INTO addresses 
        (user_id, name, phone1, phone2, house_no, street, area, city, province, landmark)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [addrResult] = await connection.execute(addressQuery, [
        finalUserId,
        shippingAddress.name,
        shippingAddress.phone1,
        shippingAddress.phone2 || null,
        shippingAddress.house,
        shippingAddress.street,
        shippingAddress.area,
        shippingAddress.city,
        shippingAddress.province,
        shippingAddress.landmark || null
      ]);

      addressId = addrResult.insertId; 
    }

    // B. Save Order
    // We always save shipping_address as JSON for history/guest support
    const orderQuery = `
      INSERT INTO orders 
      (user_id, address_id, customer_email, total_amount, status, items, shipping_address, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'pending', ?, ?, NOW(), NOW())
    `;

    const [orderResult] = await connection.execute(orderQuery, [
      finalUserId,     
      addressId,            
      email,
      totalAmount,
      JSON.stringify(items),           
      JSON.stringify(shippingAddress)  
    ]);

    await connection.commit();

    return { success: true, orderId: orderResult.insertId };

  } catch (error) {
    await connection.rollback();
    console.error("❌ Transaction Error:", error);
    return { success: false, error: error.message };
  } finally {
    connection.release(); 
  }
}

// ==========================================
// 2. GET ORDERS (For Admin Dashboard)
// ==========================================
export async function getOrders(filters = {}) {
  const { filter, startDate, endDate } = filters;

  // Base Query
  let query = `
    SELECT o.*, u.name as user_name 
    FROM orders o 
    LEFT JOIN users u ON o.user_id = u.id
  `;

  const conditions = [];
  const values = [];

  // Date Filters
  if (filter === "today") {
    conditions.push("DATE(o.created_at) = CURDATE()");
  } else if (filter === "week") {
    conditions.push("YEARWEEK(o.created_at, 1) = YEARWEEK(CURDATE(), 1)");
  } else if (filter === "month") {
    conditions.push("MONTH(o.created_at) = MONTH(CURDATE()) AND YEAR(o.created_at) = YEAR(CURDATE())");
  } else if (filter === "custom" && startDate && endDate) {
    conditions.push("DATE(o.created_at) BETWEEN ? AND ?");
    values.push(startDate, endDate);
  }

  // Combine Query
  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " ORDER BY o.created_at DESC";

  try {
    const [rows] = await db.execute(query, values);

    // Parse JSON columns safely
    return rows.map(order => ({
      ...order,
      items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items,
      shipping_address: typeof order.shipping_address === 'string' ? JSON.parse(order.shipping_address) : order.shipping_address,
    }));

  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    throw new Error("Failed to fetch orders");
  }
}


 //3. UPDATE ORDER STATUS
export async function updateOrderStatus(orderId, status) {
  try {
    const [result] = await db.execute(
      "UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?",
      [status, orderId]
    );
    return result.affectedRows > 0;
  } catch (error) {
    console.error("❌ updateOrderStatus Error:", error);
    throw error;
  }
}