"use client";

import { useActionState } from "react";
import { changePasswordAction, updateProfileAction } from "../actions";
import { btnPrimary, inputClass, labelClass } from "../styles";

export function UpdateProfileForm({
  name,
  email,
  roleLabel,
}: {
  name: string;
  email: string;
  roleLabel: string;
}) {
  const [state, action, pending] = useActionState(updateProfileAction, null);
  return (
    <form action={action} className="mt-4 space-y-4">
      <div>
        <label htmlFor="profile-name" className={labelClass}>
          Name
        </label>
        <input
          id="profile-name"
          name="name"
          defaultValue={name}
          key={name}
          required
          minLength={2}
          maxLength={100}
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="profile-email" className={labelClass}>
          Email
        </label>
        <input
          id="profile-email"
          name="email"
          type="email"
          defaultValue={email}
          key={email}
          required
          maxLength={254}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-ink-soft">
          This is the address you sign in with.
        </p>
      </div>
      <div>
        <p className={labelClass}>Role</p>
        <p className="text-sm">{roleLabel}</p>
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
        {pending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}

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