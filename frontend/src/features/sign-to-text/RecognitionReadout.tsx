import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, CircleHelp, CirclePause, Hand, Loader2, PlugZap, RefreshCw, ScanLine, ServerOff, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";
import type { CameraTracking } from "@/services/camera/useCameraTracking";
import type { AcceptedSign, RecognitionService, RejectReason } from "@/services/recognition/useRecognitionService";
import { glossLabel, trustOf, type RecognitionMetrics, type SignLibrary } from "@/services/signs/library";

interface ReadoutProps {
  camera: CameraTracking;
  service: RecognitionService;
  recognising: boolean;
  accepted: AcceptedSign | null;
  threshold: number;
  metrics: RecognitionMetrics;
  library: SignLibrary;
}

const REASON_TEXT: Record<Exclude<RejectReason, "resting">, string> = {
  "low-confidence": "Below the confidence threshold, so nothing is output.",
  unverified: "This sign isn't verified for recognition yet, so nothing is output.",
  unstable: "Not held steadily enough to be sure. Hold the sign a moment longer.",
  "already-emitted": "Already added. Lower your hands briefly before repeating a sign.",
};

type Tone = "neutral" | "success" | "warning" | "danger" | "muted";

const TONE: Record<Tone, { bar: string; icon: string }> = {
  neutral: { bar: "border-royal", icon: "text-royal" },
  success: { bar: "border-success", icon: "text-success" },
  warning: { bar: "border-gold", icon: "text-gold-800" },
  danger: { bar: "border-danger", icon: "text-danger" },
  muted: { bar: "border-line-strong", icon: "text-ink-3" },
};

function State({ icon, title, children, tone = "neutral", action }: { icon: ReactNode; title: ReactNode; children?: ReactNode; tone?: Tone; action?: ReactNode }) {
  return (
    <div className={cn("min-h-[8.5rem] border-l-2 pl-4", TONE[tone].bar)}>
      <p className={cn("flex items-center gap-2 text-[0.8125rem] font-medium", TONE[tone].icon)}>
        <span className="[&_svg]:size-4">{icon}</span>
      </p>
      <div className="mt-1.5 text-xl leading-7 font-semibold tracking-[-0.02em] text-navy">{title}</div>
      {children && <div className="mt-1.5 text-[0.9375rem] leading-6 text-ink-2">{children}</div>}
      {action && <div className="mt-3 flex flex-wrap items-center gap-2">{action}</div>}
    </div>
  );
}

function Meter({ value, threshold, label }: { value: number; threshold: number; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs font-medium text-ink-3">
        <span>{label}</span>
        <span className="tabular-nums">{pct}%</span>
      </div>
      <div
        className="relative mt-1.5 h-1.5 rounded-full bg-line-soft"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className={cn("absolute inset-y-0 left-0 rounded-full", value >= threshold ? "bg-success" : "bg-ink-3/50")} style={{ width: `${pct}%` }} />
        <div aria-hidden className="absolute -top-1 -bottom-1 w-0.5 bg-navy" style={{ left: `${Math.round(threshold * 100)}%` }} />
      </div>
      <p className="mt-1 text-xs text-ink-3">Line marks the {Math.round(threshold * 100)}% threshold</p>
    </div>
  );
}

export function ServiceStatus({ service }: { service: RecognitionService }) {
  const c = service.connection;
  const view =
    c === "open"
      ? { dot: "bg-success", text: "Recognition service connected" }
      : c === "connecting"
        ? { dot: "bg-royal animate-pulse", text: "Connecting to the recognition service" }
        : c === "no-model"
          ? { dot: "bg-gold", text: "Service running without a model" }
          : { dot: "bg-danger", text: "Recognition service offline" };
  return (
    <p className="flex items-center gap-2 text-[0.8125rem] font-medium text-ink-2" role="status">
      <span aria-hidden className={cn("size-2 rounded-full", view.dot)} />
      {view.text}
    </p>
  );
}

