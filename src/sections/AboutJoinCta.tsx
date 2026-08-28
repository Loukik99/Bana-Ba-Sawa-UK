import joinImage from "../assets/images/about-join.jpg";
import Button from "../components/Button";
import Reveal from "../components/Reveal";
import { IconGathering } from "../components/AboutIcons";
import { ROUTES } from "../lib/routes";

export default function AboutJoinCta() {
  return (
    <section className="bg-ivory px-5 py-14 sm:px-8 sm:py-16 lg:py-20" aria-label="Join us in our journey">
      <Reveal className="mx-auto grid max-w-[72rem] overflow-hidden rounded-[10px] border border-forest-900/8 bg-cream shadow-[0_18px_40px_rgba(18,52,32,0.06)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <div className="flex flex-col justify-center px-7 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <span className="flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-full bg-forest-900 text-ivory">
            <IconGathering size={30} />
          </span>
          <h2 className="mt-6 font-display text-[2rem] font-semibold leading-[1.12] text-forest-950 sm:text-[2.35rem]">
            Join Us in Our Journey
          </h2>
          <p className="mt-4 max-w-[28rem] text-[0.95rem] leading-[1.7] text-ink-soft">
            People of Sawa heritage are welcome to join, and visitors may attend gatherings as
            observers. Together we support one another and keep our culture alive.
          </p>
          <div className="mt-7">
            <Button to={ROUTES.membership} variant="primary" className="rounded-full px-7">
              Become a Member
            </Button>
          </div>
        </div>

        <div className="relative min-h-[15rem] sm:min-h-[17rem] lg:min-h-full">
          <img
            src={joinImage}
            alt="Members gathered in a decorated tent during a community celebration"
            className="absolute inset-0 h-full w-full object-cover object-[center_46%]"
            loading="lazy"
            width={1600}
            height={1066}
          />
        </div>
      </Reveal>
    </section>
  );
}
