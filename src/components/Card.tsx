import type { ReactNode } from "react";

interface CardProps {
  icon?: ReactNode;
  title: string;
  description: string;
  className?: string;
  tone?: "ivory" | "cream";
}

export default function Card({ icon, title, description, className = "", tone = "cream" }: CardProps) {
  const toneClasses =
    tone === "ivory"
      ? "bg-ivory border-forest-900/10"
      : "bg-cream border-forest-900/10";

  return (
    <div className={`border ${toneClasses} p-6 ${className}`}>
      {icon ? <div className="mb-4 text-gold-dark">{icon}</div> : null}
      <h3 className="font-display text-xl text-forest-950">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">{description}</p>
    </div>
  );
}
