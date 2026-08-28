import heroImage from "../assets/images/community-hands.jpg";
import Button from "../components/Button";
import Reveal from "../components/Reveal";

export default function CommunityHero() {
  return (
    <section className="relative overflow-hidden bg-forest-950" aria-label="Our community">
      <img
        src={heroImage}
        alt="Members of the Sawa community stacking their hands together in a circle, a gesture of unity and belonging"
        className="absolute inset-0 h-full w-full object-cover object-[78%_48%]"
        loading="eager"
        fetchPriority="high"
        width={1024}
        height={682}
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
          <p className="eyebrow text-gold-light">Our Community</p>
          <h1 className="mt-4 font-display text-[2.55rem] font-semibold leading-[1.06] text-ivory sm:text-5xl lg:text-[3.65rem]">
            One Community.
            <br />
            Many Voices.
            <br />
            One Future.
          </h1>
          <p className="mt-5 max-w-md text-[0.95rem] leading-relaxed text-ivory/82 sm:text-base">
            Bana Ba Sawa UK brings members of the Sawa community together in the United Kingdom
            through solidarity, mutual support, cultural connection and shared responsibility.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button href="#who-we-are" variant="on-dark">
              Our Community
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
