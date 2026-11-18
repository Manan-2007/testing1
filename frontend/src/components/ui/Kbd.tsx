import type { ReactNode } from "react";

/** Keyboard key, drawn in the interface font (no monospace). */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded-xs border border-line-strong bg-surface px-1.5 font-sans text-xs font-semibold text-ink-2 shadow-xs">
      {children}
    </kbd>
  );
}
