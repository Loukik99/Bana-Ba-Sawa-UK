import { createElement } from "react";
import type { ReactNode } from "react";
import { useReveal } from "../lib/useReveal";

interface RevealProps {
  as?: keyof HTMLElementTagNameMap;
  children: ReactNode;
  className?: string;
  delay?: number;
  immediate?: boolean;
}

/**
 * Wraps content in a subtle fade and rise reveal as it enters the viewport.
 * Respects prefers-reduced-motion via the .reveal utility in index.css.
 */
export default function Reveal({
  as = "div",
  children,
  className = "",
  delay = 0,
  immediate = false,
}: RevealProps) {
  const ref = useReveal<HTMLElement>(immediate);

  return createElement(
    as,
    {
      ref,
      className: `reveal ${immediate ? "is-visible" : ""} ${className}`,
      style: delay ? { transitionDelay: `${delay}ms` } : undefined,
    },
    children,
  );
}
