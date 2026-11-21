import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { getAdminById, can, type Admin, type Permission } from "./admins";

const COOKIE = "gj_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32)
    throw new Error("SESSION_SECRET must be set to a long random string");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export async function createSession(adminId: number) {
  const payload = Buffer.from(
    JSON.stringify({
      aid: adminId,
      exp: Date.now() + MAX_AGE_SECONDS * 1000,
      n: randomBytes(8).toString("hex"),
    })
  ).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getCurrentAdmin(): Promise<Admin | null> {
  await connection();
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given))
    return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof data.exp !== "number" || data.exp <= Date.now()) return null;
    if (typeof data.aid !== "number") return null;
    const admin = getAdminById(data.aid);
    return admin && admin.active ? admin : null;
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<Admin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/knoxx/login");
  return admin;
}

export async function requirePermission(permission: Permission): Promise<Admin> {
  const admin = await requireAdmin();
  if (!can(admin.role, permission)) redirect("/knoxx");
  return admin;
}