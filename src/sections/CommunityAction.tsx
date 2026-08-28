import Reveal from "../components/Reveal";
import {
  IconCloth,
  IconFamily,
  IconGuidance,
  IconShelter,
  IconTable,
  IconVisit,
} from "../components/CommunityIcons";

const ACTIONS = [
  {
    icon: IconShelter,
    title: "Community Support",
    description: "We support members and their families through life's challenges.",
  },
  {
    icon: IconFamily,
    title: "Family Events",
    description: "Marriage, birth, birthdays and baptisms are recognised happy events.",
  },
  {
    icon: IconCloth,
    title: "Cultural Preservation",
    description: "Promoting Sawa language, traditions and cultural heritage.",
  },
  {
    icon: IconTable,
    title: "Events & Gatherings",
    description: "Members meet monthly in general assembly, with extra sessions when needed.",
  },
  {
    icon: IconVisit,
    title: "Health & Wellbeing",
    description: "Physical assistance for members who are unwell, arranged through the office.",
  },
  {
    icon: IconGuidance,
    title: "Mutual Assistance",
    description: "Moral, legal, material, intellectual and scientific help, following the association's process.",
  },
];

export default function CommunityAction() {
  return (
    <section className="bg-[#f3eee1] py-[4.25rem] sm:py-20" aria-labelledby="community-action-heading">
      <div className="mx-auto max-w-[72rem] px-5 sm:px-8">
        <Reveal>
          <h2 id="community-action-heading" className="sr-only">
            Our Community in Action
          </h2>
          <p className="eyebrow text-center text-gold-dark">Our Community in Action</p>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:mt-14 lg:grid-cols-6">
            {ACTIONS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="flex flex-col items-center px-5 py-8 text-center not-last:border-b not-last:border-forest-900/10 sm:px-4 lg:py-2 lg:not-last:border-b-0 lg:not-last:border-r lg:not-last:border-forest-900/10"
                >
                  <Icon size={28} className="text-gold-dark" />
                  <h3 className="mt-5 font-display text-[1.25rem] leading-snug text-forest-950">
                    {item.title}
                  </h3>
                  <p className="mt-2.5 max-w-[16.5rem] text-[0.8125rem] leading-relaxed text-ink-soft">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
