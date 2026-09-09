import { NavLink, Outlet, useLocation } from "react-router-dom";
import AdminHeader from "../../components/admin/AdminHeader";
import { ROUTES } from "../../lib/routes";
import { useAuth } from "../../context/AuthContext";

const NAV = [
  { to: ROUTES.admin, label: "Dashboard", end: true },
  { to: ROUTES.adminMembers, label: "Members", end: false },
];

function navClass(isActive: boolean) {
  return `block rounded-[3px] px-3 py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.12em] transition-colors ${
    isActive
      ? "bg-forest-900 text-ivory lg:bg-ivory/12"
      : "text-forest-900 hover:bg-forest-50 lg:text-ivory/70 lg:hover:bg-ivory/8 lg:hover:text-ivory"
  }`;
}

export default function AdminLayout() {
  const { member } = useAuth();
  const location = useLocation();
  const onMembers =
    location.pathname === ROUTES.adminMembers || location.pathname.startsWith(`${ROUTES.adminMembers}/`);
  const title =
    onMembers && location.pathname !== ROUTES.adminMembers
      ? "Member details"
      : onMembers
        ? "Members"
        : "Dashboard";
  const firstName = member?.firstName ?? "Admin";

  return (
    <div className="flex min-h-screen flex-col bg-forest-950">
      <AdminHeader />
      <main id="main-content" className="flex-1">
        <section className="border-b border-ivory/10" aria-label="Admin Dashboard">
          <div className="mx-auto max-w-[72rem] px-5 py-8 sm:px-8 sm:py-10">
            <p className="eyebrow text-gold-light">Client Admin Dashboard</p>
            <h1 className="mt-3 font-display text-[2.15rem] font-semibold leading-[1.08] text-ivory sm:text-[2.6rem]">
              {title}
            </h1>
            <p className="mt-3 max-w-xl text-[0.95rem] leading-relaxed text-ivory/80">
              Signed in as {firstName}. This area is for association administrators only.
            </p>
          </div>
        </section>

        <div className="bg-ivory">
          <div className="mx-auto max-w-[72rem] px-5 py-8 sm:px-8 lg:py-12">
            <div className="flex flex-col gap-8 lg:flex-row lg:gap-10">
              <nav
                aria-label="Admin sections"
                className="-mx-1 flex gap-1 overflow-x-auto pb-1 lg:mx-0 lg:w-52 lg:shrink-0 lg:flex-col lg:overflow-visible lg:rounded-[4px] lg:bg-forest-950 lg:p-2 lg:pb-2"
              >
                {NAV.map((item) => {
                  const isActive = item.end
                    ? location.pathname === item.to
                    : location.pathname === item.to || location.pathname.startsWith(`${item.to}/`);
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={`${navClass(isActive)} whitespace-nowrap`}
                    >
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
              <div className="min-w-0 flex-1">
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="border-t border-ivory/10 bg-forest-950">
        <div className="mx-auto flex max-w-[72rem] flex-col gap-1 px-5 py-4 text-[0.7rem] text-ivory/55 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Bana Ba Sawa UK · Client Admin Dashboard</p>
          <p>Administrators only</p>
        </div>
      </footer>
    </div>
  );
}
