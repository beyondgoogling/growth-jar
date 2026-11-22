"use client";

import { useActionState, useState } from "react";
import {
  createAdminAction,
  deleteAdminAction,
  resetAdminPasswordAction,
  updateAdminProfileAction,
} from "../actions";
import { btnPrimary, inputClass, labelClass } from "../styles";

export function CreateAdminForm() {
  const [state, action, pending] = useActionState(createAdminAction, null);
  return (
    <form action={action} className="mt-4 space-y-4">
      <div>
        <label htmlFor="new-name" className={labelClass}>
          Name
        </label>
        <input id="new-name" name="name" required maxLength={100} className={inputClass} />
      </div>
      <div>
        <label htmlFor="new-email" className={labelClass}>
          Email
        </label>
        <input id="new-email" name="email" type="email" required maxLength={254} className={inputClass} />
      </div>
      <div>
        <label htmlFor="new-role" className={labelClass}>
          Role
        </label>
        <select id="new-role" name="role" defaultValue="staff" className={inputClass}>
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
          <option value="owner">Owner</option>
        </select>
      </div>
      <div>
        <label htmlFor="new-password" className={labelClass}>
          Temporary password
        </label>
        <input
          id="new-password"
          name="password"
          type="text"
          required
          minLength={10}
          maxLength={200}
          placeholder="At least 10 characters"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-ink-soft">
          Share it privately; they can change it themselves under Account after
          signing in.
        </p>
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
        {pending ? "Creating…" : "Create admin"}
      </button>
    </form>
  );
}

export function EditAdminProfileForm({
  id,
  name,
  email,
}: {
  id: number;
  name: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(updateAdminProfileAction, null);
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-gold hover:text-sage-dark"
      >
        Edit name / email
      </button>
    );
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        name="name"
        defaultValue={name}
        key={name}
        required
        minLength={2}
        maxLength={100}
        aria-label={`Name for ${email}`}
        className={`${inputClass} max-w-xs`}
      />
      <input
        name="email"
        type="email"
        defaultValue={email}
        key={email}
        required
        maxLength={254}
        aria-label={`Email for ${name}`}
        className={`${inputClass} max-w-xs`}
      />
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Saving…" : "Save"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs uppercase tracking-[0.15em] text-ink-soft hover:text-sage-dark"
      >
        Cancel
      </button>
      {state?.message && (
        <p
          role="status"
          className={`w-full rounded-xl p-2.5 text-sm ring-1 ${
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

export function DeleteAdminForm({
  id,
  name,
  email,
}: {
  id: number;
  name: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteAdminAction, null);
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-red-600 hover:text-red-800"
      >
        Delete
      </button>
    );
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <span className="text-xs text-red-700">
        Permanently delete {name} ({email})? They will lose sign-in access.
      </span>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-red-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-red-700 disabled:opacity-60"
      >
        {pending ? "Deleting…" : "Yes, delete"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs uppercase tracking-[0.15em] text-ink-soft hover:text-sage-dark"
      >
        Cancel
      </button>
      {state?.message && (
        <p
          role="status"
          className={`w-full rounded-xl p-2.5 text-sm ring-1 ${
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

export function ResetPasswordForm({ id, email }: { id: number; email: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(resetAdminPasswordAction, null);
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-gold hover:text-sage-dark"
      >
        Reset password
      </button>
    );
  return (
    <form action={action} className="mt-3 flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input
        name="password"
        type="text"
        required
        minLength={10}
        maxLength={200}
        placeholder={`New password for ${email}`}
        className={`${inputClass} max-w-xs`}
      />
      <button type="submit" disabled={pending} className={btnPrimary}>
        {pending ? "Saving…" : "Set password"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="text-xs uppercase tracking-[0.15em] text-ink-soft hover:text-sage-dark"
      >
        Cancel
      </button>
      {state?.message && (
        <p
          role="status"
          className={`w-full rounded-xl p-2.5 text-sm ring-1 ${
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