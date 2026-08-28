import joinImage from "../assets/images/hero-community.jpg";
import Reveal from "../components/Reveal";
import { IconDeclaration, IconStudy, IconThreshold, IconTray } from "../components/MembershipIcons";

const STEPS = [
  {
    icon: IconDeclaration,
    title: "Fill the Form",
    description: "Complete the membership declaration set out in the association's rules.",
  },
  {
    icon: IconTray,
    title: "Submit",
    description: "Attend a general meeting in person and return the signed declaration.",
  },
  {
    icon: IconStudy,
    title: "Review",
    description: "Recognition follows from eligibility, attendance and the required declaration.",
  },
  {
    icon: IconThreshold,
    title: "Welcome",
    description: "Active membership includes paying dues and taking part in association life.",
  },
];

export default function MembershipJoin() {
  return (
    <section
      id="how-to-join"
      className="scroll-mt-20 bg-ivory px-5 pb-16 sm:px-8 sm:pb-20 lg:pb-24"
      aria-labelledby="how-to-join-heading"
    >
      <Reveal className="mx-auto grid max-w-[72rem] overflow-hidden rounded-[4px] border border-forest-900/8 bg-cream shadow-[0_12px_32px_rgba(18,52,32,0.05)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="relative min-h-[18rem] sm:min-h-[22rem] lg:min-h-[32rem]">
          <img
            src={joinImage}
            alt="Members of Bana Ba Sawa UK gathered outdoors in traditional attire at a community celebration"
            className="absolute inset-0 h-full w-full object-cover object-[62%_38%]"
            loading="lazy"
            width={1536}
            height={1024}
          />
        </div>

        <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <p className="eyebrow text-gold-dark">How to Join</p>
          <h2
            id="how-to-join-heading"
            className="mt-4 font-display text-[2.15rem] font-semibold leading-[1.12] text-forest-950 sm:text-[2.45rem]"
          >
            Joining is Simple
          </h2>

          <ol className="mt-10 grid grid-cols-1 items-start gap-8 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 lg:gap-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="relative flex flex-col items-center text-center">
                  {index < STEPS.length - 1 ? (
                    <span
                      className="absolute top-4 left-[calc(50%+1.15rem)] hidden h-px w-[calc(100%-0.5rem)] border-t border-dashed border-forest-900/25 lg:block"
                      aria-hidden="true"
                    />
                  ) : null}
                  <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-forest-900 text-[0.7rem] font-semibold text-ivory">
                    {index + 1}
                  </span>
                  <span
                    className="mt-3 flex h-[3.35rem] w-[3.35rem] items-center justify-center rounded-full bg-forest-50 text-forest-800"
                    aria-hidden="true"
                  >
                    <Icon size={22} />
                  </span>
                  <h3 className="mt-4 font-display text-[1.2rem] leading-snug text-forest-950">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-[0.78rem] leading-relaxed text-ink-soft">{step.description}</p>
                </li>
              );
            })}
          </ol>
        </div>
      </Reveal>
    </section>
  );
}
