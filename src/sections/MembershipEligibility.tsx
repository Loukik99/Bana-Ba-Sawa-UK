import Reveal from "../components/Reveal";
import {
  IconGarland,
  IconLantern,
  IconSeal,
  IconVessel,
  IconVoiceArc,
  IconWelcomePeople,
} from "../components/MembershipIcons";

const BENEFITS = [
  {
    icon: IconVoiceArc,
    title: "Have Your Voice Heard",
    description: "Take part in the monthly general assembly, where members decide together.",
  },
  {
    icon: IconLantern,
    title: "Access Support Services",
    description: "Moral, legal, material, intellectual and scientific help, following the association's process.",
  },
  {
    icon: IconGarland,
    title: "Community Events",
    description: "Monthly assemblies, extra sessions when needed, and recognised community occasions.",
  },
  {
    icon: IconVessel,
    title: "Cultural Preservation",
    description: "Promoting and revitalising Sawa culture among our members.",
  },
  {
    icon: IconSeal,
    title: "Recognition",
    description: "Recognised members adhere to the texts, pay dues and attend general meetings.",
  },
];

export default function MembershipEligibility() {
  return (
    <section className="bg-ivory py-16 sm:py-20 lg:py-24" aria-labelledby="who-can-join-heading">
      <div className="mx-auto grid max-w-[72rem] grid-cols-1 items-start gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(16rem,0.72fr)_minmax(0,1.28fr)] lg:gap-14">
        <Reveal>
          <p className="eyebrow text-gold-dark">Who Can Join?</p>
          <h2
            id="who-can-join-heading"
            className="mt-4 font-display text-[2.15rem] font-semibold leading-[1.12] text-forest-950 sm:text-[2.55rem]"
          >
            Everyone is Welcome
          </h2>
          <p className="mt-5 max-w-[28rem] text-[0.95rem] leading-[1.7] text-ink-soft">
            Membership is open to people of coastal Sawa descent who speak or understand Douala.
            Members share the association's values and commitment to community life. Visitors may
            attend gatherings as observers.
          </p>
          <span
            className="mt-8 flex h-[4.25rem] w-[4.25rem] items-center justify-center rounded-full bg-forest-50 text-forest-800"
            aria-hidden="true"
          >
            <IconWelcomePeople size={28} />
          </span>
        </Reveal>

        <Reveal delay={80}>
          <p className="eyebrow text-gold-dark">Membership Benefits</p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:mt-10 lg:grid-cols-5">
            {BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="flex flex-col px-1 py-7 text-left not-last:border-b not-last:border-forest-900/10 sm:px-3 sm:py-6 lg:px-3.5 lg:py-1 lg:not-last:border-b-0 lg:not-last:border-r lg:not-last:border-forest-900/10"
                >
                  <Icon size={24} className="text-forest-800" />
                  <h3 className="mt-4 font-display text-[1.2rem] leading-snug text-forest-950">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[0.78rem] leading-relaxed text-ink-soft">{item.description}</p>
                </article>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
