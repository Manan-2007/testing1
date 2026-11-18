/**
 * Text -> ISL gloss -> sign motions, ready for the signer.
 *
 * Adapted from VOX. Words with no sign in the library stay in the queue,
 * flagged as missing, because "there is no sign for AMBULANCE yet" is
 * information and a silently shorter sentence is not.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { loadSign, prefetchSigns, type QueueItem } from "@/engine/avatar/signMotion";
import { toGloss, type GlossResult } from "@/engine/isl/grammar";
import { loadSignLibrary, useSignLibrary } from "./library";

export type QueueStatus = "idle" | "loading" | "ready" | "empty" | "error";

export interface Translation {
  gloss: GlossResult;
  queue: QueueItem[];
}

export interface SignQueue {
  queue: QueueItem[];
  gloss: GlossResult | null;
  /** The English text that produced the current queue. */
  source: string;
  status: QueueStatus;
  libraryLoaded: boolean;
  translate: (text: string) => Promise<Translation | null>;
  clear: () => void;
}

export function useSignQueue(): SignQueue {
  const library = useSignLibrary();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [gloss, setGloss] = useState<GlossResult | null>(null);
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<QueueStatus>("idle");
  /** Guards against a slower, earlier phrase overwriting a later one. */
  const requestRef = useRef(0);

  useEffect(() => {
    if (!library.loaded) return;
    prefetchSigns(["hello", "yes", "no", "thankyou", "please", "sorry", "help", "what", "doctor", "pain"].filter((g) => library.available.has(g)));
  }, [library]);

  const translate = useCallback(async (text: string): Promise<Translation | null> => {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const request = ++requestRef.current;
    setStatus("loading");
    setSource(trimmed);
    try {
      const { available } = await loadSignLibrary();
      const result = toGloss(trimmed, available);
      if (request !== requestRef.current) return null;
      setGloss(result);
      if (result.tokens.length === 0) {
        setQueue([]);
        setStatus("empty");
        return { gloss: result, queue: [] };
      }
      prefetchSigns(result.tokens.filter((t) => !t.missing).map((t) => t.gloss));
      const items = await Promise.all(
        result.tokens.map(async (token): Promise<QueueItem> => {
          const motion = token.missing ? null : await loadSign(token.gloss);
          return { gloss: token.gloss, label: token.label, motion, missing: motion === null, face: token.face };
        }),
      );
      if (request !== requestRef.current) return null;
      setQueue(items);
      setStatus("ready");
      return { gloss: result, queue: items };
    } catch {
      if (request === requestRef.current) setStatus("error");
      return null;
    }
  }, []);

  const clear = useCallback(() => {
    requestRef.current += 1;
    setQueue([]);
    setGloss(null);
    setSource("");
    setStatus("idle");
  }, []);

  return { queue, gloss, source, status, libraryLoaded: library.loaded, translate, clear };
}
