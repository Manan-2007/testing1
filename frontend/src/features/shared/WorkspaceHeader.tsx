import type { ReactNode } from "react";

interface WorkspaceHeaderProps {
  title: string;
  description: string;
  meta?: ReactNode;
  action?: ReactNode;
}

/** Editorial page header for the supporting pages. */
export function WorkspaceHeader({ title, description, meta, action }: WorkspaceHeaderProps) {
  return (
    <div className="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-[2.25rem] leading-[1.05] font-semibold tracking-[-0.045em] sm:text-[3rem]">{title}</h1>
        <p className="mt-3 max-w-2xl text-[1.0625rem] leading-7 text-ink-2">{description}</p>
      </div>
      {(meta || action) && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {meta && <span className="text-sm font-medium text-ink-3">{meta}</span>}
          {action}
        </div>
      )}
    </div>
  );
}
