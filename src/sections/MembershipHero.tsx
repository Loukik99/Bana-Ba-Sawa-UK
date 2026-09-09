import Button from "../components/Button";
import HeroPicture from "../components/HeroPicture";
import Reveal from "../components/Reveal";
import { PAGE_HEROES } from "../lib/page-heroes";
import { ROUTES } from "../lib/routes";

export default function MembershipHero() {
  return (
    <section className="relative overflow-hidden bg-forest-950" aria-label="Membership">
      <HeroPicture
        asset={PAGE_HEROES[ROUTES.membership]}
        alt="Members of the Sawa community gathered outdoors in traditional attire, talking and smiling together"
        pictureClassName="absolute inset-0 block h-full w-full"
        className="h-full w-full object-cover object-[72%_42%]"
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

      <div className="relative mx-auto flex min-h-[34rem] max-w-[72rem] flex-col justify-center px-5 pb-28 pt-16 sm:min-h-[38rem] sm:px-8 sm:pb-32 sm:pt-20 lg:min-h-[42rem]">
        <Reveal immediate className="max-w-[34rem]">
          <p className="eyebrow text-gold-light">Membership</p>
          <h1 className="mt-4 font-display text-[2.55rem] font-semibold leading-[1.06] text-ivory sm:text-5xl lg:text-[3.65rem]">
            Be Part of Our
            <br />
            Community
          </h1>
          <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-ivory/82 sm:text-base">
            Membership is open to people of coastal Sawa descent who speak or understand Douala,
            and who share the association's values of fraternity, solidarity and cultural connection.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="#how-to-join" variant="on-dark">
              Join Now
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
