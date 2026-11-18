/**
 * A 2D trace of real signing: hand landmarks from the ISLRTC motion library,
 * drawn as SVG. No WebGL, a few kilobytes per sign, and the motion is the
 * genuine recording rather than an illustration of one.
 *
 * Each hand is drawn from its 21 metric world landmarks (its true shape),
 * placed at its image-space wrist position (where it is in the signing space).
 */
import { useEffect, useRef, useState } from "react";
import { loadSign, type SignMotion } from "@/engine/avatar/signMotion";
import { cn } from "@/lib/cn";

const BONES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];
const HANDS = [
  { wrist: 0, world: 2, elbow: 3, colour: "#0D21A1" },
  { wrist: 65, world: 67, elbow: 4, colour: "#B8901A" },
];
const POSE = 130;
const VIEW_W = 160;
const VIEW_H = 120;
/** Where the reference silhouette's shoulders sit, in view units. */
const SHOULDER_Y = 84;
const SHOULDER_SPAN = 50;
/** View units per metre of hand (world landmarks are metric). */
const HAND_SCALE = 165;
const HOLD_MS = 450;

type Point = [number, number];

/** The signer's body frame for one sign: shoulder midpoint and span, averaged. */
interface Anchor {
  x: number;
  y: number;
  span: number;
}

function anchorOf(motion: SignMotion): Anchor {
  let x = 0;
  let y = 0;
  let span = 0;
  let n = 0;
  for (const frame of motion.frames) {
    const lx = frame[POSE + 3] ?? 0;
    const ly = frame[POSE + 4] ?? 0;
    const rx = frame[POSE + 6] ?? 0;
    const ry = frame[POSE + 7] ?? 0;
    if (!lx || !rx) continue;
    x += (lx + rx) / 2;
    y += (ly + ry) / 2;
    span += Math.hypot(lx - rx, ly - ry);
    n += 1;
  }
  return n ? { x: x / n, y: y / n, span: span / n } : { x: 0.89, y: 0.52, span: 0.35 };
}

/** Square-space point (motion library coordinates) to view units. */
function toView(x: number, y: number, a: Anchor): Point {
  const k = SHOULDER_SPAN / a.span;
  return [VIEW_W / 2 + (x - a.x) * k, SHOULDER_Y + (y - a.y) * k];
}

function project(frame: Float32Array, hand: (typeof HANDS)[number], a: Anchor): { points: Point[]; elbow: Point | null; shoulder: Point } | null {
  const wx = frame[hand.wrist] ?? 0;
  const wy = frame[hand.wrist + 1] ?? 0;
  if (wx === 0 && wy === 0) return null;
  const [cx, cy] = toView(wx, wy, a);
  const ox = frame[hand.world] ?? 0;
  const oy = frame[hand.world + 1] ?? 0;
  const points: Point[] = [];
  for (let i = 0; i < 21; i += 1) {
    const x = (frame[hand.world + i * 3] ?? 0) - ox;
    const y = (frame[hand.world + i * 3 + 1] ?? 0) - oy;
    points.push([cx + x * HAND_SCALE, cy + y * HAND_SCALE]);
  }
  const ex = frame[POSE + hand.elbow * 3] ?? 0;
  const ey = frame[POSE + hand.elbow * 3 + 1] ?? 0;
  const elbow = ex || ey ? toView(ex, ey, a) : null;
  // Pose point 1 is the image-right shoulder, 2 the image-left one.
  const side = hand.elbow === 3 ? 1 : 2;
  const shoulder = toView(frame[POSE + side * 3] ?? a.x, frame[POSE + side * 3 + 1] ?? a.y, a);
  return { points, elbow, shoulder };
}

interface HandTraceProps {
  glosses: readonly string[];
  /** Index of the sign being shown, reported as playback moves on. */
  onSign?: (index: number) => void;
  playing?: boolean;
  className?: string;
  /** Draw a camera frame with landmark dots (recognition) rather than a signer (output). */
  variant?: "signer" | "camera";
}

