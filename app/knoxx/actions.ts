"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { createSession, destroySession, requireAdmin, requirePermission } from "@/lib/auth";
import {
  activeOwnerCount,
  consumePasswordResetToken,
  createAdmin,
  createPasswordResetToken,
  getAdminByEmail,
  setAdminPassword,
  verifyPassword,
  ROLE_LABELS,
  type Role,
} from "@/lib/admins";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import {
  getDb,
  getOrderByReference,
  getSettings,
  getStateShippingFees,
  logAdminEvent,
  logEvent,
  updateDeliveryOptions,
  updateSettings,
  updateStateShippingFees,
  type StateFee,
} from "@/lib/db";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { money, naira, usd } from "@/lib/format";
import { notifyActivity, sendPasswordResetEmail, sendShippedNotification, sendTestEmail } from "@/lib/email";

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

  await createSession(admin.id, admin.session_epoch);
  await logAdminEvent(admin.name, "Signed in");
  after(() =>
    notifyActivity({
      subject: `Admin sign-in: ${admin.name}`,
      heading: "An admin signed in",
      details: [
        ["Name", admin.name],
        ["Email", admin.email],
        ["Role", ROLE_LABELS[admin.role]],
      ],
      actorEmail: admin.email,
    })
  );
  redirect("/knoxx");
}

export async function logoutAction() {
  await destroySession();
  redirect("/knoxx/login");
}

export async function changePasswordAction(
  _prev: { message: string; ok: boolean } | null,
  formData: FormData
): Promise<{ message: string; ok: boolean }> {
  const admin = await requireAdmin();
  if (!rateLimit(`changepw:${admin.id}`, 10, 15 * 60_000))
    return { message: "Too many attempts. Try again in 15 minutes.", ok: false };

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  const full = await getAdminByEmail(admin.email);
  if (!full || !verifyPassword(current, full.password_hash))
    return { message: "Your current password is incorrect.", ok: false };
  if (next.length < 10 || next.length > 200)
    return { message: "New password must be at least 10 characters.", ok: false };
  if (next !== confirm)
    return { message: "New passwords do not match.", ok: false };
  if (next === current)
    return { message: "New password must be different from the current one.", ok: false };

  const epoch = await setAdminPassword(admin.id, next);
  await createSession(admin.id, epoch);
  await logAdminEvent(admin.name, "Changed own password");
  after(() =>
    notifyActivity({
      subject: `Admin password changed: ${admin.email}`,
      heading: "An admin changed their password",
      details: [
        ["Account", admin.email],
        ["Name", admin.name],
      ],
      actorEmail: admin.email,
    })
  );
  return { message: "Password updated. You're still signed in on this device.", ok: true };
}

export async function updateProfileAction(
  _prev: { message: string; ok: boolean } | null,
  formData: FormData
): Promise<{ message: string; ok: boolean }> {
  const admin = await requireAdmin();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (name.length < 2 || name.length > 100)
    return { message: "Name must be 2–100 characters.", ok: false };
  if (!EMAIL_RE.test(email) || email.length > 254)
    return { message: "Enter a valid email address.", ok: false };
  const existing = await getAdminByEmail(email);
  if (existing && existing.id !== admin.id)
    return { message: "Another admin already uses that email.", ok: false };
  if (name === admin.name && email === admin.email)
    return { message: "No changes to save.", ok: true };
  const db = await getDb();
  await db.execute({
    sql: "UPDATE admins SET name = ?, email = ? WHERE id = ?",
    args: [name, email, admin.id],
  });
  await logAdminEvent(
    admin.name,
    `Updated own profile: name ${admin.name} → ${name}, email ${admin.email} → ${email}`
  );
  after(() =>
    notifyActivity({
      subject: `Admin profile updated: ${email}`,
      heading: "An admin updated their profile",
      details: [
        ["Name", `${admin.name} → ${name}`],
        ["Email", `${admin.email} → ${email}`],
      ],
      actorEmail: admin.email,
    })
  );
  revalidatePath("/knoxx/account");
  return { message: "Profile updated.", ok: true };
}

export async function forgotPasswordAction(
  _prev: { message: string; ok: boolean } | null,
  formData: FormData
): Promise<{ message: string; ok: boolean }> {
  const ip = clientIp(await headers());
  if (!rateLimit(`forgot:${ip}`, 5, 15 * 60_000))
    return { message: "Too many attempts. Try again in 15 minutes.", ok: false };

  const generic = {
    message:
      "If that email belongs to an admin account, a reset link is on its way. It expires in 1 hour.",
    ok: true,
  };
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { message: "Enter a valid email address.", ok: false };
  const admin = await getAdminByEmail(email);
  if (!admin || !admin.active) return generic;

  const token = await createPasswordResetToken(admin.id);
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const link = `${proto}://${host}/knoxx/reset-password?token=${token}`;
  const sent = await sendPasswordResetEmail(admin.email, admin.name, link);
  if (!sent)
    await logAdminEvent("System", `Password reset email failed to send for ${admin.email}`);
  return generic;
}

