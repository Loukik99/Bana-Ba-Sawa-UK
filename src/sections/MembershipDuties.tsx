import Reveal from "../components/Reveal";
import { IconDuty, IconEnvelope, IconTick } from "../components/MembershipIcons";

const RESPONSIBILITIES = [
  "Respect the association's constitution, rules and values.",
  "Attend general meetings and participate in activities.",
  "Support association initiatives and events.",
  "Pay annual dues and any other approved contributions.",
  "Promote unity, respect and positive representation of Sawa culture.",
];

export default function MembershipDuties() {
  return (
    <section
      className="bg-[#f3eee1] px-5 py-16 sm:px-8 sm:py-20 lg:py-24"
      aria-labelledby="duties-heading"
    >
      <Reveal className="mx-auto grid max-w-[72rem] overflow-hidden rounded-[4px] border border-forest-900/8 bg-cream shadow-[0_12px_32px_rgba(18,52,32,0.04)] lg:grid-cols-2">
        <div className="px-6 py-9 sm:px-10 sm:py-11 lg:px-12 lg:py-12">
          <p className="eyebrow text-gold-dark">Member Responsibilities</p>
          <h2 id="duties-heading" className="sr-only">
            Member responsibilities and membership fees
          </h2>
          <span
            className="mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-forest-800"
            aria-hidden="true"
          >
            <IconDuty size={22} />
          </span>
          <ul className="mt-6 space-y-3.5">
            {RESPONSIBILITIES.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[0.9rem] leading-[1.65] text-ink-soft">
                <span className="mt-0.5 shrink-0 text-forest-800" aria-hidden="true">
                  <IconTick size={16} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="border-t border-forest-900/8 px-6 py-9 sm:px-10 sm:py-11 lg:border-t-0 lg:border-l lg:px-12 lg:py-12">
          <p className="eyebrow text-gold-dark">Membership Fees</p>
          <span
            className="mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-forest-50 text-forest-800"
            aria-hidden="true"
          >
            <IconEnvelope size={22} />
          </span>
          <p className="mt-6 max-w-[28rem] text-[0.9rem] leading-[1.7] text-ink-soft">
            Annual dues and joining contributions are set according to the association's rules
            and may be reviewed from time to time.
          </p>
        </div>
      </Reveal>
    </section>
  );
}
