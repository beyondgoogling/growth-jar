import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getDb, type Order } from "@/lib/db";
import { formatDate, naira, PACKAGE_LABELS } from "@/lib/format";
import { AdminNav, PaymentBadge } from "./admin-nav";

export default function AdminPage() {
  return (
    <Suspense fallback={<p className="p-10 text-ink-soft">Loading dashboard…</p>}>
      <Dashboard />
    </Suspense>
  );
}

async function Dashboard() {
  await requireAdmin();
  const orders = getDb()
    .prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 500")
    .all() as Order[];
  const paid = orders.filter((o) => o.payment_status === "paid");
  const revenue = paid.reduce((sum, o) => sum + o.total_kobo, 0);
  const toShip = paid.filter((o) => o.fulfillment_status === "unfulfilled").length;

  return (
    <>
      <AdminNav active="orders" />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Paid orders" value={String(paid.length)} />
          <Stat label="Revenue (paid)" value={naira(revenue)} />
          <Stat label="Paid, not yet shipped" value={String(toShip)} />
        </div>

        <h1 className="mt-10 font-serif text-3xl font-medium text-sage-dark">
          Orders
        </h1>
        {orders.length === 0 ? (
          <p className="mt-4 text-ink-soft">
            No orders yet. They&apos;ll appear here the moment someone checks out.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-sage/30 bg-parchment">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-sage/30 text-xs uppercase tracking-[0.15em] text-sage-deep">
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Package</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3">Fulfillment</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-sage/15 last:border-0 hover:bg-cream">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o.reference}`}
                        className="font-mono font-semibold text-sage-dark underline decoration-sage/40 underline-offset-2 hover:text-gold"
                      >
                        {o.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-ink-soft">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block">{o.customer_name}</span>
                      <span className="block text-xs text-ink-soft">{o.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      {PACKAGE_LABELS[o.package]} × {o.quantity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{naira(o.total_kobo)}</td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={o.payment_status} />
                    </td>
                    <td className="px-4 py-3 capitalize">{o.fulfillment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-sage/30 bg-parchment p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sage-deep">
        {label}
      </p>
      <p className="mt-2 font-serif text-3xl font-semibold text-sage-dark">{value}</p>
    </div>
  );
}