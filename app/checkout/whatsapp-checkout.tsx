"use client";

import { useState } from "react";
import type { Settings } from "@/lib/db";
import { PACKAGE_LABELS, usd } from "@/lib/format";
import { whatsappUrl } from "@/lib/contact";
import { WhatsAppIcon } from "../components/social";

const inputClass =
  "w-full rounded-lg border border-sage/40 bg-parchment px-4 py-3 text-ink outline-none focus:border-sage-deep focus:ring-2 focus:ring-sage/30";
const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-sage-deep";

const steps = [
  {
    title: "Send your order",
    body: "The chat opens with your package, quantity and total already written. Just press send.",
  },
  {
    title: "Confirm delivery",
    body: "The creator replies personally with delivery options and the cost to your country.",
  },
  {
    title: "Complete payment",
    body: "Payment is arranged directly in the chat, and your Growth Jar is reserved for launch.",
  },
];

export function WhatsappCheckout({ settings }: { settings: Settings }) {
  const [pkg, setPkg] = useState<"journal" | "complete">("complete");
  const [quantity, setQuantity] = useState(1);

  const prices = {
    journal: settings.journalPriceUsdCents,
    complete: settings.completePriceUsdCents,
  };
  const total = prices[pkg] * quantity;
  const message = [
    "Hello! I'd like to pre-order The Growth Jar Experience.",
    "",
    `Package: ${PACKAGE_LABELS[pkg]}`,
    `Quantity: ${quantity}`,
    `Order total: ${usd(total)} (USD)`,
    "",
    "I'm ordering from outside Nigeria. Please help me complete my order.",
  ].join("\n");

  return (
    <div className="mt-10 space-y-10">
      <p
        role="status"
        className="rounded-lg bg-sage/15 p-3 text-sm text-sage-dark ring-1 ring-sage/30"
      >
        You&apos;re ordering from outside Nigeria, so you&apos;ll see dollar
        prices and complete your pre-order personally with the creator on
        WhatsApp.
      </p>

      <fieldset>
        <legend className="mb-4 font-serif text-2xl font-semibold text-sage-dark">
          1. Choose your package
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {(["journal", "complete"] as const).map((p) => (
            <label
              key={p}
              className={`cursor-pointer rounded-2xl border-2 p-5 transition-colors ${
                pkg === p
                  ? "border-sage-deep bg-parchment"
                  : "border-sage/30 bg-parchment/50 hover:border-sage/60"
              }`}
            >
              <input
                type="radio"
                name="package"
                value={p}
                checked={pkg === p}
                onChange={() => setPkg(p)}
                className="sr-only"
              />
              <span className="block font-serif text-xl font-semibold text-sage-dark">
                {PACKAGE_LABELS[p]}
              </span>
              <span className="mt-1 block text-lg text-gold">
                {usd(prices[p])}
              </span>
            </label>
          ))}
        </div>
        <div className="mt-4">
          <label htmlFor="quantity" className={labelClass}>
            Quantity
          </label>
          <select
            id="quantity"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className={`${inputClass} sm:w-40`}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </fieldset>

      <div className="rounded-2xl border border-sage/30 bg-parchment p-6">
        <h2 className="font-serif text-2xl font-semibold text-sage-dark">
          2. Your order
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">
              {PACKAGE_LABELS[pkg]} × {quantity}
            </dt>
            <dd>{usd(total)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Delivery to your country</dt>
            <dd>Arranged in chat</dd>
          </div>
          <div className="flex justify-between border-t border-sage/30 pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd className="text-gold">{usd(total)}</dd>
          </div>
        </dl>
        <a
          href={whatsappUrl(message)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-full bg-sage-dark px-8 py-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-parchment transition-colors hover:bg-gold"
        >
          <WhatsAppIcon className="h-5 w-5 shrink-0" />
          <span>Order on WhatsApp · {usd(total)}</span>
        </a>
        <p className="mt-3 text-center text-xs text-ink-soft">
          Opens a WhatsApp chat with the creator. Your order details are typed
          into the message for you — just press send.
        </p>
      </div>

      <div className="rounded-2xl border border-sage/30 bg-parchment/50 p-6">
        <h2 className="font-serif text-2xl font-semibold text-sage-dark">
          How international ordering works
        </h2>
        <ol className="mt-5 space-y-5">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="font-serif text-2xl italic leading-none text-gold"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sage-deep">
                  {s.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-xs text-ink-soft">
          Prices are shown in US dollars. The creator confirms the final total
          and delivery details with you in the chat.
        </p>
      </div>
    </div>
  );
}