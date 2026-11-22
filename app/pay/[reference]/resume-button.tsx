"use client";

import { useState } from "react";

export function ResumeButton({ reference }: { reference: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      window.location.href = json.authorizationUrl;
    } catch {
      setError("Network error. Please check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <div className="mt-8">
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="w-full rounded-full bg-sage-dark px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-parchment hover:bg-gold disabled:opacity-60"
      >
        {busy ? "Opening secure checkout…" : "Complete my payment"}
      </button>
      <p className="mt-3 text-center text-xs text-ink-soft">
        You&apos;ll be redirected to Paystack&apos;s secure checkout.
      </p>
      {error && (
        <p
          role="status"
          className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200"
        >
          {error}
        </p>
      )}
    </div>
  );
}