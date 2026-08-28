import { useEffect, useRef } from "react";

/**
 * Adds the "is-visible" class once an element scrolls into view.
 * No-ops visually when the user prefers reduced motion (handled in CSS),
 * but the class is still added so content is never hidden.
 */
export function useReveal<T extends HTMLElement>(immediate = false) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const show = () => node.classList.add("is-visible");

    if (immediate) {
      show();
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      show();
      return;
    }

    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      show();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -24px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [immediate]);

  return ref;
}
