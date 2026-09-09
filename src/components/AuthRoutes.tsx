import Header from "./Header";
import Footer from "./Footer";
import Button from "./Button";
import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { homePathForRole, ROUTES } from "../lib/routes";
import type { ReactNode } from "react";

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Header />
      <main className="flex flex-1 items-center justify-center px-5 py-24 sm:px-8">
        <p className="text-sm text-ink-soft">Loading your membership...</p>
      </main>
      <Footer />
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { member, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;
  if (!member) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`${ROUTES.login}?next=${encodeURIComponent(next)}`} replace />;
  }
  return children;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { member, loading } = useAuth();

  if (loading) return <AuthLoadingScreen />;
  if (member) return <Navigate to={homePathForRole(member.role)} replace />;
  return children;
}

export function AdminForbidden() {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Header />
      <main id="main-content" className="flex flex-1 items-center justify-center px-5 py-24 sm:px-8">
        <div className="max-w-lg text-center">
          <p className="eyebrow text-gold-dark">403</p>
          <h1 className="mt-4 font-display text-3xl text-forest-950 sm:text-4xl">Access denied</h1>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            You do not have permission to view the admin dashboard. This area is only available to association
            administrators.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button to={ROUTES.portal} variant="primary" className="rounded-full">
              Back to Member Portal
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { member, loading } = useAuth();
  const location = useLocation();

  if (loading) return <AuthLoadingScreen />;
  if (!member) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`${ROUTES.login}?next=${encodeURIComponent(next)}`} replace />;
  }
  if (member.role !== "admin") {
    return <AdminForbidden />;
  }
  return children;
}
