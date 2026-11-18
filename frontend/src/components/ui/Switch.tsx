import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Hide the visible label (it remains the accessible name). */
  hideLabel?: boolean;
  disabled?: boolean;
  id?: string;
  describedBy?: string;
}

export function Switch({ checked, onChange, label, hideLabel, disabled, id, describedBy }: SwitchProps) {
  const generated = useId();
  const switchId = id ?? generated;
  return (
    <span className="inline-flex items-center gap-3">
      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={hideLabel ? label : undefined}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-150",
          "disabled:opacity-40",
          checked ? "border-royal bg-royal" : "border-line-strong bg-line",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block size-5 rounded-full bg-white shadow-sm transition-transform duration-150",
            checked ? "translate-x-[1.375rem]" : "translate-x-[0.1875rem]",
          )}
        />
      </button>
      {!hideLabel && (
        <label htmlFor={switchId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
    </span>
  );
}

interface SwitchRowProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: ReactNode;
  disabled?: boolean;
  badge?: ReactNode;
}

/** A labelled settings row: title and description on the left, switch on the right. */
export function SwitchRow({ checked, onChange, label, description, disabled, badge }: SwitchRowProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor={id} className="text-[0.9375rem] font-semibold text-ink">
            {label}
          </label>
          {badge}
        </div>
        {description && (
          <p id={descriptionId} className="mt-0.5 text-sm leading-5 text-ink-3">
            {description}
          </p>
        )}
      </div>
      <Switch
        id={id}
        checked={checked}
        onChange={onChange}
        label={label}
        hideLabel
        disabled={disabled}
        describedBy={description ? descriptionId : undefined}
      />
    </div>
  );
}
