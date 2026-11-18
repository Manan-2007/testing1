import { useRef, type KeyboardEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface SegmentedOption<T extends string | number> {
  value: T;
  label: ReactNode;
  /** Accessible name when the label is an icon. */
  ariaLabel?: string;
  disabled?: boolean;
  title?: string;
}

interface SegmentedProps<T extends string | number> {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  size?: "sm" | "md";
  block?: boolean;
  className?: string;
}

/** A radio group drawn as a segmented control, with arrow-key navigation. */
export function Segmented<T extends string | number>({
  label,
  value,
  options,
  onChange,
  size = "md",
  block = false,
  className,
}: SegmentedProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
    const back = event.key === "ArrowLeft" || event.key === "ArrowUp";
    if (!forward && !back) return;
    event.preventDefault();
    const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);
    const position = enabled.indexOf(index);
    const next = enabled[(position + (forward ? 1 : -1) + enabled.length) % enabled.length];
    if (next === undefined) return;
    onChange(options[next]!.value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-sm border border-line-strong bg-surface p-0.5",
        block && "flex w-full",
        className,
      )}
    >
      {options.map((option, index) => {
        const selected = option.value === value;
        return (
          <button
            key={String(option.value)}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={option.ariaLabel}
            title={option.title}
            disabled={option.disabled}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-xs font-medium whitespace-nowrap transition-colors duration-150",
              "disabled:opacity-40",
              size === "sm" ? "h-8 px-2.5 text-[0.8125rem] [&_svg]:size-4" : "h-10 px-3.5 text-sm [&_svg]:size-[1.125rem]",
              block && "flex-1",
              selected ? "bg-navy text-white" : "text-ink-2 hover:bg-subtle hover:text-navy",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
