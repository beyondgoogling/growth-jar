"use client";

import { useActionState } from "react";
import { changePasswordAction } from "../actions";
import { btnPrimary, inputClass, labelClass } from "../styles";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);
  return (
    <form action={action} className="mt-4 space-y-4">
      <div>
        <label htmlFor="current-password" className={labelClass}>
          Current password
        </label>
        <input
          id="current-password"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="new-password" className={labelClass}>
          New password
        </label>
        <input
          id="new-password"
          name="newPassword"
          type="password"
          required
          minLength={10}
          maxLength={200}
          autoComplete="new-password"
          placeholder="At least 10 characters"
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="confirm-password" className={labelClass}>
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
          className={inputClass}
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
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}