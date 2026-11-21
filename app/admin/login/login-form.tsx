"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
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
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-sage-deep"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-xl border border-sage/30 bg-cream px-4 py-3 text-sm outline-none transition-colors focus:border-sage-deep focus:ring-2 focus:ring-sage/25"
        />
      </div>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-sage-dark px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-parchment transition-colors hover:bg-gold disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}