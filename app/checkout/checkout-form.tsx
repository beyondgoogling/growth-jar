"use client";

import { useState } from "react";
import type { Settings, StateFee } from "@/lib/db";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { naira, DELIVERY_LABELS, PACKAGE_LABELS } from "@/lib/format";

const inputClass =
  "w-full rounded-lg border border-sage/40 bg-parchment px-4 py-3 text-ink outline-none focus:border-sage-deep focus:ring-2 focus:ring-sage/30";
const labelClass =
  "mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-sage-deep";

const METHOD_NOTES = {
  delivery: "We ship to your address after the official launch.",
  pickup: "Collect in person. No shipping fee.",
} as const;

export function CheckoutForm({
  settings,
  stateFees,
}: {
  settings: Settings;
  stateFees: Record<string, StateFee>;
}) {
  const [pkg, setPkg] = useState<"journal" | "complete">("complete");
  const [method, setMethod] = useState<"pickup" | "delivery">(
    settings.deliveryEnabled ? "delivery" : "pickup"
  );
  const [quantity, setQuantity] = useState(1);
  const [state, setState] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const prices = {
    journal: settings.journalPriceKobo,
    complete: settings.completePriceKobo,
  };
  const unit = prices[pkg];
  const feesOn = settings.shippingFeesEnabled;
  const shipping =
    method === "delivery" && feesOn ? (stateFees[state]?.kobo ?? null) : 0;
  const total = unit * quantity + (shipping ?? 0);
  const methods = (["delivery", "pickup"] as const).filter((m) =>
    m === "delivery" ? settings.deliveryEnabled : settings.pickupEnabled
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package: pkg,
          deliveryMethod: method,
          quantity,
          customerName: data.get("customerName"),
          email: data.get("email"),
          phone: data.get("phone"),
          addressLine: data.get("addressLine"),
          city: data.get("city"),
          state: data.get("state"),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      window.location.href = json.authorizationUrl;
    } catch {
      setError("Network error. Please check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-10">
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
                {naira(prices[p])}
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

      <fieldset>
        <legend className="mb-4 font-serif text-2xl font-semibold text-sage-dark">
          2. How would you like to receive it?
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {methods.map((m) => (
            <label
              key={m}
              className={`cursor-pointer rounded-2xl border-2 p-5 transition-colors ${
                method === m
                  ? "border-sage-deep bg-parchment"
                  : "border-sage/30 bg-parchment/50 hover:border-sage/60"
              }`}
            >
              <input
                type="radio"
                name="deliveryMethod"
                value={m}
                checked={method === m}
                onChange={() => setMethod(m)}
                className="sr-only"
              />
              <span className="block font-serif text-xl font-semibold text-sage-dark">
                {DELIVERY_LABELS[m]}
              </span>
              <span className="mt-1 block text-sm text-ink-soft">
                {METHOD_NOTES[m]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-4 font-serif text-2xl font-semibold text-sage-dark">
          3. Your details
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="customerName" className={labelClass}>
              Full name
            </label>
            <input
              id="customerName"
              name="customerName"
              required
              maxLength={100}
              autoComplete="name"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              maxLength={254}
              autoComplete="email"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              maxLength={20}
              autoComplete="tel"
              className={inputClass}
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-4 font-serif text-2xl font-semibold text-sage-dark">
          {method === "pickup" ? "4. Your address" : "4. Shipping address"}
        </legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="addressLine" className={labelClass}>
              Street address
            </label>
            <input
              id="addressLine"
              name="addressLine"
              required
              maxLength={300}
              autoComplete="street-address"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="city" className={labelClass}>
              City
            </label>
            <input
              id="city"
              name="city"
              required
              maxLength={100}
              autoComplete="address-level2"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="state" className={labelClass}>
              State
            </label>
            <select
              id="state"
              name="state"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              autoComplete="address-level1"
              className={inputClass}
            >
              <option value="">Choose your state…</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
        {method === "pickup" ? (
          <p className="mt-3 text-sm text-ink-soft">
            Pick up is free. After payment, a sales representative will reach
            out to you shortly to arrange your collection.
          </p>
        ) : feesOn && shipping !== null ? (
          <p
            role="status"
            className="mt-3 rounded-lg bg-sage/15 p-3 text-sm text-sage-dark ring-1 ring-sage/30"
          >
            Shipping fee for {state}: <strong>{naira(shipping)}</strong>. It has
            been added to your total below.
          </p>
        ) : feesOn ? (
          <p className="mt-3 text-sm text-ink-soft">
            Delivery within Nigeria. Choose your state to see its shipping fee.
          </p>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">
            Delivery within Nigeria. No shipping fee is added at checkout.
          </p>
        )}
      </fieldset>

      <div className="rounded-2xl border border-sage/30 bg-parchment p-6">
        <h2 className="font-serif text-2xl font-semibold text-sage-dark">
          Order summary
        </h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">
              {PACKAGE_LABELS[pkg]} × {quantity}
            </dt>
            <dd>{naira(unit * quantity)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Delivery</dt>
            <dd>{DELIVERY_LABELS[method]}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">
              {method === "pickup"
                ? "Pick up"
                : `Shipping${state ? ` (${state})` : ""}`}
            </dt>
            <dd>
              {method === "pickup" || !feesOn
                ? "No fee"
                : shipping !== null
                  ? naira(shipping)
                  : "Select a state"}
            </dd>
          </div>
          <div className="flex justify-between border-t border-sage/30 pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd className="text-gold">{naira(total)}</dd>
          </div>
        </dl>
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !state}
          className="mt-6 w-full rounded-full bg-sage-dark px-8 py-4 text-center text-xs font-semibold uppercase tracking-[0.2em] text-parchment transition-colors hover:bg-gold disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy
            ? "Opening secure payment…"
            : !state
              ? "Choose your state to continue"
              : `Pay ${naira(total)} with Paystack`}
        </button>
        <p className="mt-3 text-center text-xs text-ink-soft">
          You&apos;ll be redirected to Paystack&apos;s secure checkout. We never
          see or store your card details.
        </p>
      </div>
    </form>
  );
}