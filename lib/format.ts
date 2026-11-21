export function naira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
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