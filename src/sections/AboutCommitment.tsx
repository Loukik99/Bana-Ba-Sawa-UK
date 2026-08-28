import commitmentImage from "../assets/images/about-commitment.jpg";
import Reveal from "../components/Reveal";
import { IconCalendarLine, IconColumn, IconCuppedHands, IconPurpose } from "../components/AboutIcons";

const COMMITMENTS = [
  {
    icon: IconCalendarLine,
    value: "Monthly",
    label: "Assemblies",
  },
  {
    icon: IconCuppedHands,
    value: "Mutual",
    label: "Assistance",
  },
  {
    icon: IconColumn,
    value: "Sawa",
    label: "Culture",
  },
  {
    icon: IconPurpose,
    value: "Shared",
    label: "Purpose",
  },
];

export default function AboutCommitment() {
  return (
    <section className="bg-forest-950" aria-labelledby="commitment-heading">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <Reveal className="flex flex-col justify-center px-5 py-14 sm:px-8 sm:py-16 lg:py-[4.75rem] lg:pr-12 lg:pl-[max(2rem,calc((100vw-72rem)/2+2rem))]">
          <p className="eyebrow text-gold-light">Our Commitment</p>
          <h2
            id="commitment-heading"
            className="mt-4 font-display text-[2.15rem] font-semibold leading-[1.12] text-ivory sm:text-[2.65rem]"
          >
            Building a Stronger Tomorrow
          </h2>
          <p className="mt-5 max-w-[32rem] text-[0.95rem] leading-[1.7] text-ivory/80">
            We are committed to organising solidarity among members and their families,
            strengthening fraternity through communication and participation, and promoting Sawa
            culture in the United Kingdom.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-y-8 sm:grid-cols-4 sm:gap-0">
            {COMMITMENTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex flex-col items-start px-0 sm:px-3 sm:not-first:border-l sm:not-first:border-ivory/15 lg:px-5"
                >
                  <Icon size={18} className="text-gold-light" />
                  <p className="mt-3 font-display text-[1.75rem] leading-none text-ivory sm:text-[1.95rem]">
                    {item.value}
                  </p>
                  <p className="mt-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ivory/65">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </Reveal>

        <div className="relative min-h-[20rem] sm:min-h-[24rem] lg:min-h-[32rem]">
          <img
            src={commitmentImage}
            alt="Members of Bana Ba Sawa UK standing together at a community gathering"
            className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
            loading="lazy"
            width={1600}
            height={900}
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
