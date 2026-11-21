export const PREORDER_URL = "/checkout";

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
      className={`inline-block rounded-full px-8 py-4 text-center text-xs font-semibold uppercase tracking-[0.2em] transition-colors ${
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
    <p className="text-balance text-xs font-semibold uppercase tracking-[0.2em] text-gold sm:tracking-[0.3em]">
      {children}
    </p>
  );
}