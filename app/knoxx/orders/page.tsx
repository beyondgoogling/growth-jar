import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { can } from "@/lib/admins";
import { getDb, type Order } from "@/lib/db";
import { formatDate, naira, PACKAGE_LABELS } from "@/lib/format";
import { AdminShell, Card, FulfillmentBadge, PaymentBadge } from "../ui";
import { btnOutline } from "../styles";

export default function OrdersPage() {
  return (
    <Suspense fallback={<p className="p-10 text-ink-soft">Loading orders…</p>}>
      <Orders />
    </Suspense>
  );
}

async function Orders() {
  const admin = await requireAdmin();
  const db = await getDb();
  const orders = (
    await db.execute("SELECT * FROM orders ORDER BY id DESC LIMIT 1000")
  ).rows as unknown as Order[];

  return (
    <AdminShell
      admin={admin}
      active="orders"
      title="Orders"
      subtitle={`${orders.length} order${orders.length === 1 ? "" : "s"} on record.`}
      actions={
        can(admin.role, "orders.export") ? (
          <>
            <a href="/api/knoxx/export?format=xlsx" className={btnOutline}>
              ⬇ Export Excel
            </a>
            <a href="/api/knoxx/export?format=pdf" className={btnOutline}>
              ⬇ Export PDF
            </a>
          </>
        ) : undefined
      }
    >
      <Card className="overflow-hidden">
        {orders.length === 0 ? (
          <p className="px-6 py-14 text-center text-ink-soft">
            No orders yet. Share your sales page — orders will land here automatically.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-sage/15 bg-cream/60 text-[11px] uppercase tracking-[0.15em] text-sage-deep">
                  <th className="px-6 py-3.5">Reference</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Package</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Fulfillment</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-sage/10 transition-colors last:border-0 hover:bg-cream">
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/knoxx/orders/${o.reference}`}
                        className="font-mono text-xs font-semibold text-sage-dark underline decoration-gold/50 underline-offset-4 hover:text-gold"
                      >
                        {o.reference}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-ink-soft">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="block font-medium">{o.customer_name}</span>
                      <span className="block text-xs text-ink-soft">{o.email}</span>
                    </td>
                    <td className="px-4 py-3.5 text-ink-soft">
                      {PACKAGE_LABELS[o.package]} × {o.quantity}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 font-semibold">
                      {naira(o.total_kobo)}
                    </td>
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