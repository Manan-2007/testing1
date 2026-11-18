import { useId, type ReactNode } from "react";

interface FieldProps {
  label: string;
  description?: ReactNode;
  badge?: ReactNode;
  children: (ids: { id: string; describedBy?: string }) => ReactNode;
  /** Lay the control beside the label on wide screens. */
  inline?: boolean;
}

/** Label + description + control, with the ids wired for assistive tech. */
export function Field({ label, description, badge, children, inline = true }: FieldProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;
  return (
    <div className={inline ? "grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,18rem)] sm:items-center sm:gap-6" : "grid gap-2 py-4"}>
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
      <div className="min-w-0">{children({ id, describedBy: descriptionId })}</div>
    </div>
  );
}
