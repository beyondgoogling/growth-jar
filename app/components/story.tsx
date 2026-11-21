import Image from "next/image";
import { Eyebrow, PreorderButton } from "./cta";

export function Story() {
  return (
    <>
      <section className="bg-linen">
        <div className="mx-auto max-w-3xl space-y-6 px-6 py-20 text-center md:py-28">
          <Eyebrow>A moment down memory lane</Eyebrow>
          <h2 className="font-serif text-4xl font-medium text-sage-dark md:text-5xl">
            Think about the person you were a year ago.
          </h2>
          <div className="space-y-5 leading-relaxed text-ink-soft">
            <p>
              Close your eyes as you do this. The things that kept you up at
              night? The prayer points you cried to God about? The things that
              made you so happy? The things that happened that you never saw
              coming? And how much of it can you still remember?
            </p>
            <p className="font-serif text-2xl italic text-sage-deep">
              All? Some? Or none at all?
            </p>
            <p>
              We live through hundreds of little moments every year. Yet,
              somewhere between chasing our big goals and handling everyday
              life, we forget so much of what makes our lives meaningful.
            </p>
            <p>What if you could store those moments somewhere within reach?</p>
            <p>
              Not on your phone. What if it gets lost or wipes off?
              <br />
              Not somewhere in your memory. What if you forget?
            </p>
            <p className="font-medium text-ink">
              But in a jar you can see daily and reach out to when you need to
              remember&hellip;
            </p>
            <p>
              That&apos;s the idea behind The Growth Jar Experience. A beautiful
              way to reflect on your life, preserve meaningful moments, and
              rediscover your story, one week at a time.
            </p>
          </div>
          <PreorderButton />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
        <Image
          src="/jar.png"
          alt="A clear glass Growth Jar filled with folded weekly reflection slips"
          width={2331}
          height={2783}
          sizes="(min-width: 768px) 50vw, 100vw"
          className="h-auto w-full rounded-2xl shadow-xl shadow-sage/20"
        />
        <div className="space-y-6">
          <Eyebrow>52 weeks of intentional reflection</Eyebrow>
          <h2 className="font-serif text-4xl font-medium leading-tight text-sage-dark md:text-5xl">
            What if you could meet yourself from 52 weeks ago?
          </h2>
          <div className="space-y-4 leading-relaxed text-ink-soft">
            <p>
              Imagine opening your jar filled with little folded notes. You
              pick one. It&apos;s about something that once kept you awake at
              night. You smile because it no longer worries you.
            </p>
            <p>
              You open another. It&apos;s a small win you had completely
              forgotten. Another one reminds you of someone who showed up for
              you when you needed them the most. And another takes you back to
              a moment you wish you could relive.
            </p>
            <p>
              Suddenly, you&apos;re not just reading old notes. You&apos;re
              seeing your life through the eyes of the person you used to be.
              The things you hoped for. The moments you survived. The lessons
              you learned. And the person you became along the way.
            </p>
            <p className="font-serif text-xl italic text-sage-deep">
              That&apos;s what 52 weeks of intentional reflection can give you.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-parchment">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
          <div className="space-y-6 md:order-2">
            <Image
              src="/journal.png"
              alt="The Growth Jar guided gratitude journal with a sage green linen cover and gold lettering"
              width={2556}
              height={2858}
              sizes="(min-width: 768px) 50vw, 100vw"
              className="h-auto w-full rounded-2xl shadow-xl shadow-sage/20"
            />
          </div>
          <div className="space-y-6 md:order-1">
            <Eyebrow>An experience you can hold</Eyebrow>
            <h2 className="font-serif text-4xl font-medium leading-tight text-sage-dark md:text-5xl">
              This is more than a gratitude journal.
            </h2>
            <div className="space-y-4 leading-relaxed text-ink-soft">
              <p>
                Most journals give you a place to write. This one gives you a
                reason to return to what you&apos;ve written.
              </p>
              <p>
                The Growth Jar Experience combines guided weekly journaling
                with a simple routine.
              </p>
              <p className="font-serif text-2xl italic text-gold">
                Reflect. Write. Tear it out. Save it.
              </p>
              <p>
                Week after week, your jar fills up with memories, lessons,
                gratitude, hopes, and personal victories. Until one day, you
                have an entire year of your life waiting to be rediscovered.
              </p>
              <p className="font-medium text-ink">
                Because the beauty isn&apos;t just in what you write. It&apos;s
                what you discover when you read it again.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}