/**
 * Stylised vector hands driven by a real ISLRTC recording.
 *
 * The motion is not illustrated or invented: every frame is the dictionary
 * signer's tracked hand landmarks (21 per hand). Each hand keeps its true metric
 * shape (world landmarks) and its place in the signing space (image wrist),
 * and is drawn as soft cut-paper shapes: a rounded palm and tapered fingers,
 * sorted by depth so curled fingers pass in front of or behind the palm.
 *
 * Tracking artefacts are cleaned, never re-choreographed: a hand the tracker
 * had not found yet (a frozen placeholder) is treated as absent and fades in at
 * its first real pose, and a one-frame jump is replaced by its neighbours.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { loadSign, type SignMotion } from "@/engine/avatar/signMotion";
import { cn } from "@/lib/cn";

type P = [number, number];

const POSE = 130;
/** Hand slots in a frame: image wrist, world landmarks, matching pose elbow and wrist. */
const SLOTS = [
  { wrist: 0, world: 2, elbow: 3, poseWrist: 5 },
  { wrist: 65, world: 67, elbow: 4, poseWrist: 6 },
] as const;
const PALM = [0, 1, 5, 9, 13, 17];
const FINGERS: { idx: number[]; w: number }[] = [
  { idx: [1, 2, 3, 4], w: 0.34 },
  { idx: [5, 6, 7, 8], w: 0.29 },
  { idx: [9, 10, 11, 12], w: 0.3 },
  { idx: [13, 14, 15, 16], w: 0.28 },
  { idx: [17, 18, 19, 20], w: 0.24 },
];
/** Body units per metre of hand; the shoulders span 50 body units. */
const HAND_SCALE = 165;
const SHOULDER_SPAN = 50;
/**
 * Illustration proportion: hand shapes are drawn larger than life relative to
 * the distance they travel, so they read at a glance. Shapes and paths are
 * both the recording's own; only their relative scale is changed.
 */
const SHAPE = 1.9;
const VIEW = 100;
const PAD = 8;
const TRAIL = 16;
const FADE_FRAMES = 4;

interface HandPose {
  pts: P[];
  z: number[];
  elbow: P | null;
  depth: number;
  alpha: number;
}
type Frame = (HandPose | null)[];

interface Prepared {
  frames: Frame[];
  lead: number;
  /** Drawing size of each hand (wrist to middle knuckle), constant through the sign. */
  size: [number, number];
}

const dist = (a: P, b: P) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const same = (a: Float32Array, b: Float32Array, start: number, length: number) => {
  for (let i = start; i < start + length; i += 1) if (a[i] !== b[i]) return false;
  return true;
};

/** Which frames really contain each hand, after removing placeholders and glitches. */
function cleanFrames(frames: Float32Array[]): { rows: Float32Array[]; present: boolean[][] } {
  const rows = frames.map((f) => Float32Array.from(f));
  const present = SLOTS.map((s) => rows.map((f) => !!(f[s.wrist] || f[s.wrist + 1])));

  SLOTS.forEach((s, h) => {
    const length = 63 + 2;
    // A run of three or more bit-identical frames is a held placeholder: keep only its last frame.
    let i = 0;
    while (i < rows.length) {
      let j = i;
      while (j + 1 < rows.length && same(rows[j]!, rows[j + 1]!, s.wrist, length)) j += 1;
      if (j - i >= 2) for (let k = i; k < j; k += 1) present[h]![k] = false;
      i = j + 1;
    }
    // A single-frame jump far from both neighbours (which agree) is a tracking glitch.
    for (let k = 1; k < rows.length - 1; k += 1) {
      if (!present[h]![k - 1] || !present[h]![k] || !present[h]![k + 1]) continue;
      const w = (r: Float32Array): P => [r[s.wrist]!, r[s.wrist + 1]!];
      const a = w(rows[k - 1]!);
      const b = w(rows[k]!);
      const c = w(rows[k + 1]!);
      if (dist(a, b) > 0.15 && dist(b, c) > 0.15 && dist(a, c) < 0.08) {
        for (let x = s.wrist; x < s.wrist + length; x += 1) rows[k]![x] = (rows[k - 1]![x]! + rows[k + 1]![x]!) / 2;
      }
    }
  });
  return { rows, present };
}

