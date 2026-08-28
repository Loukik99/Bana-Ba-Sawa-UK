import Reveal from "../components/Reveal";
import { IconColumn, IconCuppedHands, IconDialogue, IconRings } from "../components/AboutIcons";

const VALUES = [
  {
    icon: IconRings,
    title: "Solidarity",
    description: "We stand together and support one another through life's challenges.",
  },
  {
    icon: IconDialogue,
    title: "Fraternity",
    description: "We strengthen bonds through communication, respect and participation.",
  },
  {
    icon: IconColumn,
    title: "Heritage",
    description: "We promote and revitalise Sawa heritage and cultural values.",
  },
  {
    icon: IconCuppedHands,
    title: "Mutual Support",
    description: "We provide practical, moral, material and technical support to our members.",
  },
];

export default function AboutValues() {
  return (
    <section className="bg-[#f3eee1] py-[4.25rem] sm:py-20" aria-labelledby="values-heading">
      <div className="mx-auto max-w-[72rem] px-5 sm:px-8">
        <Reveal>
          <h2 id="values-heading" className="sr-only">
            Our Values
          </h2>
          <p className="eyebrow text-center text-gold-dark">Our Values</p>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:mt-14 lg:grid-cols-4">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="flex flex-col items-center px-6 py-8 text-center not-last:border-b not-last:border-forest-900/10 sm:px-7 lg:py-2 lg:not-last:border-b-0 lg:not-last:border-r lg:not-last:border-forest-900/10"
                >
                  <Icon size={30} className="text-gold-dark" />
                  <h3 className="mt-5 font-display text-[1.5rem] leading-snug text-forest-950">
                    {value.title}
                  </h3>
                  <p className="mt-2.5 max-w-[16.5rem] text-[0.8125rem] leading-relaxed text-ink-soft">
                    {value.description}
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
