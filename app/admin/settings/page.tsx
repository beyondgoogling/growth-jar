import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { AdminNav } from "../admin-nav";
import { SettingsForm } from "./settings-form";

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="p-10 text-ink-soft">Loading settings…</p>}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  await requireAdmin();
  const s = getSettings();
  return (
    <>
      <AdminNav active="settings" />
      <main className="mx-auto max-w-xl px-6 py-10">
        <h1 className="font-serif text-3xl font-medium text-sage-dark">
          Prices & shipping
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Changes go live on the checkout page immediately. Amounts in Naira.
        </p>
        <SettingsForm
          initial={{
            journalPrice: s.journalPriceKobo / 100,
            completePrice: s.completePriceKobo / 100,
            shippingFee: s.shippingFeeKobo / 100,
          }}
        />
      </main>
    </>
  );
}