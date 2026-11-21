import { Suspense } from "react";
import { requirePermission } from "@/lib/auth";
import { getSettings } from "@/lib/db";
import { AdminShell, Card } from "../ui";
import { SettingsForm } from "./settings-form";

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="p-10 text-ink-soft">Loading settings…</p>}>
      <Settings />
    </Suspense>
  );
}

async function Settings() {
  const admin = await requirePermission("settings.prices");
  const s = await getSettings();
  return (
    <AdminShell
      admin={admin}
      active="prices"
      title="Prices & shipping"
      subtitle="Changes go live on the checkout page immediately. Amounts in Naira."
    >
      <Card className="max-w-xl p-8">
        <SettingsForm
          initial={{
            journalPrice: s.journalPriceKobo / 100,
            completePrice: s.completePriceKobo / 100,
            shippingFee: s.shippingFeeKobo / 100,
          }}
        />
      </Card>
    </AdminShell>
  );
}