function prepare(motion: SignMotion, from: number, to: number): Prepared {
  const { rows: all, present: allPresent } = cleanFrames(motion.frames);
  const end = Math.min(all.length - 1, to);
  const rows = all.slice(from, end + 1);
  const present = allPresent.map((p) => p.slice(from, end + 1));

  // Body frame: average shoulder midpoint and span.
  let ax = 0;
  let ay = 0;
  let span = 0;
  let n = 0;
  for (const f of rows) {
    const lx = f[POSE + 3] ?? 0;
    const rx = f[POSE + 6] ?? 0;
    if (!lx || !rx) continue;
    ax += (lx + rx) / 2;
    ay += ((f[POSE + 4] ?? 0) + (f[POSE + 7] ?? 0)) / 2;
    span += Math.hypot(lx - rx, (f[POSE + 4] ?? 0) - (f[POSE + 7] ?? 0));
    n += 1;
  }
  [ax, ay, span] = n ? [ax / n, ay / n, span / n] : [0.5, 0.5, 0.35];
  const k = SHOULDER_SPAN / span;
  const body = (x: number, y: number): P => [(x - ax) * k, (y - ay) * k];

  const posed = (f: Float32Array, h: number): HandPose => {
    const s = SLOTS[h]!;
    const [cx, cy] = body(f[s.wrist]!, f[s.wrist + 1]!);
    const ox = f[s.world]!;
    const oy = f[s.world + 1]!;
    const oz = f[s.world + 2]!;
    const pts: P[] = [];
    const z: number[] = [];
    for (let i = 0; i < 21; i += 1) {
      pts.push([cx + (f[s.world + i * 3]! - ox) * HAND_SCALE * SHAPE, cy + (f[s.world + i * 3 + 1]! - oy) * HAND_SCALE * SHAPE]);
      z.push(f[s.world + i * 3 + 2]! - oz);
    }
    const ex = f[POSE + s.elbow * 3] ?? 0;
    const ey = f[POSE + s.elbow * 3 + 1] ?? 0;
    return { pts, z, elbow: ex || ey ? body(ex, ey) : null, depth: f[POSE + s.poseWrist * 3 + 2] ?? 0, alpha: 1 };
  };

  let frames: Frame[] = rows.map((f, i) => [0, 1].map((h) => (present[h]![i] ? posed(f, h) : null)));

  // Light temporal smoothing (1-2-1) where both neighbours exist; removes tracker jitter.
  frames = frames.map((frame, i) =>
    frame.map((hand, h) => {
      const a = frames[i - 1]?.[h];
      const b = frames[i + 1]?.[h];
      if (!hand || !a || !b) return hand;
      const mix = (u: P, v: P, w: P): P => [(u[0] + 2 * v[0] + w[0]) / 4, (u[1] + 2 * v[1] + w[1]) / 4];
      return { ...hand, pts: hand.pts.map((p, j) => mix(a.pts[j]!, p, b.pts[j]!)), z: hand.z.map((zz, j) => (a.z[j]! + 2 * zz + b.z[j]!) / 4) };
    }),
  );

  // A hand that arrives or leaves mid-sign fades at its first or last real pose.
  for (let h = 0; h < 2; h += 1) {
    const first = frames.findIndex((f) => f[h]);
    if (first < 0) continue;
    let last = first;
    frames.forEach((f, i) => f[h] && (last = i));
    for (let i = 1; i <= FADE_FRAMES; i += 1) {
      const alpha = 1 - i / (FADE_FRAMES + 1);
      if (first - i >= 0 && !frames[first - i]![h]) frames[first - i]![h] = { ...frames[first]![h]!, alpha };
      if (last + i < frames.length && !frames[last + i]![h]) frames[last + i]![h] = { ...frames[last]![h]!, alpha };
    }
  }

  // Fit the hands' working space into the view, centred.
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const frame of frames)
    for (const hand of frame)
      for (const [x, y] of hand?.pts ?? []) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
  const scale = (VIEW - PAD * 2) / Math.max(maxX - minX, maxY - minY, 1);
  const offX = VIEW / 2 - ((minX + maxX) / 2) * scale;
  const offY = VIEW / 2 - ((minY + maxY) / 2) * scale;
  const fit = ([x, y]: P): P => [x * scale + offX, y * scale + offY];
  frames = frames.map((frame) => frame.map((hand) => (hand ? { ...hand, pts: hand.pts.map(fit), elbow: hand.elbow ? fit(hand.elbow) : null } : null)));

  // Constant drawing size per hand, from its true 3D length (foreshortening never thins it).
  const size = [0, 1].map((h) => {
    const lengths = rows
      .filter((_, i) => present[h]![i])
      .map((f) => {
        const w = SLOTS[h]!.world;
        return Math.hypot(f[w + 27]! - f[w]!, f[w + 28]! - f[w + 1]!, f[w + 29]! - f[w + 2]!);
      })
      .sort((a, b) => a - b);
    const median = lengths[Math.floor(lengths.length / 2)] ?? 0.085;
    return median * HAND_SCALE * SHAPE * scale;
  }) as [number, number];

  // The lead hand is the one that travels furthest; it carries the gold trail.
  const travel = [0, 1].map((h) => {
    let d = 0;
    for (let i = 1; i < frames.length; i += 1) {
      const a = frames[i - 1]![h];
      const b = frames[i]![h];
      if (a && b) d += dist(a.pts[8]!, b.pts[8]!);
    }
    return d;
  });
  return { frames, lead: travel[1]! > travel[0]! ? 1 : 0, size };
}

