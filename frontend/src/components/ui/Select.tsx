import { forwardRef, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  size_?: "sm" | "md";
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, size_ = "md", children, ...rest },
  ref,
) {
  return (
    <span className={cn("relative inline-flex", className)}>
      <select
        ref={ref}
        className={cn(
          "w-full appearance-none rounded-sm border border-line-strong bg-surface pr-9 pl-3 font-medium text-ink shadow-xs",
          "transition-colors hover:border-brand-300 disabled:opacity-50 disabled:cursor-not-allowed",
          size_ === "sm" ? "h-9 text-sm" : "h-11 text-[0.9375rem]",
        )}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-ink-3" />
    </span>
  );
});
