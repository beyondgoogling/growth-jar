export type CheckoutInput = {
  package: "journal" | "complete";
  quantity: number;
  customerName: string;
  email: string;
  phone: string;
  addressLine: string;
  city: string;
  state: string;
};

type FieldRule = { max: number; min?: number; pattern?: RegExp; label: string };

const rules: Record<keyof Omit<CheckoutInput, "package" | "quantity">, FieldRule> = {
  customerName: { max: 100, min: 2, label: "Full name" },
  email: {
    max: 254,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    label: "Email address",
  },
  phone: {
    max: 20,
    pattern: /^\+?[0-9\s-]{7,20}$/,
    label: "Phone number",
  },
  addressLine: { max: 300, min: 5, label: "Street address" },
  city: { max: 100, min: 2, label: "City" },
  state: { max: 100, min: 2, label: "State" },
};

export function validateCheckout(
  body: unknown
): { ok: true; value: CheckoutInput } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null)
    return { ok: false, error: "Invalid request." };
  const b = body as Record<string, unknown>;

  if (b.package !== "journal" && b.package !== "complete")
    return { ok: false, error: "Please choose a package." };

  const quantity = Number(b.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10)
    return { ok: false, error: "Quantity must be between 1 and 10." };

  const out: Record<string, string> = {};
  for (const [key, rule] of Object.entries(rules)) {
    const raw = b[key];
    if (typeof raw !== "string")
      return { ok: false, error: `${rule.label} is required.` };
    const value = raw.trim();
    if (value.length < (rule.min ?? 1))
      return { ok: false, error: `${rule.label} is required.` };
    if (value.length > rule.max)
      return { ok: false, error: `${rule.label} is too long.` };
    if (rule.pattern && !rule.pattern.test(value))
      return { ok: false, error: `Please enter a valid ${rule.label.toLowerCase()}.` };
    out[key] = value;
  }

  return {
    ok: true,
    value: {
      package: b.package,
      quantity,
      customerName: out.customerName,
      email: out.email,
      phone: out.phone,
      addressLine: out.addressLine,
      city: out.city,
      state: out.state,
    },
  };
}