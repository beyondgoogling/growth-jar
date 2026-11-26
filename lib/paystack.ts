import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const BASE = "https://api.paystack.co";

export function paystackConfigured(): boolean {
  const key = process.env.PAYSTACK_SECRET_KEY ?? "";
  return (key.startsWith("sk_") || key.startsWith("rk_")) && !key.includes("REPLACE");
}

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("PAYSTACK_SECRET_KEY is not set");
  return key;
}

export async function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, unknown>;
}): Promise<{ authorization_url: string }> {
  const res = await fetch(`${BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      currency: "NGN",
      reference: params.reference,
      callback_url: params.callbackUrl,
      metadata: params.metadata,
    }),
  });
  const data = await res.json();
  if (!data.status) throw new Error(data.message ?? "Paystack initialize failed");
  return data.data;
}

export type VerifiedTransaction = {
  status: "success" | "failed" | "abandoned" | "pending";
  amount: number;
  currency: string;
  reference: string;
};

export async function verifyTransaction(
  reference: string
): Promise<VerifiedTransaction | null> {
  const res = await fetch(
    `${BASE}/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey()}` } }
  );
  const data = await res.json();
  if (!data.status) return null;
  return {
    status: data.data.status,
    amount: data.data.amount,
    currency: data.data.currency,
    reference: data.data.reference,
  };
}

export function validWebhookSignature(
  rawBody: string,
  signature: string | null
): boolean {
  if (!signature) return false;
  // Paystack signs webhooks with the secret key, even when API calls use a restricted key.
  const key = process.env.PAYSTACK_WEBHOOK_SECRET || secretKey();
  const expected = createHmac("sha512", key).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}