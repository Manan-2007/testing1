/**
 * Typed client for the ISL recognition service (the VOX FastAPI backend).
 *
 * Sends:    {"landmarks": number[141]}                 one tracked frame
 *           {"config": {"confidence_threshold": n}}    per-connection setting
 * Receives: {"word", "confidence"}                     an ACCEPTED sign
 *           {"status":"listening","candidate",...}     a candidate, NOT accepted
 *           {"status":"listening","buffered","needed"} window still filling
 *           {"status":"no-model"}                      service up, no model
 *           {"error"}                                  rejected frame
 *
 * The service accepts a sign only above the confidence threshold, stable for
 * three predictions, and verified on held-out recordings. A candidate is never
 * promoted to a result here: the UI shows it as "not recognised".
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type ConnectionState = "idle" | "connecting" | "open" | "offline" | "no-model";

export type RejectReason = "resting" | "unverified" | "low-confidence" | "unstable" | "already-emitted";

export interface Candidate {
  word: string;
  confidence: number;
  stableFor: number;
  reason: RejectReason;
}

export interface AcceptedSign {
  word: string;
  confidence: number;
  at: number;
}

export interface RecognitionService {
  connection: ConnectionState;
  /** Auto-retry has stopped; the user can retry by hand. */
  gaveUp: boolean;
  candidate: Candidate | null;
  buffered: { have: number; need: number } | null;
  error: string | null;
  send: (vector: Float32Array) => void;
  retry: () => void;
  /** Forget the live candidate (e.g. when recognition is paused). */
  resetLive: () => void;
}

interface Options {
  url: string;
  enabled: boolean;
  threshold: number;
  onAccepted: (sign: AcceptedSign) => void;
}

const RETRY_DELAYS_MS = [1500, 3000, 6000, 12000, 20000];

export function useRecognitionService({ url, enabled, threshold, onAccepted }: Options): RecognitionService {
  const onAcceptedRef = useRef(onAccepted);
  onAcceptedRef.current = onAccepted;
  const thresholdRef = useRef(threshold);
  thresholdRef.current = threshold;
  const socketRef = useRef<WebSocket | null>(null);

  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [gaveUp, setGaveUp] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [buffered, setBuffered] = useState<{ have: number; need: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (!enabled) {
      setConnection("idle");
      return;
    }
    let disposed = false;
    let attempt = 0;
    let timer: number | undefined;
    setGaveUp(false);

    const connect = () => {
      if (disposed) return;
      setConnection("connecting");
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch {
        setConnection("offline");
        setGaveUp(true);
        setError("The recognition service address is not a valid WebSocket URL.");
        return;
      }
      socketRef.current = ws;

      ws.onopen = () => {
        if (disposed) return;
        attempt = 0;
        setConnection("open");
        setError(null);
        ws.send(JSON.stringify({ config: { confidence_threshold: thresholdRef.current } }));
      };

      ws.onclose = () => {
        if (disposed) return;
        socketRef.current = null;
        setCandidate(null);
        setBuffered(null);
        setConnection((state) => (state === "no-model" ? state : "offline"));
        const delay = RETRY_DELAYS_MS[attempt];
        attempt += 1;
        if (delay === undefined) {
          setGaveUp(true);
          return;
        }
        timer = window.setTimeout(connect, delay);
      };

      ws.onmessage = (event) => {
        if (disposed) return;
        let msg: Record<string, unknown>;
        try {
          msg = JSON.parse(event.data as string) as Record<string, unknown>;
        } catch {
          return;
        }
        if (typeof msg.word === "string") {
          onAcceptedRef.current({ word: msg.word, confidence: Number(msg.confidence) || 0, at: Date.now() });
          setCandidate(null);
          setBuffered(null);
        } else if (msg.status === "no-model") {
          setConnection("no-model");
        } else if (typeof msg.error === "string") {
          setError(msg.error);
        } else if (typeof msg.candidate === "string") {
          setCandidate({
            word: msg.candidate,
            confidence: Number(msg.confidence) || 0,
            stableFor: Number(msg.stable_for) || 0,
            reason: ((msg.reason as RejectReason | undefined) ?? "low-confidence"),
          });
          setBuffered(null);
        } else if (msg.buffered !== undefined) {
          setBuffered({ have: Number(msg.buffered) || 0, need: Number(msg.needed) || 30 });
          setCandidate(null);
        }
      };
    };

    connect();

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      const ws = socketRef.current;
      if (ws) {
        ws.onclose = null;
        ws.onmessage = null;
        // Closing mid-handshake logs a browser warning; let it open, then close.
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.onopen = () => ws.close();
          ws.onerror = null;
        } else {
          ws.close();
        }
      }
      socketRef.current = null;
    };
  }, [url, enabled, generation]);

  useEffect(() => {
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ config: { confidence_threshold: threshold } }));
    }
  }, [threshold]);

  const send = useCallback((vector: Float32Array) => {
    const ws = socketRef.current;
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ landmarks: Array.from(vector) }));
  }, []);

  const retry = useCallback(() => setGeneration((n) => n + 1), []);

  const resetLive = useCallback(() => {
    setCandidate(null);
    setBuffered(null);
  }, []);

  return { connection, gaveUp, candidate, buffered, error, send, retry, resetLive };
}
