/**
 * The hero's live stage: the real 3D signer between the Parlance arcs, driven
 * by the real grammar engine and motion library. Visitors can type their own
 * sentence; until they do, it cycles through a few short phrases.
 * Loaded as its own chunk (three.js).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Arcs } from "@/components/brand/Arcs";
import { AvatarViewport } from "@/components/avatar/AvatarViewport";
import { announce } from "@/components/ui/Toaster";
import { loadSign, type PlayerState, type QueueItem, type SignPlayer } from "@/engine/avatar/signMotion";
import { toGloss, type GlossResult } from "@/engine/isl/grammar";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";
import { loadSignLibrary } from "@/services/signs/library";

const DEMO_PHRASES = ["Good morning, welcome.", "Where is the pain?", "Do you want water?", "Thank you."];
const GAP_MS = 1600;

interface Prepared {
  english: string;
  gloss: GlossResult;
  queue: QueueItem[];
}

async function prepare(english: string): Promise<Prepared> {
  const { available } = await loadSignLibrary();
  const gloss = toGloss(english, available);
  const queue = await Promise.all(
    gloss.tokens.map(async (token): Promise<QueueItem> => {
      const motion = token.missing ? null : await loadSign(token.gloss);
      return { gloss: token.gloss, label: token.label, motion, missing: motion === null, face: token.face };
    }),
  );
  return { english, gloss, queue };
}

const CLAUSE: Record<GlossResult["clause"], string> = {
  statement: "Statement",
  polar: "Yes / no question",
  content: "Question word",
};

export default function HeroStage({ request }: { request: { text: string; id: number } | null }) {
  const reduced = useReducedMotion();
  const [current, setCurrent] = useState<Prepared | null>(null);
  const [state, setState] = useState<PlayerState | null>(null);
  /** Cycle demo phrases automatically. */
  const [demo, setDemo] = useState(!reduced);
  const [demoIndex, setDemoIndex] = useState(0);
  /** The visitor has typed their own sentence. */
  const [userTook, setUserTook] = useState(false);
  /** Hand the queue to the signer. Under reduced motion, only after Play. */
  const [started, setStarted] = useState(!reduced);
  const [player, setPlayer] = useState<SignPlayer | null>(null);
  const [visible, setVisible] = useState(true);
  const hostRef = useRef<HTMLDivElement>(null);

  // Stop rendering when the hero scrolls away.
  useEffect(() => {
    const node = hostRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry?.isIntersecting ?? true));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Demo phrases until the visitor types their own.
  useEffect(() => {
    if (userTook) return;
    let live = true;
    void prepare(DEMO_PHRASES[demoIndex % DEMO_PHRASES.length]!).then((p) => {
      if (!live) return;
      setState(null);
      setCurrent(p);
    });
    return () => {
      live = false;
    };
  }, [userTook, demoIndex]);

  // A visitor's own sentence takes over the stage.
  useEffect(() => {
    if (!request) return;
    let live = true;
    setDemo(false);
    setUserTook(true);
    setStarted(true);
    void prepare(request.text).then((p) => {
      if (!live) return;
      setState(null);
      setCurrent(p);
      const signed = p.queue.filter((q) => !q.missing).length;
      announce(
        p.queue.length === 0
          ? "Nothing in that sentence could be translated."
          : `Signing ${p.gloss.notation}. ${signed} of ${p.queue.length} words have a sign.`,
      );
    });
    return () => {
      live = false;
    };
  }, [request]);

  const onState = useCallback((next: PlayerState) => setState(next), []);
  useEffect(() => {
    if (!demo || !state?.finished || state.playing) return;
    const timer = window.setTimeout(() => setDemoIndex((i) => i + 1), GAP_MS);
    return () => window.clearTimeout(timer);
  }, [demo, state]);

  const queue = current?.queue;
  const active = state && queue?.length ? Math.min(state.index, queue.length - 1) : -1;
  const playing = !!state?.playing;
  const markers = current?.gloss.markers ?? [];

  return (
    <div ref={hostRef} className="relative h-full w-full">
      {/* stage disc + arcs */}
      <div
        aria-hidden
        className="absolute top-[1%] left-1/2 aspect-square h-[80%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,#ffffff_0%,var(--color-stage-2)_55%,var(--color-stage)_88%,transparent_100%)]"
      />
      <Arcs draw point={false} className="absolute top-[1%] left-1/2 aspect-square h-[80%] -translate-x-1/2" />

      <div className="absolute inset-x-[6%] top-0 bottom-[20%]">
        <AvatarViewport
          queue={started ? queue : undefined}
          presentation="figure"
          interactive={false}
          suspended={!visible}
          onState={onState}
          onPlayer={setPlayer}
          label={
            current
              ? `3D signer performing the ISL phrase ${current.gloss.notation}, translated from "${current.english}"`
              : "3D signer, resting"
          }
        />
      </div>

      {/* Left annotation, attached to the arc: what was said */}
      <div className="pointer-events-none absolute top-[14%] left-0 hidden max-w-[11.5rem] xl:block" aria-hidden>
        <p className="eyebrow">English</p>
        <p className="mt-1.5 text-[1.0625rem] leading-6 font-medium text-navy">{current ? current.english : "…"}</p>
        <span className="mt-3 block h-px w-24 bg-royal/40" />
      </div>

      {/* Right annotation, attached to the arc: grammar on the face */}
      <div className="pointer-events-none absolute top-[14%] right-0 hidden max-w-[11.5rem] text-right xl:block" aria-hidden>
        <p className="eyebrow">{current ? CLAUSE[current.gloss.clause] : "ISL grammar"}</p>
        <p className="mt-1.5 text-[0.9375rem] leading-6 text-ink-2">
          {markers.length ? markers[0]!.charAt(0).toUpperCase() + markers[0]!.slice(1) : "Neutral face"}
        </p>
        <span className="mt-3 ml-auto block h-px w-24 bg-royal/40" />
      </div>

      {/* Gloss rail with the gold point under the active sign */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-3">
        <div className="flex max-w-full flex-wrap items-end justify-center gap-x-5 gap-y-2 px-2" aria-hidden>
          {queue?.map((item, i) => (
            <span key={`${item.gloss}-${i}`} className="flex flex-col items-center gap-2">
              <span
                className={cn(
                  "text-[1.0625rem] leading-none font-semibold tracking-[0.04em] uppercase transition-colors duration-300 sm:text-xl",
                  item.missing ? "text-ink-3 line-through decoration-1" : i === active ? "text-navy" : "text-ink-3",
                )}
              >
                {item.label}
              </span>
              <span
                className={cn(
                  "size-1.5 rounded-full transition-all duration-300",
                  i === active && !item.missing ? "scale-125 bg-gold" : "bg-line-strong",
                )}
              />
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (!current) return;
              if (!started) {
                setStarted(true);
                return;
              }
              if (demo) setDemo(false);
              player?.toggle();
            }}
            disabled={!player || !queue?.length}
            className="inline-flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface text-navy transition-colors hover:border-navy/40 disabled:opacity-40"
            aria-label={playing ? "Pause the signer" : "Play the signer"}
            title={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause className="size-3.5" aria-hidden /> : <Play className="size-3.5" aria-hidden />}
          </button>
          <button
            type="button"
            onClick={() => {
              if (demo) setDemo(false);
              if (!started) setStarted(true);
              else player?.restart();
            }}
            disabled={!player || !queue?.length}
            className="inline-flex size-9 items-center justify-center rounded-full border border-line-strong bg-surface text-navy transition-colors hover:border-navy/40 disabled:opacity-40"
            aria-label="Replay the phrase"
            title="Replay"
          >
            <RotateCcw className="size-3.5" aria-hidden />
          </button>
          <span className="ml-1 text-[0.8125rem] font-medium text-ink-3" aria-hidden>
            {!current ? "Preparing the signer…" : playing ? `Signing ${active + 1} of ${queue?.length ?? 0}` : demo ? "Next phrase…" : "Ready"}
          </span>
        </div>
      </div>
    </div>
  );
}
