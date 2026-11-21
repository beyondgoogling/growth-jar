import "server-only";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDb } from "./db";

export type Role = "owner" | "manager" | "staff";

export type Admin = {
  id: number;
  email: string;
  name: string;
  role: Role;
  active: number;
  created_at: string;
};

export type Permission =
  | "orders.view"
  | "orders.fulfill"
  | "orders.notes"
  | "orders.export"
  | "email.send"
  | "settings.prices"
  | "settings.email"
  | "admins.manage";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    "orders.view",
    "orders.fulfill",
    "orders.notes",
    "orders.export",
    "email.send",
    "settings.prices",
    "settings.email",
    "admins.manage",
  ],
  manager: [
    "orders.view",
    "orders.fulfill",
    "orders.notes",
    "orders.export",
    "email.send",
    "settings.prices",
  ],
  staff: ["orders.view", "orders.fulfill", "orders.notes"],
};

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  manager: "Manager",
  staff: "Staff",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Full access, including prices, email settings, and managing the team.",
  manager: "Orders, shipping emails, exports, and prices. No team or email settings.",
  staff: "View orders, update shipping status, and add notes. Nothing else.",
};

export function can(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const given = scryptSync(password, salt, 64);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export async function getAdminByEmail(
  email: string
): Promise<(Admin & { password_hash: string }) | undefined> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM admins WHERE email = ?",
    args: [email.toLowerCase()],
  });
  return rs.rows[0] as unknown as (Admin & { password_hash: string }) | undefined;
}

export async function getAdminById(id: number): Promise<Admin | undefined> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM admins WHERE id = ?",
    args: [id],
  });
  return rs.rows[0] as unknown as Admin | undefined;
}

export async function listAdmins(): Promise<Admin[]> {
  const db = await getDb();
  const rs = await db.execute("SELECT * FROM admins ORDER BY id");
  return rs.rows as unknown as Admin[];
}

export async function activeOwnerCount(excludeId?: number): Promise<number> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT COUNT(*) AS n FROM admins WHERE role = 'owner' AND active = 1 AND id != ?",
    args: [excludeId ?? -1],
  });
  return Number(rs.rows[0].n);
}

export async function createAdmin(input: {
  email: string;
  name: string;
  role: Role;
  password: string;
}) {
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO admins (email, name, role, password_hash) VALUES (?, ?, ?, ?)",
    args: [
      input.email.toLowerCase(),
      input.name,
      input.role,
      hashPassword(input.password),
    ],
  });
}