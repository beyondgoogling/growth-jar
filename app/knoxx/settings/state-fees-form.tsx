"use client";

import { useActionState } from "react";
import { NIGERIAN_STATES } from "@/lib/nigeria";
import { saveStateShippingAction } from "../actions";
import { btnPrimary, inputClass, labelClass } from "../styles";

export function StateFeesForm({
  initialFees,
}: {
  initialFees: Record<string, number>;
}) {
  const [state, action, pending] = useActionState(saveStateShippingAction, null);
  return (
    <form action={action} className="mt-5 space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
        {NIGERIAN_STATES.map((s) => (
          <div key={s}>
            <label htmlFor={`fee-${s}`} className={labelClass}>
              {s} (₦)
            </label>
            <input
              id={`fee-${s}`}
              name={`fee:${s}`}
              type="number"
              min={0}
              max={10000000}
              step={100}
              required
              defaultValue={initialFees[s]}
              className={inputClass}
            />
          </div>
        ))}
      </div>
      {state?.message && (
        <p
          role="status"
          className={`rounded-xl p-3 text-sm ring-1 ${
            state.ok
              ? "bg-sage/15 text-sage-dark ring-sage/30"
              : "bg-red-50 text-red-700 ring-red-200"
          }`}
        >
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Saving…" : "Save shipping fees"}
      </button>
    </form>
  );
}