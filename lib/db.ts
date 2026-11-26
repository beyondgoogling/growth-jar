import "server-only";
import { createClient, type Client } from "@libsql/client";
import { NIGERIAN_STATES } from "./nigeria";

const globalForDb = globalThis as unknown as { __gjDb?: Promise<Client> };

async function createDb(): Promise<Client> {
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) throw new Error("TURSO_DATABASE_URL is not set");
  const db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  await db.executeMultiple(`
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
      delivery_method TEXT NOT NULL DEFAULT 'delivery'
        CHECK (delivery_method IN ('pickup','delivery')),
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
    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin_id INTEGER NOT NULL REFERENCES admins(id),
      token_hash TEXT UNIQUE NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT
    );
    CREATE TABLE IF NOT EXISTS state_shipping_fees (
      state TEXT PRIMARY KEY,
      fee_kobo INTEGER NOT NULL
    );
  `);
  const cols = await db.execute("PRAGMA table_info(admins)");
  if (!cols.rows.some((r) => r.name === "session_epoch")) {
    await db.execute(
      "ALTER TABLE admins ADD COLUMN session_epoch INTEGER NOT NULL DEFAULT 0"
    );
  }
  const feeCols = await db.execute("PRAGMA table_info(state_shipping_fees)");
  if (!feeCols.rows.some((r) => r.name === "usd_cents")) {
    await db.execute(
      "ALTER TABLE state_shipping_fees ADD COLUMN usd_cents INTEGER NOT NULL DEFAULT 200"
    );
  }
  const orderCols = await db.execute("PRAGMA table_info(orders)");
  if (!orderCols.rows.some((r) => r.name === "reminder_sent_at")) {
    await db.execute("ALTER TABLE orders ADD COLUMN reminder_sent_at TEXT");
  }
  if (!orderCols.rows.some((r) => r.name === "paystack_ref")) {
    await db.execute("ALTER TABLE orders ADD COLUMN paystack_ref TEXT");
  }
  if (!orderCols.rows.some((r) => r.name === "delivery_method")) {
    await db.execute(
      "ALTER TABLE orders ADD COLUMN delivery_method TEXT NOT NULL DEFAULT 'delivery' CHECK (delivery_method IN ('pickup','delivery'))"
    );
  }
  await db.batch(
    [
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('journal_price_kobo', '1500000')",
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('complete_price_kobo', '2500000')",
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('journal_price_usd_cents', '1000')",
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('complete_price_usd_cents', '1667')",
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('shipping_fee_kobo', '300000')",
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('notify_email', '')",
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('notify_email_2', '')",
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('shipping_fees_enabled', '1')",
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('pickup_enabled', '1')",
      "INSERT OR IGNORE INTO settings (key, value) VALUES ('delivery_enabled', '1')",
    ],
    "write"
  );
  const flatFee = await db.execute(
    "SELECT value FROM settings WHERE key = 'shipping_fee_kobo'"
  );
  const defaultFee = Number(flatFee.rows[0]?.value ?? 300000);
  await db.batch(
    NIGERIAN_STATES.map((state) => ({
      sql: "INSERT OR IGNORE INTO state_shipping_fees (state, fee_kobo) VALUES (?, ?)",
      args: [state, defaultFee],
    })),
    "write"
  );
  return db;
}

export function getDb(): Promise<Client> {
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
  delivery_method: "pickup" | "delivery";
  payment_status: "pending" | "paid" | "failed";
  paid_at: string | null;
  fulfillment_status: "unfulfilled" | "shipped" | "delivered" | "cancelled";
  notes: string;
  reminder_sent_at: string | null;
  paystack_ref: string | null;
};

export type Settings = {
  journalPriceKobo: number;
  completePriceKobo: number;
  journalPriceUsdCents: number;
  completePriceUsdCents: number;
  shippingFeesEnabled: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
};

export async function getSettings(): Promise<Settings> {
  const db = await getDb();
  const rs = await db.execute("SELECT key, value FROM settings");
  const map = Object.fromEntries(
    rs.rows.map((r) => [r.key as string, Number(r.value)])
  );
  return {
    journalPriceKobo: map.journal_price_kobo,
    completePriceKobo: map.complete_price_kobo,
    journalPriceUsdCents: map.journal_price_usd_cents,
    completePriceUsdCents: map.complete_price_usd_cents,
    shippingFeesEnabled: map.shipping_fees_enabled === 1,
    pickupEnabled: map.pickup_enabled === 1,
    deliveryEnabled: map.delivery_enabled === 1,
  };
}

export type DeliveryOptions = {
  shippingFeesEnabled: boolean;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
};

