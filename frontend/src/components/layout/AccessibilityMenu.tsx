import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Accessibility, ArrowRight } from "lucide-react";
import { Segmented } from "@/components/ui/Segmented";
import { cn } from "@/lib/cn";
import { useSettings, type MotionPreference, type TextSize } from "@/stores/settings";

/** Quick accessibility controls, reachable from every page header. */
export function AccessibilityMenu({ align = "right" }: { align?: "left" | "right" }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const textSize = useSettings((s) => s.textSize);
  const motion = useSettings((s) => s.motion);
  const set = useSettings((s) => s.set);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    panelRef.current?.querySelector<HTMLElement>("[role=radio][tabindex='0']")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label="Accessibility options"
        title="Accessibility options"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex size-11 items-center justify-center rounded-full border transition-colors",
          open
            ? "border-royal bg-brand-50 text-royal"
            : "border-line-strong bg-surface text-navy hover:border-brand-300 hover:bg-brand-25",
        )}
      >
        <Accessibility className="size-5" aria-hidden />
      </button>
      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-label="Accessibility options"
          className={cn(
            "absolute top-[calc(100%+0.5rem)] z-50 w-[min(20rem,calc(100vw-2rem))] animate-rise rounded-lg border border-line bg-surface p-4 shadow-lg",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <p className="text-sm font-bold text-navy">Accessibility</p>
          <div className="mt-3 space-y-4">
            <div>
              <p className="mb-1.5 text-[0.8125rem] font-semibold text-ink-2" id={`${panelId}-text`}>
                Text size
              </p>
              <Segmented<TextSize>
                label="Text size"
                block
                size="sm"
                value={textSize}
                onChange={(value) => set("textSize", value)}
                options={[
                  { value: "default", label: "Default" },
                  { value: "large", label: "Large" },
                  { value: "larger", label: "Larger" },
                ]}
              />
            </div>
            <div>
              <p className="mb-1.5 text-[0.8125rem] font-semibold text-ink-2">Motion</p>
              <Segmented<MotionPreference>
                label="Motion"
                block
                size="sm"
                value={motion}
                onChange={(value) => set("motion", value)}
                options={[
                  { value: "system", label: "System" },
                  { value: "reduce", label: "Reduced" },
                  { value: "full", label: "Full" },
                ]}
              />
            </div>
          </div>
          <Link
            to="/app/settings#accessibility"
            onClick={() => setOpen(false)}
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-royal hover:underline"
          >
            All settings <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      )}
    </div>
  );
}