export function HandTrace({ glosses, onSign, playing = true, className, variant = "signer" }: HandTraceProps) {
  const [motions, setMotions] = useState<(SignMotion | null)[]>([]);
  const [shown, setShown] = useState<{ frame: Float32Array; anchor: Anchor } | null>(null);
  const onSignRef = useRef(onSign);
  onSignRef.current = onSign;
  const key = glosses.join(" ");

  useEffect(() => {
    let live = true;
    void Promise.all(key.split(" ").map((g) => loadSign(g))).then((loaded) => live && setMotions(loaded));
    return () => {
      live = false;
    };
  }, [key]);

  useEffect(() => {
    const usable = motions.filter((m): m is SignMotion => m !== null && m.frames.length > 0);
    if (usable.length === 0) return;
    if (!playing) {
      const first = usable[0]!;
      const still = first.frames[Math.floor(first.frames.length * 0.6)];
      setShown(still ? { frame: still, anchor: anchorOf(first) } : null);
      onSignRef.current?.(0);
      return;
    }
    const anchors = usable.map(anchorOf);
    let raf = 0;
    let sign = 0;
    let started = performance.now();
    onSignRef.current?.(0);
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const motion = usable[sign]!;
      const duration = (motion.frames.length / motion.fps) * 1000 * 1.15;
      const t = now - started;
      if (t > duration + HOLD_MS) {
        sign = (sign + 1) % usable.length;
        started = now;
        onSignRef.current?.(sign);
        return;
      }
      const index = Math.min(motion.frames.length - 1, Math.floor((Math.min(t, duration) / duration) * motion.frames.length));
      const next = motion.frames[index];
      if (next) setShown({ frame: next, anchor: anchors[sign]! });
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [motions, playing]);

  const hands = shown ? HANDS.map((hand) => ({ hand, drawn: project(shown.frame, hand, shown.anchor) })) : [];

  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} className={cn("h-full w-full", className)} aria-hidden>
      {variant === "camera" ? (
        <g fill="none" stroke="#97A3E2" strokeWidth="0.8" strokeLinecap="round">
          <path d="M8 18V8h10M152 18V8h-10M8 102v10h10M152 102v10h-10" />
        </g>
      ) : null}
      {/* A neutral head-and-shoulders reference, so the hands read as signing space. */}
      <g fill={variant === "camera" ? "#E3E7F4" : "#DEE2F7"}>
        <ellipse cx="80" cy="44" rx="13" ry="16" />
        <path d="M80 76c-17 0-27 9-29 26l-2 18h62l-2-18c-2-17-12-26-29-26z" />
      </g>
      {hands.map(({ hand, drawn }) =>
        drawn?.elbow ? (
          <g key={`arm-${hand.wrist}`} stroke={variant === "camera" ? "#D2D8EC" : "#C9D0F0"} strokeLinecap="round" fill="none">
            <line x1={drawn.shoulder[0]} y1={drawn.shoulder[1]} x2={drawn.elbow[0]} y2={drawn.elbow[1]} strokeWidth="7" />
            <line x1={drawn.elbow[0]} y1={drawn.elbow[1]} x2={drawn.points[0]![0]} y2={drawn.points[0]![1]} strokeWidth="5.5" />
          </g>
        ) : null,
      )}
      {hands.map(({ hand, drawn }) =>
        drawn ? (
          <g key={hand.wrist}>
            <g stroke="#FFFFFF" strokeWidth="3.8" strokeLinecap="round" strokeLinejoin="round">
              {BONES.map(([a, b]) => (
                <line key={`${a}-${b}`} x1={drawn.points[a]![0]} y1={drawn.points[a]![1]} x2={drawn.points[b]![0]} y2={drawn.points[b]![1]} />
              ))}
            </g>
            <g stroke={hand.colour} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              {BONES.map(([a, b]) => (
                <line key={`${a}-${b}`} x1={drawn.points[a]![0]} y1={drawn.points[a]![1]} x2={drawn.points[b]![0]} y2={drawn.points[b]![1]} />
              ))}
            </g>
            {drawn.points.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i === 0 ? 2 : 1.35} fill="#FFFFFF" stroke={hand.colour} strokeWidth="0.75" />
            ))}
          </g>
        ) : null,
      )}
    </svg>
  );
}
