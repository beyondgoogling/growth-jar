"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSession, destroySession, requirePermission } from "@/lib/auth";
import {
  activeOwnerCount,
  createAdmin,
  getAdminByEmail,
  hashPassword,
  verifyPassword,
  type Role,
} from "@/lib/admins";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  getDb,
  getOrderByReference,
  logEvent,
  updateSettings,
} from "@/lib/db";
import { sendShippedNotification, sendTestEmail } from "@/lib/email";

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const ip = clientIp(await headers());
  if (!rateLimit(`login:${ip}`, 5, 15 * 60_000))
    return { error: "Too many attempts. Try again in 15 minutes." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const admin = email ? await getAdminByEmail(email) : undefined;
  // Always run a hash verification so timing doesn't reveal whether the email exists.
  const hash =
    admin?.password_hash ??
    "00000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";
  const valid = verifyPassword(password, hash);
  if (!admin || !admin.active || !valid)
    return { error: "Incorrect email or password." };

  await createSession(admin.id);
  redirect("/knoxx");
}

export async function logoutAction() {
  await destroySession();
  redirect("/knoxx/login");
}

const FULFILLMENT_STATUSES = ["unfulfilled", "shipped", "delivered", "cancelled"];

export async function updateFulfillmentAction(formData: FormData) {
  const admin = await requirePermission("orders.fulfill");
  const reference = String(formData.get("reference") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!FULFILLMENT_STATUSES.includes(status)) return;
  const order = await getOrderByReference(reference);
  if (!order || order.fulfillment_status === status) return;
  const db = await getDb();
  await db.execute({
    sql: "UPDATE orders SET fulfillment_status = ? WHERE id = ?",
    args: [status, order.id],
  });
  await logEvent(order.id, `Fulfillment changed: ${order.fulfillment_status} → ${status} (by ${admin.name})`);
  revalidatePath("/knoxx");
  revalidatePath(`/knoxx/orders/${reference}`);
}

export async function saveNotesAction(formData: FormData) {
  const admin = await requirePermission("orders.notes");
  const reference = String(formData.get("reference") ?? "");
  const notes = String(formData.get("notes") ?? "").slice(0, 5000);
  const order = await getOrderByReference(reference);
  if (!order) return;
  const db = await getDb();
  await db.execute({
    sql: "UPDATE orders SET notes = ? WHERE id = ?",
    args: [notes, order.id],
  });
  await logEvent(order.id, `Notes updated (by ${admin.name})`);
  revalidatePath(`/knoxx/orders/${reference}`);
}

export async function notifyShippedAction(
  _prev: { message: string; ok: boolean } | null,
  formData: FormData
): Promise<{ message: string; ok: boolean }> {
  const admin = await requirePermission("email.send");
  const ip = clientIp(await headers());
  if (!rateLimit(`shipmail:${ip}`, 20, 60_000))
    return { message: "Too many emails at once. Wait a minute.", ok: false };
  const reference = String(formData.get("reference") ?? "");
  const order = await getOrderByReference(reference);
  if (!order) return { message: "Order not found.", ok: false };
  if (order.payment_status !== "paid")
    return { message: "Only paid orders can be marked as shipped to the customer.", ok: false };
  if (order.fulfillment_status !== "shipped" && order.fulfillment_status !== "delivered")
    return { message: "Set the status to Shipped first, then send the email.", ok: false };
  const sent = await sendShippedNotification(order);
  revalidatePath(`/knoxx/orders/${reference}`);
  return sent
    ? { message: `Shipped email sent to ${order.email}. (by ${admin.name})`, ok: true }
    : {
        message:
          "Email could not be sent. Check the SMTP settings in .env.local and the order history for details.",
        ok: false,
      };
}

