import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { getDb, getOrderByReference, getSettings, getStateShippingFees, logEvent } from "@/lib/db";
import { sendNewOrderPendingAlert } from "@/lib/email";
import { initializeTransaction, paystackConfigured } from "@/lib/paystack";
import { validateCheckout } from "@/lib/validation";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Invalid request origin." }, { status: 403 });

  if (!rateLimit(`checkout:${clientIp(request.headers)}`, 10, 60_000))
    return Response.json(
      { error: "Too many attempts. Please wait a minute and try again." },
      { status: 429 }
    );

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = validateCheckout(body);
  if (!result.ok)
    return Response.json({ error: result.error }, { status: 400 });
  const input = result.value;

  if (!paystackConfigured())
    return Response.json(
      {
        error:
          "Online payment is not live yet. Please check back soon or contact us to reserve your copy.",
      },
      { status: 503 }
    );

  const settings = await getSettings();
  const unitPrice =
    input.package === "journal"
      ? settings.journalPriceKobo
      : settings.completePriceKobo;
  const shipping = (await getStateShippingFees())[input.state].kobo;
  const total = unitPrice * input.quantity + shipping;
  const reference = `GJ-${randomBytes(6).toString("hex").toUpperCase()}`;

  const db = await getDb();
  const inserted = await db.execute({
    sql: `INSERT INTO orders
        (reference, package, quantity, unit_price_kobo, shipping_kobo, total_kobo,
         customer_name, email, phone, address_line, city, state)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      reference,
      input.package,
      input.quantity,
      unitPrice,
      shipping,
      total,
      input.customerName,
      input.email,
      input.phone,
      input.addressLine,
      input.city,
      input.state,
    ],
  });
  const orderId = Number(inserted.lastInsertRowid);
  await logEvent(orderId, "Order created");
  after(async () => {
    const order = await getOrderByReference(reference);
    if (order) await sendNewOrderPendingAlert(order);
  });

  try {
    const { authorization_url } = await initializeTransaction({
      email: input.email,
      amountKobo: total,
      reference,
      callbackUrl: `${new URL(request.url).origin}/checkout/verify`,
      metadata: { order_id: orderId, package: input.package, quantity: input.quantity },
    });
    await logEvent(orderId, "Paystack payment initialized");
    return Response.json({ authorizationUrl: authorization_url });
  } catch {
    await logEvent(orderId, "Paystack initialization failed");
    return Response.json(
      { error: "Could not start the payment. Please try again." },
      { status: 502 }
    );
  }
}