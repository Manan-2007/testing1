/**
 * The Speech → Sign stage: the signer large, between the Parlance arcs, with a
 * big caption, a clickable gloss rail, a floating toolbar and a dark transport.
 */
import { useReducer, useRef } from "react";
import { Expand, FlipHorizontal2, Hand, Pause, PersonStanding, Play, Repeat, RotateCcw, Shrink } from "lucide-react";
import { Arcs } from "@/components/brand/Arcs";
import { AvatarViewport } from "@/components/avatar/AvatarViewport";
import type { PlayerState, QueueItem, SignPlayer } from "@/engine/avatar/signMotion";
import { useFullscreen } from "@/hooks/useFullscreen";
import { cn } from "@/lib/cn";
import { useSettings, type AvatarView, type PlaybackSpeed } from "@/stores/settings";

interface SignerStageProps {
  queue: readonly QueueItem[];
  loading: boolean;
  state: PlayerState;
  onState: (state: PlayerState) => void;
  player: SignPlayer | null;
  onPlayer: (player: SignPlayer) => void;
}

function ToolButton({
  label,
  pressed,
  onClick,
  children,
}: {
  label: string;
  pressed?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-sm transition-colors sm:size-10 [&_svg]:size-[1.125rem]",
        pressed ? "bg-navy text-white" : "text-ink-2 hover:bg-subtle hover:text-navy",
      )}
    >
      {children}
    </button>
  );
}

