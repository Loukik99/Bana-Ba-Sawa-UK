import Button from "../components/Button";
import HeroPicture from "../components/HeroPicture";
import Reveal from "../components/Reveal";
import { PAGE_HEROES } from "../lib/page-heroes";
import { ROUTES } from "../lib/routes";

export default function AboutHero() {
  return (
    <section className="bg-cream" aria-labelledby="about-hero-heading">
      <div className="mx-auto grid max-w-[72rem] grid-cols-1 items-center gap-10 px-5 py-14 sm:px-8 sm:py-16 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-14 lg:py-[4.5rem]">
        <Reveal immediate>
          <p className="eyebrow text-gold-dark">About Us</p>
          <h1
            id="about-hero-heading"
            className="mt-4 font-display text-[2.55rem] font-semibold leading-[1.08] text-forest-950 sm:text-[3rem] lg:text-[3.35rem]"
          >
            Our Story.
            <br />
            Our Mission.
            <br />
            Our Community.
          </h1>
          <p className="mt-6 max-w-[28rem] text-[0.95rem] leading-[1.7] text-ink-soft">
            Bana Ba Sawa UK was formed in the United Kingdom to give lasting structure to the
            long-standing values of fraternity, cultural openness and solidarity shared among
            people of Sawa heritage.
          </p>
          <p className="mt-4 max-w-[28rem] text-[0.95rem] leading-[1.7] text-ink-soft">
            We come together so members can support one another, stay connected to Sawa culture,
            and take part in a united community for present and future generations.
          </p>
          <div className="mt-8">
            <Button to={ROUTES.community} variant="primary" className="rounded-full px-7">
              Our Community
            </Button>
          </div>
        </Reveal>

        <div className="overflow-hidden rounded-[4px]">
          <HeroPicture
            asset={PAGE_HEROES[ROUTES.about]}
            alt="Members of Bana Ba Sawa UK standing together in coordinated cultural attire"
            className="aspect-[4/3] h-full w-full object-cover object-[center_18%] lg:aspect-[4/5] lg:max-h-[36rem]"
          />
        </div>
      </div>
    </section>
  );
}
