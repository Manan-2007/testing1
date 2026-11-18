import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "subtle" | "danger" | "inverse" | "dark";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm font-medium tracking-[-0.005em] select-none " +
  "transition-[background-color,border-color,color,box-shadow] duration-150 ease-out " +
  "disabled:opacity-45 disabled:pointer-events-none aria-disabled:opacity-45 aria-disabled:pointer-events-none";

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-[0.8125rem] [&_svg]:size-4",
  md: "h-11 px-4 text-[0.9375rem] [&_svg]:size-[1.125rem]",
  lg: "h-[3.25rem] px-6 text-base [&_svg]:size-5",
};

const variants: Record<ButtonVariant, string> = {
  primary: "bg-royal text-white hover:bg-brand-700 active:bg-brand-800",
  secondary: "bg-surface text-navy border border-line-strong hover:border-navy/40 hover:bg-white",
  ghost: "text-ink-2 hover:bg-brand-50 hover:text-navy",
  subtle: "bg-brand-50 text-royal hover:bg-brand-100",
  danger: "bg-surface text-danger border border-line-strong hover:bg-danger-bg hover:border-danger/40",
  inverse: "bg-white text-navy hover:bg-brand-50",
  dark: "bg-navy text-white hover:bg-[#0a2450]",
};

export function buttonClasses(options: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
} = {}): string {
  const { variant = "primary", size = "md", block = false, className } = options;
  return cn(base, sizes[size], variants[variant], block && "w-full", className);
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, block, className, leading, trailing, children, type = "button", ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={buttonClasses({ variant, size, block, className })} {...rest}>
      {leading}
      {children}
      {trailing}
    </button>
  );
});

interface ButtonLinkProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export function ButtonLink({ variant, size, block, className, leading, trailing, children, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClasses({ variant, size, block, className: className as string | undefined })} {...rest}>
      {leading}
      {children}
      {trailing}
    </Link>
  );
}
