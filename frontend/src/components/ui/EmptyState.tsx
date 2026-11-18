import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, children, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <span className="inline-flex size-12 items-center justify-center rounded-full border border-line-strong text-royal [&_svg]:size-5">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-semibold tracking-[-0.02em] text-navy">{title}</h3>
      {children && <div className="mt-1.5 max-w-sm text-sm leading-6 text-ink-3">{children}</div>}
      {action && <div className="mt-5 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}
