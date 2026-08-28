import togetherImage from "../assets/images/community-together.jpg";
import cultureImage from "../assets/images/about-culture.jpg";
import supportImage from "../assets/images/community-support.jpg";
import Button from "../components/Button";
import Reveal from "../components/Reveal";
import { IconBead, IconLinked, IconOffering } from "../components/CommunityIcons";
import { ROUTES } from "../lib/routes";

const IDENTITY_CARDS = [
  {
    image: togetherImage,
    imageClass: "object-[center_32%]",
    width: 1200,
    height: 1600,
    icon: IconLinked,
    title: "Stronger Together",
    description: "Solidarity between members and their families, through communication and participation.",
    alt: "Members of Bana Ba Sawa UK gathered together at a community celebration",
  },
  {
    image: cultureImage,
    imageClass: "object-[center_28%]",
    width: 1200,
    height: 1600,
    icon: IconBead,
    title: "Celebrate Our Culture",
    description: "Promoting Sawa language, traditions and cultural participation among our members.",
    alt: "A member in traditional patterned attire and beaded necklace at a community gathering",
  },
  {
    image: supportImage,
    imageClass: "object-[center_22%]",
    width: 1200,
    height: 1600,
    icon: IconOffering,
    title: "Support & Empower",
    description: "Practical, moral, material and technical assistance for members and their families.",
    alt: "Members seated together during a community meal",
  },
];

export default function CommunityWhoWeAre() {
  return (
    <section
      id="who-we-are"
      className="scroll-mt-20 bg-ivory py-16 sm:py-20 lg:py-24"
      aria-labelledby="who-we-are-heading"
    >
      <div className="mx-auto grid max-w-[72rem] grid-cols-1 items-start gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(16.5rem,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
        <Reveal>
          <p className="eyebrow text-gold-dark">Who We Are</p>
          <h2
            id="who-we-are-heading"
            className="mt-4 font-display text-[2.15rem] font-semibold leading-[1.12] text-forest-950 sm:text-[2.55rem]"
          >
            A Community Rooted in Heritage, Growing Together
          </h2>
          <p className="mt-5 max-w-[28rem] text-[0.95rem] leading-[1.7] text-ink-soft">
            Bana Ba Sawa UK is a community association created to strengthen fraternity, solidarity
            and cultural connection among its members in the United Kingdom.
          </p>
          <p className="mt-4 max-w-[28rem] text-[0.95rem] leading-[1.7] text-ink-soft">
            Membership is open to people of coastal Sawa descent who speak or understand Douala.
            Together we provide a framework for mutual support, communication and participation in
            community life.
          </p>
          <div className="mt-8">
            <Button to={ROUTES.about} variant="primary" className="rounded-full px-7">
              Learn More About Us
            </Button>
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-5">
            {IDENTITY_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className="min-w-0 overflow-hidden rounded-[4px] border border-forest-900/8 bg-cream shadow-[0_10px_28px_rgba(18,52,32,0.06)]"
                >
                  <div className="relative">
                    <div className="overflow-hidden">
                      <img
                        src={card.image}
                        alt={card.alt}
                        className={`aspect-[4/3] w-full object-cover sm:aspect-[3/4] ${card.imageClass}`}
                        loading="lazy"
                        width={card.width}
                        height={card.height}
                      />
                    </div>
                    <span
                      className="absolute left-1/2 top-full flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-forest-900 text-ivory"
                      aria-hidden="true"
                    >
                      <Icon size={16} />
                    </span>
                  </div>
                  <div className="px-3 pb-6 pt-7 text-center">
                    <h3 className="font-display text-[1.35rem] leading-snug text-forest-950">
                      {card.title}
                    </h3>
                    <p className="mt-1.5 text-[0.8rem] leading-relaxed text-ink-soft">
                      {card.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
