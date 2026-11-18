/**
 * Whether the welcome scene plays, and where it is.
 *
 * It plays once on the landing page, then not again on this device for a day,
 * never on a deep link (#about), never with reduced motion, and never again
 * when the reader moves between routes in the same visit. `?intro` forces it,
 * and the footer can replay it.
 */
import { create } from "zustand";
import { useSettings } from "@/stores/settings";

export type IntroPhase = "playing" | "revealing" | "done";

const KEY = "parlance.intro.seenAt";
const DAY = 24 * 60 * 60 * 1000;

function prefersReduced(): boolean {
  const preference = useSettings.getState().motion;
  if (preference === "reduce") return true;
  if (preference === "full") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

function firstPhase(): IntroPhase {
  if (typeof window === "undefined" || prefersReduced()) return "done";
  try {
    if (new URLSearchParams(window.location.search).has("intro")) return "playing";
    if (window.location.pathname !== "/" || window.location.hash || window.scrollY > 0) return "done";
    const seen = Number(window.localStorage.getItem(KEY) ?? 0);
    if (Date.now() - seen < DAY) return "done";
  } catch {
    // Storage blocked: play it; it cannot be remembered anyway.
  }
  return "playing";
}

export function markIntroSeen(): void {
  try {
    window.localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // Not remembered; harmless.
  }
}

interface IntroState {
  phase: IntroPhase;
  setPhase: (phase: IntroPhase) => void;
  replay: () => void;
}

export const useIntro = create<IntroState>((set) => ({
  phase: firstPhase(),
  setPhase: (phase) => set({ phase }),
  replay: () => {
    if (prefersReduced()) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    set({ phase: "playing" });
  },
}));
