"use client";

import { useActionState } from "react";
import { saveEmailSettingsAction, sendTestEmailAction } from "../actions";
import { btnGold, btnPrimary, inputClass, labelClass } from "../styles";

function Message({ state }: { state: { message: string; ok: boolean } | null }) {
  if (!state?.message) return null;
  return (
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
  );
}

export function EmailSettingsForm({
  initial,
  initial2,
}: {
  initial: string;
  initial2: string;
}) {
  const [state, action, pending] = useActionState(saveEmailSettingsAction, null);
  return (
    <form action={action} className="mt-4 space-y-4">
      <div>
        <label htmlFor="notifyEmail" className={labelClass}>
          Notification email 1
        </label>
        <input
          id="notifyEmail"
          name="notifyEmail"
          type="email"
          maxLength={254}
          defaultValue={initial}
          placeholder="you@yourdomain.com"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="notifyEmail2" className={labelClass}>
          Notification email 2 (optional)
        </label>
        <input
          id="notifyEmail2"
          name="notifyEmail2"
          type="email"
          maxLength={254}
          defaultValue={initial2}
          placeholder="partner@yourdomain.com"
          className={inputClass}
        />
      </div>
      <Message state={state} />
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

export function TestEmailForm({ defaultTo }: { defaultTo: string }) {
  const [state, action, pending] = useActionState(sendTestEmailAction, null);
  return (
    <form action={action} className="mt-4 space-y-4">
      <div>
        <label htmlFor="testTo" className={labelClass}>
          Send test to
        </label>
        <input
          id="testTo"
          name="testTo"
          type="email"
          required
          maxLength={254}
          defaultValue={defaultTo}
          className={inputClass}
        />
      </div>
      <Message state={state} />
      <button type="submit" disabled={pending} className={btnGold}>
        {pending ? "Sending…" : "✉ Send test email"}
      </button>
    </form>
  );
}