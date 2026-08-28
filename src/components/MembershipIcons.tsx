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

/** Figure standing inside a quiet enclosing ring. Belonging. */
export function IconBelong({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="12" cy="12" r="8.2" />
      <circle cx="12" cy="9.2" r="1.7" />
      <path d="M8.4 16.8c.35-2.6 1.6-4 3.6-4s3.25 1.4 3.6 4" />
    </svg>
  );
}

/** Basin with a shared pour. Mutual support. */
export function IconBasin({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <path d="M5.2 11.4h13.6" />
      <path d="M6.4 11.4c.4 4.2 2.2 6.8 5.6 6.8s5.2-2.6 5.6-6.8" />
      <path d="M12 4.8v4.2" />
      <path d="M9.6 6.6c1.5 1.2 3.3 1.2 4.8 0" />
    </svg>
  );
}

/** Three nodes joined on a quiet triangle. Connection. */
export function IconNodes({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="12" cy="6.2" r="1.7" />
      <circle cx="6.4" cy="17.2" r="1.7" />
      <circle cx="17.6" cy="17.2" r="1.7" />
      <path d="M10.7 7.4 7.6 15.6M13.3 7.4l3.1 8.2M8.1 17.2h7.8" />
    </svg>
  );
}

/** Concentric ripples from a centre point. Lasting impact. */
export function IconRipple({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="12" cy="12" r="1.15" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="12" cy="12" r="7.4" />
    </svg>
  );
}

/** Folded declaration sheet. Fill the form. */
export function IconDeclaration({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <path d="M7 4.8h7.2L17.8 8.4V19.2H7z" />
      <path d="M14.2 4.8v3.6h3.6" />
      <path d="M9.4 12h5.2M9.4 14.8h3.6" />
    </svg>
  );
}

/** Sheet entering a receiving tray. Submit. */
export function IconTray({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <path d="M12 4.6v8.2" />
      <path d="M9.2 10.4 12 13.2l2.8-2.8" />
      <path d="M5.2 15.2h13.6v4.2H5.2z" />
    </svg>
  );
}

/** Open leaf with a studying mark. Review. */
export function IconStudy({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="10.4" cy="10.4" r="5.2" />
      <path d="M14.2 14.2 18.6 18.6" />
      <path d="M8.4 10.4h4" />
    </svg>
  );
}

/** Open threshold. Welcome. */
export function IconThreshold({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <path d="M4.8 20.2V6.4L12 3.6l7.2 2.8v13.8" />
      <path d="M12 8.2v12" />
      <path d="M4.8 20.2h14.4" />
    </svg>
  );
}

/** Standing mark beside a short list. Responsibilities. */
export function IconDuty({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="8.2" cy="7" r="1.7" />
      <path d="M5.4 19.2c.25-3.4 1.4-5.2 2.8-5.2s2.55 1.8 2.8 5.2" />
      <path d="M13.2 8.6h6.2M13.2 12.2h6.2M13.2 15.8h4.4" />
    </svg>
  );
}

/** Sealed contribution envelope. Membership fees. */
export function IconEnvelope({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <rect x="3.8" y="6.4" width="16.4" height="11.4" rx="1.2" />
      <path d="M4.2 7.2 12 13.2l7.8-6" />
    </svg>
  );
}

/** Small confirming tick in a circle. */
export function IconTick({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="12" cy="12" r="8.2" />
      <path d="M8.2 12.2 10.8 14.8 15.8 9.4" />
    </svg>
  );
}

/** Quiet gathering of three. Who can join. */
export function IconWelcomePeople({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="12" cy="6.6" r="1.9" />
      <circle cx="6.2" cy="8.4" r="1.45" />
      <circle cx="17.8" cy="8.4" r="1.45" />
      <path d="M8.8 19.4c.2-2.8 1.5-4.4 3.2-4.4s3 1.6 3.2 4.4" />
      <path d="M3.8 19c.2-2 1.1-3.2 2.4-3.2" />
      <path d="M20.2 19c-.2-2-1.1-3.2-2.4-3.2" />
    </svg>
  );
}

/** Radiating speech arcs. Voice in assembly. */
export function IconVoiceArc({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="7.4" cy="12" r="2.1" />
      <path d="M11.2 8.4c1.8 1.8 1.8 5.4 0 7.2" />
      <path d="M14.2 6.2c3.2 3 3.2 8.6 0 11.6" />
      <path d="M17.2 4.4c4.2 4 4.2 11.2 0 15.2" />
    </svg>
  );
}

/** Steady lantern. Access to support. */
export function IconLantern({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <path d="M12 3.6v2.2" />
      <path d="M8.2 5.8h7.6" />
      <path d="M8.6 5.8 7.2 14.6h9.6L15.4 5.8" />
      <path d="M7.2 14.6h9.6v2.4c0 1.2-2.1 2.2-4.8 2.2s-4.8-1-4.8-2.2z" />
    </svg>
  );
}

/** Festive garland. Community events. */
export function IconGarland({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <path d="M4.2 7.2c2.6 3.2 4.4 3.2 7.8 0 3.4 3.2 5.2 3.2 7.8 0" />
      <path d="M8.1 10.2 7 13.8M12 10.4v4M15.9 10.2 17 13.8" />
      <circle cx="7" cy="15.4" r="1.15" />
      <circle cx="12" cy="16.2" r="1.15" />
      <circle cx="17" cy="15.4" r="1.15" />
    </svg>
  );
}

/** Carved vessel. Cultural continuity. */
export function IconVessel({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <path d="M8.2 5.2h7.6" />
      <path d="M9.2 5.2c.3 2.6-.2 4.2-1.6 6.4 2.2.4 4.4.4 6.8 0-1.4-2.2-1.9-3.8-1.6-6.4" />
      <path d="M7.6 11.6c.6 4.4 2.2 7 4.4 7s3.8-2.6 4.4-7" />
    </svg>
  );
}

/** Circular seal. Recognition as a member. */
export function IconSeal({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest}>
      <circle cx="12" cy="11.2" r="6.4" />
      <path d="M12 6.8l1.15 2.5 2.7.28-2.05 1.86.58 2.66L12 12.86l-2.38 1.24.58-2.66-2.05-1.86 2.7-.28z" />
      <path d="M9.4 17.2 12 20.4l2.6-3.2" />
    </svg>
  );
}

/** Editorial quote mark for the community banner. */
export function IconQuote({ size = 22, className, ...rest }: IconProps) {
  return (
    <svg {...base(size, className)} {...rest} fill="currentColor" stroke="none">
      <path d="M6.4 16.6c1.7 0 3-1.4 3-3.2 0-1.7-1.2-3-2.8-3-.2-2.2 1.2-4.1 3.6-4.9l-.6-1.7C6.3 4.9 3.6 7.5 3.6 11.5c0 2.8 1.9 5.1 2.8 5.1Zm8.4 0c1.7 0 3-1.4 3-3.2 0-1.7-1.2-3-2.8-3-.2-2.2 1.2-4.1 3.6-4.9l-.6-1.7c-3.1 1.1-5.8 3.7-5.8 7.7 0 2.8 1.9 5.1 2.8 5.1Z" />
    </svg>
  );
}
