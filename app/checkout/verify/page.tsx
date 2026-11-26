import { Suspense } from "react";
import Link from "next/link";
import { getOrderByReference, markFailed, markPaid } from "@/lib/db";
import { paystackConfigured, verifyTransaction } from "@/lib/paystack";
import { sendAdminNewOrderAlert, sendOrderConfirmation } from "@/lib/email";
import { naira, PACKAGE_LABELS } from "@/lib/format";

export const metadata = {
  title: "Order status — The Growth Jar Experience",
  robots: { index: false },
};

export default function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16 text-center">
      <Link
        href="/"
        className="font-serif text-lg font-semibold uppercase tracking-[0.12em] text-sage-dark"
      >
        The Growth Jar
      </Link>
      <Suspense fallback={<p className="mt-10 text-ink-soft">Checking your payment…</p>}>
        <VerifyResult searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function VerifyResult({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const reference = typeof params.reference === "string" ? params.reference : "";
  const order = reference ? await getOrderByReference(reference) : undefined;

  if (!order) {
    return (
      <Card
        title="Order not found"
        body="We couldn't find that order. If you completed a payment, please contact us with your payment receipt and we'll sort it out."
      />
    );
  }

  if (order.payment_status === "pending" && paystackConfigured()) {
    const verified = await verifyTransaction(order.paystack_ref ?? order.reference);
    if (
      verified?.status === "success" &&
      verified.amount === order.total_kobo &&
      verified.currency === order.currency
    ) {
      if (await markPaid(order.id)) {
        order.payment_status = "paid";
        await sendOrderConfirmation(order);
        await sendAdminNewOrderAlert(order);
      } else {
        order.payment_status = "paid";
      }
    } else if (verified?.status === "failed") {
      await markFailed(order.id);
      order.payment_status = "failed";
    }
  }

  if (order.payment_status === "paid") {
    return (
      <Card
        tone="success"
        title="Thank you — your pre-order is confirmed!"
        body={
          order.delivery_method === "pickup"
            ? `We've received your payment of ${naira(order.total_kobo)} for ${
                PACKAGE_LABELS[order.package]
              } × ${order.quantity}. You chose pick up — a sales representative will reach out to you shortly to help arrange your collection. Keep your order reference safe.`
            : `We've received your payment of ${naira(order.total_kobo)} for ${
                PACKAGE_LABELS[order.package]
              } × ${order.quantity}. Your Growth Jar will ship to ${order.address_line}, ${
                order.city
              }, ${order.state} after the official launch on 12 December 2026. Keep your order reference safe.`
        }
        reference={order.reference}
      />
    );
  }

  if (order.payment_status === "failed") {
    return (
      <Card
        tone="error"
        title="Payment didn't go through"
        body="Your order is saved but the payment failed. You can try again below — or contact us if money left your account."
        reference={order.reference}
        action={{ href: `/pay/${order.reference}`, label: "Try payment again" }}
      />
    );
  }

  return (
    <Card
      title="Payment pending"
      body="We haven't received confirmation from Paystack yet. If you completed payment, this page will update shortly — refresh in a minute. Your order is saved either way."
      reference={order.reference}
    />
  );
}

function Card({
  title,
  body,
  reference,
  tone = "neutral",
  action,
}: {
  title: string;
  body: string;
  reference?: string;
  tone?: "success" | "error" | "neutral";
  action?: { href: string; label: string };
}) {
  return (
    <div className="mt-10 rounded-2xl border border-sage/30 bg-parchment p-8">
      <h1
        className={`font-serif text-3xl font-medium ${
          tone === "success"
            ? "text-sage-deep"
            : tone === "error"
              ? "text-red-700"
              : "text-sage-dark"
        }`}
      >
        {title}
      </h1>
      <p className="mt-4 leading-relaxed text-ink-soft">{body}</p>
      {reference && (
        <p className="mt-4 text-sm">
          Order reference:{" "}
          <span className="font-mono font-semibold text-sage-dark">{reference}</span>
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mr-3 mt-6 inline-block rounded-full bg-sage-dark px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-parchment hover:bg-gold"
        >
          {action.label}
        </Link>
      )}
      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-sage-dark px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-parchment hover:bg-gold"
      >
        Back to the site
      </Link>
    </div>
  );
}