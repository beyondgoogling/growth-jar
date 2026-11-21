// Replace with the real checkout/pre-order URL when available.
export const PREORDER_URL = "#preorder";

export function PreorderButton({
  children = "Pre-order your Growth Jar Experience",
  light = false,
}: {
  children?: React.ReactNode;
  light?: boolean;
}) {
  return (
    <a
      href={PREORDER_URL}
      className={`inline-block rounded-full px-8 py-4 text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
        light
          ? "bg-parchment text-sage-dark hover:bg-gold-soft hover:text-parchment"
          : "bg-sage-dark text-parchment hover:bg-gold"
      }`}
    >
      {children}
    </a>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
      {children}
    </p>
  );
}