import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getSettings } from "@/lib/db";
import { CheckoutForm } from "./checkout-form";

export const metadata = {
  title: "Checkout — The Growth Jar Experience",
  robots: { index: false },
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 md:py-16">
      <div className="mb-10 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-lg font-semibold uppercase tracking-[0.12em] text-sage-dark"
        >
          The Growth Jar
        </Link>
        <Link
          href="/"
          className="text-xs uppercase tracking-[0.2em] text-ink-soft hover:text-sage-dark"
        >
          Back to site
        </Link>
      </div>
      <h1 className="font-serif text-4xl font-medium text-sage-dark md:text-5xl">
        Pre-order your Growth Jar
      </h1>
      <p className="mt-3 text-ink-soft">
        Tell us where to send it. Payment is securely handled by Paystack.
      </p>
      <Suspense
        fallback={<p className="mt-10 text-ink-soft">Loading checkout…</p>}
      >
        <CheckoutLoader />
      </Suspense>
    </main>
  );
}

async function CheckoutLoader() {
  await connection();
  return <CheckoutForm settings={await getSettings()} />;
}