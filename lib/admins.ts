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

export function getAdminByEmail(
  email: string
): (Admin & { password_hash: string }) | undefined {
  return getDb()
    .prepare("SELECT * FROM admins WHERE email = ?")
    .get(email.toLowerCase()) as (Admin & { password_hash: string }) | undefined;
}

export function getAdminById(id: number): Admin | undefined {
  return getDb().prepare("SELECT * FROM admins WHERE id = ?").get(id) as
    | Admin
    | undefined;
}

export function listAdmins(): Admin[] {
  return getDb()
    .prepare("SELECT * FROM admins ORDER BY id")
    .all() as Admin[];
}

export function activeOwnerCount(excludeId?: number): number {
  const row = getDb()
    .prepare(
      "SELECT COUNT(*) AS n FROM admins WHERE role = 'owner' AND active = 1 AND id != ?"
    )
    .get(excludeId ?? -1) as { n: number };
  return row.n;
}

export function createAdmin(input: {
  email: string;
  name: string;
  role: Role;
  password: string;
}) {
  getDb()
    .prepare(
      "INSERT INTO admins (email, name, role, password_hash) VALUES (?, ?, ?, ?)"
    )
    .run(
      input.email.toLowerCase(),
      input.name,
      input.role,
      hashPassword(input.password)
    );
}