import Header from "../components/Header";
import Footer from "../components/Footer";
import Button from "../components/Button";
import { ROUTES } from "../lib/routes";

interface ComingSoonProps {
  title: string;
}

/**
 * Lightweight placeholder used for pages not yet built (Support, Events,
 * Gallery, Contact, Privacy Policy, Documents).
 * Keeps navigation and buttons functional without fabricating page content.
 */
export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center bg-ivory px-5 py-24 sm:px-8">
        <div className="max-w-lg text-center">
          <p className="eyebrow text-gold-dark">Bana Ba Sawa UK</p>
          <h1 className="mt-4 font-display text-3xl text-forest-950 sm:text-4xl">{title}</h1>
          <p className="mt-4 text-base leading-relaxed text-ink-soft">
            This page is being prepared and will be published soon. In the meantime, return home.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button to={ROUTES.home} variant="primary">
              Back to Home
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
