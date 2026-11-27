import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { getSettings, getStateShippingFees } from "@/lib/db";
import { AdminShell, Card } from "../ui";
import { SettingsForm } from "./settings-form";
import { StateFeesForm } from "./state-fees-form";
import { DeliveryOptionsForm } from "./delivery-options-form";

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
      <div className="grid gap-6 xl:grid-cols-2">
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
        <Card className="h-fit p-8">
          <h2 className="font-serif text-xl font-semibold text-sage-dark">
            Delivery options
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Choose what customers can pick at checkout, and whether state
            shipping fees are charged.
          </p>
          <DeliveryOptionsForm
            initial={{
              pickupEnabled: s.pickupEnabled,
              deliveryEnabled: s.deliveryEnabled,
              shippingFeesEnabled: s.shippingFeesEnabled,
            }}
          />
        </Card>
      </div>
      <Card className="mt-6 p-8">
          <h2 className="font-serif text-xl font-semibold text-sage-dark">
            Shipping fees by state
          </h2>
          {!s.shippingFeesEnabled && (
            <p className="mt-2 rounded-xl bg-gold/15 p-3 text-sm text-sage-dark ring-1 ring-gold/40">
              Shipping fees are currently switched OFF: home delivery customers
              see only state names, nothing is added at checkout, and the fee is
              arranged with them afterwards. Pick up never shows a fee. The
              amounts below are kept for when you switch fees back on.
            </p>
          )}
          <p className="mt-1 text-sm text-ink-soft">
            Set what delivery costs for each state: naira in the left box, US
            dollars in the right. With fees switched on, home delivery customers
            see each fee in the state list at checkout and it is added to their
            total. International visitors order on WhatsApp — use the dollar
            figures when quoting delivery in chat.
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
    </AdminShell>
  );
}