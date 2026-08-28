import { Link } from "react-router-dom";
import Logo from "./Logo";
import { ROUTES } from "../lib/routes";

const QUICK_LINKS = [
  { label: "Home", path: ROUTES.home },
  { label: "About Us", path: ROUTES.about },
  { label: "Community", path: ROUTES.community },
  { label: "Membership", path: ROUTES.membership },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-cream text-ink">
      <div className="mx-auto max-w-[72rem] px-5 py-12 sm:px-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-8">
          <div>
            <Link to={ROUTES.home} className="flex items-center gap-2.5" aria-label="Bana Ba Sawa UK, home">
              <Logo className="h-9 w-9 shrink-0" />
              <span className="font-display text-base font-semibold tracking-[0.08em] text-forest-950">
                BANA BA SAWA UK
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-ink-soft">
              Uniting people of Sawa heritage in the UK through solidarity, culture and mutual support.
            </p>
          </div>

          <div className="lg:text-center">
            <h3 className="eyebrow text-gold-dark">Quick Links</h3>
            <ul className="mt-4 space-y-2">
              {QUICK_LINKS.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-sm text-ink-soft hover:text-forest-900">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:ml-auto lg:max-w-[16.5rem] lg:text-right">
            <h3 className="eyebrow text-gold-dark">Our Community</h3>
            <p className="mt-4 text-sm leading-relaxed text-ink-soft">
              A Sawa association in the United Kingdom. Members meet monthly to stay connected,
              support one another and keep our heritage present.
            </p>
            <Link
              to={ROUTES.community}
              className="mt-3 inline-block text-sm text-forest-900 hover:text-gold-dark"
            >
              Discover Our Community
            </Link>
          </div>
        </div>
      </div>

      <div className="bg-forest-950">
        <div className="mx-auto max-w-[72rem] px-5 py-4 text-[0.7rem] text-ivory/60 sm:px-8">
          <p>&copy; {year} Bana Ba Sawa UK. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
