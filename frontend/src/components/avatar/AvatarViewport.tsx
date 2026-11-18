/**
 * React host for the 3D signer.
 *
 * The render loop lives in the engine's AvatarStage, outside React: this
 * component builds the stage once, feeds it a source (a replay queue, or live
 * camera frames), and pushes option changes through without rebuilding the
 * WebGL context. Adapted from VOX's SignAvatar.
 *
 * The built-in procedural signer is installed first, always. A VRM humanoid
 * replaces it only when VITE_PARLANCE_AVATAR points at one, so by default no
 * avatar file is requested at all.
 */
import { useEffect, useRef, useState } from "react";
import { MonitorX } from "lucide-react";
import { AvatarStage } from "@/engine/avatar/AvatarStage";
import { ProceduralAvatar } from "@/engine/avatar/ProceduralAvatar";
import { PoseRetargeter } from "@/engine/avatar/retarget";
import type { Presentation, SigningAvatar } from "@/engine/avatar/SigningAvatar";
import { FRAME_FLOATS, SignPlayer, type PlayerState, type QueueItem } from "@/engine/avatar/signMotion";
import { NEUTRAL_FACE } from "@/engine/avatar/nonManual";
import { blankPose, type HumanoidPose } from "@/engine/core/humanoid";
import { cn } from "@/lib/cn";

const CUSTOM_AVATAR_URL = import.meta.env.VITE_PARLANCE_AVATAR as string | undefined;

export type AvatarLoadState =
  | { status: "builtin" }
  | { status: "loading"; progress: number }
  | { status: "custom" }
  | { status: "custom-refused"; message: string }
  | { status: "no-webgl" };

export interface AvatarViewportProps {
  /** Replay queue. When empty, `liveFrame` drives the signer instead. */
  queue?: readonly QueueItem[];
  liveFrame?: Float32Array | null;
  mirror?: boolean;
  presentation?: Presentation;
  playbackSpeed?: number;
  loop?: boolean;
  /** Stop rendering (e.g. while scrolled out of view). */
  suspended?: boolean;
  onState?: (state: PlayerState) => void;
  onPlayer?: (player: SignPlayer) => void;
  onLoadState?: (state: AvatarLoadState) => void;
  /** Allow dragging to turn the signer. Off for decorative placements. */
  interactive?: boolean;
  /** Accessible description of what the signer is showing. */
  label: string;
  className?: string;
}

