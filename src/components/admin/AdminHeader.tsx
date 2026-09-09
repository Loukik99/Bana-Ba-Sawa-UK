import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "../Logo";
import { useAuth } from "../../context/AuthContext";
import { memberName } from "../../lib/membership";
import { ROUTES } from "../../lib/routes";

const NAV = [
  { to: ROUTES.admin, label: "Dashboard", end: true },
  { to: ROUTES.adminMembers, label: "Members", end: false },
];

function navClass(isActive: boolean) {
  return `rounded-[3px] px-3 py-2 text-[0.68rem] font-semibold uppercase tracking-[0.14em] transition-colors ${
    isActive ? "bg-ivory/12 text-ivory" : "text-ivory/70 hover:bg-ivory/8 hover:text-ivory"
  }`;
}

export default function AdminHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { member, logout } = useAuth();
  const closeMenu = () => setIsOpen(false);
  const displayName = member ? memberName(member) : "Administrator";

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      closeMenu();
      navigate(ROUTES.home);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-ivory/10 bg-forest-950">
      <div className="mx-auto flex max-w-[72rem] items-center justify-between gap-4 px-5 py-3 sm:px-8">
        <Link to={ROUTES.admin} className="flex min-w-0 items-center gap-2.5" aria-label="Admin Dashboard home">
          <Logo variant="light" className="h-9 w-9 shrink-0" />
          <span className="min-w-0">
            <span className="block font-display text-[0.95rem] font-semibold tracking-[0.08em] text-ivory sm:text-[1.05rem]">
              BANA BA SAWA UK
            </span>
            <span className="mt-0.5 block text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-gold-light">
              Admin Dashboard
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Admin Dashboard">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => navClass(isActive)}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <p className="max-w-[14rem] truncate text-right text-[0.72rem] text-ivory/75">
            <span className="block font-semibold uppercase tracking-[0.12em] text-gold-light">Admin</span>
            <span className="block truncate text-ivory">{displayName}</span>
          </p>
          <Link
            to={ROUTES.home}
            className="whitespace-nowrap py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ivory/70 transition-colors hover:text-ivory"
          >
            View website
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="whitespace-nowrap py-1 text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ivory/70 transition-colors hover:text-ivory"
          >
            {loggingOut ? "Signing out..." : "Log out"}
          </button>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center text-ivory lg:hidden"
          aria-label={isOpen ? "Close admin menu" : "Open admin menu"}
          aria-expanded={isOpen}
          aria-controls="admin-mobile-menu"
          onClick={() => setIsOpen((open) => !open)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div
        id="admin-mobile-menu"
        className={`lg:hidden ${isOpen ? "block" : "hidden"} border-t border-ivory/10 bg-forest-950`}
      >
        <nav className="flex flex-col px-5 py-4" aria-label="Admin Dashboard mobile">
          <p className="px-2 pb-3 text-[0.72rem] text-ivory/75">
            <span className="block font-semibold uppercase tracking-[0.12em] text-gold-light">Admin</span>
            <span className="mt-1 block text-ivory">{displayName}</span>
          </p>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={closeMenu}
              className={({ isActive }) =>
                `px-2 py-3 text-sm font-semibold uppercase tracking-[0.08em] ${
                  isActive ? "bg-ivory/12 text-ivory" : "text-ivory/75"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to={ROUTES.home}
            onClick={closeMenu}
            className="px-2 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-ivory/75"
          >
            View website
          </Link>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
            className="mt-3 px-2 py-3 text-left text-sm font-semibold uppercase tracking-[0.08em] text-ivory/75"
          >
            {loggingOut ? "Signing out..." : "Log out"}
          </button>
        </nav>
      </div>
    </header>
  );
}
