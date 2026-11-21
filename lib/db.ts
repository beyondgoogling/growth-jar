import "server-only";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";

const globalForDb = globalThis as unknown as { __gjDb?: DatabaseSync };

function createDb(): DatabaseSync {
  const dir = path.join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, "growth-jar.db"));
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      package TEXT NOT NULL CHECK (package IN ('journal','complete')),
      quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 10),
      unit_price_kobo INTEGER NOT NULL,
      shipping_kobo INTEGER NOT NULL,
      total_kobo INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'NGN',
      customer_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      address_line TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'Nigeria',
      payment_status TEXT NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending','paid','failed')),
      paid_at TEXT,
      fulfillment_status TEXT NOT NULL DEFAULT 'unfulfilled'
        CHECK (fulfillment_status IN ('unfulfilled','shipped','delivered','cancelled')),
      notes TEXT NOT NULL DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS order_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      at TEXT NOT NULL DEFAULT (datetime('now')),
      event TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('owner','manager','staff')),
      password_hash TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS admin_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      at TEXT NOT NULL DEFAULT (datetime('now')),
      actor TEXT NOT NULL,
      event TEXT NOT NULL
    );
  `);
  const seed = db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");
  seed.run("journal_price_kobo", "1500000");
  seed.run("complete_price_kobo", "2500000");
  seed.run("shipping_fee_kobo", "300000");
  seed.run("notify_email", "");
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__gjDb) globalForDb.__gjDb = createDb();
  return globalForDb.__gjDb;
}

export type Order = {
  id: number;
  reference: string;
  created_at: string;
  package: "journal" | "complete";
  quantity: number;
  unit_price_kobo: number;
  shipping_kobo: number;
  total_kobo: number;
  currency: string;
  customer_name: string;
  email: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  country: string;
  payment_status: "pending" | "paid" | "failed";
  paid_at: string | null;
  fulfillment_status: "unfulfilled" | "shipped" | "delivered" | "cancelled";
  notes: string;
};

export type Settings = {
  journalPriceKobo: number;
  completePriceKobo: number;
  shippingFeeKobo: number;
};

export function getSettings(): Settings {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
  const map = Object.fromEntries(rows.map((r) => [r.key, Number(r.value)]));
  return {
    journalPriceKobo: map.journal_price_kobo,
    completePriceKobo: map.complete_price_kobo,
    shippingFeeKobo: map.shipping_fee_kobo,
  };
}

export function updateSettings(s: Settings) {
  const stmt = getDb().prepare("UPDATE settings SET value = ? WHERE key = ?");
  stmt.run(String(s.journalPriceKobo), "journal_price_kobo");
  stmt.run(String(s.completePriceKobo), "complete_price_kobo");
  stmt.run(String(s.shippingFeeKobo), "shipping_fee_kobo");
}

export function logEvent(orderId: number, event: string) {
  getDb()
    .prepare("INSERT INTO order_events (order_id, event) VALUES (?, ?)")
    .run(orderId, event);
}

export function getOrderByReference(reference: string): Order | undefined {
  return getDb()
    .prepare("SELECT * FROM orders WHERE reference = ?")
    .get(reference) as Order | undefined;
}

export function markPaid(orderId: number): boolean {
  const db = getDb();
  const res = db
    .prepare(
      "UPDATE orders SET payment_status = 'paid', paid_at = datetime('now') WHERE id = ? AND payment_status != 'paid'"
    )
    .run(orderId);
  if (Number(res.changes) > 0) {
    logEvent(orderId, "Payment confirmed via Paystack");
    return true;
  }
  return false;
}

export function markFailed(orderId: number) {
  const db = getDb();
  const res = db
    .prepare(
      "UPDATE orders SET payment_status = 'failed' WHERE id = ? AND payment_status = 'pending'"
    )
    .run(orderId);
  if (Number(res.changes) > 0) logEvent(orderId, "Payment attempt failed");
}