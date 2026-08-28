import { Users, HeartHandshake, Landmark, Handshake, Megaphone } from "lucide-react";
import SectionHeading from "../components/SectionHeading";
import Reveal from "../components/Reveal";

const SERVICES = [
  {
    icon: Users,
    title: "Community Engagement",
    description: "Bringing members together through regular meetings and shared participation in association life.",
  },
  {
    icon: HeartHandshake,
    title: "Support & Welfare",
    description: "Providing assistance to members and their families during health concerns, family events and bereavement.",
  },
  {
    icon: Landmark,
    title: "Culture & Heritage",
    description: "Promoting Sawa language, traditions and cultural identity among our members.",
  },
  {
    icon: Handshake,
    title: "Partnerships & Collaboration",
    description: "Working alongside members and other organisations to support our shared cultural and community goals.",
  },
  {
    icon: Megaphone,
    title: "Advocacy & Representation",
    description: "Representing the interests of our members and the Sawa community through our elected leadership.",
  },
];

export default function WhatWeDo() {
  return (
    <section className="bg-ivory py-20 sm:py-24" aria-labelledby="what-we-do-heading">
      <div className="mx-auto max-w-[72rem] px-5 sm:px-8">
        <SectionHeading
          align="center"
          eyebrow="What We Do"
          title={<span id="what-we-do-heading">Serving Our Members and Our Culture</span>}
          className="mx-auto max-w-2xl"
        />
        <Reveal className="mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {SERVICES.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="px-1 py-8 not-last:border-b not-last:border-forest-900/10 lg:px-5 lg:py-2 lg:not-last:border-b-0 lg:not-last:border-r lg:not-last:border-forest-900/10"
                >
                  <Icon size={20} strokeWidth={1.4} className="text-gold-dark" aria-hidden="true" />
                  <h3 className="mt-4 font-display text-[1.2rem] leading-snug text-forest-950">{item.title}</h3>
                  <p className="mt-2 text-[0.8rem] leading-relaxed text-ink-soft">{item.description}</p>
                </div>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
