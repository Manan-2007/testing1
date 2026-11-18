/**
 * Voice input through the browser's Web Speech API.
 *
 * Available in Chromium browsers and Safari; not in Firefox. In Chrome the
 * audio is processed by the browser vendor's speech service, which is stated
 * in the interface next to the microphone button. When unsupported, the
 * workspace falls back to typing, which runs the identical translation path.
 */
import { useCallback, useEffect, useRef, useState } from "react";

interface RecognitionAlternative { transcript: string }
interface RecognitionResult { isFinal: boolean; 0: RecognitionAlternative }
interface RecognitionEvent { resultIndex: number; results: { length: number; [index: number]: RecognitionResult } }
interface Recognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onstart: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
type RecognitionConstructor = new () => Recognition;

function getRecognition(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as RecognitionConstructor | null;
}

export type SpeechInputStatus = "idle" | "starting" | "listening" | "processing";

export type SpeechInputError =
  | "permission-denied"
  | "no-microphone"
  | "no-speech"
  | "network"
  | "unknown";

export const SPEECH_ERROR_MESSAGES: Record<SpeechInputError, string> = {
  "permission-denied": "Microphone access is blocked. Allow it in your browser's site settings, then try again.",
  "no-microphone": "No microphone was found. Connect one, or type your message instead.",
  "no-speech": "No speech was detected. Try again a little closer to the microphone.",
  network: "Voice input needs an internet connection in this browser. You can type instead.",
  unknown: "Voice input stopped unexpectedly. Try again, or type your message.",
};

export interface SpeechInput {
  supported: boolean;
  status: SpeechInputStatus;
  interim: string;
  error: SpeechInputError | null;
  /** Milliseconds since listening began. */
  elapsed: number;
  start: () => void;
  stop: () => void;
  cancel: () => void;
  clearError: () => void;
}

export function useSpeechInput(language: string, onFinal: (text: string) => void): SpeechInput {
  const Ctor = getRecognition();
  const supported = Ctor !== null;

  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;
  const recognitionRef = useRef<Recognition | null>(null);
  const startedAt = useRef(0);
  const gotFinal = useRef(false);

  const [status, setStatus] = useState<SpeechInputStatus>("idle");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<SpeechInputError | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => () => recognitionRef.current?.abort(), []);

  useEffect(() => {
    if (status !== "listening") return;
    const timer = window.setInterval(() => setElapsed(Date.now() - startedAt.current), 250);
    return () => window.clearInterval(timer);
  }, [status]);

  const start = useCallback(() => {
    if (!Ctor || recognitionRef.current) return;
    const recognition = new Ctor();
    recognition.lang = language;
    recognition.continuous = false;
    recognition.interimResults = true;
    gotFinal.current = false;

    recognition.onstart = () => {
      startedAt.current = Date.now();
      setElapsed(0);
      setStatus("listening");
    };
    recognition.onresult = (event) => {
      let pending = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result) continue;
        if (result.isFinal) {
          const text = result[0].transcript.trim();
          if (text) {
            gotFinal.current = true;
            onFinalRef.current(text);
          }
        } else {
          pending += result[0].transcript;
        }
      }
      setInterim(pending);
    };
    recognition.onerror = (event) => {
      const map: Record<string, SpeechInputError> = {
        "not-allowed": "permission-denied",
        "service-not-allowed": "permission-denied",
        "audio-capture": "no-microphone",
        "no-speech": "no-speech",
        network: "network",
      };
      if (event.error === "aborted") return;
      setError(map[event.error] ?? "unknown");
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setStatus("idle");
      setInterim("");
    };

    recognitionRef.current = recognition;
    setError(null);
    setStatus("starting");
    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      setStatus("idle");
      setError("unknown");
    }
  }, [Ctor, language]);

  const stop = useCallback(() => {
    if (!recognitionRef.current) return;
    setStatus("processing");
    recognitionRef.current.stop();
  }, []);

  const cancel = useCallback(() => {
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setStatus("idle");
    setInterim("");
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { supported, status, interim, error, elapsed, start, stop, cancel, clearError };
}
