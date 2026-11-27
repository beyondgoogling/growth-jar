import Image from "next/image";
import { Eyebrow, PreorderButton } from "./cta";

export function Story() {
  return (
    <>
      <section className="bg-linen">
        <div className="mx-auto max-w-3xl space-y-6 px-6 py-16 text-center md:py-28">
          <Eyebrow>A moment down memory lane</Eyebrow>
          <h2 className="text-balance font-serif text-4xl font-medium text-sage-dark md:text-5xl">
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

      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-28">
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
          <h2 className="text-balance font-serif text-4xl font-medium leading-tight text-sage-dark md:text-5xl">
            What if you could sit down with the person you were 52 weeks ago?
          </h2>
          <div className="space-y-4 leading-relaxed text-ink-soft">
            <p>
              Imagine opening a jar filled with little notes from the past
              year.
            </p>
            <p>
              You unfold one and read about something that once kept you awake
              at night. Something that felt overwhelming, impossible, or too
              heavy to carry. And then you realize&hellip; you made it through.
              What once felt like a mountain is now just a memory.
            </p>
            <p>
              You pick another note. It&apos;s a small victory you had
              forgotten all about. A prayer answered. A goal reached. A moment
              that mattered more than you knew at the time.
            </p>
            <p>
              Another note reminds you of someone who stood by your side when
              you felt alone. Someone who showed up, encouraged you, or held
              your hand through a difficult season.
            </p>
            <p>
              Then you open one that takes your breath away. A beautiful
              moment. A laugh. A hug. A memory you&apos;d give anything to
              relive for just a few seconds.
            </p>
            <p>As you keep reading, something unexpected happens.</p>
            <p>
              You&apos;re no longer looking at pieces of paper. You&apos;re
              looking at your life.
            </p>
            <p>
              The hopes you carried. The tears you cried. The battles you
              fought in silence. The blessings you almost missed. The strength
              you didn&apos;t know you had.
            </p>
            <p className="font-serif text-xl italic text-sage-deep">
              And suddenly, you meet the person you used to be.
            </p>
            <p>
              The version of you who was worried about the future, praying for
              answers, and wondering how everything would work out.
            </p>
            <p className="font-medium text-ink">
              If they could see you now, they would be so proud.
            </p>
            <p>
              Because despite the setbacks, the heartbreaks, and the
              uncertainties, you kept going.
            </p>
            <p>
              And somehow, through it all, you became the person you were
              meant to be.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-parchment">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-28">
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
            <h2 className="text-balance font-serif text-4xl font-medium leading-tight text-sage-dark md:text-5xl">
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