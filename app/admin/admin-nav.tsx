import Link from "next/link";
import { logoutAction } from "./actions";

export function AdminNav({ active }: { active: "orders" | "settings" }) {
  const link = (isActive: boolean) =>
    `text-xs font-semibold uppercase tracking-[0.2em] ${
      isActive ? "text-gold" : "text-parchment/80 hover:text-parchment"
    }`;
  return (
    <header className="bg-sage-dark">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <span className="font-serif text-lg font-semibold uppercase tracking-[0.12em] text-parchment">
          Growth Jar Admin
        </span>
        <nav className="flex items-center gap-6">
          <Link href="/admin" className={link(active === "orders")}>
            Orders
          </Link>
          <Link href="/admin/settings" className={link(active === "settings")}>
            Prices
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-parchment/80 hover:text-parchment"
            >
              Sign out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}

export function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-green-100 text-green-800",
    pending: "bg-amber-100 text-amber-800",
    failed: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${styles[status] ?? "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}