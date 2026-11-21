import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { can } from "@/lib/admins";
import { getDb, type Order } from "@/lib/db";
import { formatDate, naira, PACKAGE_LABELS } from "@/lib/format";
import { AdminShell, Card, FulfillmentBadge, PaymentBadge } from "./ui";
import { btnOutline } from "./styles";

export default function AdminPage() {
  return (
    <Suspense fallback={<ShellLoading />}>
      <Dashboard />
    </Suspense>
  );
}

function ShellLoading() {
  return <p className="p-10 text-ink-soft">Loading dashboard…</p>;
}

async function Dashboard() {
  const admin = await requireAdmin();
  const orders = getDb()
    .prepare("SELECT * FROM orders ORDER BY id DESC")
    .all() as Order[];
  const paid = orders.filter((o) => o.payment_status === "paid");
  const revenue = paid.reduce((s, o) => s + o.total_kobo, 0);
  const toShip = paid.filter((o) => o.fulfillment_status === "unfulfilled").length;
  const pending = orders.filter((o) => o.payment_status === "pending").length;
  const recent = orders.slice(0, 8);

  return (
    <AdminShell
      admin={admin}
      active="dashboard"
      title={`Welcome, ${admin.name.split(" ")[0]}`}
      subtitle="Here's how the Growth Jar is doing."
      actions={
        can(admin.role, "orders.export") ? (
          <>
            <a href="/api/admin/export?format=xlsx" className={btnOutline}>
              ⬇ Excel
            </a>
            <a href="/api/admin/export?format=pdf" className={btnOutline}>
              ⬇ PDF
            </a>
          </>
        ) : undefined
      }
    >
      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Revenue (paid)" value={naira(revenue)} accent />
        <Stat label="Paid orders" value={String(paid.length)} />
        <Stat label="Awaiting shipment" value={String(toShip)} />
        <Stat label="Pending payment" value={String(pending)} />
      </div>

      <Card className="mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-sage/15 px-6 py-4">
          <h2 className="font-serif text-xl font-semibold text-sage-dark">
            Recent orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-xs font-semibold uppercase tracking-[0.15em] text-gold hover:text-sage-dark"
          >
            View all →
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="px-6 py-10 text-center text-ink-soft">
            No orders yet. They&apos;ll appear here the moment someone checks out.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-sage/15 text-[11px] uppercase tracking-[0.15em] text-sage-deep">
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Fulfillment</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-sage/10 transition-colors last:border-0 hover:bg-cream">
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/admin/orders/${o.reference}`}
                        className="font-mono text-xs font-semibold text-sage-dark underline decoration-gold/50 underline-offset-4 hover:text-gold"
                      >
                        {o.reference}
                      </Link>
                      <span className="mt-0.5 block text-[11px] text-ink-soft">
                        {formatDate(o.created_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-medium">{o.customer_name}</td>
                    <td className="px-4 py-3.5 text-ink-soft">
                      {PACKAGE_LABELS[o.package]} × {o.quantity}
                    </td>
                    <td className="px-4 py-3.5 font-semibold">{naira(o.total_kobo)}</td>
                    <td className="px-4 py-3.5">
                      <PaymentBadge status={o.payment_status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <FulfillmentBadge status={o.fulfillment_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminShell>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className={`p-6 ${accent ? "border-gold/40 bg-gradient-to-br from-parchment to-gold/10" : ""}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sage-deep">
        {label}
      </p>
      <p className={`mt-3 font-serif text-3xl font-semibold ${accent ? "text-gold" : "text-sage-dark"}`}>
        {value}
      </p>
    </Card>
  );
}