export async function updateDeliveryOptions(o: DeliveryOptions) {
  const db = await getDb();
  await db.batch(
    [
      {
        sql: "UPDATE settings SET value = ? WHERE key = ?",
        args: [o.shippingFeesEnabled ? "1" : "0", "shipping_fees_enabled"],
      },
      {
        sql: "UPDATE settings SET value = ? WHERE key = ?",
        args: [o.pickupEnabled ? "1" : "0", "pickup_enabled"],
      },
      {
        sql: "UPDATE settings SET value = ? WHERE key = ?",
        args: [o.deliveryEnabled ? "1" : "0", "delivery_enabled"],
      },
    ],
    "write"
  );
}

export async function updateSettings(s: Omit<Settings, keyof DeliveryOptions>) {
  const db = await getDb();
  await db.batch(
    [
      {
        sql: "UPDATE settings SET value = ? WHERE key = ?",
        args: [String(s.journalPriceKobo), "journal_price_kobo"],
      },
      {
        sql: "UPDATE settings SET value = ? WHERE key = ?",
        args: [String(s.completePriceKobo), "complete_price_kobo"],
      },
      {
        sql: "UPDATE settings SET value = ? WHERE key = ?",
        args: [String(s.journalPriceUsdCents), "journal_price_usd_cents"],
      },
      {
        sql: "UPDATE settings SET value = ? WHERE key = ?",
        args: [String(s.completePriceUsdCents), "complete_price_usd_cents"],
      },
    ],
    "write"
  );
}

export type StateFee = { kobo: number; usdCents: number };

export async function getStateShippingFees(): Promise<Record<string, StateFee>> {
  const db = await getDb();
  const rs = await db.execute(
    "SELECT state, fee_kobo, usd_cents FROM state_shipping_fees ORDER BY state"
  );
  return Object.fromEntries(
    rs.rows.map((r) => [
      r.state as string,
      { kobo: Number(r.fee_kobo), usdCents: Number(r.usd_cents) },
    ])
  );
}

export async function updateStateShippingFees(fees: Record<string, StateFee>) {
  const db = await getDb();
  await db.batch(
    Object.entries(fees).map(([state, fee]) => ({
      sql: "UPDATE state_shipping_fees SET fee_kobo = ?, usd_cents = ? WHERE state = ?",
      args: [fee.kobo, fee.usdCents, state],
    })),
    "write"
  );
}

export async function logEvent(orderId: number, event: string) {
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO order_events (order_id, event) VALUES (?, ?)",
    args: [orderId, event],
  });
}

export async function logAdminEvent(actor: string, event: string) {
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO admin_events (actor, event) VALUES (?, ?)",
    args: [actor, event],
  });
}

export async function getNotifyEmails(): Promise<string[]> {
  const db = await getDb();
  const rs = await db.execute(
    "SELECT value FROM settings WHERE key IN ('notify_email', 'notify_email_2') ORDER BY key"
  );
  const seen = new Set<string>();
  for (const row of rs.rows) {
    const v = String(row.value ?? "").trim();
    if (v) seen.add(v.toLowerCase());
  }
  return [...seen];
}

export async function getOrderByReference(
  reference: string
): Promise<Order | undefined> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM orders WHERE reference = ?",
    args: [reference],
  });
  return rs.rows[0] as unknown as Order | undefined;
}

export async function getOrderByPaystackRef(
  paystackRef: string
): Promise<Order | undefined> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM orders WHERE paystack_ref = ? OR reference = ?",
    args: [paystackRef, paystackRef],
  });
  return rs.rows[0] as unknown as Order | undefined;
}

export async function setPaystackRef(orderId: number, paystackRef: string) {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE orders SET paystack_ref = ? WHERE id = ?",
    args: [paystackRef, orderId],
  });
}

export async function getOrdersDueForReminder(): Promise<Order[]> {
  const db = await getDb();
  const rs = await db.execute(
    `SELECT * FROM orders
     WHERE payment_status = 'pending'
       AND reminder_sent_at IS NULL
       AND created_at <= datetime('now', '-24 hours')
     ORDER BY id LIMIT 50`
  );
  return rs.rows as unknown as Order[];
}

export async function markReminderSent(orderId: number) {
  const db = await getDb();
  await db.execute({
    sql: "UPDATE orders SET reminder_sent_at = datetime('now') WHERE id = ?",
    args: [orderId],
  });
  await logEvent(orderId, "Payment reminder email sent");
}

export async function markPaid(orderId: number): Promise<boolean> {
  const db = await getDb();
  const res = await db.execute({
    sql: "UPDATE orders SET payment_status = 'paid', paid_at = datetime('now') WHERE id = ? AND payment_status != 'paid'",
    args: [orderId],
  });
  if (res.rowsAffected > 0) {
    await logEvent(orderId, "Payment confirmed via Paystack");
    return true;
  }
  return false;
}

export async function markFailed(orderId: number): Promise<boolean> {
  const db = await getDb();
  const res = await db.execute({
    sql: "UPDATE orders SET payment_status = 'failed' WHERE id = ? AND payment_status = 'pending'",
    args: [orderId],
  });
  if (res.rowsAffected > 0) {
    await logEvent(orderId, "Payment attempt failed");
    return true;
  }
  return false;
}