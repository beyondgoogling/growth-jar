import { Eyebrow, PreorderButton } from "./cta";

const VOICES = [
  {
    name: "Naomi",
    video: "/voice-dami.mp4",
    poster: "/voice-dami-poster.jpg",
    label: "Video testimonial from Naomi",
  },
  {
    name: "Toria",
    video: "/voice-sarrah.mp4",
    poster: "/voice-sarrah-poster.jpg",
    label: "Video testimonial from Toria",
  },
];

export function Voices() {
  return (
    <section className="bg-linen">
      <div className="mx-auto w-full max-w-6xl space-y-12 px-6 py-16 md:py-28">
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          <Eyebrow>In their own words</Eyebrow>
          <h2 className="text-balance font-serif text-4xl font-medium text-sage-dark md:text-5xl">
            Hear what they have to say. Press Play
          </h2>
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
              <figcaption className="text-center">
                <p className="font-serif text-2xl font-medium text-sage-dark">
                  {voice.name}
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