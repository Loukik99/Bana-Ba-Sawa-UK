import { useState } from "react";
import gallery1 from "../assets/images/community-gallery-1.jpg";
import gallery2 from "../assets/images/community-gallery-2.jpg";
import gallery3 from "../assets/images/community-gallery-3.jpg";
import gallery4 from "../assets/images/community-gallery-4.jpg";
import gallery5 from "../assets/images/community-gallery-5.jpg";
import togetherImage from "../assets/images/community-together.jpg";
import joinImage from "../assets/images/about-join.jpg";
import voiceImage from "../assets/images/community-support.jpg";
import Reveal from "../components/Reveal";
import { IconQuoteMark } from "../components/CommunityIcons";

const SLIDES = [
  [
    {
      src: gallery1,
      alt: "Members seated around a decorated table at a community gathering",
      className: "object-[center_40%]",
      width: 1200,
      height: 1600,
    },
    {
      src: gallery2,
      alt: "Members gathered indoors in coordinated cultural attire",
      className: "object-[center_35%]",
      width: 1200,
      height: 1600,
    },
    {
      src: gallery3,
      alt: "Members talking together at a community celebration",
      className: "object-[center_28%]",
      width: 1200,
      height: 1600,
    },
  ],
  [
    {
      src: gallery4,
      alt: "Decorated banquet tables prepared for a community celebration",
      className: "object-[center_45%]",
      width: 1200,
      height: 1600,
    },
    {
      src: gallery5,
      alt: "Members in colourful cultural dress during a community celebration",
      className: "object-[center_38%]",
      width: 1200,
      height: 1600,
    },
    {
      src: togetherImage,
      alt: "Members standing together at a community celebration",
      className: "object-[center_30%]",
      width: 1200,
      height: 1600,
    },
  ],
  [
    {
      src: joinImage,
      alt: "Members gathered in a decorated tent during a community celebration",
      className: "object-[center_46%]",
      width: 1600,
      height: 1066,
    },
    {
      src: gallery2,
      alt: "Members gathered in a home setting in coordinated cultural attire",
      className: "object-[center_48%]",
      width: 1200,
      height: 1600,
    },
    {
      src: gallery1,
      alt: "Members sharing a meal at a community gathering",
      className: "object-[center_55%]",
      width: 1200,
      height: 1600,
    },
  ],
];

export default function CommunityVoices() {
  const [active, setActive] = useState(0);
  const images = SLIDES[active];

  return (
    <section className="bg-ivory py-16 sm:py-20 lg:py-24" aria-labelledby="voices-heading">
      <div className="mx-auto max-w-[72rem] px-5 sm:px-8">
        <Reveal>
          <h2 id="voices-heading" className="sr-only">
            Voices From Our Community
          </h2>
          <p className="eyebrow text-center text-gold-dark">Voices From Our Community</p>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-12 grid grid-cols-1 items-stretch gap-6 lg:mt-14 lg:grid-cols-[minmax(17rem,0.78fr)_minmax(0,1.22fr)] lg:gap-7">
            <blockquote className="flex h-full flex-col justify-between rounded-[4px] border border-forest-900/8 bg-cream px-7 py-8 shadow-[0_12px_32px_rgba(18,52,32,0.05)] sm:px-8 sm:py-9">
              <div>
                <span className="text-gold-dark" aria-hidden="true">
                  <IconQuoteMark size={28} />
                </span>
                <p className="mt-5 font-display text-[1.45rem] leading-[1.35] text-forest-950 sm:text-[1.6rem]">
                  The association provides a framework through which members support one another,
                  stay connected to Sawa culture, and participate together in community life.
                </p>
              </div>
              <footer className="mt-8 flex items-center gap-3">
                <img
                  src={voiceImage}
                  alt=""
                  className="h-11 w-11 rounded-full object-cover object-[center_18%]"
                  width={88}
                  height={88}
                />
                <div>
                  <cite className="not-italic text-[0.92rem] font-semibold text-forest-950">
                    Our Community
                  </cite>
                  <p className="text-[0.75rem] tracking-[0.04em] text-ink-soft">Bana Ba Sawa UK</p>
                </div>
              </footer>
            </blockquote>

            <div>
              <div className="grid h-full min-h-[14rem] grid-cols-3 gap-3 sm:min-h-[16.5rem] sm:gap-4 lg:min-h-[18.5rem] lg:grid-cols-[1.55fr_0.95fr_0.95fr]">
                {images.map((image, index) => (
                  <div
                    key={`${active}-${image.src}-${index}`}
                    className="overflow-hidden rounded-[4px]"
                  >
                    <img
                      src={image.src}
                      alt={image.alt}
                      className={`h-full w-full object-cover ${image.className}`}
                      loading="lazy"
                      width={image.width}
                      height={image.height}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-center gap-2" role="tablist" aria-label="Community photographs">
                {SLIDES.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    role="tab"
                    aria-selected={active === index}
                    aria-label={`Show photograph set ${index + 1}`}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      active === index ? "bg-forest-900" : "border border-forest-900/35 bg-transparent"
                    }`}
                    onClick={() => setActive(index)}
                  />
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
