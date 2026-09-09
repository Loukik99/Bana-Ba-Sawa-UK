import homeJpg from "../assets/images/hero-pick-five.jpg";
import homeWebp from "../assets/images/hero-pick-five.webp";
import homeWebp768 from "../assets/images/hero-pick-five-768.webp";
import aboutJpg from "../assets/images/about-hero.jpg";
import aboutWebp from "../assets/images/about-hero.webp";
import aboutWebp768 from "../assets/images/about-hero-768.webp";
import membershipJpg from "../assets/images/community-hero.jpg";
import membershipWebp from "../assets/images/community-hero.webp";
import membershipWebp768 from "../assets/images/community-hero-768.webp";
import communityJpg from "../assets/images/community-hands.jpg";
import communityWebp from "../assets/images/community-hands.webp";
import communityWebp768 from "../assets/images/community-hands-768.webp";
import { ROUTES } from "./routes";

export interface HeroRaster {
  src: string;
  width: number;
}

export interface PageHeroAsset {
  jpg: string;
  webp: HeroRaster[];
  width: number;
  height: number;
  sizes: string;
}

export const PAGE_HEROES: Record<string, PageHeroAsset> = {
  [ROUTES.home]: {
    jpg: homeJpg,
    webp: [
      { src: homeWebp768, width: 768 },
      { src: homeWebp, width: 1376 },
    ],
    width: 1376,
    height: 650,
    sizes: "100vw",
  },
  [ROUTES.about]: {
    jpg: aboutJpg,
    webp: [
      { src: aboutWebp768, width: 768 },
      { src: aboutWebp, width: 1066 },
    ],
    width: 1066,
    height: 1600,
    sizes: "(min-width: 1024px) 50vw, 100vw",
  },
  [ROUTES.membership]: {
    jpg: membershipJpg,
    webp: [
      { src: membershipWebp768, width: 768 },
      { src: membershipWebp, width: 1024 },
    ],
    width: 1024,
    height: 681,
    sizes: "100vw",
  },
  [ROUTES.community]: {
    jpg: communityJpg,
    webp: [
      { src: communityWebp768, width: 768 },
      { src: communityWebp, width: 1024 },
    ],
    width: 1024,
    height: 682,
    sizes: "100vw",
  },
};

const prefetched = new Set<string>();

export function prefetchHeroForPath(path: string): void {
  const hero = PAGE_HEROES[path];
  if (!hero) return;

  const neededWidth = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
  const chosen =
    hero.webp.find((source) => source.width >= neededWidth) ?? hero.webp[hero.webp.length - 1];
  if (!chosen || prefetched.has(chosen.src)) return;

  prefetched.add(chosen.src);
  const image = new Image();
  image.src = chosen.src;
}
