import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  /** Accessible name. Also shown as a native tooltip. */
  label: string;
  icon: ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "ghost" | "outline" | "primary" | "subtle";
  /** For toggles: renders aria-pressed and the selected look. */
  pressed?: boolean;
}

const sizes = {
  sm: "size-9 [&_svg]:size-4",
  md: "size-11 [&_svg]:size-5",
  lg: "size-12 [&_svg]:size-[1.375rem]",
};

const variants = {
  ghost: "text-ink-2 hover:bg-brand-50 hover:text-navy",
  outline: "bg-surface text-navy border border-line-strong hover:border-navy/40",
  primary: "bg-royal text-white hover:bg-brand-700",
  subtle: "bg-brand-50 text-royal hover:bg-brand-100",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, size = "md", variant = "ghost", pressed, className, type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-sm transition-colors duration-150",
        "disabled:opacity-40 disabled:pointer-events-none",
        sizes[size],
        variants[variant],
        pressed && variant !== "primary" && "border-navy bg-navy text-white hover:bg-navy hover:text-white",
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
});
