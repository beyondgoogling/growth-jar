import { Eyebrow, PreorderButton } from "./cta";
import { InstagramLink } from "./social";

const faqs = [
  {
    q: "Do I need to write every day?",
    a: "No. It's a weekly experience designed to fit into your life. Simply set aside time once a week.",
  },
  {
    q: "How is this different from a regular journal?",
    a: "You don't just write and move on. You tear out a reflection slip each week and preserve it in a jar, creating a collection of memories to revisit after 52 weeks.",
  },
  {
    q: "What if I have a difficult week?",
    a: "You can write about that, too. Gratitude doesn't mean pretending everything is perfect. There's room for your worries, emotions, and lessons.",
  },
  {
    q: "What happens after 52 weeks?",
    a: "You'll open your jar, read your saved reflections, and use the journal's final reflection section to look back on your year.",
  },
  {
    q: "Does the journal come with a jar?",
    a: "Only the Complete Experience package comes with a jar.",
  },
  {
    q: "Can I gift it to someone?",
    a: "Absolutely. It's a thoughtful gift for birthdays, milestones, new beginnings, or anyone who wants to become more intentional about their life.",
  },
];

export function Faq() {
  return (
    <>
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-28">
        <div className="space-y-4 text-center">
          <Eyebrow>Questions, answered</Eyebrow>
          <h2 className="text-balance font-serif text-4xl font-medium text-sage-dark md:text-5xl">
            Frequently Asked Questions
          </h2>
        </div>
        <div className="mt-12 divide-y divide-sage/25 border-y border-sage/25">
          {faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-xl font-semibold text-sage-deep [&::-webkit-details-marker]:hidden">
                {f.q}
                <span className="text-gold transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 leading-relaxed text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-linen">
        <div className="mx-auto max-w-3xl space-y-7 px-6 py-16 text-center md:py-24">
          <h2 className="text-balance font-serif text-4xl font-medium leading-tight text-sage-dark md:text-5xl">
            One day, these ordinary moments will become memories.
          </h2>
          <p className="font-serif text-2xl italic text-gold">
            Give yourself a way to find them again.
          </p>
          <PreorderButton>Pre-order your copy</PreorderButton>
        </div>
      </section>

      <footer className="bg-sage-dark px-6 py-10 text-center text-xs uppercase tracking-[0.25em] text-parchment/70">
        <InstagramLink
          className="text-parchment/85 hover:text-gold"
          iconClassName="h-5 w-5"
          showHandle
        />
        <p className="mt-4 text-balance">
          The Growth Jar Experience · Launching 12 December 2026
        </p>
      </footer>
    </>
  );
}