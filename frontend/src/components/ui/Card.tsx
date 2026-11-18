import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-line bg-surface", className)} {...rest} />;
}

interface CardHeaderProps {
  title: ReactNode;
  /** Heading level for the title. */
  as?: "h2" | "h3";
  description?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  id?: string;
}

export function CardHeader({ title, as: Heading = "h2", description, icon, actions, className, id }: CardHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-x-3 gap-y-2 border-b border-line px-4 py-3 sm:px-5", className)}>
      <div className="flex min-w-[min(100%,13rem)] flex-1 items-start gap-3">
        {icon && <span className="mt-[0.1875rem] shrink-0 text-ink-3 [&_svg]:size-4">{icon}</span>}
        <div className="min-w-0">
          <Heading id={id} className="text-[0.9375rem] leading-6 font-semibold tracking-[-0.01em] text-navy">
            {title}
          </Heading>
          {description && <p className="text-sm leading-5 text-ink-3">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>}
    </div>
  );
}