export async function saveSettingsAction(
  _prev: { message: string } | null,
  formData: FormData
): Promise<{ message: string }> {
  await requirePermission("settings.prices");
  const parse = (key: string): number | null => {
    const n = Number(formData.get(key));
    if (!Number.isFinite(n) || n < 0 || n > 10_000_000) return null;
    return Math.round(n * 100);
  };
  const journal = parse("journalPrice");
  const complete = parse("completePrice");
  const shipping = parse("shippingFee");
  if (journal === null || complete === null || shipping === null)
    return { message: "Prices must be numbers between ₦0 and ₦10,000,000." };
  await updateSettings({
    journalPriceKobo: journal,
    completePriceKobo: complete,
    shippingFeeKobo: shipping,
  });
  revalidatePath("/checkout");
  revalidatePath("/knoxx/settings");
  return { message: "Saved. New prices are live on the checkout page." };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function saveEmailSettingsAction(
  _prev: { message: string; ok: boolean } | null,
  formData: FormData
): Promise<{ message: string; ok: boolean }> {
  await requirePermission("settings.email");
  const notifyEmail = String(formData.get("notifyEmail") ?? "").trim();
  if (notifyEmail && (!EMAIL_RE.test(notifyEmail) || notifyEmail.length > 254))
    return { message: "Enter a valid email address.", ok: false };
  const db = await getDb();
  await db.execute({
    sql: "UPDATE settings SET value = ? WHERE key = 'notify_email'",
    args: [notifyEmail],
  });
  revalidatePath("/knoxx/email");
  return { message: "Saved. New paid orders will alert this address.", ok: true };
}

export async function sendTestEmailAction(
  _prev: { message: string; ok: boolean } | null,
  formData: FormData
): Promise<{ message: string; ok: boolean }> {
  await requirePermission("settings.email");
  const to = String(formData.get("testTo") ?? "").trim();
  if (!EMAIL_RE.test(to)) return { message: "Enter a valid email address.", ok: false };
  const result = await sendTestEmail(to);
  return result.ok
    ? { message: `Test email sent to ${to}. Check the inbox.`, ok: true }
    : { message: result.error ?? "Send failed.", ok: false };
}

const ROLES: Role[] = ["owner", "manager", "staff"];

export async function createAdminAction(
  _prev: { message: string; ok: boolean } | null,
  formData: FormData
): Promise<{ message: string; ok: boolean }> {
  const actor = await requirePermission("admins.manage");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "") as Role;
  const password = String(formData.get("password") ?? "");
  if (!EMAIL_RE.test(email) || email.length > 254)
    return { message: "Enter a valid email address.", ok: false };
  if (name.length < 2 || name.length > 100)
    return { message: "Name must be 2–100 characters.", ok: false };
  if (!ROLES.includes(role)) return { message: "Choose a role.", ok: false };
  if (password.length < 10 || password.length > 200)
    return { message: "Password must be at least 10 characters.", ok: false };
  if (await getAdminByEmail(email))
    return { message: "An admin with that email already exists.", ok: false };
  await createAdmin({ email, name, role, password });
  await logAdminEvent(actor.name, `Created admin ${email} (${role})`);
  revalidatePath("/knoxx/team");
  return { message: `${name} can now sign in as ${role}.`, ok: true };
}

export async function updateAdminAction(formData: FormData) {
  const actor = await requirePermission("admins.manage");
  const id = Number(formData.get("id"));
  const db = await getDb();
  const targetRs = await db.execute({
    sql: "SELECT * FROM admins WHERE id = ?",
    args: [id],
  });
  const target = targetRs.rows[0] as unknown as
    | { id: number; email: string; role: Role; active: number }
    | undefined;
  if (!target) return;

  const role = String(formData.get("role") ?? "") as Role;
  const active = formData.get("active") === "1" ? 1 : 0;
  if (!ROLES.includes(role)) return;
  // Never allow removing the last active owner (including demoting/disabling yourself).
  const staysOwner = role === "owner" && active === 1;
  if (!staysOwner && target.role === "owner" && target.active === 1 && (await activeOwnerCount(target.id)) === 0)
    return;
  if (target.id === actor.id && active === 0) return;

  await db.execute({
    sql: "UPDATE admins SET role = ?, active = ? WHERE id = ?",
    args: [role, active, id],
  });
  await logAdminEvent(actor.name, `Updated admin ${target.email}: role=${role}, active=${active}`);
  revalidatePath("/knoxx/team");
}

export async function resetAdminPasswordAction(
  _prev: { message: string; ok: boolean } | null,
  formData: FormData
): Promise<{ message: string; ok: boolean }> {
  const actor = await requirePermission("admins.manage");
  const id = Number(formData.get("id"));
  const password = String(formData.get("password") ?? "");
  if (password.length < 10 || password.length > 200)
    return { message: "Password must be at least 10 characters.", ok: false };
  const db = await getDb();
  const targetRs = await db.execute({
    sql: "SELECT email FROM admins WHERE id = ?",
    args: [id],
  });
  const target = targetRs.rows[0] as unknown as { email: string } | undefined;
  if (!target) return { message: "Admin not found.", ok: false };
  await db.execute({
    sql: "UPDATE admins SET password_hash = ? WHERE id = ?",
    args: [hashPassword(password), id],
  });
  await logAdminEvent(actor.name, `Reset password for ${target.email}`);
  revalidatePath("/knoxx/team");
  return { message: `Password reset for ${target.email}.`, ok: true };
}

async function logAdminEvent(actor: string, event: string) {
  const db = await getDb();
  await db.execute({
    sql: "INSERT INTO admin_events (actor, event) VALUES (?, ?)",
    args: [actor, event],
  });
}