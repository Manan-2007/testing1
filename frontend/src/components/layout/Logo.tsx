import { Link } from "react-router-dom";
import { cn } from "@/lib/cn";

/** The Parlance mark: two voices facing each other around a shared point. */
export function LogoMark({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8 shrink-0", className)}>
      <rect width="32" height="32" rx="8" fill={inverse ? "#FFFFFF" : "#0D21A1"} />
      <path
        d="M12.5 9.5c-3.1 1.6-4.5 4-4.5 6.5s1.4 4.9 4.5 6.5M19.5 9.5c3.1 1.6 4.5 4 4.5 6.5s-1.4 4.9-4.5 6.5"
        fill="none"
        stroke={inverse ? "#0D21A1" : "#FFFFFF"}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="2.4" fill="#EEC643" />
    </svg>
  );
}

export function Logo({ inverse = false, className, to = "/" }: { inverse?: boolean; className?: string; to?: string }) {
  return (
    <Link
      to={to}
      className={cn("inline-flex items-center gap-2.5 rounded-sm", className)}
      aria-label="Parlance home"
    >
      <LogoMark inverse={inverse} />
      <span className={cn("text-[1.1875rem] font-bold tracking-[-0.02em]", inverse ? "text-white" : "text-navy")}>
        Parlance
      </span>
    </Link>
  );
}
