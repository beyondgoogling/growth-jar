"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createSession,
  destroySession,
  passwordMatches,
  requireAdmin,
} from "@/lib/auth";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { getDb, getOrderByReference, logEvent, updateSettings } from "@/lib/db";

export async function loginAction(
  _prev: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const ip = clientIp(await headers());
  if (!rateLimit(`login:${ip}`, 5, 15 * 60_000))
    return { error: "Too many attempts. Try again in 15 minutes." };

  const password = formData.get("password");
  if (typeof password !== "string" || !passwordMatches(password))
    return { error: "Incorrect password." };

  await createSession();
  redirect("/admin");
}

export async function logoutAction() {
  await destroySession();
  redirect("/admin/login");
}

const FULFILLMENT_STATUSES = ["unfulfilled", "shipped", "delivered", "cancelled"];

export async function updateFulfillmentAction(formData: FormData) {
  await requireAdmin();
  const reference = String(formData.get("reference") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!FULFILLMENT_STATUSES.includes(status)) return;
  const order = getOrderByReference(reference);
  if (!order || order.fulfillment_status === status) return;
  getDb()
    .prepare("UPDATE orders SET fulfillment_status = ? WHERE id = ?")
    .run(status, order.id);
  logEvent(order.id, `Fulfillment changed: ${order.fulfillment_status} → ${status}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/orders/${reference}`);
}

export async function saveNotesAction(formData: FormData) {
  await requireAdmin();
  const reference = String(formData.get("reference") ?? "");
  const notes = String(formData.get("notes") ?? "").slice(0, 5000);
  const order = getOrderByReference(reference);
  if (!order) return;
  getDb().prepare("UPDATE orders SET notes = ? WHERE id = ?").run(notes, order.id);
  logEvent(order.id, "Notes updated");
  revalidatePath(`/admin/orders/${reference}`);
}

export async function saveSettingsAction(
  _prev: { message: string } | null,
  formData: FormData
): Promise<{ message: string }> {
  await requireAdmin();
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
  updateSettings({
    journalPriceKobo: journal,
    completePriceKobo: complete,
    shippingFeeKobo: shipping,
  });
  revalidatePath("/checkout");
  revalidatePath("/admin/settings");
  return { message: "Saved. New prices are live on the checkout page." };
}