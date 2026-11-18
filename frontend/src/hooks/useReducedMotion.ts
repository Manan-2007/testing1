import { useSettings } from "@/stores/settings";
import { useMediaQuery } from "./useMediaQuery";

/** True when motion should be minimised: the in-app setting wins over the OS. */
export function useReducedMotion(): boolean {
  const preference = useSettings((s) => s.motion);
  const system = useMediaQuery("(prefers-reduced-motion: reduce)");
  if (preference === "reduce") return true;
  if (preference === "full") return false;
  return system;
}
