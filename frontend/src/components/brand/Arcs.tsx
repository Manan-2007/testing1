/**
 * The Parlance motif: two voices facing each other around a shared point.
 * Thin royal arcs frame the signer; the gold point marks "now".
 * Purely decorative (aria-hidden); scales to its container.
 */
import { cn } from "@/lib/cn";

interface ArcsProps {
  className?: string;
  /** Draw the arcs in on mount. */
  draw?: boolean;
  /** Show the gold point between the arcs. */
  point?: boolean;
  /** Pulse the point (e.g. while signing). */
  live?: boolean;
  tone?: "royal" | "soft" | "inverse";
}

const STROKES = {
  royal: { arc: "#0D21A1", opacity: 0.9 },
  soft: { arc: "#97A3E2", opacity: 1 },
  inverse: { arc: "#FFFFFF", opacity: 0.35 },
};

export function Arcs({ className, draw = false, point = true, live = false, tone = "royal" }: ArcsProps) {
  const stroke = STROKES[tone];
  return (
    <svg viewBox="0 0 400 400" fill="none" aria-hidden className={cn("pointer-events-none", className)}>
      <path
        d="M128 36C66 78 36 136 36 200s30 122 92 164"
        stroke={stroke.arc}
        strokeOpacity={stroke.opacity}
        strokeWidth="1.5"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        className={draw ? "animate-draw [--len:1]" : undefined}
      />
      <path
        d="M272 36c62 42 92 100 92 164s-30 122-92 164"
        stroke={stroke.arc}
        strokeOpacity={stroke.opacity}
        strokeWidth="1.5"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        className={draw ? "animate-draw [--len:1] [animation-delay:120ms]" : undefined}
      />
      {point && (
        <g className={draw ? "animate-fade [animation-delay:700ms]" : undefined}>
          {live && <circle cx="200" cy="376" r="9" fill="#EEC643" opacity="0.35" className="origin-[200px_376px] animate-ping" />}
          <circle cx="200" cy="376" r="5" fill="#EEC643" />
        </g>
      )}
    </svg>
  );
}

/** The gold point, inline. */
export function Point({ className, live = false }: { className?: string; live?: boolean }) {
  return (
    <span aria-hidden className={cn("relative inline-flex size-2 shrink-0", className)}>
      {live && <span className="absolute inset-0 animate-ping rounded-full bg-gold/60" />}
      <span className="relative size-2 rounded-full bg-gold" />
    </span>
  );
}

/** Section label: a gold numbered chip, (01) How it works. */
export function SectionIndex({ index, label, tone = "default" }: { index: string; label: string; tone?: "default" | "inverse" }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 rounded-full py-1 pr-3.5 pl-1 text-[0.8125rem] leading-5 font-semibold",
        tone === "inverse" ? "bg-white/10 text-white" : "bg-surface text-navy shadow-xs ring-1 ring-sky-300/70",
      )}
    >
      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-gold px-1.5 text-[0.6875rem] font-bold text-navy tabular-nums">
        <span className="sr-only">Section </span>
        {index}
      </span>
      {label}
    </p>
  );
}
