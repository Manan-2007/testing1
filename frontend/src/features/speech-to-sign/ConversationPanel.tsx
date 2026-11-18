import { useEffect, useId, useRef, type KeyboardEvent } from "react";
import { ArrowUp, Mic, MicOff, Play, ScanFace, Square, Trash2 } from "lucide-react";
import type { QueueItem } from "@/engine/avatar/signMotion";
import type { GlossResult } from "@/engine/isl/grammar";
import { cn } from "@/lib/cn";
import { formatDuration, formatTime } from "@/lib/time";
import { SPEECH_ERROR_MESSAGES, type SpeechInput } from "@/services/speech/useSpeechInput";
import type { InputSource } from "@/stores/history";
import type { SpeechLanguage } from "@/stores/settings";
import { PHRASE_GROUPS } from "./phrases";

export interface Exchange {
  id: string;
  text: string;
  gloss: GlossResult;
  queue: QueueItem[];
  input: InputSource;
  at: number;
}

const SOURCE: Record<InputSource, string> = { voice: "Spoken", typed: "Typed", phrase: "Phrase", camera: "Signed" };
const MAX_LENGTH = 300;

interface ConversationPanelProps {
  exchanges: Exchange[];
  activeId: string | null;
  onReplay: (id: string) => void;
  onClear: () => void;
  text: string;
  onText: (text: string) => void;
  onSubmit: (source: InputSource, override?: string) => void;
  busy: boolean;
  speech: SpeechInput;
  language: SpeechLanguage;
  onLanguage: (language: SpeechLanguage) => void;
}

