import Image from "next/image";
import { PreorderButton } from "./cta";

export function Preorder() {
  return (
    <section id="preorder" className="bg-sage">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <div className="space-y-7 text-parchment">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-parchment/80">
            Your story is worth keeping
          </p>
          <h2 className="font-serif text-4xl font-medium leading-tight md:text-5xl">
            The Growth Jar Experience
          </h2>
          <p className="font-serif text-2xl italic">
            52 weeks. One journal. One jar. Your becoming.
          </p>
          <p className="max-w-md leading-relaxed text-parchment/85">
            A guided gratitude journal and jar journey to help you slow down,
            reflect, appreciate your life, and preserve meaningful memories.
          </p>
          <ul className="space-y-1 font-serif text-xl italic">
            <li>For yourself.</li>
            <li>For someone you love.</li>
            <li>For the person you&apos;ll be 52 weeks from now.</li>
          </ul>
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em]">
              Official launch · 11 December 2026
            </p>
            <PreorderButton light />
            <p className="font-serif text-lg italic text-parchment/85">
              Don&apos;t just count your blessings. Document your becoming.
            </p>
          </div>
        </div>
        <Image
          src="/growth-jar-experience.png"
          alt="The complete Growth Jar Experience set — journal and keepsake jar"
          width={3882}
          height={4637}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="h-auto w-full rounded-2xl shadow-xl shadow-sage-dark/30"
        />
      </div>
    </section>
  );
}