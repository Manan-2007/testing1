/**
 * Toasts for confirming actions, and an announcer for screen-reader-only
 * messages. Both are polite live regions: they never interrupt.
 */
import { create } from "zustand";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/cn";

type ToastTone = "success" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastStore {
  toasts: Toast[];
  announcement: string;
  push: (message: string, tone?: ToastTone) => void;
  dismiss: (id: number) => void;
  announce: (message: string) => void;
}

let counter = 0;

const useToastStore = create<ToastStore>()((set, get) => ({
  toasts: [],
  announcement: "",
  push: (message, tone = "success") => {
    const id = ++counter;
    set({ toasts: [...get().toasts.slice(-2), { id, message, tone }] });
    window.setTimeout(() => get().dismiss(id), 4200);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
  announce: (message) => {
    // Clearing first makes a repeated identical message announce again.
    set({ announcement: "" });
    window.setTimeout(() => set({ announcement: message }), 60);
  },
}));

export const toast = (message: string, tone?: ToastTone) => useToastStore.getState().push(message, tone);
export const announce = (message: string) => useToastStore.getState().announce(message);

const icons = { success: CheckCircle2, info: Info, warning: TriangleAlert };
const toneStyles = {
  success: "text-success",
  info: "text-royal",
  warning: "text-gold-800",
};

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const announcement = useToastStore((s) => s.announcement);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {announcement}
      </div>
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((t) => {
          const Icon = icons[t.tone];
          return (
            <div
              key={t.id}
              role="status"
              className="pointer-events-auto flex w-full max-w-sm animate-rise items-center gap-3 rounded-md border border-line bg-surface py-2.5 pr-2 pl-3.5 shadow-lg"
            >
              <Icon aria-hidden className={cn("size-5 shrink-0", toneStyles[t.tone])} />
              <p className="flex-1 text-sm font-medium text-ink">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="inline-flex size-8 items-center justify-center rounded-xs text-ink-3 hover:bg-brand-50 hover:text-navy"
                aria-label="Dismiss notification"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
