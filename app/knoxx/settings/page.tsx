import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { getSettings, getStateShippingFees } from "@/lib/db";
import { AdminShell, Card } from "../ui";
import { SettingsForm } from "./settings-form";
import { StateFeesForm } from "./state-fees-form";

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="p-10 text-ink-soft">Loading settings…</p>}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const admin = await requirePermission("settings.prices");
  const [s, fees] = await Promise.all([getSettings(), getStateShippingFees()]);
  return (
    <AdminShell
      admin={admin}
      active="prices"
      title="Prices & shipping"
      subtitle="Changes go live on the checkout page immediately. Amounts in Naira."
    >
      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="h-fit p-8">
          <h2 className="font-serif text-xl font-semibold text-sage-dark">
            Product prices
          </h2>
          <SettingsForm
            initial={{
              journalPrice: s.journalPriceKobo / 100,
              completePrice: s.completePriceKobo / 100,
              journalPriceUsd: s.journalPriceUsdCents / 100,
              completePriceUsd: s.completePriceUsdCents / 100,
            }}
          />
        </Card>
        <Card className="p-8 xl:col-span-2">
          <h2 className="font-serif text-xl font-semibold text-sage-dark">
            Shipping fees by state
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Set what delivery costs for each state: naira in the left box, US
            dollars in the right. Customers see the fee as soon as they pick
            their state at checkout, and it is added to their total. Visitors
            outside Nigeria see the dollar prices.
          </p>
          <StateFeesForm
            initialFees={Object.fromEntries(
              Object.entries(fees).map(([state, f]) => [state, f.kobo / 100])
            )}
            initialUsd={Object.fromEntries(
              Object.entries(fees).map(([state, f]) => [state, f.usdCents / 100])
            )}
          />
        </Card>
      </div>
    </AdminShell>
  );
}