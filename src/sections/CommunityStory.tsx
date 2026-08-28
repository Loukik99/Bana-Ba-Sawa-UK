import { useRef, useState } from "react";
import { Play } from "lucide-react";
import communityPeople from "../assets/videos/community-people.mp4";
import peoplePoster from "../assets/images/community-people-poster.jpg";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";

const VIDEO = {
  src: communityPeople,
  poster: peoplePoster,
  label: "Members of Bana Ba Sawa UK together at a community celebration",
};

function CommunityVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <figure className="relative overflow-hidden rounded-[4px] border border-forest-900/8 bg-forest-950">
      <video
        ref={videoRef}
        src={VIDEO.src}
        poster={VIDEO.poster}
        controls
        playsInline
        preload="metadata"
        className="aspect-video w-full object-cover object-center"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        aria-label={VIDEO.label}
      />
      {!isPlaying ? (
        <button
          type="button"
          className="absolute inset-x-0 top-0 bottom-12 z-10 flex items-center justify-center bg-forest-950/20 transition-colors hover:bg-forest-950/28"
          aria-label={`Play video: ${VIDEO.label}`}
          onClick={() => {
            void videoRef.current?.play();
          }}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold/65 bg-forest-950/50">
            <Play size={16} strokeWidth={1.6} fill="currentColor" className="ml-0.5 text-ivory" aria-hidden="true" />
          </span>
        </button>
      ) : null}
      <figcaption className="sr-only">{VIDEO.label}</figcaption>
    </figure>
  );
}

export default function CommunityStory() {
  return (
    <section className="impact-pattern py-20 sm:py-24" aria-labelledby="community-story-heading">
      <div className="mx-auto max-w-[72rem] px-5 sm:px-8">
        <SectionHeading
          align="center"
          eyebrow="Our Community in Motion"
          title={<span id="community-story-heading">Life in Our Community</span>}
          description="Show the real people, culture, connections and moments that bring the Bana Ba Sawa UK community together."
          className="mx-auto max-w-2xl"
        />

        <Reveal className="mx-auto mt-12 max-w-3xl">
          <CommunityVideo />
        </Reveal>

        <Reveal delay={80} className="mx-auto mt-12 max-w-2xl text-center sm:mt-14">
          <h3 className="font-display text-[1.85rem] leading-[1.12] text-forest-950 sm:text-[2.1rem]">
            Together Beyond the Moments
          </h3>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
            This film comes from one of our gatherings. It shows people dancing, speaking and
            spending time together in the same room.
          </p>
          <p className="mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
            What lasts beyond that moment is the regular life of the association: meals,
            meetings, family occasions, and the work of keeping Sawa heritage present for members
            in the United Kingdom.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
