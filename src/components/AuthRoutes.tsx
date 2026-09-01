import Header from "./Header";
import Footer from "./Footer";
import { useAuth } from "../context/AuthContext";
import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../lib/routes";
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
  if (member) return <Navigate to={ROUTES.portal} replace />;
  return children;
}
