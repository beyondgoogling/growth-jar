"use client";

import { useActionState } from "react";
import { saveSettingsAction } from "../actions";
import { btnPrimary, inputClass, labelClass } from "../styles";

const fields = [
  { name: "journalPrice", label: "Journal only price (₦)", step: 100, max: 10000000 },
  { name: "completePrice", label: "Complete Experience price (₦)", step: 100, max: 10000000 },
  { name: "journalPriceUsd", label: "Journal only price ($)", step: 0.01, max: 100000 },
  { name: "completePriceUsd", label: "Complete Experience price ($)", step: 0.01, max: 100000 },
] as const;

export function SettingsForm({
  initial,
}: {
  initial: {
    journalPrice: number;
    completePrice: number;
    journalPriceUsd: number;
    completePriceUsd: number;
  };
}) {
  const [state, action, pending] = useActionState(saveSettingsAction, null);
  return (
    <form action={action} className="mt-4 space-y-5">
      {fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={f.name} className={labelClass}>
            {f.label}
          </label>
          <input
            id={f.name}
            name={f.name}
            type="number"
            min={0}
            max={f.max}
            step={f.step}
            required
            defaultValue={initial[f.name]}
            className={inputClass}
          />
        </div>
      ))}
      <p className="text-xs text-ink-soft">
        Dollar prices are shown to visitors outside Nigeria. Payment is always
        collected in naira.
      </p>
      {state?.message && (
        <p role="status" className="rounded-xl bg-sage/15 p-3 text-sm text-sage-dark ring-1 ring-sage/30">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}