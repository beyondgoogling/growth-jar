import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getDb, getOrderByReference } from "@/lib/db";
import { formatDate, naira, PACKAGE_LABELS } from "@/lib/format";
import { saveNotesAction, updateFulfillmentAction } from "../../actions";
import { AdminNav, PaymentBadge } from "../../admin-nav";

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
  await requireAdmin();
  const { reference } = await params;
  const order = getOrderByReference(reference);
  if (!order) notFound();

  const events = getDb()
    .prepare("SELECT * FROM order_events WHERE order_id = ? ORDER BY id DESC")
    .all(order.id) as { id: number; at: string; event: string }[];

  return (
    <>
      <AdminNav active="orders" />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Link href="/admin" className="text-xs uppercase tracking-[0.2em] text-ink-soft hover:text-sage-dark">
          ← All orders
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <h1 className="font-mono text-2xl font-semibold text-sage-dark">
            {order.reference}
          </h1>
          <PaymentBadge status={order.payment_status} />
          <span className="text-sm text-ink-soft">{formatDate(order.created_at)}</span>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-sage/30 bg-parchment p-6">
            <h2 className="font-serif text-xl font-semibold text-sage-dark">Customer</h2>
            <dl className="mt-3 space-y-1 text-sm">
              <Row k="Name" v={order.customer_name} />
              <Row k="Email" v={order.email} />
              <Row k="Phone" v={order.phone} />
            </dl>
            <h2 className="mt-6 font-serif text-xl font-semibold text-sage-dark">
              Ship to
            </h2>
            <p className="mt-2 text-sm leading-relaxed">
              {order.address_line}
              <br />
              {order.city}, {order.state}
              <br />
              {order.country}
            </p>
          </section>

          <section className="rounded-2xl border border-sage/30 bg-parchment p-6">
            <h2 className="font-serif text-xl font-semibold text-sage-dark">Order</h2>
            <dl className="mt-3 space-y-1 text-sm">
              <Row k="Package" v={`${PACKAGE_LABELS[order.package]} × ${order.quantity}`} />
              <Row k="Unit price" v={naira(order.unit_price_kobo)} />
              <Row k="Shipping" v={naira(order.shipping_kobo)} />
              <Row k="Total" v={naira(order.total_kobo)} />
              {order.paid_at && <Row k="Paid at" v={formatDate(order.paid_at)} />}
            </dl>

            <form action={updateFulfillmentAction} className="mt-6">
              <input type="hidden" name="reference" value={order.reference} />
              <label
                htmlFor="status"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.15em] text-sage-deep"
              >
                Fulfillment status
              </label>
              <div className="flex gap-2">
                <select
                  id="status"
                  name="status"
                  key={order.fulfillment_status}
                  defaultValue={order.fulfillment_status}
                  className="w-full rounded-lg border border-sage/40 bg-cream px-3 py-2 text-sm capitalize"
                >
                  <option value="unfulfilled">Unfulfilled</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  type="submit"
                  className="rounded-full bg-sage-dark px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-parchment hover:bg-gold"
                >
                  Update
                </button>
              </div>
            </form>
          </section>
        </div>

        <section className="mt-6 rounded-2xl border border-sage/30 bg-parchment p-6">
          <h2 className="font-serif text-xl font-semibold text-sage-dark">
            Internal notes
          </h2>
          <form action={saveNotesAction} className="mt-3">
            <input type="hidden" name="reference" value={order.reference} />
            <textarea
              name="notes"
              defaultValue={order.notes}
              rows={4}
              maxLength={5000}
              placeholder="e.g. customer asked for gift wrapping, courier tracking number…"
              className="w-full rounded-lg border border-sage/40 bg-cream px-4 py-3 text-sm outline-none focus:border-sage-deep"
            />
            <button
              type="submit"
              className="mt-3 rounded-full bg-sage-dark px-5 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-parchment hover:bg-gold"
            >
              Save notes
            </button>
          </form>
        </section>

        <section className="mt-6 rounded-2xl border border-sage/30 bg-parchment p-6">
          <h2 className="font-serif text-xl font-semibold text-sage-dark">History</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {events.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-x-3">
                <span className="whitespace-nowrap text-ink-soft">{formatDate(e.at)}</span>
                <span>{e.event}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
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