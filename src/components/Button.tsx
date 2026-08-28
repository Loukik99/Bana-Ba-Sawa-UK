import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type ButtonVariant = "primary" | "secondary" | "outline-light" | "ghost-light" | "on-dark";

interface ButtonProps {
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
  /** Internal route. Renders a react-router Link. */
  to?: string;
  /** External URL. Renders an anchor tag. */
  href?: string;
  /** Click handler, usable alongside `to` (e.g. closing a menu) or on its own. */
  onClick?: () => void;
  type?: "button" | "submit";
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    "bg-forest-900 text-ivory hover:bg-forest-800",
  secondary:
    "bg-gold text-forest-950 hover:bg-gold-dark",
  "on-dark":
    "bg-forest-700 text-ivory hover:bg-forest-600",
  "outline-light":
    "border border-ivory/55 bg-forest-950/25 text-ivory hover:bg-ivory/10",
  "ghost-light":
    "border border-forest-800 text-forest-900 hover:bg-forest-900 hover:text-ivory",
};

const BASE_CLASSES =
  "inline-flex items-center justify-center gap-2 rounded-[3px] px-6 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.16em] transition-colors duration-200";

export default function Button({
  variant = "primary",
  className = "",
  children,
  to,
  href,
  onClick,
  type = "button",
}: ButtonProps) {
  const classes = `${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} onClick={onClick}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
}
