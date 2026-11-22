"use client";

import { useActionState } from "react";
import { forgotPasswordAction } from "../actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, null);
  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-sage-deep"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="username"
          className="w-full rounded-xl border border-sage/30 bg-cream px-4 py-3 text-sm outline-none transition-colors focus:border-sage-deep focus:ring-2 focus:ring-sage/25"
        />
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
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-sage-dark px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-parchment transition-colors hover:bg-gold disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}