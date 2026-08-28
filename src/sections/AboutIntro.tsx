import aboutImage from "../assets/images/about-community.jpg";
import Button from "../components/Button";
import Reveal from "../components/Reveal";
import { ROUTES } from "../lib/routes";

export default function AboutIntro() {
  return (
    <section className="bg-ivory py-20 sm:py-24" aria-labelledby="about-heading">
      <div className="mx-auto grid max-w-[72rem] grid-cols-1 items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16">
        <Reveal>
          <p className="eyebrow text-gold-dark">About Us</p>
          <h2 id="about-heading" className="mt-4 font-display text-[2.35rem] font-semibold leading-[1.1] text-forest-950 sm:text-[2.85rem] lg:text-[3.15rem]">
            Our Story.
            <br />
            Our Mission.
            <br />
            Our Community.
          </h2>
          <p className="mt-6 max-w-md text-[0.95rem] leading-relaxed text-ink-soft">
            Bana Ba Sawa UK was formed to give lasting structure to the values of fraternity,
            cultural openness and solidarity long shared among people of Sawa heritage. We provide
            a framework through which members support one another, stay connected to our culture,
            and participate together in community life.
          </p>
          <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink-soft">
            Through regular gatherings, mutual assistance and shared responsibility, we work to
            strengthen fraternity, communication and participation among our members across the
            United Kingdom.
          </p>
          <div className="mt-8">
            <Button to={ROUTES.about} variant="primary">
              Learn More About Us
            </Button>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <div className="overflow-hidden rounded-[4px] border border-forest-900/8">
            <img
              src={aboutImage}
              alt="Members of Bana Ba Sawa UK together at a community gathering, dressed in shared cultural attire"
              className="aspect-[5/4] h-full w-full object-cover object-[center_18%] lg:aspect-[4/5] lg:max-h-[34rem]"
              loading="lazy"
              width={1000}
              height={1501}
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
