import { Eyebrow } from "./cta";

const steps = [
  {
    n: "01",
    title: "Reflect",
    body: "Pause once a week. Notice the moments, people, experiences, and feelings that shaped your days.",
  },
  {
    n: "02",
    title: "Write",
    body: "Capture your gratitude, little wins, meaningful memories, worries, and personal affirmations using guided prompts.",
  },
  {
    n: "03",
    title: "Tear",
    body: "Carefully tear out your completed reflection slip. A little piece of your story, now in your hands.",
  },
  {
    n: "04",
    title: "Save",
    body: "Fold your slip and place it in your Growth Jar. Watch your collection grow, one week at a time.",
  },
  {
    n: "05",
    title: "Revisit",
    body: "After 52 weeks, open your jar. Read your words, relive your memories, and discover how much has changed.",
  },
];

const themes = [
  {
    title: "Your gratitude",
    body: "The things you're thankful for and why they matter.",
  },
  {
    title: "Your people",
    body: "The kindness, joy, and beautiful moments happening around you.",
  },
  {
    title: "Your memories",
    body: "The experiences you never want to forget.",
  },
  {
    title: "Your difficult moments",
    body: "The worries, disappointments, and lessons you're working through.",
  },
  {
    title: "Your becoming",
    body: "The small victories, changing perspectives, and growth you might otherwise overlook.",
  },
  {
    title: "Your affirmations",
    body: "The words you want to carry into another week.",
  },
];

export function HowItWorks() {
  return (
    <>
      <section className="bg-sage-dark text-parchment">
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gold-soft">
              The weekly ritual
            </p>
            <h2 className="font-serif text-4xl font-medium md:text-5xl">
              How The Growth Jar Experience works
            </h2>
          </div>
          <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            {steps.map((s) => (
              <li key={s.n} className="space-y-3">
                <span className="font-serif text-4xl italic text-gold-soft">
                  {s.n}
                </span>
                <h3 className="text-sm font-semibold uppercase tracking-[0.25em]">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-parchment/75">
                  {s.body}
                </p>
              </li>
            ))}
          </ol>
          <p className="mt-14 text-center font-serif text-2xl italic text-gold-soft">
            Write it. Tear it. Save it. One week at a time.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <Eyebrow>Inside the journal</Eyebrow>
          <h2 className="font-serif text-4xl font-medium text-sage-dark md:text-5xl">
            What will you find inside?
          </h2>
          <p className="leading-relaxed text-ink-soft">
            52 weeks of thoughtful reflection prompts designed to help you
            explore:
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {themes.map((t) => (
            <div
              key={t.title}
              className="rounded-2xl border border-sage/25 bg-parchment p-7"
            >
              <h3 className="font-serif text-2xl font-semibold text-sage-deep">
                {t.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                {t.body}
              </p>
            </div>
          ))}
        </div>
        <div className="mx-auto mt-12 max-w-2xl space-y-4 text-center leading-relaxed text-ink-soft">
          <p>
            You&apos;ll also find a special end-of-year reflection section to
            help you revisit your journey and recognize how your experiences
            have shaped you.
          </p>
          <p className="font-serif text-xl italic text-sage-deep">
            No pressure to write perfectly. No need to have an extraordinary
            week. Just an invitation to notice the life you&apos;re already
            living.
          </p>
        </div>
      </section>
    </>
  );
}