import cultureImage from "../assets/images/about-culture.jpg";
import historyImage from "../assets/images/about-history.jpg";
import peopleImage from "../assets/images/about-people.jpg";
import Reveal from "../components/Reveal";
import { IconDrum, IconFigures, IconScroll } from "../components/AboutIcons";

const HERITAGE_CARDS = [
  {
    image: cultureImage,
    imageClass: "object-[center_28%]",
    width: 1200,
    height: 1600,
    icon: IconDrum,
    title: "Our Culture",
    description: "Language, music, dress and gathering we continue to share.",
    alt: "A member in traditional patterned attire and beaded necklace at a community gathering",
  },
  {
    image: historyImage,
    imageClass: "object-[center_38%]",
    width: 1200,
    height: 1600,
    icon: IconScroll,
    title: "Our History",
    description: "A formal association built on long-standing Sawa practices.",
    alt: "Members celebrating together, with the Cameroon flag in the background",
  },
  {
    image: peopleImage,
    imageClass: "object-[center_22%]",
    width: 1200,
    height: 1600,
    icon: IconFigures,
    title: "Our People",
    description: "A community bound by solidarity, participation and mutual support.",
    alt: "A member wearing patterned cultural dress at a community gathering",
  },
];

export default function AboutHeritage() {
  return (
    <section className="bg-ivory py-16 sm:py-20 lg:py-24" aria-labelledby="heritage-heading">
      <div className="mx-auto grid max-w-[72rem] grid-cols-1 items-start gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(16.5rem,0.82fr)_minmax(0,1.18fr)] lg:gap-14">
        <Reveal>
          <p className="eyebrow text-gold-dark">Our Roots</p>
          <h2
            id="heritage-heading"
            className="mt-4 font-display text-[2.15rem] font-semibold leading-[1.12] text-forest-950 sm:text-[2.55rem]"
          >
            The Sawa Heritage
          </h2>
          <p className="mt-5 max-w-[28rem] text-[0.95rem] leading-[1.7] text-ink-soft">
            Membership is open to people of coastal Sawa descent who speak or understand Douala.
            Our language, traditions and cultural values connect members across generations, and
            the association exists to promote and revitalise that heritage.
          </p>
          <p className="mt-4 max-w-[28rem] text-[0.95rem] leading-[1.7] text-ink-soft">
            In the United Kingdom we continue this work through regular gatherings, cultural
            participation and a framework of solidarity that keeps members connected to one
            another and to Sawa community life.
          </p>
        </Reveal>

        <Reveal delay={80}>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-5">
            {HERITAGE_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.title} className="min-w-0">
                  <div className="relative">
                    <div className="overflow-hidden rounded-[4px]">
                      <img
                        src={card.image}
                        alt={card.alt}
                        className={`aspect-[4/3] w-full object-cover sm:aspect-[3/4] ${card.imageClass}`}
                        loading="lazy"
                        width={card.width}
                        height={card.height}
                      />
                    </div>
                    <span className="absolute left-1/2 top-full flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-forest-900 text-ivory" aria-hidden="true">
                      <Icon size={16} />
                    </span>
                  </div>
                  <div className="px-1 pt-7 text-center">
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
