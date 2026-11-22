import { Eyebrow, PreorderButton } from "./cta";

const VOICES = [
  {
    name: "Carolina",
    role: "Creator, The Growth Jar Experience",
    video: "/voice-carolina.mp4",
    poster: "/voice-carolina-poster.jpg",
    label: "Video note from Carolina, creator of The Growth Jar Experience",
  },
  {
    name: "Sunday",
    role: "A Growth Jar customer",
    video: "/voice-sunday.mp4",
    poster: "/voice-sunday-poster.jpg",
    label: "Video testimonial from Sunday, a Growth Jar customer",
  },
];

export function Voices() {
  return (
    <section className="bg-linen">
      <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-16 md:py-28">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <Eyebrow>In their own words</Eyebrow>
          <h2 className="text-balance font-serif text-4xl font-medium text-sage-dark md:text-5xl">
            Hear the heart behind the jar.
          </h2>
          <p className="leading-relaxed text-ink-soft">
            A note from the creator, and a word from someone who has
            experienced it. Press play.
          </p>
        </div>
        <div className="mx-auto grid w-full max-w-3xl gap-12 md:grid-cols-2">
          {VOICES.map((voice) => (
            <figure key={voice.name} className="mx-auto w-full max-w-xs space-y-4">
              <video
                controls
                preload="none"
                playsInline
                poster={voice.poster}
                width={464}
                height={832}
                aria-label={voice.label}
                className="aspect-[464/832] h-auto w-full rounded-2xl bg-sage-dark object-cover shadow-xl shadow-sage/20"
              >
                <source src={voice.video} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <figcaption className="space-y-1 text-center">
                <p className="font-serif text-2xl font-medium text-sage-dark">
                  {voice.name}
                </p>
                <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">
                  {voice.role}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="text-center">
          <PreorderButton />
        </div>
      </div>
    </section>
  );
}