import { HeartHandshake, Users, Landmark, HandHelping } from "lucide-react";
import Reveal from "../components/Reveal";

const VALUES = [
  {
    icon: HeartHandshake,
    title: "Solidarity",
    description: "We support members and families through life's challenges.",
  },
  {
    icon: Users,
    title: "Fraternity",
    description: "We strengthen bonds through communication, respect and participation.",
  },
  {
    icon: Landmark,
    title: "Culture",
    description: "We promote and revitalise Sawa heritage and values.",
  },
  {
    icon: HandHelping,
    title: "Mutual Support",
    description: "We provide practical, moral, material and technical assistance.",
  },
];

export default function ValuesStrip() {
  return (
    <section className="relative z-10 -mt-16 sm:-mt-[4.5rem]" aria-label="What we stand for">
      <div className="mx-auto max-w-[72rem] px-5 sm:px-8">
        <Reveal
          as="div"
          immediate
          className="grid grid-cols-1 rounded-[4px] border border-forest-900/10 bg-cream shadow-[0_18px_40px_rgba(18,52,32,0.08)] lg:grid-cols-4"
        >
          {VALUES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-center px-7 py-8 text-center not-last:border-b not-last:border-forest-900/10 sm:px-8 sm:py-10 lg:not-last:border-b-0 lg:not-last:border-r lg:not-last:border-forest-900/10"
            >
              <Icon size={22} strokeWidth={1.4} className="text-gold-dark" aria-hidden="true" />
              <h3 className="eyebrow mt-4 text-forest-950">{title}</h3>
              <p className="mt-2.5 max-w-[16rem] text-[0.8125rem] leading-relaxed text-ink-soft">{description}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
