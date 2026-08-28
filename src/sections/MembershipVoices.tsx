import bannerImage from "../assets/images/about-join.jpg";
import avatarImage from "../assets/images/community-support.jpg";
import Reveal from "../components/Reveal";
import { IconQuote } from "../components/MembershipIcons";

export default function MembershipVoices() {
  return (
    <section className="bg-forest-950" aria-labelledby="membership-voices-heading">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <Reveal className="flex flex-col justify-center px-5 py-14 sm:px-8 sm:py-16 lg:py-[4.75rem] lg:pr-12 lg:pl-[max(2rem,calc((100vw-72rem)/2+2rem))]">
          <span className="text-gold-light" aria-hidden="true">
            <IconQuote size={36} />
          </span>
          <h2 id="membership-voices-heading" className="sr-only">
            From our community
          </h2>
          <blockquote className="mt-5 max-w-[32rem]">
            <p className="font-display text-[1.55rem] leading-[1.35] text-ivory sm:text-[1.85rem]">
              The association provides a framework through which members support one another, stay
              connected to Sawa culture, and participate together in community life.
            </p>
            <footer className="mt-8 flex items-center gap-3">
              <img
                src={avatarImage}
                alt=""
                className="h-11 w-11 rounded-full object-cover object-[center_18%]"
                width={88}
                height={88}
              />
              <div>
                <cite className="not-italic text-[0.92rem] font-semibold text-ivory">Our Community</cite>
                <p className="text-[0.75rem] tracking-[0.04em] text-ivory/65">Bana Ba Sawa UK</p>
              </div>
            </footer>
          </blockquote>
        </Reveal>

        <div className="relative min-h-[20rem] sm:min-h-[24rem] lg:min-h-[32rem]">
          <img
            src={bannerImage}
            alt="Members gathered in a decorated tent during a community celebration"
            className="absolute inset-0 h-full w-full object-cover object-[center_46%]"
            loading="lazy"
            width={1600}
            height={1066}
          />
          <div
            className="absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-forest-950 to-transparent lg:block"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  );
}
