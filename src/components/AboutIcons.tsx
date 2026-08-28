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

/** Drum with beaters. Culture / music. */
export function IconDrum({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <ellipse cx="12" cy="8.2" rx="7.2" ry="2.6" />
      <path d="M4.8 8.2v7.2c0 1.5 3.2 2.7 7.2 2.7s7.2-1.2 7.2-2.7V8.2" />
      <path d="M4.8 12.1c0 1.5 3.2 2.6 7.2 2.6s7.2-1.1 7.2-2.6" />
      <path d="M7.6 6.4 5.2 3.4M16.4 6.4l2.4-3" />
    </svg>
  );
}

/** Open scroll. History. */
export function IconScroll({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <path d="M7.2 6.2c0-1.2.9-2 2.1-2H19v12.4c0 .9-.8 1.6-1.7 1.6H9.2" />
      <path d="M7.2 6.2v11.6c0 1.1.9 2 2 2h.8" />
      <path d="M10.4 9.2h5.6M10.4 12.2h5.6M10.4 15.2h3.4" />
    </svg>
  );
}

/** Three standing figures. People. */
export function IconFigures({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="12" cy="5.8" r="2.05" />
      <circle cx="6.1" cy="7.4" r="1.7" />
      <circle cx="17.9" cy="7.4" r="1.7" />
      <path d="M8.2 19.2c.2-3.4 1.7-5.4 3.8-5.4s3.6 2 3.8 5.4" />
      <path d="M3.4 19.2c.2-2.5 1.3-4 2.8-4" />
      <path d="M20.6 19.2c-.2-2.5-1.3-4-2.8-4" />
    </svg>
  );
}

/** Two interlocking rings. Solidarity. */
export function IconRings({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="9" cy="12" r="5" />
      <circle cx="15" cy="12" r="5" />
    </svg>
  );
}

/** Dialogue marks. Fraternity through communication. */
export function IconDialogue({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <path d="M4.5 7.2h8.2c.9 0 1.6.7 1.6 1.6v4.2c0 .9-.7 1.6-1.6 1.6H9.2L6.4 17v-2.4H4.5c-.9 0-1.6-.7-1.6-1.6V8.8c0-.9.7-1.6 1.6-1.6Z" />
      <path d="M14.2 9.6h5.3c.8 0 1.5.7 1.5 1.5v3.6c0 .8-.7 1.5-1.5 1.5h-1.6V18l-2.3-1.8h-1.4" />
    </svg>
  );
}

/** Classical column. Heritage. */
export function IconColumn({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <path d="M5.5 20.2h13" />
      <path d="M7 8.4h10" />
      <path d="M8.2 8.4v11.8M12 8.4v11.8M15.8 8.4v11.8" />
      <path d="M6.2 8.4 12 3.8l5.8 4.6" />
      <path d="M5.8 4.8h12.4" />
    </svg>
  );
}

/** Cupped hands. Mutual support. */
export function IconCuppedHands({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <path d="M4.2 12.6c0 0 1.6 4.6 7.8 4.6s7.8-4.6 7.8-4.6" />
      <path d="M4.2 12.6c-1.2-2.2.6-4.2 2.7-3.3 1 .5 1.9 1.6 2.4 2.6" />
      <path d="M19.8 12.6c1.2-2.2-.6-4.2-2.7-3.3-1 .5-1.9 1.6-2.4 2.6" />
      <path d="M9 8.2c1.1-2.4 4.9-2.4 6 0" />
    </svg>
  );
}

/** Circle of four figures. Join / gathering. */
export function IconGathering({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="12" cy="6.2" r="2" />
      <circle cx="6.4" cy="10.2" r="1.7" />
      <circle cx="17.6" cy="10.2" r="1.7" />
      <circle cx="12" cy="12.6" r="1.7" />
      <path d="M8.6 20c.3-2.6 1.6-4.2 3.4-4.2s3.1 1.6 3.4 4.2" />
      <path d="M3.6 19.2c.2-2.1 1.2-3.4 2.6-3.4" />
      <path d="M20.4 19.2c-.2-2.1-1.2-3.4-2.6-3.4" />
    </svg>
  );
}

/** Simple calendar. Monthly assemblies. */
export function IconCalendarLine({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <rect x="4.2" y="5.8" width="15.6" height="13.4" rx="1.6" />
      <path d="M4.2 10h15.6M8.2 3.8v3.2M15.8 3.8v3.2" />
      <path d="M8.4 13.4h.1M12 13.4h.1M15.6 13.4h.1M8.4 16.6h.1M12 16.6h.1" />
    </svg>
  );
}

/** Branching path. Shared purpose. */
export function IconPurpose({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="12" cy="5.2" r="1.7" />
      <circle cx="6.2" cy="18.6" r="1.7" />
      <circle cx="17.8" cy="18.6" r="1.7" />
      <path d="M12 6.9v4.4M12 11.3 6.8 17M12 11.3l5.2 5.7" />
    </svg>
  );
}
