/**
 * Translation history, stored only in this browser.
 *
 * Where it lives depends on the retention setting, and changes the moment that
 * setting changes:
 *
 *   off       nothing is recorded, and existing entries are deleted
 *   session   sessionStorage: gone when the tab closes (the default)
 *   1d/7d/30d localStorage: pruned by age on load and on every write
 *
 * Text only. Camera frames and audio are never stored anywhere.
 */
import { create } from "zustand";
import { createId } from "@/lib/id";
import { readJson, removeKey, writeJson } from "@/lib/storage";
import { useSettings, type Retention } from "./settings";

export type Direction = "speech-to-sign" | "sign-to-text";
export type InputSource = "voice" | "typed" | "phrase" | "camera";

export interface HistoryEntry {
  id: string;
  direction: Direction;
  /** English text: what was said or typed, or the sentence built from signs. */
  text: string;
  /** ISL gloss notation, e.g. "HOSPITAL WHERE". */
  gloss: string;
  /** Words with no sign in the library (speech to sign only). */
  missing: string[];
  input: InputSource;
  /** Accepted signs with their confidence (sign to text only). */
  words?: { word: string; confidence: number }[];
  createdAt: number;
}

const KEY = "parlance.history.v1";
const DAY = 86_400_000;
const MAX_ENTRIES = 250;

function maxAge(retention: Retention): number {
  switch (retention) {
    case "1d": return DAY;
    case "7d": return 7 * DAY;
    case "30d": return 30 * DAY;
    default: return Number.POSITIVE_INFINITY;
  }
}

function prune(entries: HistoryEntry[], retention: Retention): HistoryEntry[] {
  if (retention === "off") return [];
  const cutoff = Date.now() - maxAge(retention);
  return entries.filter((entry) => entry.createdAt >= cutoff).slice(0, MAX_ENTRIES);
}

function load(retention: Retention): HistoryEntry[] {
  if (retention === "off") return [];
  const stored = readJson<HistoryEntry[]>(retention === "session" ? "session" : "local", KEY);
  return prune(Array.isArray(stored) ? stored : [], retention);
}

function save(entries: HistoryEntry[], retention: Retention): void {
  if (retention === "off") {
    removeKey("local", KEY);
    removeKey("session", KEY);
  } else if (retention === "session") {
    writeJson("session", KEY, entries);
    removeKey("local", KEY);
  } else {
    writeJson("local", KEY, entries);
    removeKey("session", KEY);
  }
}

interface HistoryStore {
  entries: HistoryEntry[];
  add: (entry: Omit<HistoryEntry, "id" | "createdAt">) => HistoryEntry | null;
  remove: (id: string) => void;
  clear: () => void;
}

export const useHistory = create<HistoryStore>()((set, get) => ({
  entries: load(useSettings.getState().retention),

  add: (draft) => {
    const retention = useSettings.getState().retention;
    if (retention === "off") return null;
    const latest = get().entries[0];
    // The same phrase replayed straight away is one interaction, not two.
    if (
      latest &&
      latest.direction === draft.direction &&
      latest.text === draft.text &&
      Date.now() - latest.createdAt < 15_000
    ) {
      return latest;
    }
    const entry: HistoryEntry = { ...draft, id: createId(), createdAt: Date.now() };
    set({ entries: prune([entry, ...get().entries], retention) });
    return entry;
  },

  remove: (id) => set({ entries: get().entries.filter((entry) => entry.id !== id) }),

  clear: () => set({ entries: [] }),
}));

useHistory.subscribe((state) => save(state.entries, useSettings.getState().retention));

// Moving between retention modes moves (or deletes) what is stored.
useSettings.subscribe((state, previous) => {
  if (state.retention === previous.retention) return;
  const kept = prune(useHistory.getState().entries, state.retention);
  useHistory.setState({ entries: kept });
  save(kept, state.retention);
});

/** Delete expired entries while a long session stays open. */
export function startHistoryPruning(): () => void {
  const timer = window.setInterval(() => {
    const retention = useSettings.getState().retention;
    const { entries } = useHistory.getState();
    const kept = prune(entries, retention);
    if (kept.length !== entries.length) useHistory.setState({ entries: kept });
  }, 60_000);
  return () => window.clearInterval(timer);
}
