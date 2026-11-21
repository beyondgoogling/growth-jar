import Image from "next/image";
import { Eyebrow, PreorderButton } from "./cta";

export function Hero() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <span className="whitespace-nowrap font-serif text-lg font-semibold uppercase tracking-[0.12em] text-sage-dark sm:text-xl sm:tracking-[0.15em]">
          The Growth Jar
        </span>
        <a
          href="#preorder"
          className="rounded-full border border-sage-dark px-4 py-2 sm:px-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-sage-dark transition-colors hover:bg-sage-dark hover:text-parchment"
        >
          Pre-order
        </a>
      </header>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 pb-20 pt-10 md:grid-cols-2 md:pb-28 md:pt-16">
        <div className="space-y-7">
          <Eyebrow>52 weeks · One journal · One jar</Eyebrow>
          <h1 className="text-balance font-serif text-5xl font-medium leading-[1.05] text-sage-dark md:text-6xl">
            Welcome to your Growth Jar Experience
          </h1>
          <p className="font-serif text-2xl italic text-gold">
            Don&apos;t just count your blessings. Document your becoming.
          </p>
          <p className="max-w-md leading-relaxed text-ink-soft">
            365 days worth remembering. A guided gratitude journal and jar
            journey to help you slow down, reflect, appreciate your life, and
            preserve meaningful memories.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <PreorderButton />
            <span className="text-xs uppercase tracking-[0.2em] text-ink-soft">
              Official launch · 11 Dec 2026
            </span>
          </div>
        </div>
        <Image
          src="/growth-jar-experience.png"
          alt="The Growth Jar Experience — sage green guided journal beside a glass jar of folded reflection slips"
          width={3882}
          height={4637}
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="h-auto w-full rounded-2xl shadow-xl shadow-sage/20"
        />
      </section>
    </>
  );
}