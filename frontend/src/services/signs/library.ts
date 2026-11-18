/**
 * The sign motion library (239 ISLRTC dictionary signs, landmarks only) and the
 * recogniser's measured quality, each loaded once and shared.
 */
import { useEffect, useState } from "react";
import { loadManifest, type ManifestEntry } from "@/engine/avatar/signMotion";

export interface SignLibrary {
  signs: Record<string, ManifestEntry>;
  available: ReadonlySet<string>;
  loaded: boolean;
}

const EMPTY_LIBRARY: SignLibrary = { signs: {}, available: new Set(), loaded: false };
let libraryCache: SignLibrary | null = null;
let libraryPromise: Promise<SignLibrary> | null = null;

export function loadSignLibrary(): Promise<SignLibrary> {
  libraryPromise ??= loadManifest().then((manifest) => {
    const signs = manifest.signs ?? {};
    libraryCache = { signs, available: new Set(Object.keys(signs)), loaded: true };
    return libraryCache;
  });
  return libraryPromise;
}

export function useSignLibrary(): SignLibrary {
  const [library, setLibrary] = useState<SignLibrary>(libraryCache ?? EMPTY_LIBRARY);
  useEffect(() => {
    if (libraryCache) return;
    let live = true;
    void loadSignLibrary().then((next) => live && setLibrary(next));
    return () => {
      live = false;
    };
  }, []);
  return library;
}

/** What the recogniser has been measured at, from ml/evaluate.py's output. */
export interface RecognitionMetrics {
  classes: number;
  top1: number;
  gatedPrecision: number;
  /** Signs scoring 80%+ on held-out recordings: the only ones the service emits. */
  verified: ReadonlySet<string>;
  /** Signs with any held-out recording at all. */
  measured: ReadonlySet<string>;
  loaded: boolean;
}

const EMPTY_METRICS: RecognitionMetrics = {
  classes: 0,
  top1: 0,
  gatedPrecision: 0,
  verified: new Set(),
  measured: new Set(),
  loaded: false,
};
let metricsCache: RecognitionMetrics | null = null;
let metricsPromise: Promise<RecognitionMetrics> | null = null;

/** The model's "no sign is being made" class, never a word. */
const REJECT_LABEL = "rest";

function loadMetrics(): Promise<RecognitionMetrics> {
  metricsPromise ??= fetch("/signs/recognition.json")
    .then((response) => (response.ok ? response.json() : null))
    .then((data) => {
      const list = (value: unknown) =>
        new Set((Array.isArray(value) ? (value as string[]) : []).filter((w) => w !== REJECT_LABEL));
      metricsCache = data
        ? {
            classes: data.classes ?? 0,
            top1: data.top1 ?? 0,
            gatedPrecision: data.gatedPrecision ?? 0,
            verified: list(data.reliable),
            measured: list(data.measured),
            loaded: true,
          }
        : { ...EMPTY_METRICS, loaded: true };
      return metricsCache;
    })
    .catch(() => {
      metricsCache = { ...EMPTY_METRICS, loaded: true };
      return metricsCache;
    });
  return metricsPromise;
}

export function useRecognitionMetrics(): RecognitionMetrics {
  const [metrics, setMetrics] = useState<RecognitionMetrics>(metricsCache ?? EMPTY_METRICS);
  useEffect(() => {
    if (metricsCache) return;
    let live = true;
    void loadMetrics().then((next) => live && setMetrics(next));
    return () => {
      live = false;
    };
  }, []);
  return metrics;
}

export type Trust = "verified" | "measured" | "unmeasured";

export function trustOf(gloss: string, metrics: RecognitionMetrics): Trust {
  if (metrics.verified.has(gloss)) return "verified";
  if (metrics.measured.has(gloss)) return "measured";
  return "unmeasured";
}

/** Display form of a gloss key: "thankyou" -> "THANK YOU" where the manifest knows the English. */
export function glossLabel(gloss: string, library?: SignLibrary): string {
  const english = library?.signs[gloss]?.english;
  return (english ?? gloss).toUpperCase();
}
