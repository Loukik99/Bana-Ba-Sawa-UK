import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

function base(size: number, className: string | undefined): SVGProps<SVGSVGElement> {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className,
    "aria-hidden": true,
  };
}

/** Three figures under an arch. Community support / shelter. */
export function IconShelter({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <path d="M4.2 11.2 12 4.8l7.8 6.4" />
      <path d="M6.2 10.4v8.8h11.6v-8.8" />
      <circle cx="12" cy="13.2" r="1.35" />
      <circle cx="8.2" cy="14.1" r="1.1" />
      <circle cx="15.8" cy="14.1" r="1.1" />
      <path d="M10.1 19.2c.2-1.8 1-2.8 1.9-2.8s1.7 1 1.9 2.8" />
      <path d="M6.6 19.2c.15-1.3.8-2 1.6-2" />
      <path d="M17.4 19.2c-.15-1.3-.8-2-1.6-2" />
    </svg>
  );
}

/** Adult and child standing together. Family events. */
export function IconFamily({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="9.2" cy="6.6" r="2" />
      <path d="M5.6 19.4c.3-3.6 1.8-5.6 3.6-5.6s3.3 2 3.6 5.6" />
      <circle cx="16.2" cy="9.4" r="1.55" />
      <path d="M13.5 19.4c.2-2.5 1.3-3.9 2.7-3.9s2.5 1.4 2.7 3.9" />
    </svg>
  );
}

/** Folded cloth with a hanging pattern. Cultural dress and heritage. */
export function IconCloth({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <path d="M5.2 5.4h13.6" />
      <path d="M7.2 5.4c.2 4.6-.8 8.2-2 13.2" />
      <path d="M12 5.4c.4 5.2 0 8.8-1.2 13.2" />
      <path d="M16.8 5.4c.3 4.8.2 8.6 1.6 13.2" />
      <path d="M6.4 10.6h9.2M5.8 14.8h10.4" />
    </svg>
  );
}

/** Round gathering table with three seats. Events and assemblies. */
export function IconTable({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <ellipse cx="12" cy="13.2" rx="7.4" ry="3.1" />
      <path d="M4.6 13.2v2.4c0 1.7 3.3 3.1 7.4 3.1s7.4-1.4 7.4-3.1v-2.4" />
      <circle cx="12" cy="6.2" r="1.55" />
      <circle cx="6.4" cy="8.6" r="1.25" />
      <circle cx="17.6" cy="8.6" r="1.25" />
    </svg>
  );
}

/** Companion walking with a supported figure. Health visits. */
export function IconVisit({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="8.2" cy="6.4" r="1.7" />
      <path d="M5.4 19.4c.25-3.4 1.5-5.4 2.8-5.4s2.55 2 2.8 5.4" />
      <circle cx="15.6" cy="7.2" r="1.7" />
      <path d="M12.8 19.4c.25-3.2 1.5-5.1 2.8-5.1s2.55 1.9 2.8 5.1" />
      <path d="M10.4 12.2h3.4" />
    </svg>
  );
}

/** Open path with a guiding lamp. Technical and practical assistance. */
export function IconGuidance({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <path d="M8.2 20.2c0-4.2 2.4-6.4 3.8-8.2 1.4 1.8 3.8 4 3.8 8.2" />
      <path d="M12 4.6v3.4" />
      <path d="M9.2 8.8h5.6" />
      <path d="M10.2 8.8c0 2.1.8 3.4 1.8 3.4s1.8-1.3 1.8-3.4" />
    </svg>
  );
}

/** Linked figures for solidarity card badge. */
export function IconLinked({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="8.4" cy="7.2" r="2" />
      <circle cx="15.6" cy="7.2" r="2" />
      <path d="M4.8 19.2c.3-3.2 1.8-5 3.6-5s3.3 1.8 3.6 5" />
      <path d="M12 19.2c.3-3.2 1.8-5 3.6-5s3.3 1.8 3.6 5" />
      <path d="M10.6 12.4h2.8" />
    </svg>
  );
}

/** Small drum-and-bead motif for culture card badge. Distinct from About drum. */
export function IconBead({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="12" cy="12" r="6.4" />
      <path d="M12 5.6v12.8M5.6 12h12.8" />
      <path d="M7.4 7.4c3.2 1.4 5.8 1.4 9.2 0M7.4 16.6c3.2-1.4 5.8-1.4 9.2 0" />
    </svg>
  );
}

/** Open palms offering help. Support card badge. */
export function IconOffering({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <path d="M4.4 13.4c1.8-1.1 3.4-.4 4.2.8" />
      <path d="M8.6 14.2c.4-2.2 2.2-3.4 3.4-3.4 1.2 0 3 1.2 3.4 3.4" />
      <path d="M15.4 14.2c.8-1.2 2.4-1.9 4.2-.8" />
      <path d="M4.4 13.4c-.4 2.8 2.2 6.2 7.6 6.2s8-3.4 7.6-6.2" />
    </svg>
  );
}

/** Outlined gathering mark for the join banner. */
export function IconCircleGathering({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="12" cy="5.8" r="1.9" />
      <circle cx="6.2" cy="9.6" r="1.55" />
      <circle cx="17.8" cy="9.6" r="1.55" />
      <path d="M8.6 19.6c.25-2.7 1.6-4.3 3.4-4.3s3.15 1.6 3.4 4.3" />
      <path d="M3.6 19c.2-2.1 1.2-3.3 2.6-3.3" />
      <path d="M20.4 19c-.2-2.1-1.2-3.3-2.6-3.3" />
    </svg>
  );
}

/** Editorial quote mark for the voices card. */
export function IconQuoteMark({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest} fill="currentColor" stroke="none">
      <path d="M6.2 16.8c1.8 0 3.2-1.5 3.2-3.4 0-1.8-1.3-3.2-3-3.2-.2-2.4 1.3-4.4 3.8-5.2l-.7-1.8C6.2 4.4 3.4 7.2 3.4 11.4c0 3 2 5.4 2.8 5.4Zm8.6 0c1.8 0 3.2-1.5 3.2-3.4 0-1.8-1.3-3.2-3-3.2-.2-2.4 1.3-4.4 3.8-5.2l-.7-1.8c-3.3 1.2-6.1 4-6.1 8.2 0 3 2 5.4 2.8 5.4Z" />
    </svg>
  );
}