export async function resetPasswordWithTokenAction(
  _prev: { message: string; ok: boolean } | null,
  formData: FormData
): Promise<{ message: string; ok: boolean }> {
  const ip = clientIp(await headers());
  if (!rateLimit(`resetpw:${ip}`, 10, 15 * 60_000))
    return { message: "Too many attempts. Try again in 15 minutes.", ok: false };

  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");
  if (password.length < 10 || password.length > 200)
    return { message: "Password must be at least 10 characters.", ok: false };
  if (password !== confirm)
    return { message: "Passwords do not match.", ok: false };

  const adminId = await consumePasswordResetToken(token);
  if (adminId === null)
    return {
      message: "This reset link is invalid or has expired. Request a new one.",
      ok: false,
    };
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT email, name FROM admins WHERE id = ? AND active = 1",
    args: [adminId],
  });
  const admin = rs.rows[0] as unknown as { email: string; name: string } | undefined;
  if (!admin)
    return { message: "This account is no longer active.", ok: false };

  await setAdminPassword(adminId, password);
  await logAdminEvent(admin.name, "Password reset via email link");
  after(() =>
    notifyActivity({
      subject: `Admin password reset: ${admin.email}`,
      heading: "An admin password was reset",
      details: [
        ["Account", admin.email],
        ["Method", "Email reset link"],
      ],
      actorEmail: admin.email,
    })
  );
  return { message: "Password updated. You can now sign in with it.", ok: true };
}

const FULFILLMENT_STATUSES = ["unfulfilled", "shipped", "delivered", "cancelled"];

