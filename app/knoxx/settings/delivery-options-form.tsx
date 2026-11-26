"use client";

import { useActionState } from "react";
import { saveDeliveryOptionsAction } from "../actions";
import { btnPrimary } from "../styles";

const options = [
  {
    name: "pickupEnabled",
    label: "Offer pick up",
    note: "Customers can choose to collect in person. No shipping fee is charged for pick up.",
  },
  {
    name: "deliveryEnabled",
    label: "Offer home delivery",
    note: "Customers can choose to have their order shipped to their address.",
  },
  {
    name: "shippingFeesEnabled",
    label: "Charge per-state shipping fees",
    note: "On: each state's fee is shown at checkout and added to the total. Off: states are listed without prices and no shipping fee is added.",
  },
] as const;

export function DeliveryOptionsForm({
  initial,
}: {
  initial: {
    pickupEnabled: boolean;
    deliveryEnabled: boolean;
    shippingFeesEnabled: boolean;
  };
}) {
  const [state, action, pending] = useActionState(saveDeliveryOptionsAction, null);
  return (
    <form action={action} className="mt-4 space-y-4">
      {options.map((o) => (
        <label
          key={o.name}
          className="flex cursor-pointer items-start gap-3 rounded-xl border border-sage/25 bg-cream/60 p-4"
        >
          <input
            type="checkbox"
            name={o.name}
            defaultChecked={initial[o.name]}
            className="mt-0.5 h-5 w-5 shrink-0 accent-sage-deep"
          />
          <span>
            <span className="block text-sm font-semibold text-sage-dark">
              {o.label}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
              {o.note}
            </span>
          </span>
        </label>
      ))}
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
        {pending ? "Saving…" : "Save delivery options"}
      </button>
    </form>
  );
}
