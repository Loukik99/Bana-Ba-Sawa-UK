import ctaImage from "../assets/images/community-cta.jpg";
import Button from "../components/Button";
import Reveal from "../components/Reveal";
import { IconCircleGathering } from "../components/CommunityIcons";
import { ROUTES } from "../lib/routes";

export default function CommunityJoinCta() {
  return (
    <section className="bg-ivory px-5 py-14 sm:px-8 sm:py-16 lg:py-20" aria-label="Join our community">
      <Reveal className="mx-auto grid max-w-[72rem] overflow-hidden rounded-[10px] bg-forest-900 shadow-[0_18px_40px_rgba(18,52,32,0.12)] lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
        <div className="flex flex-col justify-center px-7 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
          <span
            className="flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-full border border-ivory/35 text-ivory"
            aria-hidden="true"
          >
            <IconCircleGathering size={30} />
          </span>
          <h2 className="mt-6 font-display text-[2rem] font-semibold leading-[1.12] text-ivory sm:text-[2.35rem]">
            Join Our Community
          </h2>
          <p className="mt-4 max-w-[28rem] text-[0.95rem] leading-[1.7] text-ivory/80">
            People of Sawa heritage are welcome to join, and visitors may attend gatherings as
            observers. Together we support one another and keep our culture alive.
          </p>
          <div className="mt-7">
            <Button to={ROUTES.membership} variant="secondary" className="rounded-full px-7">
              Become a Member
            </Button>
          </div>
        </div>

        <div className="relative min-h-[15rem] sm:min-h-[17rem] lg:min-h-full">
          <img
            src={ctaImage}
            alt="Members of Bana Ba Sawa UK standing together at a community gathering"
            className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
            loading="lazy"
            width={1600}
            height={900}
          />
          <div
            className="absolute inset-y-0 left-0 hidden w-16 bg-gradient-to-r from-forest-900 to-transparent lg:block"
            aria-hidden="true"
          />
        </div>
      </Reveal>
    </section>
  );
}
