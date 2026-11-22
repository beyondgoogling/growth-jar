"use client";

import Link from "next/link";
import { useActionState } from "react";
import { resetPasswordWithTokenAction } from "../actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(resetPasswordWithTokenAction, null);
  if (state?.ok)
    return (
      <div className="mt-8 space-y-5">
        <p role="status" className="rounded-xl bg-sage/15 p-3 text-sm text-sage-dark ring-1 ring-sage/30">
          {state.message}
        </p>
        <Link
          href="/knoxx/login"
          className="block w-full rounded-full bg-sage-dark px-6 py-3.5 text-center text-xs font-semibold uppercase tracking-[0.2em] text-parchment transition-colors hover:bg-gold"
        >
          Sign in
        </Link>
      </div>
    );
  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="token" value={token} />
      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-sage-deep"
        >
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          maxLength={200}
          autoComplete="new-password"
          placeholder="At least 10 characters"
          className="w-full rounded-xl border border-sage/30 bg-cream px-4 py-3 text-sm outline-none transition-colors focus:border-sage-deep focus:ring-2 focus:ring-sage/25"
        />
      </div>
      <div>
        <label
          htmlFor="confirm-password"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-sage-deep"
        >
          Confirm new password
        </label>
        <input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          required
          minLength={10}
          maxLength={200}
          autoComplete="new-password"
          className="w-full rounded-xl border border-sage/30 bg-cream px-4 py-3 text-sm outline-none transition-colors focus:border-sage-deep focus:ring-2 focus:ring-sage/25"
        />
      </div>
      {state?.message && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-sage-dark px-6 py-3.5 text-xs font-semibold uppercase tracking-[0.2em] text-parchment transition-colors hover:bg-gold disabled:opacity-60"
      >
        {pending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}