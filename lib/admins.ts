import "server-only";
import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getDb } from "./db";

export type Role = "owner" | "manager" | "staff";

export type Admin = {
  id: number;
  email: string;
  name: string;
  role: Role;
  active: number;
  created_at: string;
  session_epoch: number;
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

// Bumps session_epoch so every existing session for this admin stops working.
export async function setAdminPassword(
  id: number,
  password: string
): Promise<number> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "UPDATE admins SET password_hash = ?, session_epoch = session_epoch + 1 WHERE id = ? RETURNING session_epoch",
    args: [hashPassword(password), id],
  });
  return Number(rs.rows[0].session_epoch);
}

const RESET_TOKEN_TTL = "+1 hour";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPasswordResetToken(adminId: number): Promise<string> {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE password_resets SET used_at = datetime('now') WHERE admin_id = ? AND used_at IS NULL",
    args: [adminId],
  });
  const token = randomBytes(32).toString("base64url");
  await db.execute({
    sql: "INSERT INTO password_resets (admin_id, token_hash, expires_at) VALUES (?, ?, datetime('now', ?))",
    args: [adminId, hashToken(token), RESET_TOKEN_TTL],
  });
  return token;
}

export async function isValidPasswordResetToken(token: string): Promise<boolean> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT id FROM password_resets WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now')",
    args: [hashToken(token)],
  });
  return rs.rows.length > 0;
}

// Single-use: marks the token consumed and returns the admin id, or null if invalid/expired/already used.
export async function consumePasswordResetToken(
  token: string
): Promise<number | null> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "UPDATE password_resets SET used_at = datetime('now') WHERE token_hash = ? AND used_at IS NULL AND expires_at > datetime('now') RETURNING admin_id",
    args: [hashToken(token)],
  });
  return rs.rows.length > 0 ? Number(rs.rows[0].admin_id) : null;
}