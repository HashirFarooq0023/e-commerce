import db from "./db";

// 1. FIND USER BY EMAIL (Used for Login)
export async function findUserByEmail(email) {
  try {
    const query = "SELECT * FROM users WHERE email = ?";
    const [rows] = await db.execute(query, [email]);
    return rows[0] || null;
  } catch (error) {
    console.error("❌ Error finding user:", error);
    return null;
  }
}

// 2. CREATE USER (Used for Register)
export async function createUser({ email, password, name }) {
  try {
    // Generate a simple ID (since your DB expects a string)
    const newId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const query = `
      INSERT INTO users (id, email, password, name, role, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'user', NOW(), NOW())
    `;

    await db.execute(query, [newId, email, password, name || "User"]);
    
    return { id: newId, email, name };
  } catch (error) {
    console.error("❌ Error creating user:", error);
    throw new Error("Could not create user");
  }
}

// 3. GET USER BY ID (Profile/Session)
export async function getUserById(id) {
  try {
    const query = "SELECT id, email, name, role, created_at FROM users WHERE id = ?";
    const [rows] = await db.execute(query, [id]);
    return rows[0] || null;
  } catch (error) {
    console.error("❌ Error fetching user:", error);
    return null;
  }
}

// 4. GET ALL USERS (Admin)
export async function getAllUsers() {
  try {
    const query = "SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC";
    const [rows] = await db.execute(query);
    return rows;
  } catch (error) {
    console.error("❌ Error fetching all users:", error);
    return [];
  }
}