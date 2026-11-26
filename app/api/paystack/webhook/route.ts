import {
  getOrderByPaystackRef,
  markFailed,
  markPaid,
  type Order,
} from "@/lib/db";
import { validWebhookSignature, verifyTransaction } from "@/lib/paystack";
import {
  sendAdminNewOrderAlert,
  sendOrderConfirmation,
  sendPaymentFailedAlert,
  sendPaymentFailedCustomerEmail,
  siteUrl,
} from "@/lib/email";

export async function POST(request: Request) {
  const rawBody = await request.text();
  if (!validWebhookSignature(rawBody, request.headers.get("x-paystack-signature")))
    return new Response("Invalid signature", { status: 401 });

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }

  if (event.event !== "charge.success" && event.event !== "charge.failed")
    return new Response("OK");

  const reference = event.data?.reference;
  if (!reference) return new Response("OK");
  const order = await getOrderByPaystackRef(reference);
  if (!order) return new Response("OK");

  // Never trust the webhook payload alone — confirm with Paystack's API.
  const verified = await verifyTransaction(reference);
  if (!verified) return new Response("OK");

  if (
    verified.status === "success" &&
    verified.amount === order.total_kobo &&
    verified.currency === order.currency
  ) {
    if (await markPaid(order.id)) {
      const paidOrder = (await getOrderByPaystackRef(reference)) as Order;
      await sendOrderConfirmation(paidOrder);
      await sendAdminNewOrderAlert(paidOrder);
    }
  } else if (verified.status === "failed") {
    if (await markFailed(order.id)) {
      await sendPaymentFailedAlert(order);
      await sendPaymentFailedCustomerEmail(
        order,
        `${siteUrl()}/pay/${order.reference}`
      );
    }
  }

  return new Response("OK");
}