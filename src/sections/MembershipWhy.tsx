import Reveal from "../components/Reveal";
import { IconBasin, IconBelong, IconNodes, IconRipple } from "../components/MembershipIcons";

const REASONS = [
  {
    icon: IconBelong,
    title: "Belong",
    description: "A recognised place among people of Sawa heritage in the United Kingdom.",
  },
  {
    icon: IconBasin,
    title: "Support",
    description: "Mutual assistance for members and families through life's important moments.",
  },
  {
    icon: IconNodes,
    title: "Connect",
    description: "Regular gatherings, dialogue and participation in association life.",
  },
  {
    icon: IconRipple,
    title: "Make Impact",
    description: "Promote Sawa culture and contribute to the wellbeing of the community.",
  },
];

export default function MembershipWhy() {
  return (
    <section className="bg-ivory py-16 sm:py-20 lg:py-24" aria-labelledby="why-member-heading">
      <div className="mx-auto grid max-w-[72rem] grid-cols-1 items-start gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(16.5rem,0.78fr)_minmax(0,1.22fr)] lg:gap-12">
        <Reveal>
          <p className="eyebrow text-gold-dark">Why Become a Member?</p>
          <h2
            id="why-member-heading"
            className="mt-4 font-display text-[2.15rem] font-semibold leading-[1.12] text-forest-950 sm:text-[2.55rem]"
          >
            Stronger Together,
            <br />
            Great Impact
          </h2>
          <p className="mt-5 max-w-[28rem] text-[0.95rem] leading-[1.7] text-ink-soft">
            The association provides a framework through which members support one another, stay
            connected to Sawa culture, and take part together in community life.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3.5">
            {REASONS.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="flex h-full min-h-[16.5rem] flex-col items-center rounded-[4px] border border-forest-900/8 bg-cream px-5 py-9 text-center shadow-[0_8px_24px_rgba(18,52,32,0.05)] sm:py-10"
                >
                  <Icon size={26} className="text-forest-800" />
                  <h3 className="mt-5 font-display text-[1.35rem] leading-snug text-forest-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-soft">{item.description}</p>
                </article>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