function lerpHand(a: HandPose | null, b: HandPose | null, t: number): HandPose | null {
  if (!a || !b) return t < 0.5 ? a : b;
  const l = (u: number, v: number) => u + (v - u) * t;
  return {
    pts: a.pts.map((p, i) => [l(p[0], b.pts[i]![0]), l(p[1], b.pts[i]![1])] as P),
    z: a.z.map((z, i) => l(z, b.z[i]!)),
    elbow: a.elbow && b.elbow ? [l(a.elbow[0], b.elbow[0]), l(a.elbow[1], b.elbow[1])] : (a.elbow ?? b.elbow),
    depth: l(a.depth, b.depth),
    alpha: l(a.alpha, b.alpha),
  };
}

function Hand({ hand, size, fill, gap, id }: { hand: HandPose; size: number; fill: string; gap: string; id: string }) {
  const p = hand.pts;
  const s = size;
  const outline = s * 0.075;
  const meanZ = (idx: number[]) => idx.reduce((sum, i) => sum + hand.z[i]!, 0) / idx.length;
  const parts = [
    { key: "palm", z: meanZ(PALM) + 0.004, palm: true, idx: PALM, w: 0.36 },
    ...FINGERS.map((f, i) => ({ key: `f${i}`, z: meanZ(f.idx.slice(1)), palm: false, ...f })),
  ].sort((a, b) => b.z - a.z);

  const palmD = `M${PALM.map((i) => `${p[i]![0].toFixed(2)} ${p[i]![1].toFixed(2)}`).join("L")}Z`;
  const forearm = hand.elbow ? ([p[0]![0] + (hand.elbow[0] - p[0]![0]) * 0.9, p[0]![1] + (hand.elbow[1] - p[0]![1]) * 0.9] as P) : null;

  return (
    <g opacity={hand.alpha}>
      {forearm && (
        <>
          <defs>
            <linearGradient id={`${id}-arm`} gradientUnits="userSpaceOnUse" x1={p[0]![0]} y1={p[0]![1]} x2={forearm[0]} y2={forearm[1]}>
              <stop offset="0" stopColor={fill} stopOpacity="0.45" />
              <stop offset="1" stopColor={fill} stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1={p[0]![0]} y1={p[0]![1]} x2={forearm[0]} y2={forearm[1]} stroke={`url(#${id}-arm)`} strokeWidth={s * 0.6} strokeLinecap="round" />
        </>
      )}
      {parts.map((part) =>
        part.palm ? (
          <g key={part.key} strokeLinejoin="round">
            <path d={palmD} fill={gap} stroke={gap} strokeWidth={s * part.w + outline * 2} />
            <path d={palmD} fill={fill} stroke={fill} strokeWidth={s * part.w} />
          </g>
        ) : (
          <g key={part.key} strokeLinecap="round">
            {[gap, fill].map((colour, layer) =>
              part.idx.slice(0, -1).map((a, j) => {
                const b = part.idx[j + 1]!;
                const width = s * part.w * (1 - j * 0.1) + (layer === 0 ? outline * 2 : 0);
                return <line key={`${layer}-${a}`} x1={p[a]![0]} y1={p[a]![1]} x2={p[b]![0]} y2={p[b]![1]} stroke={colour} strokeWidth={width} />;
              }),
            )}
          </g>
        ),
      )}
    </g>
  );
}

