import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Tone = "neutral" | "brand" | "gold" | "success" | "danger" | "warning" | "navy";

const tones: Record<Tone, string> = {
  neutral: "bg-subtle text-ink-2 border-line",
  brand: "bg-brand-50 text-royal border-brand-100",
  gold: "bg-gold-100 text-gold-800 border-gold-300",
  success: "bg-success-bg text-success border-success/20",
  danger: "bg-danger-bg text-danger border-danger/20",
  warning: "bg-warning-bg text-warning border-gold-300",
  navy: "bg-navy text-white border-navy",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: ReactNode;
  size?: "sm" | "md";
}

export function Badge({ tone = "neutral", icon, size = "sm", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xs border font-medium whitespace-nowrap",
        size === "sm" ? "h-6 px-2 text-xs [&_svg]:size-3.5" : "h-7 px-2.5 text-[0.8125rem] [&_svg]:size-4",
        tones[tone],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
    </span>
  );
}
