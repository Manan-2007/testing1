import { useEffect, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { startHistoryPruning } from "@/stores/history";
import { useSettings } from "@/stores/settings";

/** Applies text size and motion preferences to the document. */
export function Preferences({ children }: { children: ReactNode }) {
  const textSize = useSettings((s) => s.textSize);
  const reduced = useReducedMotion();

  useEffect(() => {
    document.documentElement.dataset.textSize = textSize;
  }, [textSize]);

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduce" : "full";
  }, [reduced]);

  useEffect(() => startHistoryPruning(), []);

  return <MotionConfig reducedMotion={reduced ? "always" : "never"}>{children}</MotionConfig>;
}
