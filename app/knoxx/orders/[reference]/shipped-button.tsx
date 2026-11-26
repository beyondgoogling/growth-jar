"use client";

import { useActionState } from "react";
import { notifyShippedAction } from "../../actions";
import { btnGold } from "../../styles";

export function ShippedEmailButton({
  reference,
  eligible,
  pickup,
}: {
  reference: string;
  eligible: boolean;
  pickup: boolean;
}) {
  const [state, action, pending] = useActionState(notifyShippedAction, null);
  return (
    <form action={action}>
      <input type="hidden" name="reference" value={reference} />
      <button type="submit" disabled={pending || !eligible} className={btnGold}>
        {pending
          ? "Sending email…"
          : pickup
            ? "✉ Email customer: ready for pick up"
            : "✉ Email customer: order shipped"}
      </button>
      {!eligible && (
        <p className="mt-2 text-xs text-ink-soft">
          {pickup
            ? "Available once the order is paid and marked as Shipped (ready for pick up)."
            : "Available once the order is paid and marked as Shipped."}
        </p>
      )}
      {state?.message && (
        <p
          role="status"
          className={`mt-3 rounded-xl p-3 text-sm ring-1 ${
            state.ok
              ? "bg-sage/15 text-sage-dark ring-sage/30"
              : "bg-red-50 text-red-700 ring-red-200"
          }`}
        >
          {state.message}
        </p>
      )}
    </form>
  );
}