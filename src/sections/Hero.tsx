import Button from "../components/Button";
import HeroPicture from "../components/HeroPicture";
import Reveal from "../components/Reveal";
import { PAGE_HEROES } from "../lib/page-heroes";
import { ROUTES } from "../lib/routes";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-forest-950" aria-label="Introduction">
      <HeroPicture
        asset={PAGE_HEROES[ROUTES.home]}
        alt="Members of Bana Ba Sawa UK gathered together in traditional attire at a community celebration"
        pictureClassName="absolute inset-0 block h-full w-full"
        className="h-full w-full object-cover object-[50%_40%] sm:object-[52%_38%] lg:object-[54%_36%]"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(96deg, rgb(12, 31, 19) 0%, rgba(12, 31, 19, 0.94) 26%, rgba(12, 31, 19, 0.72) 40%, rgba(12, 31, 19, 0.32) 56%, rgba(12, 31, 19, 0.08) 74%, transparent 100%)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(12, 31, 19, 0.18) 0%, transparent 22%, transparent 68%, rgba(12, 31, 19, 0.28) 100%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-[36rem] max-w-[72rem] flex-col justify-center px-5 pb-32 pt-16 sm:min-h-[40rem] sm:px-8 sm:pb-36 sm:pt-20 lg:min-h-[44rem]">
        <Reveal immediate className="max-w-[34rem]">
          <p className="eyebrow text-gold-light">Together in Solidarity</p>
          <h1 className="mt-4 font-display text-[2.55rem] font-semibold leading-[1.06] text-ivory sm:text-5xl lg:text-[3.65rem]">
            Stronger as One.
            <br />
            United for Our Heritage.
          </h1>
          <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-ivory/82 sm:text-base">
            Bana Ba Sawa UK is a community association uniting people of Sawa heritage in the UK
            through solidarity, culture and mutual support.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button to={ROUTES.membership} variant="on-dark">
              Become a Member
            </Button>
            <Button to={ROUTES.community} variant="outline-light">
              Discover Our Community
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