export function SignerStage({ queue, loading, state, onState, player, onPlayer }: SignerStageProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const fullscreen = useFullscreen(stageRef);
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  const view = useSettings((s) => s.avatarView);
  const speed = useSettings((s) => s.playbackSpeed);
  const loop = useSettings((s) => s.loop);
  const mirror = useSettings((s) => s.mirror);
  const showCaptions = useSettings((s) => s.showCaptions);
  const set = useSettings((s) => s.set);

  const has = queue.length > 0;
  const index = has ? Math.min(state.index, queue.length - 1) : 0;
  const current = has ? queue[index] : null;
  const overall = has ? (index + (state.finished ? 1 : state.progress)) / queue.length : 0;

  const status = loading
    ? "Preparing signs"
    : !has
      ? "Waiting for a message"
      : state.playing
        ? `Signing ${index + 1} of ${queue.length}`
        : state.finished
          ? "Finished"
          : "Paused";

  return (
    <div
      ref={stageRef}
      className={cn(
        "relative isolate flex h-full min-h-[26rem] flex-col overflow-hidden bg-[linear-gradient(180deg,var(--color-stage-2),var(--color-stage))]",
        fullscreen.active && "min-h-screen",
      )}
    >
      <div aria-hidden className="hairline-grid absolute inset-0 -z-10 opacity-60 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_45%,black,transparent)]" />

      {/* top bar: status + toolbar */}
      <div className="relative z-10 flex items-start justify-between gap-3 p-3 sm:p-4">
        <p className="flex min-w-0 items-center gap-2 rounded-sm bg-surface/90 px-3 py-2 text-[0.8125rem] font-medium whitespace-nowrap text-ink-2" role="status">
          <span
            aria-hidden
            className={cn("size-2 rounded-full", state.playing ? "animate-pulse bg-gold" : has ? "bg-royal" : "bg-line-strong")}
          />
          <span className="truncate">{status}</span>
        </p>
        <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-line bg-surface/95 p-1" role="toolbar" aria-label="Signer view">
          <ToolButton label="Whole signer, including the face" pressed={view === "figure"} onClick={() => set("avatarView", "figure" as AvatarView)}>
            <PersonStanding aria-hidden />
          </ToolButton>
          <ToolButton label="Hands focus" pressed={view === "hands"} onClick={() => set("avatarView", "hands" as AvatarView)}>
            <Hand aria-hidden />
          </ToolButton>
          <span aria-hidden className="mx-1 h-6 w-px bg-line" />
          <ToolButton label={mirror ? "Mirrored view on" : "Mirror the signer"} pressed={mirror} onClick={() => set("mirror", !mirror)}>
            <FlipHorizontal2 aria-hidden />
          </ToolButton>
          <ToolButton label={loop ? "Looping on" : "Loop the phrase"} pressed={loop} onClick={() => set("loop", !loop)}>
            <Repeat aria-hidden />
          </ToolButton>
          {fullscreen.supported && (
            <ToolButton label={fullscreen.active ? "Exit full screen" : "Full screen"} onClick={fullscreen.toggle}>
              {fullscreen.active ? <Shrink aria-hidden /> : <Expand aria-hidden />}
            </ToolButton>
          )}
        </div>
      </div>

      {/* signer between the arcs */}
      <div className="relative min-h-0 flex-1">
        <div
          aria-hidden
          className="absolute top-1/2 left-1/2 aspect-square h-[96%] max-w-[96%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,#ffffff_0%,rgb(255_255_255/0.6)_55%,transparent_100%)]"
        />
        <Arcs point={false} className="absolute top-1/2 left-1/2 aspect-square h-[96%] max-w-[96%] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute inset-0">
          <AvatarViewport
            queue={queue}
            mirror={mirror}
            presentation={view}
            playbackSpeed={speed}
            loop={loop}
            onState={onState}
            onPlayer={onPlayer}
            label={current ? `3D signer performing ${current.label.toUpperCase()}. Drag sideways to turn the signer.` : "3D signer, idle. Drag sideways to turn the signer."}
          />
        </div>
        {!has && !loading && (
          <p className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[0.9375rem] text-ink-3">
            Type or say a message, and the signer will perform it in ISL.
          </p>
        )}
      </div>

      {/* caption + gloss rail */}
      {has && (
        <div className="relative z-10 px-4 pb-3 text-center" aria-hidden>
          {showCaptions && current && (
            <>
              <p className="text-[2.25rem] leading-none font-semibold tracking-[-0.02em] text-navy uppercase sm:text-[3rem]">
                {current.label}
              </p>
              <p className="mt-2 text-[0.8125rem] font-medium text-ink-3">
                {current.missing ? "No sign in the library yet, shown as text" : state.transitioning ? "Moving to the next sign" : `Sign ${index + 1} of ${queue.length}`}
              </p>
            </>
          )}
          <ol className="mt-4 flex flex-wrap items-start justify-center gap-x-4 gap-y-2">
            {queue.map((item, i) => (
              <li key={`${item.gloss}-${i}`}>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => {
                    player?.step(i);
                    player?.play();
                    rerender();
                  }}
                  className="flex flex-col items-center gap-1.5"
                >
                  <span
                    className={cn(
                      "text-sm font-semibold tracking-[0.05em] uppercase transition-colors",
                      item.missing ? "text-ink-3 line-through" : i === index ? "text-navy" : "text-ink-3 hover:text-navy",
                    )}
                  >
                    {item.label}
                  </span>
                  <span className={cn("size-1.5 rounded-full transition-colors", i === index && !item.missing ? "bg-gold" : "bg-line-strong")} />
                </button>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* transport */}
      <div className="relative z-10 px-3 pb-3 sm:px-4 sm:pb-4">
        <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-lg bg-navy p-2 text-white shadow-[var(--shadow-float)] sm:gap-3">
          <button
            type="button"
            disabled={!has || !player}
            onClick={() => {
              player?.toggle();
              rerender();
            }}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-white text-navy transition-colors hover:bg-brand-50 disabled:opacity-40"
            aria-label={state.playing ? "Pause signing" : "Play signing"}
          >
            {state.playing ? <Pause className="size-5" aria-hidden /> : <Play className="size-5 translate-x-px" aria-hidden />}
          </button>
          <button
            type="button"
            disabled={!has || !player}
            onClick={() => {
              player?.restart();
              rerender();
            }}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-md text-white/85 transition-colors hover:bg-white/10 disabled:opacity-40"
            aria-label="Replay from the start"
            title="Replay from the start"
          >
            <RotateCcw className="size-[1.125rem]" aria-hidden />
          </button>
          <div
            className="relative h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-label="Phrase progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(overall * 100)}
          >
            <div className="absolute inset-y-0 left-0 rounded-full bg-gold transition-[width] duration-100 ease-linear" style={{ width: `${overall * 100}%` }} />
          </div>
          <span className="hidden w-12 shrink-0 text-right text-[0.8125rem] font-medium tabular-nums text-white/70 sm:block">
            {has ? `${index + 1}/${queue.length}` : "0/0"}
          </span>
          <div role="group" aria-label="Playback speed" className="flex shrink-0 items-center rounded-md bg-white/10 p-0.5">
            {([0.5, 0.75, 1] as PlaybackSpeed[]).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={speed === value}
                aria-label={value === 1 ? "Normal speed" : `${value} times speed`}
                onClick={() => set("playbackSpeed", value)}
                className={cn(
                  "h-9 rounded-sm px-2 text-[0.8125rem] font-medium tabular-nums transition-colors sm:px-2.5",
                  speed === value ? "bg-white text-navy" : "text-white/75 hover:text-white",
                )}
              >
                {value}×
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
