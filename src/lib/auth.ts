import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function getSecret(): Uint8Array {
  const raw = process.env.JWT_SECRET;
  if (!raw || raw.length < 32 || raw.includes("change-me") || raw === "fallback-secret") {
    throw new Error("JWT_SECRET is not configured with a strong value");
  }
  return new TextEncoder().encode(raw);
}

const alg = "HS256";

export async function createToken(payload: { id: number; role: string; studentId?: string }) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg })
    .setExpirationTime("24h")
    .sign(getSecret());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { id: number; role: string; studentId?: string };
  } catch {
    return null;
  }
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (!["admin", "coordinator", "super_admin"].includes(session.role)) throw new Error("Forbidden");
  return session;
}

export async function requireAdminOnly() {
  const session = await requireAuth();
  if (!["admin", "super_admin"].includes(session.role)) throw new Error("Forbidden");
  return session;
}

export async function requireSuperAdmin() {
  const session = await requireAuth();
  if (session.role !== "super_admin") throw new Error("Forbidden");
  return session;
}

export async function requireCoordinatorOrAbove() {
  const session = await requireAuth();
  if (!["coordinator", "super_admin"].includes(session.role)) throw new Error("Forbidden");
  return session;
}

export async function requireStaff() {
  const session = await requireAuth();
  if (session.role !== "staff") throw new Error("Forbidden");
  return session;
}
