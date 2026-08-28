import type { ReactNode } from "react";

type Align = "left" | "center";
type Tone = "dark" | "light";

interface SectionHeadingProps {
  eyebrow: string;
  title?: ReactNode;
  description?: ReactNode;
  align?: Align;
  tone?: Tone;
  className?: string;
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
  className = "",
}: SectionHeadingProps) {
  const isCenter = align === "center";
  const isLight = tone === "light";

  return (
    <div className={`${isCenter ? "text-center mx-auto" : ""} ${className}`}>
      <div
        className={`eyebrow ${isCenter ? "text-center" : ""} ${
          isLight ? "text-gold-light" : "text-gold-dark"
        }`}
      >
        {eyebrow}
      </div>
      {title ? (
        <h2
          className={`mt-4 font-display text-[2rem] leading-[1.12] sm:text-[2.35rem] ${
            isLight ? "text-ivory" : "text-forest-950"
          }`}
        >
          {title}
        </h2>
      ) : null}
      {description ? (
        <p
          className={`mt-4 max-w-xl text-base leading-relaxed ${
            isCenter ? "mx-auto" : ""
          } ${isLight ? "text-ivory/80" : "text-ink-soft"}`}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}