export function AvatarViewport({
  queue,
  liveFrame,
  mirror = false,
  presentation = "figure",
  playbackSpeed = 1,
  loop = false,
  suspended = false,
  onState,
  onPlayer,
  onLoadState,
  interactive = true,
  label,
  className,
}: AvatarViewportProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<AvatarStage | null>(null);
  const playerRef = useRef<SignPlayer | null>(null);
  if (!playerRef.current) playerRef.current = new SignPlayer();
  const player = playerRef.current;
  player.speed = playbackSpeed;
  player.loop = loop;

  const liveRef = useRef<Float32Array | null>(null);
  liveRef.current = liveFrame ?? null;
  const onStateRef = useRef(onState);
  onStateRef.current = onState;
  const onLoadRef = useRef(onLoadState);
  onLoadRef.current = onLoadState;
  const optionsRef = useRef({ mirror, presentation });
  optionsRef.current = { mirror, presentation };

  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    onPlayer?.(player);
    // The player instance is stable for the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  useEffect(() => {
    if (queue && queue.length) player.setQueue([...queue]);
    else player.clear();
  }, [queue, player]);

  /* ------------------------------------------------------------- stage -- */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let stage: AvatarStage;
    try {
      stage = new AvatarStage(mount, { ...optionsRef.current, skeleton: false });
    } catch {
      setWebglFailed(true);
      onLoadRef.current?.({ status: "no-webgl" });
      return;
    }
    stageRef.current = stage;
    // Horizontal drags turn the signer; vertical swipes still scroll the page.
    const canvas = mount.querySelector("canvas");
    if (canvas) canvas.style.touchAction = "pan-y";

    // One retargeter per source: each keeps its own filter history.
    let replayRetargeter: PoseRetargeter | null = null;
    let liveRetargeter: PoseRetargeter | null = null;
    const replayPose: HumanoidPose = blankPose();
    const livePose: HumanoidPose = blankPose();
    const frame = new Float32Array(FRAME_FLOATS);
    let lastFingerprint = -1;

    stage.source = (dt, time) => {
      const current = playerRef.current!;
      if (current.items.length > 0 && replayRetargeter) {
        const advanced = current.advance(dt, frame);
        const state = current.state;
        const fingerprint =
          state.index * 1000 +
          Math.round(state.progress * 100) +
          (state.playing ? 200_000 : 0) +
          (state.transitioning ? 400_000 : 0) +
          (state.finished ? 800_000 : 0);
        if (onStateRef.current && fingerprint !== lastFingerprint) {
          lastFingerprint = fingerprint;
          onStateRef.current(state);
        }
        if (!advanced) return null;
        const ok = replayRetargeter.solve(frame, replayPose, {
          expression: current.face,
          time,
          timeMs: performance.now(),
        });
        return ok ? replayPose : null;
      }
      const live = liveRef.current;
      if (!live || !liveRetargeter) return null;
      const ok = liveRetargeter.solve(live, livePose, {
        expression: NEUTRAL_FACE,
        time,
        timeMs: performance.now(),
      });
      return ok ? livePose : null;
    };

    stage.start();
    const observer = new ResizeObserver(() => stage.resize());
    observer.observe(mount);

    let cancelled = false;
    let current: SigningAvatar | null = null;
    const install = (avatar: SigningAvatar) => {
      current = avatar;
      replayRetargeter = new PoseRetargeter(avatar.rest);
      liveRetargeter = new PoseRetargeter(avatar.rest);
      stage.setAvatar(avatar);
    };

    install(new ProceduralAvatar());
    onLoadRef.current?.({ status: "builtin" });

    if (CUSTOM_AVATAR_URL) {
      onLoadRef.current?.({ status: "loading", progress: 0 });
      void import("@/engine/avatar/VrmAvatar")
        .then(async ({ loadVrmAvatar }) => {
          const { avatar } = await loadVrmAvatar(CUSTOM_AVATAR_URL, (fraction) => {
            if (!cancelled) onLoadRef.current?.({ status: "loading", progress: Math.max(0, fraction) });
          });
          if (cancelled) {
            avatar.dispose();
            return;
          }
          const previous = current;
          install(avatar);
          previous?.dispose();
          onLoadRef.current?.({ status: "custom" });
        })
        .catch((error: unknown) => {
          if (cancelled) return;
          onLoadRef.current?.({
            status: "custom-refused",
            message: error instanceof Error ? error.message : String(error),
          });
        });
    }

    return () => {
      cancelled = true;
      observer.disconnect();
      stage.dispose();
      stageRef.current = null;
    };
  }, []);

  useEffect(() => {
    stageRef.current?.setOptions({ mirror, presentation });
  }, [mirror, presentation]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    if (suspended) stage.stop();
    else stage.start();
  }, [suspended]);

  if (webglFailed) {
    return (
      <div className={cn("flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center", className)}>
        <span className="inline-flex size-11 items-center justify-center rounded-md bg-surface text-ink-3 shadow-xs">
          <MonitorX className="size-5" aria-hidden />
        </span>
        <p className="text-sm font-semibold text-navy">3D rendering is unavailable in this browser</p>
        <p className="max-w-xs text-sm text-ink-3">
          WebGL could not start. The ISL gloss is still shown word by word below the signer.
        </p>
      </div>
    );
  }

  return (
    <div
      ref={mountRef}
      role="img"
      aria-label={label}
      className={cn("avatar-canvas h-full w-full", !interactive && "pointer-events-none", className)}
    />
  );
}