export async function deleteOrderAction(
  _prev: { message: string; ok: boolean } | null,
  formData: FormData
): Promise<{ message: string; ok: boolean }> {
  const admin = await requirePermission("orders.delete");
  const reference = String(formData.get("reference") ?? "");
  const order = await getOrderByReference(reference);
  if (!order)
    return { message: "Order not found — it may already be deleted.", ok: false };
  const db = await getDb();
  await db.batch(
    [
      { sql: "DELETE FROM order_events WHERE order_id = ?", args: [order.id] },
      { sql: "DELETE FROM orders WHERE id = ?", args: [order.id] },
    ],
    "write"
  );
  const total = money(order.total_kobo, order.currency === "USD" ? "USD" : "NGN");
  await logAdminEvent(
    admin.name,
    `Deleted order ${reference} (${order.customer_name}, ${total}, payment ${order.payment_status})`
  );
  after(() =>
    notifyActivity({
      subject: `Order deleted: ${reference}`,
      heading: "An order was permanently deleted",
      details: [
        ["Order", reference],
        ["Customer", order.customer_name],
        ["Total", total],
        ["Payment status", order.payment_status],
        ["Deleted by", admin.name],
      ],
      actorEmail: admin.email,
    })
  );
  revalidatePath("/knoxx");
  revalidatePath("/knoxx/orders");
  redirect("/knoxx/orders");
}

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
  after(() =>
    notifyActivity({
      subject: `Order ${reference}: marked ${status}`,
      heading: "Order status changed",
      details: [
        ["Order", reference],
        ["Customer", order.customer_name],
        ["Changed by", admin.name],
        ["Status", `${order.fulfillment_status} → ${status}`],
      ],
      actorEmail: admin.email,
      orderId: order.id,
    })
  );
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
  after(() =>
    notifyActivity({
      subject: `Notes updated on ${reference}`,
      heading: "Order notes updated",
      details: [
        ["Order", reference],
        ["Updated by", admin.name],
        ["Notes", notes ? (notes.length > 200 ? `${notes.slice(0, 200)}…` : notes) : "(cleared)"],
      ],
      actorEmail: admin.email,
      orderId: order.id,
    })
  );
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
  const pickup = order.delivery_method === "pickup";
  if (order.payment_status !== "paid")
    return {
      message: pickup
        ? "Only paid orders can get the pick-up ready email."
        : "Only paid orders can be marked as shipped to the customer.",
      ok: false,
    };
  if (order.fulfillment_status !== "shipped" && order.fulfillment_status !== "delivered")
    return {
      message: pickup
        ? "Set the status to Shipped (ready for pick up) first, then send the email."
        : "Set the status to Shipped first, then send the email.",
      ok: false,
    };
  const sent = await sendShippedNotification(order);
  if (sent) {
    after(() =>
      notifyActivity({
        subject: `${pickup ? "Pick-up ready" : "Shipped"} email sent: ${reference}`,
        heading: pickup
          ? "A pick-up ready email went to a customer"
          : "A shipped email went to a customer",
        details: [
          ["Order", reference],
          ["Customer email", order.email],
          ["Sent by", admin.name],
        ],
        actorEmail: admin.email,
        orderId: order.id,
      })
    );
  }
  revalidatePath(`/knoxx/orders/${reference}`);
  return sent
    ? {
        message: `${pickup ? "Pick-up ready" : "Shipped"} email sent to ${order.email}. (by ${admin.name})`,
        ok: true,
      }
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
  const admin = await requirePermission("settings.prices");
  const parse = (key: string): number | null => {
    const n = Number(formData.get(key));
    if (!Number.isFinite(n) || n < 0 || n > 10_000_000) return null;
    return Math.round(n * 100);
  };
  const journal = parse("journalPrice");
  const complete = parse("completePrice");
  const parseUsd = (key: string): number | null => {
    const n = Number(formData.get(key));
    if (!Number.isFinite(n) || n < 0 || n > 100_000) return null;
    return Math.round(n * 100);
  };
  const journalUsd = parseUsd("journalPriceUsd");
  const completeUsd = parseUsd("completePriceUsd");
  if (journal === null || complete === null || journalUsd === null || completeUsd === null)
    return { message: "Prices must be numbers between ₦0 and ₦10,000,000 ($0–$100,000)." };
  const old = await getSettings();
  await updateSettings({
    journalPriceKobo: journal,
    completePriceKobo: complete,
    journalPriceUsdCents: journalUsd,
    completePriceUsdCents: completeUsd,
  });
  await logAdminEvent(
    admin.name,
    `Prices updated: journal ${naira(old.journalPriceKobo)} → ${naira(journal)}, complete ${naira(old.completePriceKobo)} → ${naira(complete)}, USD journal ${usd(old.journalPriceUsdCents)} → ${usd(journalUsd)}, complete ${usd(old.completePriceUsdCents)} → ${usd(completeUsd)}`
  );
  after(() =>
    notifyActivity({
      subject: "Product prices were changed",
      heading: "Product prices updated",
      details: [
        ["Changed by", admin.name],
        ["Journal only", `${naira(old.journalPriceKobo)} → ${naira(journal)} (${usd(old.journalPriceUsdCents)} → ${usd(journalUsd)})`],
        ["Complete Experience", `${naira(old.completePriceKobo)} → ${naira(complete)} (${usd(old.completePriceUsdCents)} → ${usd(completeUsd)})`],
      ],
      actorEmail: admin.email,
    })
  );
  revalidatePath("/checkout");
  revalidatePath("/knoxx/settings");
  return { message: "Saved. New prices are live on the checkout page." };
}

export async function saveStateShippingAction(
  _prev: { message: string; ok: boolean } | null,
  formData: FormData
): Promise<{ message: string; ok: boolean }> {
  const admin = await requirePermission("settings.prices");
  const fees: Record<string, StateFee> = {};
  for (const state of NIGERIAN_STATES) {
    const n = Number(formData.get(`fee:${state}`));
    if (!Number.isFinite(n) || n < 0 || n > 10_000_000)
      return {
        message: `Enter a valid amount (₦0–10,000,000) for ${state}.`,
        ok: false,
      };
    const d = Number(formData.get(`usd:${state}`));
    if (!Number.isFinite(d) || d < 0 || d > 100_000)
      return {
        message: `Enter a valid dollar amount ($0–$100,000) for ${state}.`,
        ok: false,
      };
    fees[state] = { kobo: Math.round(n * 100), usdCents: Math.round(d * 100) };
  }
  const old = await getStateShippingFees();
  const changed = NIGERIAN_STATES.filter(
    (s) => old[s].kobo !== fees[s].kobo || old[s].usdCents !== fees[s].usdCents
  );
  if (changed.length === 0)
    return { message: "No changes to save.", ok: true };
  await updateStateShippingFees(fees);
  const changeText = (s: string) =>
    `${s} ${naira(old[s].kobo)} → ${naira(fees[s].kobo)} / ${usd(old[s].usdCents)} → ${usd(fees[s].usdCents)}`;
  const summary = changed.map(changeText).join("; ");
  await logAdminEvent(admin.name, `State shipping fees updated: ${summary}`);
  after(() =>
    notifyActivity({
      subject: "State shipping fees were changed",
      heading: "Shipping fees updated",
      details: [
        ["Changed by", admin.name],
        ["States updated", String(changed.length)],
        [
          "Changes",
          changed.slice(0, 6).map(changeText).join("; ") +
            (changed.length > 6 ? `; …and ${changed.length - 6} more` : ""),
        ],
      ],
      actorEmail: admin.email,
    })
  );
  revalidatePath("/checkout");
  revalidatePath("/knoxx/settings");
  return {
    message: `Saved. Shipping fees for ${changed.length} state${changed.length === 1 ? "" : "s"} are live at checkout.`,
    ok: true,
  };
}

