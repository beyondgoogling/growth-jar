import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { can } from "@/lib/admins";
import { getDb, getOrderByReference } from "@/lib/db";
import { formatDate, naira, PACKAGE_LABELS } from "@/lib/format";
import { saveNotesAction, updateFulfillmentAction } from "../../actions";
import { AdminShell, Card, FulfillmentBadge, PaymentBadge } from "../../ui";
import { btnPrimary, inputClass, labelClass } from "../../styles";
import { ShippedEmailButton } from "./shipped-button";

export default function OrderPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  return (
    <Suspense fallback={<p className="p-10 text-ink-soft">Loading order…</p>}>
      <OrderDetail params={params} />
    </Suspense>
  );
}

async function OrderDetail({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const admin = await requireAdmin();
  const { reference } = await params;
  const order = await getOrderByReference(reference);
  if (!order) notFound();

  const db = await getDb();
  const events = (
    await db.execute({
      sql: "SELECT * FROM order_events WHERE order_id = ? ORDER BY id DESC",
      args: [order.id],
    })
  ).rows as unknown as { id: number; at: string; event: string }[];

  const canFulfill = can(admin.role, "orders.fulfill");
  const canNote = can(admin.role, "orders.notes");
  const canEmail = can(admin.role, "email.send");

  return (
    <AdminShell
      admin={admin}
      active="orders"
      title={order.reference}
      subtitle={`Placed ${formatDate(order.created_at)}`}
      actions={
        <div className="flex items-center gap-2">
          <PaymentBadge status={order.payment_status} />
          <FulfillmentBadge status={order.fulfillment_status} />
        </div>
      }
    >
      <Link
        href="/knoxx/orders"
        className="text-xs font-semibold uppercase tracking-[0.15em] text-ink-soft hover:text-gold"
      >
        ← All orders
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <Card className="p-7">
          <h2 className="font-serif text-xl font-semibold text-sage-dark">Customer</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <Row k="Name" v={order.customer_name} />
            <Row k="Email" v={order.email} />
            <Row k="Phone" v={order.phone} />
          </dl>
          <div className="mt-6 rounded-xl bg-cream p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-sage-deep">
              Ship to
            </h3>
            <p className="mt-2 text-sm leading-relaxed">
              {order.address_line}
              <br />
              {order.city}, {order.state}
              <br />
              {order.country}
            </p>
          </div>
          {canEmail && (
            <div className="mt-6 border-t border-sage/15 pt-5">
              <ShippedEmailButton
                reference={order.reference}
                eligible={
                  order.payment_status === "paid" &&
                  (order.fulfillment_status === "shipped" ||
                    order.fulfillment_status === "delivered")
                }
              />
            </div>
          )}
        </Card>

        <Card className="p-7">
          <h2 className="font-serif text-xl font-semibold text-sage-dark">Order</h2>
          <dl className="mt-4 space-y-2.5 text-sm">
            <Row k="Package" v={`${PACKAGE_LABELS[order.package]} × ${order.quantity}`} />
            <Row k="Unit price" v={naira(order.unit_price_kobo)} />
            <Row k="Shipping" v={naira(order.shipping_kobo)} />
            <div className="flex justify-between gap-4 border-t border-sage/15 pt-3">
              <dt className="font-semibold">Total</dt>
              <dd className="font-serif text-xl font-semibold text-gold">
                {naira(order.total_kobo)}
              </dd>
            </div>
            {order.paid_at && <Row k="Paid at" v={formatDate(order.paid_at)} />}
            {(order.reminder_sent_at || order.payment_status === "pending") && (
              <Row
                k="Payment reminder"
                v={
                  order.reminder_sent_at
                    ? `Sent ${formatDate(order.reminder_sent_at)}`
                    : "Not sent yet"
                }
              />
            )}
          </dl>

          {canFulfill ? (
            <form action={updateFulfillmentAction} className="mt-7">
              <input type="hidden" name="reference" value={order.reference} />
              <label htmlFor="status" className={labelClass}>
                Fulfillment status
              </label>
              <div className="flex gap-2">
                <select
                  id="status"
                  name="status"
                  key={order.fulfillment_status}
                  defaultValue={order.fulfillment_status}
                  className={`${inputClass} capitalize`}
                >
                  <option value="unfulfilled">Unfulfilled</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button type="submit" className={btnPrimary}>
                  Update
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-7 text-sm text-ink-soft">
              Your role cannot change fulfillment status.
            </p>
          )}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="p-7">
          <h2 className="font-serif text-xl font-semibold text-sage-dark">
            Internal notes
          </h2>
          {canNote ? (
            <form action={saveNotesAction} className="mt-4">
              <input type="hidden" name="reference" value={order.reference} />
              <textarea
                name="notes"
                defaultValue={order.notes}
                rows={5}
                maxLength={5000}
                placeholder="e.g. gift wrapping requested, courier tracking number…"
                className={inputClass}
              />
              <button type="submit" className={`${btnPrimary} mt-4`}>
                Save notes
              </button>
            </form>
          ) : (
            <p className="mt-4 whitespace-pre-wrap text-sm text-ink-soft">
              {order.notes || "No notes."}
            </p>
          )}
        </Card>

        <Card className="p-7">
          <h2 className="font-serif text-xl font-semibold text-sage-dark">History</h2>
          <ol className="mt-4 space-y-0">
            {events.map((e, i) => (
              <li key={e.id} className="relative flex gap-4 pb-5 last:pb-0">
                {i < events.length - 1 && (
                  <span className="absolute left-[5px] top-4 h-full w-px bg-sage/25" />
                )}
                <span className="mt-1.5 h-[11px] w-[11px] shrink-0 rounded-full border-2 border-gold bg-parchment" />
                <div className="min-w-0">
                  <p className="text-sm">{e.event}</p>
                  <p className="text-xs text-ink-soft">{formatDate(e.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </AdminShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}