import type { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import Reveal from "./Reveal";

interface AuthFormLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  children: ReactNode;
}

export default function AuthFormLayout({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  children,
}: AuthFormLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <Header />
      <main id="main-content" className="flex-1 px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <Reveal className="mx-auto grid max-w-[72rem] overflow-hidden rounded-[4px] border border-forest-900/8 bg-cream shadow-[0_12px_32px_rgba(18,52,32,0.05)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="relative min-h-[16rem] sm:min-h-[20rem] lg:min-h-full">
            <img
              src={image}
              alt={imageAlt}
              className="absolute inset-0 h-full w-full object-cover object-[62%_38%]"
              width={1536}
              height={1024}
            />
          </div>
          <div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <p className="eyebrow text-gold-dark">{eyebrow}</p>
            <h1 className="mt-4 font-display text-[2.15rem] font-semibold leading-[1.12] text-forest-950 sm:text-[2.45rem]">
              {title}
            </h1>
            <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-ink-soft">{description}</p>
            <div className="mt-8">{children}</div>
          </div>
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}
