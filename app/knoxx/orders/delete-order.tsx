"use client";

import { useActionState, useState } from "react";
import { deleteOrderAction } from "../actions";

export function DeleteOrderButton({ reference }: { reference: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(deleteOrderAction, null);
  if (!open)
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold uppercase tracking-[0.15em] text-red-600 hover:text-red-800"
      >
        Delete
      </button>
    );
  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="reference" value={reference} />
      <span className="text-xs text-red-700">Delete permanently?</span>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white transition-colors hover:bg-red-700 disabled:opacity-60"
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
      {state?.message && !state.ok && (
        <p
          role="status"
          className="w-full rounded-xl bg-red-50 p-2.5 text-sm text-red-700 ring-1 ring-red-200"
        >
          {state.message}
        </p>
      )}
    </form>
  );
}