interface SigningHandsProps {
  gloss: string;
  /** Start the motion. Before that the first pose is held. */
  playing: boolean;
  speed?: number;
  /** Play only these frames of the recording (the sign without its rest positions). */
  from?: number;
  to?: number;
  onReady?: (ok: boolean) => void;
  onEnd?: () => void;
  className?: string;
  /** Background colour, used for the cut-paper gaps between overlapping parts. */
  gap?: string;
}

export function SigningHands({ gloss, playing, speed = 1, from = 0, to = Infinity, onReady, onEnd, className, gap = "#0D21A1" }: SigningHandsProps) {
  const [data, setData] = useState<Prepared | null>(null);
  const [{ pos, trail }, setPlayhead] = useState<{ pos: number; trail: P[] }>({ pos: 0, trail: [] });
  const cb = useRef({ onReady, onEnd });
  useEffect(() => {
    cb.current = { onReady, onEnd };
  });

  useEffect(() => {
    let live = true;
    void loadSign(gloss).then((motion) => {
      if (!live) return;
      const ok = !!motion && motion.frames.length > 1;
      if (ok) setData(prepare(motion, from, to));
      cb.current.onReady?.(ok);
    });
    return () => {
      live = false;
    };
  }, [gloss, from, to]);

  useEffect(() => {
    if (!data || !playing) return;
    const last = data.frames.length - 1;
    const fps = 15 * speed;
    let raf = 0;
    const start = performance.now();
    const tipAt = (at: number): P | null => {
      const i = Math.floor(at);
      const t = at - i;
      const a = data.frames[i]?.[data.lead];
      const b = data.frames[Math.min(last, i + 1)]?.[data.lead];
      const hand = lerpHand(a ?? null, b ?? null, t);
      return hand ? hand.pts[8]! : null;
    };
    const tick = (now: number) => {
      const next = Math.min(last, ((now - start) / 1000) * fps);
      const tip = tipAt(next);
      setPlayhead((prev) => {
        const end = prev.trail[prev.trail.length - 1];
        const trail = !tip || (end && dist(end, tip) < 0.25) ? prev.trail : [...prev.trail, tip].slice(-TRAIL);
        return { pos: next, trail };
      });
      if (next >= last) {
        cb.current.onEnd?.();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [data, playing, speed]);

  const hands = useMemo(() => {
    if (!data) return [];
    const i = Math.floor(pos);
    const t = pos - i;
    const a = data.frames[i]!;
    const b = data.frames[Math.min(data.frames.length - 1, i + 1)]!;
    return [0, 1]
      .map((h) => ({ h, pose: lerpHand(a[h] ?? null, b[h] ?? null, t) }))
      .filter((x): x is { h: number; pose: HandPose } => x.pose !== null)
      .sort((x, y) => y.pose.depth - x.pose.depth);
  }, [data, pos]);

  return (
    <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className={cn("overflow-visible", className)} aria-hidden>
      {/* Gold trail behind the lead hand's index fingertip */}
      <g fill="none" strokeLinecap="round">
        {trail.slice(1).map((pt, i) => (
          <line
            key={i}
            x1={trail[i]![0]}
            y1={trail[i]![1]}
            x2={pt[0]}
            y2={pt[1]}
            stroke="#EEC643"
            strokeOpacity={((i + 1) / trail.length) * 0.9}
            strokeWidth={0.4 + ((i + 1) / trail.length) * 1.4}
          />
        ))}
      </g>
      {hands.map(({ h, pose }) => (
        <Hand key={h} id={`hand-${h}`} hand={pose} size={data!.size[h]} gap={gap} fill={h === data?.lead ? "#F7FAFF" : "#C7D9FF"} />
      ))}
    </svg>
  );
}
