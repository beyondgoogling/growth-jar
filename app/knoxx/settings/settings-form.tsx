"use client";

import { useActionState } from "react";
import { saveSettingsAction } from "../actions";
import { btnPrimary, inputClass, labelClass } from "../styles";

const fields = [
  { name: "journalPrice", label: "Journal only price (₦)" },
  { name: "completePrice", label: "Complete Experience price (₦)" },
] as const;

export function SettingsForm({
  initial,
}: {
  initial: { journalPrice: number; completePrice: number };
}) {
  const [state, action, pending] = useActionState(saveSettingsAction, null);
  return (
    <form action={action} className="space-y-5">
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
            max={10000000}
            step={100}
            required
            defaultValue={initial[f.name]}
            className={inputClass}
          />
        </div>
      ))}
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