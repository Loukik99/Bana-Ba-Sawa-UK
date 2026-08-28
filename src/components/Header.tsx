import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "./Logo";
import Button from "./Button";
import { NAV_ITEMS, ROUTES } from "../lib/routes";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-forest-900/8 bg-cream">
      <div className="mx-auto flex max-w-[72rem] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link to={ROUTES.home} className="flex min-w-0 items-center gap-2.5" aria-label="Bana Ba Sawa UK, home">
          <Logo className="h-9 w-9 shrink-0" />
          <span className="font-display text-[0.95rem] font-semibold tracking-[0.08em] text-forest-950 sm:text-[1.05rem]">
            BANA BA SAWA UK
          </span>
        </Link>

        <nav className="hidden items-center gap-5 xl:flex xl:gap-6" aria-label="Primary">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-current={isActive ? "page" : undefined}
                className={`relative whitespace-nowrap py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] transition-colors ${
                  isActive ? "text-forest-900" : "text-ink-soft hover:text-forest-900"
                }`}
              >
                {item.label}
                <span
                  className={`absolute -bottom-0.5 left-0 h-px w-full bg-gold transition-opacity ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden xl:block">
          <Button to={ROUTES.membership} variant="primary" className="rounded-full px-5 py-2.5">
            Join Us
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center text-forest-900 xl:hidden"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        id="mobile-menu"
        className={`xl:hidden ${isOpen ? "block" : "hidden"} border-t border-forest-900/8 bg-cream`}
      >
        <nav className="flex flex-col gap-0.5 px-5 py-4" aria-label="Mobile">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={closeMenu}
                aria-current={isActive ? "page" : undefined}
                className={`px-2 py-3 text-sm font-semibold uppercase tracking-[0.08em] ${
                  isActive ? "bg-forest-50 text-forest-900" : "text-ink-soft"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <div className="mt-3">
            <Button to={ROUTES.membership} variant="primary" className="w-full rounded-full" onClick={closeMenu}>
              Join Us
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
}