export function RecognitionReadout({ camera, service, recognising, accepted, threshold, metrics, library }: ReadoutProps) {
  if (accepted) {
    const verified = trustOf(accepted.word, metrics) === "verified";
    return (
      <State tone="success" icon={<BadgeCheck />} title={<span className="text-[2.75rem] leading-none tracking-[-0.03em] uppercase">{glossLabel(accepted.word, library)}</span>}>
        <span className="font-medium text-success">Recognised and added{verified ? " · verified sign" : ""}</span>
        <Meter value={accepted.confidence} threshold={threshold} label="Confidence" />
      </State>
    );
  }
  if (service.connection === "offline" || service.connection === "idle") {
    return (
      <State
        tone="danger"
        icon={<ServerOff />}
        title="Recognition service offline"
        action={
          <>
            <button
              type="button"
              onClick={service.retry}
              className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line-strong bg-surface px-3 text-[0.8125rem] font-medium text-navy hover:border-navy/40"
            >
              <RefreshCw className="size-3.5" aria-hidden /> {service.gaveUp ? "Try again" : "Retry now"}
            </button>
            <Link to="/app/help#service" className="inline-flex h-9 items-center px-1 text-[0.8125rem] font-medium text-royal hover:underline">
              How to start it
            </Link>
          </>
        }
      >
        The camera and hand tracking still work here, but signs can&rsquo;t be interpreted until the service is running.
        {!service.gaveUp && <span className="mt-1 block text-xs text-ink-3">Retrying automatically…</span>}
      </State>
    );
  }
  if (service.connection === "connecting") {
    return <State tone="muted" icon={<Loader2 className="animate-spin" />} title="Connecting…" />;
  }
  if (service.connection === "no-model") {
    return (
      <State tone="warning" icon={<PlugZap />} title="No trained model loaded">
        The service is running but cannot recognise signs until a model is added to its model folder.
      </State>
    );
  }
  if (camera.status !== "running") {
    return (
      <State tone="muted" icon={<ScanLine />} title="Start the camera to begin">
        Sign one word at a time. Recognised signs build a sentence below.
      </State>
    );
  }
  if (!recognising) {
    return (
      <State tone="muted" icon={<CirclePause />} title="Recognition paused">
        The camera is on, but nothing is being sent for recognition.
      </State>
    );
  }
  if (!camera.quality.body) {
    return (
      <State tone="warning" icon={<UserRound />} title="Step back into frame">
        Recognition needs your head and both shoulders in view.
      </State>
    );
  }
  if (camera.quality.hands === 0) {
    return (
      <State tone="muted" icon={<Hand />} title="Waiting for a sign">
        Raise your hands into the frame and sign one word.
      </State>
    );
  }
  if (service.buffered) {
    const pct = Math.round((service.buffered.have / Math.max(1, service.buffered.need)) * 100);
    return (
      <State tone="neutral" icon={<Loader2 className="animate-spin" />} title="Watching your signing…">
        Collecting two seconds of movement before deciding.
        <span className="mt-3 block h-1 overflow-hidden rounded-full bg-line-soft" aria-hidden>
          <span className="block h-full rounded-full bg-royal transition-[width]" style={{ width: `${pct}%` }} />
        </span>
      </State>
    );
  }
  const candidate = service.candidate;
  if (candidate && candidate.reason !== "resting") {
    return (
      <State tone="warning" icon={<CircleHelp />} title="Not recognised">
        {REASON_TEXT[candidate.reason]}
        <span className="mt-2 block text-xs text-ink-3">
          Closest guess, not accepted: <span className="font-semibold text-ink-2">{glossLabel(candidate.word, library)}</span>
        </span>
        <Meter value={candidate.confidence} threshold={threshold} label="Closest guess" />
      </State>
    );
  }
  return (
    <State tone="neutral" icon={<Hand />} title="No sign detected">
      Hands are in view but no sign is being made. Parlance stays silent rather than guess.
    </State>
  );
}
