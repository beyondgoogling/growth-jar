export type Currency = "NGN" | "USD";

export function naira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export function usd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function money(smallestUnit: number, currency: Currency): string {
  return currency === "NGN" ? naira(smallestUnit) : usd(smallestUnit);
}

export const PACKAGE_LABELS = {
  journal: "Journal only",
  complete: "Complete Experience (journal + jar)",
} as const;

export function formatDate(sqliteUtc: string): string {
  return new Date(sqliteUtc.replace(" ", "T") + "Z").toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  });
}