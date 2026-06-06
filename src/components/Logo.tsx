import { Link } from "@tanstack/react-router";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`group flex items-center gap-3 ${className}`}>
      <svg
        width="44"
        height="44"
        viewBox="0 0 44 44"
        fill="none"
        className="transition-transform duration-300 group-hover:rotate-[8deg]"
        aria-hidden
      >
        {/* outer ring — gold */}
        <circle cx="22" cy="22" r="20.5" stroke="var(--gold)" strokeWidth="1" />
        {/* inner solid disc — black */}
        <circle cx="22" cy="22" r="18" fill="#0a0a0a" />
        {/* inner thin ring — red */}
        <circle cx="22" cy="22" r="17" stroke="var(--primary)" strokeWidth="0.75" opacity="0.9" />
        {/* tiny notches at 12/3/6/9 — clock-like precision */}
        <g stroke="var(--gold)" strokeWidth="1" strokeLinecap="square">
          <line x1="22" y1="2.5" x2="22" y2="5" />
          <line x1="41.5" y1="22" x2="39" y2="22" />
          <line x1="22" y1="41.5" x2="22" y2="39" />
          <line x1="2.5" y1="22" x2="5" y2="22" />
        </g>
        {/* CH monogram — C in white, H in gold, slightly overlapping for ligature feel */}
        <text
          x="13"
          y="29.5"
          fontFamily="Jost, Futura, Trebuchet MS, sans-serif"
          fontSize="22"
          fill="var(--foreground)"
          letterSpacing="-1"
        >
          C
        </text>
        <text
          x="22.5"
          y="29.5"
          fontFamily="Jost, Futura, Trebuchet MS, sans-serif"
          fontSize="22"
          fill="var(--gold)"
          letterSpacing="-1"
        >
          H
        </text>
      </svg>
      <span className="font-display text-2xl tracking-[0.12em] text-foreground">
        CARD <span className="text-[var(--gold)]">HUB</span>
      </span>
    </Link>
  );
}
