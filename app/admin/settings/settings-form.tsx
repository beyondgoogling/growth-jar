"use client";

import { useActionState } from "react";
import { saveSettingsAction } from "../actions";

const fields = [
  { name: "journalPrice", label: "Journal only price (₦)" },
  { name: "completePrice", label: "Complete Experience price (₦)" },
  { name: "shippingFee", label: "Flat shipping fee (₦)" },
] as const;

export function SettingsForm({
  initial,
}: {
  initial: { journalPrice: number; completePrice: number; shippingFee: number };
}) {
  const [state, action, pending] = useActionState(saveSettingsAction, null);
  return (
    <form action={action} className="mt-8 space-y-5">
      {fields.map((f) => (
        <div key={f.name}>
          <label
            htmlFor={f.name}
            className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-sage-deep"
          >
            {f.label}
          </label>
          <input
            id={f.name}
            name={f.name}
            type="number"
            min={0}
            max={10000000}
            step={100}
            required
            defaultValue={initial[f.name]}
            className="w-full rounded-lg border border-sage/40 bg-parchment px-4 py-3 outline-none focus:border-sage-deep focus:ring-2 focus:ring-sage/30"
          />
        </div>
      ))}
      {state?.message && (
        <p role="status" className="rounded-lg bg-sage/15 p-3 text-sm text-sage-dark">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-sage-dark px-8 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-parchment hover:bg-gold disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}