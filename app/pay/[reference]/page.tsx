import { Suspense } from "react";
import Link from "next/link";
import { getOrderByReference } from "@/lib/db";
import { naira, DELIVERY_LABELS, PACKAGE_LABELS } from "@/lib/format";
import { ResumeButton } from "./resume-button";

export const metadata = {
  title: "Complete your payment — The Growth Jar Experience",
  robots: { index: false },
};

export default function PayPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-16">
      <Link
        href="/"
        className="font-serif text-lg font-semibold uppercase tracking-[0.12em] text-sage-dark"
      >
        The Growth Jar
      </Link>
      <Suspense fallback={<p className="mt-10 text-ink-soft">Loading your order…</p>}>
        <PayContent params={params} />
      </Suspense>
    </main>
  );
}

async function PayContent({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const order = await getOrderByReference(reference);

  if (!order) {
    return (
      <div className="mt-10 rounded-2xl border border-sage/30 bg-parchment p-8">
        <h1 className="font-serif text-3xl font-medium text-sage-dark">
          Order not found
        </h1>
        <p className="mt-4 leading-relaxed text-ink-soft">
          We couldn&apos;t find that order. Check the link in your email, or
          contact us with your name and we&apos;ll help you sort it out.
        </p>
        <BackLink />
      </div>
    );
  }

  if (order.payment_status === "paid") {
    return (
      <div className="mt-10 rounded-2xl border border-sage/30 bg-parchment p-8">
        <h1 className="font-serif text-3xl font-medium text-sage-deep">
          This order is already confirmed
        </h1>
        <p className="mt-4 leading-relaxed text-ink-soft">
          We&apos;ve received your payment of {naira(order.total_kobo)} for{" "}
          {PACKAGE_LABELS[order.package]} × {order.quantity}.{" "}
          {order.delivery_method === "pickup"
            ? "You chose pick up — a sales representative will reach out to you shortly to help arrange your collection."
            : "Your Growth Jar will ship after the official launch on 12 December 2026."}{" "}
          Keep your order reference safe.
        </p>
        <p className="mt-4 text-sm">
          Order reference:{" "}
          <span className="font-mono font-semibold text-sage-dark">
            {order.reference}
          </span>
        </p>
        <BackLink />
      </div>
    );
  }

  return (
    <div className="mt-10 rounded-2xl border border-sage/30 bg-parchment p-8">
      <h1 className="font-serif text-3xl font-medium text-sage-dark">
        Complete your pre-order
      </h1>
      <p className="mt-4 leading-relaxed text-ink-soft">
        Hi {order.customer_name}, your order is saved and waiting for payment.
        Everything below is exactly as you left it.
      </p>
      {order.payment_status === "failed" && (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
          Your last payment attempt didn&apos;t go through — no money was taken.
          You can try again below.
        </p>
      )}
      <dl className="mt-6 space-y-2.5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">Package</dt>
          <dd className="text-right font-medium">
            {PACKAGE_LABELS[order.package]} × {order.quantity}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">Delivery</dt>
          <dd className="font-medium">
            {DELIVERY_LABELS[order.delivery_method]}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">Shipping</dt>
          <dd className="font-medium">
            {order.delivery_method === "pickup"
              ? "No fee (pick up)"
              : naira(order.shipping_kobo)}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-sage/15 pt-3">
          <dt className="font-semibold">Total</dt>
          <dd className="font-serif text-xl font-semibold text-gold">
            {naira(order.total_kobo)}
          </dd>
        </div>
      </dl>
      <div className="mt-6 rounded-xl bg-cream p-5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sage-deep">
          {order.delivery_method === "pickup" ? "Your address (pick up)" : "Ship to"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed">
          {order.address_line}
          <br />
          {order.city}, {order.state}
          <br />
          {order.country}
        </p>
      </div>
      <p className="mt-4 text-sm">
        Order reference:{" "}
        <span className="font-mono font-semibold text-sage-dark">
          {order.reference}
        </span>
      </p>
      <ResumeButton reference={order.reference} />
      <p className="mt-4 text-xs text-ink-soft">
        Changed your mind? Simply close this page — nothing is charged until
        you pay.
      </p>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/"
      className="mt-6 inline-block rounded-full bg-sage-dark px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-parchment hover:bg-gold"
    >
      Back to the site
    </Link>
  );
}