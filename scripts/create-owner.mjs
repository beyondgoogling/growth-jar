// One-time setup: creates the first owner account from .env.local values.
// Run: node scripts/create-owner.mjs
import { createClient } from "@libsql/client";
import { randomBytes, scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";

const env = {};
try {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
} catch {
  console.error("Could not read .env.local");
  process.exit(1);
}

const email = (env.ADMIN_EMAIL || "").toLowerCase().trim();
const password = env.ADMIN_PASSWORD || "";
const name = env.ADMIN_NAME || "Owner";
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Set ADMIN_EMAIL to a valid email in .env.local first.");
  process.exit(1);
}
if (password.length < 10) {
  console.error("Set ADMIN_PASSWORD to at least 10 characters in .env.local first.");
  process.exit(1);
}
if (!env.TURSO_DATABASE_URL) {
  console.error("Set TURSO_DATABASE_URL in .env.local first.");
  process.exit(1);
}

const db = createClient({
  url: env.TURSO_DATABASE_URL,
  authToken: env.TURSO_AUTH_TOKEN,
});
await db.execute(`CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','manager','staff')),
  password_hash TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

const existing = await db.execute({
  sql: "SELECT id FROM admins WHERE email = ?",
  args: [email],
});
if (existing.rows.length > 0) {
  console.log(`Owner ${email} already exists — nothing changed.`);
} else {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  await db.execute({
    sql: "INSERT INTO admins (email, name, role, password_hash) VALUES (?, ?, 'owner', ?)",
    args: [email, name, `${salt}:${hash}`],
  });
  console.log(`Owner account created: ${email}`);
}
db.close();