export async function saveDeliveryOptionsAction(
  _prev: { message: string; ok: boolean } | null,
  formData: FormData
): Promise<{ message: string; ok: boolean }> {
  const admin = await requirePermission("settings.prices");
  const pickupEnabled = formData.get("pickupEnabled") === "on";
  const deliveryEnabled = formData.get("deliveryEnabled") === "on";
  const shippingFeesEnabled = formData.get("shippingFeesEnabled") === "on";
  if (!pickupEnabled && !deliveryEnabled)
    return {
      message: "Keep at least one delivery option switched on.",
      ok: false,
    };
  const old = await getSettings();
  if (
    old.pickupEnabled === pickupEnabled &&
    old.deliveryEnabled === deliveryEnabled &&
    old.shippingFeesEnabled === shippingFeesEnabled
  )
    return { message: "No changes to save.", ok: true };
  await updateDeliveryOptions({
    shippingFeesEnabled,
    pickupEnabled,
    deliveryEnabled,
  });
  const onOff = (b: boolean) => (b ? "on" : "off");
  await logAdminEvent(
    admin.name,
    `Delivery options updated: pick up ${onOff(old.pickupEnabled)} → ${onOff(pickupEnabled)}, home delivery ${onOff(old.deliveryEnabled)} → ${onOff(deliveryEnabled)}, state shipping fees ${onOff(old.shippingFeesEnabled)} → ${onOff(shippingFeesEnabled)}`
  );
  after(() =>
    notifyActivity({
      subject: "Delivery options were changed",
      heading: "Delivery options updated",
      details: [
        ["Changed by", admin.name],
        ["Pick up", `${onOff(old.pickupEnabled)} → ${onOff(pickupEnabled)}`],
        ["Home delivery", `${onOff(old.deliveryEnabled)} → ${onOff(deliveryEnabled)}`],
        ["State shipping fees", `${onOff(old.shippingFeesEnabled)} → ${onOff(shippingFeesEnabled)}`],
      ],
      actorEmail: admin.email,
    })
  );
  revalidatePath("/checkout");
  revalidatePath("/knoxx/settings");
  return {
    message: "Saved. Checkout now reflects these delivery options.",
    ok: true,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function saveEmailSettingsAction(
  _prev: { message: string; ok: boolean } | null,
  formData: FormData
): Promise<{ message: string; ok: boolean }> {
  const admin = await requirePermission("settings.email");
  const notifyEmail = String(formData.get("notifyEmail") ?? "").trim();
  const notifyEmail2 = String(formData.get("notifyEmail2") ?? "").trim();
  for (const e of [notifyEmail, notifyEmail2]) {
    if (e && (!EMAIL_RE.test(e) || e.length > 254))
      return { message: "Enter valid email addresses.", ok: false };
  }
  const db = await getDb();
  await db.batch(
    [
      {
        sql: "UPDATE settings SET value = ? WHERE key = 'notify_email'",
        args: [notifyEmail],
      },
      {
        sql: "UPDATE settings SET value = ? WHERE key = 'notify_email_2'",
        args: [notifyEmail2],
      },
    ],
    "write"
  );
  await logAdminEvent(
    admin.name,
    `Notification emails updated: ${notifyEmail || "(none)"}${notifyEmail2 ? `, ${notifyEmail2}` : ""}`
  );
  after(() =>
    notifyActivity({
      subject: "Notification settings were changed",
      heading: "Notification addresses updated",
      details: [
        ["Changed by", admin.name],
        ["Address 1", notifyEmail || "(empty)"],
        ["Address 2", notifyEmail2 || "(empty)"],
      ],
      actorEmail: admin.email,
    })
  );
  revalidatePath("/knoxx/email");
  return { message: "Saved. These addresses now receive all activity notifications.", ok: true };
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
  after(() =>
    notifyActivity({
      subject: `New admin account: ${name} (${role})`,
      heading: "A team account was created",
      details: [
        ["Created by", actor.name],
        ["Name", name],
        ["Email", email],
        ["Role", ROLE_LABELS[role]],
      ],
      actorEmail: actor.email,
    })
  );
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
  after(() =>
    notifyActivity({
      subject: `Admin account changed: ${target.email}`,
      heading: "A team account was updated",
      details: [
        ["Changed by", actor.name],
        ["Account", target.email],
        ["Role", `${ROLE_LABELS[target.role]} → ${ROLE_LABELS[role]}`],
        ["Active", active ? "Yes" : "No"],
      ],
      actorEmail: actor.email,
    })
  );
  revalidatePath("/knoxx/team");
}

export async function updateAdminProfileAction(
  _prev: { message: string; ok: boolean } | null,
  formData: FormData
): Promise<{ message: string; ok: boolean }> {
  const actor = await requirePermission("admins.manage");
  const id = Number(formData.get("id"));
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (name.length < 2 || name.length > 100)
    return { message: "Name must be 2–100 characters.", ok: false };
  if (!EMAIL_RE.test(email) || email.length > 254)
    return { message: "Enter a valid email address.", ok: false };
  const db = await getDb();
  const targetRs = await db.execute({
    sql: "SELECT id, name, email FROM admins WHERE id = ?",
    args: [id],
  });
  const target = targetRs.rows[0] as unknown as
    | { id: number; name: string; email: string }
    | undefined;
  if (!target) return { message: "Admin not found.", ok: false };
  const existing = await getAdminByEmail(email);
  if (existing && existing.id !== target.id)
    return { message: "Another admin already uses that email.", ok: false };
  if (name === target.name && email === target.email)
    return { message: "No changes to save.", ok: true };
  await db.execute({
    sql: "UPDATE admins SET name = ?, email = ? WHERE id = ?",
    args: [name, email, id],
  });
  await logAdminEvent(
    actor.name,
    `Updated admin profile ${target.email}: name ${target.name} → ${name}, email ${target.email} → ${email}`
  );
  after(() =>
    notifyActivity({
      subject: `Admin profile updated: ${email}`,
      heading: "A team account's profile was updated",
      details: [
        ["Changed by", actor.name],
        ["Name", `${target.name} → ${name}`],
        ["Email", `${target.email} → ${email}`],
      ],
      actorEmail: actor.email,
    })
  );
  revalidatePath("/knoxx/team");
  return { message: `Profile updated for ${name}.`, ok: true };
}

export async function deleteAdminAction(
  _prev: { message: string; ok: boolean } | null,
  formData: FormData
): Promise<{ message: string; ok: boolean }> {
  const actor = await requirePermission("admins.manage");
  const id = Number(formData.get("id"));
  const db = await getDb();
  const targetRs = await db.execute({
    sql: "SELECT id, name, email, role, active FROM admins WHERE id = ?",
    args: [id],
  });
  const target = targetRs.rows[0] as unknown as
    | { id: number; name: string; email: string; role: Role; active: number }
    | undefined;
  if (!target) return { message: "Admin not found.", ok: false };
  if (target.id === actor.id)
    return { message: "You can't delete your own account. Ask another owner to do it.", ok: false };
  if (target.role === "owner" && target.active === 1 && (await activeOwnerCount(target.id)) === 0)
    return { message: "You can't delete the last active owner.", ok: false };
  await db.batch(
    [
      { sql: "DELETE FROM password_resets WHERE admin_id = ?", args: [id] },
      { sql: "DELETE FROM admins WHERE id = ?", args: [id] },
    ],
    "write"
  );
  await logAdminEvent(
    actor.name,
    `Deleted admin ${target.email} (${target.name}, ${ROLE_LABELS[target.role]})`
  );
  after(() =>
    notifyActivity({
      subject: `Admin account deleted: ${target.email}`,
      heading: "A team account was deleted",
      details: [
        ["Deleted by", actor.name],
        ["Name", target.name],
        ["Email", target.email],
        ["Role", ROLE_LABELS[target.role]],
      ],
      actorEmail: actor.email,
    })
  );
  revalidatePath("/knoxx/team");
  return { message: `${target.name}'s account was deleted.`, ok: true };
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
  const epoch = await setAdminPassword(id, password);
  if (id === actor.id) await createSession(actor.id, epoch);
  await logAdminEvent(actor.name, `Reset password for ${target.email}`);
  after(() =>
    notifyActivity({
      subject: `Admin password reset: ${target.email}`,
      heading: "An admin password was reset",
      details: [
        ["Reset by", actor.name],
        ["Account", target.email],
      ],
      actorEmail: actor.email,
    })
  );
  revalidatePath("/knoxx/team");
  return { message: `Password reset for ${target.email}.`, ok: true };
}