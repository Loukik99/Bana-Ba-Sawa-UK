import type { PageHeroAsset } from "../lib/page-heroes";

interface HeroPictureProps {
  asset: PageHeroAsset;
  alt: string;
  className?: string;
  pictureClassName?: string;
}

function toSrcSet(sources: PageHeroAsset["webp"]): string {
  return sources.map((source) => `${source.src} ${source.width}w`).join(", ");
}

export default function HeroPicture({ asset, alt, className, pictureClassName }: HeroPictureProps) {
  return (
    <picture className={pictureClassName}>
      <source type="image/webp" srcSet={toSrcSet(asset.webp)} sizes={asset.sizes} />
      <img
        src={asset.jpg}
        alt={alt}
        width={asset.width}
        height={asset.height}
        sizes={asset.sizes}
        className={className}
        loading="eager"
        fetchPriority="high"
        decoding="sync"
      />
    </picture>
  );
}
