import { Eyebrow } from "./cta";

export function Reflection() {
  return (
    <>
      <section className="bg-linen">
        <div className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-center md:py-28">
          <Eyebrow>For the ordinary weeks, too</Eyebrow>
          <h2 className="text-balance font-serif text-4xl font-medium text-sage-dark md:text-5xl">
            Here&apos;s something we often forget about gratitude.
          </h2>
          <div className="space-y-5 leading-relaxed text-ink-soft">
            <p>
              Not every week will give you something exciting to celebrate.
              Some weeks will be ordinary. Some will be difficult. And some
              will leave you with more questions than answers.
            </p>
            <p>But imagine reading about those weeks a year later.</p>
            <p className="font-serif text-xl italic text-sage-deep">
              The worry that became smaller. The difficult decision that
              changed your direction. The kindness you almost forgot. The
              little win that turned out to be the beginning of something
              bigger.
            </p>
            <p>
              Sometimes, you don&apos;t realize how much a moment mattered
              until you look back.
            </p>
            <p className="font-medium text-ink">
              That&apos;s why we&apos;re saving them.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-center md:py-28">
        <Eyebrow>A little gift to your future self</Eyebrow>
        <h2 className="text-balance font-serif text-4xl font-medium text-sage-dark md:text-5xl">
          A year from now, your life may look completely different.
        </h2>
        <div className="space-y-5 leading-relaxed text-ink-soft">
          <p>
            Or perhaps, some things will still be the same. But imagine having
            52 little reminders of the year you lived. Written in your own
            handwriting. Saved by your own hands. Waiting for you to unfold
            them.
          </p>
          <p>
            Some will make you smile. Some might make you emotional. Others
            may remind you of how strong you were, how much you&apos;ve
            learned, or how many beautiful moments happened while you were
            busy looking ahead.
          </p>
          <p className="font-serif text-2xl italic text-gold">
            You may not remember every day. But you can choose to remember
            what mattered.
          </p>
        </div>
      </section>
    </>
  );
}