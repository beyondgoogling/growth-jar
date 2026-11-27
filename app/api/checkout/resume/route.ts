import { randomBytes } from "node:crypto";
import { getOrderByReference, logEvent, setPaystackRef } from "@/lib/db";
import { initializeTransaction, paystackConfigured } from "@/lib/paystack";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    return Response.json({ error: "Invalid request origin." }, { status: 403 });

  if (!rateLimit(`resume:${clientIp(request.headers)}`, 10, 60_000))
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
  const reference =
    typeof body === "object" && body !== null
      ? (body as Record<string, unknown>).reference
      : undefined;
  if (typeof reference !== "string" || !/^GJ-[0-9A-F]{12}$/.test(reference))
    return Response.json({ error: "Invalid order reference." }, { status: 400 });

  const order = await getOrderByReference(reference);
  if (!order)
    return Response.json({ error: "Order not found." }, { status: 404 });
  if (order.payment_status === "paid")
    return Response.json(
      { error: "This order is already paid. Thank you!" },
      { status: 400 }
    );
  if (order.currency !== "NGN")
    return Response.json(
      {
        error:
          "This order is completed on WhatsApp. Please continue in your chat with the creator.",
      },
      { status: 400 }
    );

  if (!paystackConfigured())
    return Response.json(
      {
        error:
          "Online payment is not live yet. Please check back soon or contact us to reserve your copy.",
      },
      { status: 503 }
    );

  // Paystack rejects reused references, so each attempt gets its own.
  const attemptRef = `${order.reference}-R${randomBytes(3)
    .toString("hex")
    .toUpperCase()}`;
  await setPaystackRef(order.id, attemptRef);

  try {
    const { authorization_url } = await initializeTransaction({
      email: order.email,
      amountKobo: order.total_kobo,
      reference: attemptRef,
      callbackUrl: `${new URL(request.url).origin}/checkout/verify`,
      metadata: {
        order_id: order.id,
        package: order.package,
        quantity: order.quantity,
        retry: true,
      },
    });
    await logEvent(order.id, "Payment retry initialized");
    return Response.json({ authorizationUrl: authorization_url });
  } catch {
    await logEvent(order.id, "Paystack retry initialization failed");
    return Response.json(
      { error: "Could not start the payment. Please try again." },
      { status: 502 }
    );
  }
}