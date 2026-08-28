import { CalendarCheck, HeartHandshake, Sparkles, ShieldCheck } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";

const IMPACT_ITEMS = [
  {
    icon: CalendarCheck,
    title: "Monthly Gatherings",
    description:
      "Members come together every month in general assembly to connect, discuss and support one another.",
  },
  {
    icon: HeartHandshake,
    title: "Mutual Assistance",
    description:
      "A structured framework of support for health concerns, family events, bereavement and technical needs.",
  },
  {
    icon: Sparkles,
    title: "Cultural Continuity",
    description: "Promoting and revitalising Sawa heritage, language and traditions across generations.",
  },
  {
    icon: ShieldCheck,
    title: "Elected Leadership",
    description: "Guided by an executive board elected by members to represent and serve the association.",
  },
];

export default function ImpactSection() {
  return (
    <section className="impact-pattern py-20 sm:py-24" aria-labelledby="impact-heading">
      <div className="mx-auto max-w-[72rem] px-5 sm:px-8">
        <SectionHeading
          align="center"
          eyebrow="How We Support Our Community"
          title={<span id="impact-heading">Built on Structure, Sustained by Members</span>}
          className="mx-auto max-w-2xl"
        />
        <Reveal className="mt-12">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {IMPACT_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="h-full rounded-[4px] border border-forest-900/8 bg-cream px-6 py-7 shadow-[0_8px_24px_rgba(18,52,32,0.05)]"
                >
                  <Icon size={20} strokeWidth={1.4} className="text-gold-dark" aria-hidden="true" />
                  <h3 className="mt-4 font-display text-[1.35rem] leading-snug text-forest-950">{item.title}</h3>
                  <p className="mt-2 text-[0.8125rem] leading-relaxed text-ink-soft">{item.description}</p>
                </article>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
