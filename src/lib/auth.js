import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers"; // 👈 Ensure this is imported
import bcrypt from "bcryptjs";

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || "default-secret-key-change-this");

export async function hashPassword(plainText) {
  return await bcrypt.hash(plainText, 10);
}

export async function verifyPassword(plainText, hashed) {
  return await bcrypt.compare(plainText, hashed);
}

export async function createSession(user) {
  const token = await new SignJWT({ 
      userId: user.id, 
      email: user.email, 
      name: user.name,
      role: user.role 
    })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  
  if (!token) return null;
  
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload;
  } catch (error) {
    return null;
  }
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}