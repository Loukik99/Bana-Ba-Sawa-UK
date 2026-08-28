interface LogoProps {
  variant?: "dark" | "light";
  className?: string;
}

/**
 * Placeholder emblem for Bana Ba Sawa UK.
 * The association's official logo and approved brand colours have not been
 * supplied, so this simple line-drawn palm and shield mark stands in for one
 * until a confirmed logo is provided.
 */
export default function Logo({ variant = "dark", className = "" }: LogoProps) {
  const ring = variant === "light" ? "#f2ecdd" : "#123420";
  const mark = variant === "light" ? "#f2ecdd" : "#123420";
  const accent = "#b78a3d";

  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Bana Ba Sawa UK emblem"
    >
      <circle cx="24" cy="24" r="22.5" fill="none" stroke={ring} strokeWidth="1.4" />
      <circle cx="24" cy="24" r="18.5" fill="none" stroke={accent} strokeWidth="1" />
      <path
        d="M24 33c0-7 3-11 8-14-6 1-9 4-8 9 0-6-2-10-8-13 5 3 8 7 8 14z"
        fill={mark}
      />
      <path
        d="M14 33h20"
        stroke={mark}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
