import Link from "next/link";
import { can, ROLE_LABELS, type Admin } from "@/lib/admins";
import { logoutAction } from "./actions";

const NAV = [
  { href: "/knoxx", label: "Dashboard", icon: "◈", perm: null },
  { href: "/knoxx/orders", label: "Orders", icon: "✦", perm: null },
  { href: "/knoxx/settings", label: "Prices", icon: "₦", perm: "settings.prices" },
  { href: "/knoxx/email", label: "Email", icon: "✉", perm: "settings.email" },
  { href: "/knoxx/team", label: "Team", icon: "❖", perm: "admins.manage" },
  { href: "/knoxx/account", label: "Account", icon: "⚙", perm: null },
] as const;

export function AdminShell({
  admin,
  active,
  title,
  subtitle,
  actions,
  children,
}: {
  admin: Admin;
  active: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const initials = admin.name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col bg-sage-dark max-lg:w-16">
        <div className="border-b border-parchment/10 px-6 py-6 max-lg:px-3">
          <Link href="/knoxx" className="block">
            <span className="font-serif text-lg font-semibold uppercase tracking-[0.15em] text-gold-soft max-lg:hidden">
              Growth Jar
            </span>
            <span className="hidden text-center font-serif text-lg text-gold-soft max-lg:block">
              GJ
            </span>
            <span className="mt-1 block text-[10px] uppercase tracking-[0.3em] text-parchment/50 max-lg:hidden">
              Admin Console
            </span>
          </Link>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-6">
          {NAV.filter((n) => !n.perm || can(admin.role, n.perm)).map((n) => {
            const isActive = active === n.label.toLowerCase();
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors max-lg:justify-center max-lg:px-0 ${
                  isActive
                    ? "bg-gold/20 font-semibold text-gold-soft"
                    : "text-parchment/70 hover:bg-parchment/5 hover:text-parchment"
                }`}
              >
                <span aria-hidden className="text-base">{n.icon}</span>
                <span className="max-lg:hidden">{n.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-parchment/10 px-4 py-5 max-lg:px-2">
          <div className="flex items-center gap-3 max-lg:justify-center">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/25 font-serif text-sm font-semibold text-gold-soft">
              {initials}
            </span>
            <div className="min-w-0 max-lg:hidden">
              <p className="truncate text-sm font-medium text-parchment">{admin.name}</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gold-soft">
                {ROLE_LABELS[admin.role]}
              </p>
            </div>
          </div>
          <form action={logoutAction} className="mt-4 max-lg:hidden">
            <button
              type="submit"
              className="w-full rounded-lg border border-parchment/20 px-3 py-2 text-xs uppercase tracking-[0.2em] text-parchment/70 transition-colors hover:border-gold-soft hover:text-gold-soft"
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="ml-60 min-w-0 flex-1 max-lg:ml-16">
        <header className="border-b border-sage/20 bg-parchment/80 px-8 py-6 backdrop-blur max-sm:px-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-medium text-sage-dark">{title}</h1>
              {subtitle && <p className="mt-1 text-sm text-ink-soft">{subtitle}</p>}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
        </header>
        <main className="px-8 py-8 max-sm:px-4">{children}</main>
      </div>
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-sage/20 bg-parchment shadow-sm shadow-sage/10 ${className}`}
    >
      {children}
    </div>
  );
}

export function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-sage/20 text-sage-dark ring-sage/40",
    pending: "bg-gold/15 text-gold ring-gold/40",
    failed: "bg-red-100 text-red-700 ring-red-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${styles[status] ?? "bg-gray-100 text-gray-700 ring-gray-200"}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export function FulfillmentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    unfulfilled: "bg-linen text-ink-soft ring-sage/30",
    shipped: "bg-blue-50 text-blue-700 ring-blue-200",
    delivered: "bg-sage/20 text-sage-dark ring-sage/40",
    cancelled: "bg-red-50 text-red-600 ring-red-200",
  };
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ${styles[status] ?? ""}`}
    >
      {status}
    </span>
  );
}