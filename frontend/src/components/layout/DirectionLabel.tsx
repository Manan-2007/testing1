import { ArrowRight } from "lucide-react";

/** "Speech → Sign" with the arrow announced as "to". */
export function DirectionLabel({ from, to }: { from: string; to: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{from}</span>
      <ArrowRight aria-hidden className="size-3.5 opacity-70" />
      <span className="sr-only">to</span>
      <span>{to}</span>
    </span>
  );
}
