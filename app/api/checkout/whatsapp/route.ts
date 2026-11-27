import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { getDb, getOrderByReference, getSettings, logEvent } from "@/lib/db";
import { visitorCurrency } from "@/lib/currency";
import { sendWhatsappOrderAlert } from "@/lib/email";
import { validateInternationalCheckout } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Invalid request origin." }, { status: 403 });

  if (!rateLimit(`wa-checkout:${clientIp(request.headers)}`, 10, 60_000))
    return Response.json(
      { error: "Too many attempts. Please wait a minute and try again." },
      { status: 429 }
    );

  if ((await visitorCurrency()) !== "USD")
    return Response.json(
      { error: "Please use the standard checkout for orders within Nigeria." },
      { status: 403 }
    );

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = validateInternationalCheckout(body);
  if (!result.ok)
    return Response.json({ error: result.error }, { status: 400 });
  const input = result.value;

  const settings = await getSettings();
  const unitPrice =
    input.package === "journal"
      ? settings.journalPriceUsdCents
      : settings.completePriceUsdCents;
  const total = unitPrice * input.quantity;
  const reference = `GJ-${randomBytes(6).toString("hex").toUpperCase()}`;

  const db = await getDb();
  const inserted = await db.execute({
    sql: `INSERT INTO orders
        (reference, package, quantity, unit_price_kobo, shipping_kobo, total_kobo,
         currency, customer_name, email, phone, address_line, city, state, country, delivery_method)
       VALUES (?, ?, ?, ?, 0, ?, 'USD', ?, ?, ?, ?, ?, '', ?, 'delivery')`,
    args: [
      reference,
      input.package,
      input.quantity,
      unitPrice,
      total,
      input.customerName,
      input.email,
      input.phone,
      input.addressLine,
      input.city,
      input.country,
    ],
  });
  const orderId = Number(inserted.lastInsertRowid);
  await logEvent(orderId, "Order created (WhatsApp, international)");
  after(async () => {
    const order = await getOrderByReference(reference);
    if (order) await sendWhatsappOrderAlert(order);
  });

  return Response.json({ reference });
}