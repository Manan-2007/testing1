import { LogoMark } from "@/components/layout/Logo";

export function PageLoader() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3" role="status" aria-live="polite">
      <LogoMark className="size-10 animate-pulse" />
      <span className="text-sm font-semibold text-ink-3">Loading Parlance…</span>
    </div>
  );
}