export function ConversationPanel({
  exchanges,
  activeId,
  onReplay,
  onClear,
  text,
  onText,
  onSubmit,
  busy,
  speech,
  language,
  onLanguage,
}: ConversationPanelProps) {
  const inputId = useId();
  const languageId = useId();
  const logRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const listening = speech.status === "listening" || speech.status === "starting";
  const processing = speech.status === "processing";

  // Keep the newest exchange in view.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTo({ top: log.scrollHeight, behavior: "smooth" });
  }, [exchanges.length]);

  // Grow the textarea with its content, up to five lines.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 152)}px`;
  }, [text, speech.interim]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit("typed");
    }
  };

  return (
    <section aria-label="Conversation" className="flex h-full min-h-0 flex-col bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
        <h2 className="text-[0.9375rem] font-semibold tracking-[-0.01em]">Conversation</h2>
        <button
          type="button"
          onClick={onClear}
          disabled={exchanges.length === 0}
          className="inline-flex h-9 items-center gap-1.5 rounded-sm px-2.5 text-[0.8125rem] font-medium text-ink-3 transition-colors hover:bg-subtle hover:text-navy disabled:opacity-40"
        >
          <Trash2 className="size-3.5" aria-hidden /> Clear
        </button>
      </div>

      <div ref={logRef} className="min-h-0 flex-1 overflow-y-auto" aria-live="polite" aria-relevant="additions">
        {exchanges.length === 0 ? (
          <div className="px-5 py-6">
            <p className="text-statement text-[1.375rem]! text-navy">What would you like to say?</p>
            <p className="mt-2 text-[0.9375rem] leading-6 text-ink-2">
              Type or speak in English. Parlance reorders it into ISL grammar and the signer performs it.
            </p>
            <div className="mt-6 space-y-5">
              {PHRASE_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="eyebrow">{group.label}</p>
                  <ul className="mt-2 border-t border-line">
                    {group.phrases.map((phrase) => (
                      <li key={phrase}>
                        <button
                          type="button"
                          disabled={listening}
                          onClick={() => {
                            onText(phrase);
                            onSubmit("phrase", phrase);
                          }}
                          className="group flex w-full items-center justify-between gap-3 border-b border-line py-2.5 text-left text-[0.9375rem] text-ink transition-colors hover:text-royal disabled:opacity-50"
                        >
                          {phrase}
                          <ArrowUp className="size-4 rotate-45 text-ink-3 transition-colors group-hover:text-royal" aria-hidden />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <ol>
            {exchanges.map((x) => {
              const active = x.id === activeId;
              return (
                <li key={x.id} className={cn("relative animate-rise border-b border-line px-5 py-4 transition-colors", active && "bg-stage-2")}>
                  {active && <span aria-hidden className="absolute inset-y-0 left-0 w-0.5 bg-royal" />}
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-medium text-ink-3">
                      {SOURCE[x.input]} · <time dateTime={new Date(x.at).toISOString()}>{formatTime(x.at)}</time>
                    </p>
                    <button
                      type="button"
                      onClick={() => onReplay(x.id)}
                      disabled={x.queue.length === 0}
                      className="inline-flex h-8 items-center gap-1.5 rounded-sm px-2 text-[0.8125rem] font-medium text-royal transition-colors hover:bg-brand-50 disabled:opacity-40"
                      aria-label={`Sign again: ${x.text}`}
                    >
                      <Play className="size-3.5" aria-hidden /> Sign again
                    </button>
                  </div>
                  <p className="mt-1 text-[1.0625rem] leading-7 font-medium text-ink">{x.text}</p>
                  {x.gloss.tokens.length > 0 ? (
                    <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1" aria-label={`ISL gloss: ${x.gloss.notation}`}>
                      {x.gloss.tokens.map((t, i) => (
                        <span key={`${t.gloss}-${i}`} className="inline-flex items-center gap-2.5">
                          <span
                            className={cn(
                              "text-[0.8125rem] font-semibold tracking-[0.05em] uppercase",
                              t.missing ? "text-ink-3 line-through" : "text-navy",
                            )}
                          >
                            {t.label}
                          </span>
                          {i < x.gloss.tokens.length - 1 && <span aria-hidden className="size-1 rounded-full bg-line-strong" />}
                        </span>
                      ))}
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-ink-3">Nothing here could be translated.</p>
                  )}
                  {x.gloss.markers.length > 0 && (
                    <p className="mt-2 flex items-center gap-1.5 text-[0.8125rem] text-ink-2">
                      <ScanFace className="size-3.5 shrink-0 text-royal" aria-hidden />
                      {x.gloss.markers.map((m) => m.charAt(0).toUpperCase() + m.slice(1)).join(" · ")}
                    </p>
                  )}
                  {x.gloss.tokens.some((t) => t.missing) && (
                    <p className="mt-2 text-[0.8125rem] text-gold-800">
                      No sign in the library yet for{" "}
                      {x.gloss.tokens.filter((t) => t.missing).map((t) => t.label).join(", ")}: shown as text instead.
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit("typed");
        }}
        className="border-t border-line bg-surface p-3 sm:p-4 max-lg:sticky max-lg:z-20 max-lg:shadow-[0_-8px_24px_-16px_rgb(1_22_56/0.25)] max-md:bottom-[calc(4rem+env(safe-area-inset-bottom))] md:max-lg:bottom-0"
      >
        {(listening || processing) && (
          <p className="mb-2 flex items-center gap-2 px-1 text-[0.8125rem] font-medium" role="status">
            <span className="relative inline-flex size-2.5">
              <span className="absolute inset-0 animate-ping rounded-full bg-danger/50" />
              <span className="relative size-2.5 rounded-full bg-danger" />
            </span>
            <span className="text-danger">{processing ? "Transcribing" : "Recording"}</span>
            <span className="text-ink-3 tabular-nums">{formatDuration(speech.elapsed)}</span>
            <span className="flex h-4 items-center gap-0.5" aria-hidden>
              {[6, 12, 8, 14, 10, 7, 12].map((h, i) => (
                <span key={i} className="w-0.5 rounded-full bg-danger/60" style={{ height: h, animation: `wave 0.8s ${i * 0.09}s ease-in-out infinite alternate` }} />
              ))}
            </span>
          </p>
        )}
        {speech.error && (
          <p className="mb-2 flex items-start gap-2 rounded-sm bg-gold-50 px-3 py-2 text-[0.8125rem] leading-5 text-ink-2" role="alert">
            <MicOff className="mt-0.5 size-3.5 shrink-0 text-gold-800" aria-hidden />
            {SPEECH_ERROR_MESSAGES[speech.error]}
          </p>
        )}
        <label htmlFor={inputId} className="sr-only">
          Message to sign
        </label>
        <div
          className={cn(
            "flex items-end gap-1.5 rounded-md border bg-surface p-1.5 transition-[border-color,box-shadow] focus-within:border-royal focus-within:shadow-[0_0_0_4px_rgb(13_33_161/0.1)]",
            listening ? "border-danger/50" : "border-line-strong",
          )}
        >
          <textarea
            ref={textareaRef}
            id={inputId}
            rows={1}
            value={listening && speech.interim ? speech.interim : text}
            onChange={(e) => onText(e.target.value.slice(0, MAX_LENGTH))}
            onKeyDown={onKeyDown}
            readOnly={listening}
            maxLength={MAX_LENGTH}
            placeholder={listening ? "Listening…" : "Type a message…"}
            className="max-h-[9.5rem] min-h-11 flex-1 resize-none bg-transparent px-2.5 py-2.5 text-[1.0625rem] leading-6 text-ink outline-none placeholder:text-ink-3/70 focus-visible:outline-none"
          />
          {speech.supported && (
            <button
              type="button"
              onClick={listening ? speech.stop : speech.start}
              disabled={processing}
              aria-pressed={listening}
              aria-label={listening ? "Stop recording" : "Speak"}
              title={listening ? "Stop recording" : "Speak"}
              className={cn(
                "inline-flex size-11 shrink-0 items-center justify-center rounded-sm transition-colors disabled:opacity-40",
                listening ? "bg-danger text-white" : "text-navy hover:bg-subtle",
              )}
            >
              {listening ? <Square className="size-4 fill-current" aria-hidden /> : <Mic className="size-5" aria-hidden />}
            </button>
          )}
          <button
            type="submit"
            disabled={!text.trim() || busy || listening}
            aria-label="Sign this message"
            title="Sign this message"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm bg-royal text-white transition-colors hover:bg-brand-700 disabled:bg-brand-200"
          >
            <ArrowUp className="size-5" aria-hidden />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-1 text-xs text-ink-3">
          <span className="flex items-center gap-1.5">
            <label htmlFor={languageId}>Voice</label>
            <select
              id={languageId}
              value={language}
              onChange={(e) => onLanguage(e.target.value as SpeechLanguage)}
              className="rounded-xs bg-transparent py-1 font-medium text-ink-2 hover:text-navy"
            >
              <option value="en-IN">English (India)</option>
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
            </select>
          </span>
          <span>{speech.supported ? "Enter to sign · Shift + Enter for a new line" : "Voice input isn't available in this browser"}</span>
        </div>
      </form>
    </section>
  );
}
