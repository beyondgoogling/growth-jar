import { Suspense } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { can } from "@/lib/admins";
import { getDb, type Order } from "@/lib/db";
import { formatDate, naira, DELIVERY_LABELS, PACKAGE_LABELS } from "@/lib/format";
import { AdminShell, Card, FulfillmentBadge, PaymentBadge } from "../ui";
import { btnOutline } from "../styles";
import { DeleteOrderButton } from "./delete-order";

type Filter = "pickup" | "delivery";

export default function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<p className="p-10 text-ink-soft">Loading orders…</p>}>
      <Orders searchParams={searchParams} />
    </Suspense>
  );
}

async function Orders({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const admin = await requireAdmin();
  const params = await searchParams;
  const filter: Filter | undefined =
    params.delivery === "pickup" || params.delivery === "delivery"
      ? params.delivery
      : undefined;
  const db = await getDb();
  const orders = (
    await db.execute(
      filter
        ? {
            sql: "SELECT * FROM orders WHERE delivery_method = ? ORDER BY id DESC LIMIT 1000",
            args: [filter],
          }
        : "SELECT * FROM orders ORDER BY id DESC LIMIT 1000"
    )
  ).rows as unknown as Order[];
  const counts = { pickup: 0, delivery: 0 };
  const countRows = (
    await db.execute(
      "SELECT delivery_method, COUNT(*) AS n FROM orders GROUP BY delivery_method"
    )
  ).rows;
  for (const r of countRows) counts[r.delivery_method as Filter] = Number(r.n);
  const total = counts.pickup + counts.delivery;
  const canDelete = can(admin.role, "orders.delete");
  const exportQuery = filter ? `&delivery=${filter}` : "";
  const pills = [
    { href: "/knoxx/orders", label: `All (${total})`, active: !filter },
    {
      href: "/knoxx/orders?delivery=pickup",
      label: `Pick up (${counts.pickup})`,
      active: filter === "pickup",
    },
    {
      href: "/knoxx/orders?delivery=delivery",
      label: `Home delivery (${counts.delivery})`,
      active: filter === "delivery",
    },
  ];

  return (
    <AdminShell
      admin={admin}
      active="orders"
      title="Orders"
      subtitle={
        filter
          ? `${orders.length} of ${total} orders — ${DELIVERY_LABELS[filter].toLowerCase()} only.`
          : `${total} order${total === 1 ? "" : "s"} on record.`
      }
      actions={
        can(admin.role, "orders.export") ? (
          <>
            <a href={`/api/knoxx/export?format=xlsx${exportQuery}`} className={btnOutline}>
              ⬇ Export Excel
            </a>
            <a href={`/api/knoxx/export?format=pdf${exportQuery}`} className={btnOutline}>
              ⬇ Export PDF
            </a>
          </>
        ) : undefined
      }
    >
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-sage/15 bg-cream/60 px-6 py-4">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-sage-deep">
            Show
          </span>
          {pills.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className={
                p.active
                  ? "rounded-full bg-sage-dark px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-parchment"
                  : "rounded-full border border-sage/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-sage-dark transition-colors hover:border-gold hover:text-gold"
              }
            >
              {p.label}
            </Link>
          ))}
        </div>
        {orders.length === 0 ? (
          <p className="px-6 py-14 text-center text-ink-soft">
            {filter
              ? `No ${DELIVERY_LABELS[filter].toLowerCase()} orders yet.`
              : "No orders yet. Share your sales page — orders will land here automatically."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead>
                <tr className="border-b border-sage/15 bg-cream/60 text-[11px] uppercase tracking-[0.15em] text-sage-deep">
                  <th className="px-6 py-3.5">Reference</th>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Package</th>
                  <th className="px-4 py-3.5">Delivery</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Payment</th>
                  <th className="px-4 py-3.5">Fulfillment</th>
                  {canDelete && <th className="px-4 py-3.5"><span className="sr-only">Delete</span></th>}
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
                    <td className="whitespace-nowrap px-4 py-3.5 text-ink-soft">
                      {DELIVERY_LABELS[o.delivery_method]}
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
                    {canDelete && (
                      <td className="px-4 py-3.5">
                        <DeleteOrderButton reference={o.reference} />
                      </td>
                    )}
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