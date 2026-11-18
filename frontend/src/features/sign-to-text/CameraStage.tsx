/**
 * The Sign → Text camera stage: a large viewport with minimal overlays, live
 * subtitles for accepted signs, and a floating transport for camera controls.
 */
import type { ReactNode } from "react";
import { Camera, CameraOff, Grid2x2, Loader2, Lock, Power, ShieldAlert, Spline, VideoOff } from "lucide-react";
import { Arcs } from "@/components/brand/Arcs";
import { cn } from "@/lib/cn";
import type { CameraTracking } from "@/services/camera/useCameraTracking";
import { FramingGuide } from "./FramingGuide";

interface CameraStageProps {
  camera: CameraTracking;
  recognising: boolean;
  onRecognising: (on: boolean) => void;
  recognitionAvailable: boolean;
  cameraId: string | null;
  onCameraId: (id: string | null) => void;
  showLandmarks: boolean;
  onShowLandmarks: (on: boolean) => void;
  showGuide: boolean;
  onShowGuide: (on: boolean) => void;
  serviceHost: string;
  /** Labels of the signs accepted in the sentence being built. */
  subtitles: string[];
  /** The sign just accepted, briefly. */
  flash: string | null;
}

function ToolButton({ label, pressed, onClick, children }: { label: string; pressed?: boolean; onClick: () => void; children: ReactNode }) {
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

export function CameraStage({
  camera,
  recognising,
  onRecognising,
  recognitionAvailable,
  cameraId,
  onCameraId,
  showLandmarks,
  onShowLandmarks,
  showGuide,
  onShowGuide,
  serviceHost,
  subtitles,
  flash,
}: CameraStageProps) {
  const running = camera.status === "running";
  const { quality } = camera;
  const hint = !running
    ? null
    : camera.tracker === "loading"
      ? { tone: "busy", text: "Starting the hand tracker…" }
      : camera.tracker === "error"
        ? { tone: "error", text: "Hand tracking failed to start" }
        : !quality.body
          ? { tone: "warn", text: "Step back: head and both shoulders in frame" }
          : quality.hands === 0
            ? { tone: "warn", text: "Raise your hands into the frame" }
            : quality.losingHand
              ? { tone: "warn", text: "Losing a hand: add light, or move away from the background" }
              : { tone: "ok", text: quality.hands === 2 ? "Tracking both hands" : "Tracking one hand" };

  return (
    <section aria-label="Camera" className="relative isolate flex h-full min-h-[28rem] flex-col bg-[linear-gradient(180deg,var(--color-stage-2),var(--color-stage))]">
      {/* top bar */}
      <div className="flex items-start justify-between gap-3 p-3 sm:p-4">
        <p className="flex items-center gap-2 rounded-sm bg-surface/90 px-3 py-2 text-[0.8125rem] font-medium text-ink-2">
          <span aria-hidden className={cn("size-2 rounded-full", running ? "animate-pulse bg-danger" : "bg-line-strong")} />
          {running ? "Camera on" : "Camera off"}
          {running && camera.fps > 0 && <span className="text-ink-3">· {camera.fps} fps on-device</span>}
        </p>
        <div className="flex items-center gap-0.5 rounded-md border border-line bg-surface/95 p-1" role="toolbar" aria-label="Camera overlays">
          <ToolButton label={showLandmarks ? "Hide hand landmarks" : "Show hand landmarks"} pressed={showLandmarks} onClick={() => onShowLandmarks(!showLandmarks)}>
            <Spline aria-hidden />
          </ToolButton>
          <ToolButton label={showGuide ? "Hide framing guide" : "Show framing guide"} pressed={showGuide} onClick={() => onShowGuide(!showGuide)}>
            <Grid2x2 aria-hidden />
          </ToolButton>
        </div>
      </div>

      {/* viewport */}
      <div className="flex min-h-0 flex-1 items-center justify-center px-3 sm:px-6">
        <div className="relative aspect-[3/4] w-full max-w-[min(100%,calc((100dvh-15rem)*16/9))] overflow-hidden rounded-lg bg-[#dde2ef] sm:aspect-video">
          <video
            ref={camera.videoRef}
            playsInline
            muted
            aria-label="Your camera preview, mirrored"
            className={cn("absolute inset-0 h-full w-full -scale-x-100 object-cover", !running && "invisible")}
          />
          <canvas
            ref={camera.canvasRef}
            aria-hidden
            className={cn("pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover", !running && "invisible")}
          />
          {running && showGuide && <FramingGuide highlight={!quality.body ? "body" : quality.hands === 0 ? "hands" : "ok"} />}

          {running && hint && (
            <p
              role="status"
              className={cn(
                "absolute top-3 left-3 flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-sm bg-surface/95 px-3 py-2 text-[0.8125rem] font-medium",
                hint.tone === "warn" ? "text-gold-800" : hint.tone === "error" ? "text-danger" : hint.tone === "ok" ? "text-success" : "text-royal",
              )}
            >
              {hint.tone === "busy" ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <span aria-hidden className={cn("size-2 rounded-full", hint.tone === "warn" ? "bg-gold" : hint.tone === "error" ? "bg-danger" : "bg-success")} />
              )}
              {hint.text}
            </p>
          )}

          {/* live subtitles */}
          {running && (subtitles.length > 0 || flash) && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-4 sm:p-6" aria-hidden>
              <p className="max-w-full rounded-md bg-navy/80 px-4 py-2.5 text-center text-xl leading-snug font-semibold tracking-[0.02em] text-white uppercase backdrop-blur-sm sm:text-[1.75rem]">
                {subtitles.map((w, i) => (
                  <span key={`${w}-${i}`} className={cn("mx-1.5 inline-block", i === subtitles.length - 1 && flash ? "text-gold" : "")}>
                    {w}
                  </span>
                ))}
              </p>
            </div>
          )}

          {!running && <CameraState camera={camera} />}
        </div>
      </div>

      {/* transport */}
      <div className="p-3 sm:p-4">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 rounded-lg bg-navy p-2 text-white shadow-[var(--shadow-float)] sm:flex-nowrap sm:gap-3">
          {running ? (
            <button
              type="button"
              onClick={camera.stop}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-white/10 px-4 text-[0.9375rem] font-medium text-white transition-colors hover:bg-white/15"
            >
              <CameraOff className="size-[1.125rem]" aria-hidden /> Stop camera
            </button>
          ) : (
            <button
              type="button"
              onClick={camera.start}
              disabled={camera.status === "requesting"}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-md bg-white px-4 text-[0.9375rem] font-medium text-navy transition-colors hover:bg-brand-50 disabled:opacity-60"
            >
              {camera.status === "requesting" ? <Loader2 className="size-[1.125rem] animate-spin" aria-hidden /> : <Power className="size-[1.125rem]" aria-hidden />}
              {camera.status === "requesting" ? "Waiting for permission…" : "Start camera"}
            </button>
          )}

          <button
            type="button"
            role="switch"
            aria-checked={recognising && recognitionAvailable}
            disabled={!recognitionAvailable}
            onClick={() => onRecognising(!recognising)}
            className="inline-flex h-11 shrink-0 items-center gap-2.5 rounded-md px-3 text-[0.9375rem] font-medium text-white/90 transition-colors hover:bg-white/10 disabled:opacity-50"
          >
            <span
              aria-hidden
              className={cn(
                "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                recognising && recognitionAvailable ? "bg-gold" : "bg-white/25",
              )}
            >
              <span
                className={cn(
                  "absolute size-4 rounded-full bg-white transition-transform",
                  recognising && recognitionAvailable ? "translate-x-[1.125rem] bg-navy" : "translate-x-0.5",
                )}
              />
            </span>
            {!recognitionAvailable ? "Recognition unavailable" : recognising ? "Recognising" : "Paused"}
          </button>

          <label className="flex min-w-0 flex-1 basis-full items-center gap-2 text-[0.8125rem] text-white/70 sm:basis-auto">
            <Camera className="size-4 shrink-0" aria-hidden />
            <span className="sr-only">Camera</span>
            <select
              value={cameraId ?? ""}
              onChange={(e) => onCameraId(e.target.value || null)}
              disabled={camera.devices.length === 0}
              className="h-11 w-full min-w-0 rounded-md bg-white/10 px-3 text-[0.875rem] text-white disabled:opacity-60 [&>option]:text-ink"
            >
              <option value="">Default camera</option>
              {camera.devices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="mx-auto mt-2.5 flex max-w-3xl items-start justify-center gap-1.5 text-center text-xs leading-5 text-ink-3">
          <Lock className="mt-0.5 size-3 shrink-0 text-royal" aria-hidden />
          <span>
            Video never leaves this device and is never recorded. Only hand and shoulder positions are sent to{" "}
            <span className="font-medium text-ink-2">{serviceHost}</span>.
          </span>
        </p>
      </div>
    </section>
  );
}

function StateBody({ icon, title, children, tone = "neutral" }: { icon: ReactNode; title: string; children?: ReactNode; tone?: "neutral" | "warning" | "danger" }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      <span
        className={cn(
          "inline-flex size-14 items-center justify-center rounded-full border bg-surface [&_svg]:size-6",
          tone === "danger" && "border-danger/30 text-danger",
          tone === "warning" && "border-gold-300 text-gold-800",
          tone === "neutral" && "border-line text-royal",
        )}
      >
        {icon}
      </span>
      <p className="mt-4 text-xl font-semibold tracking-[-0.02em] text-navy" role="status">
        {title}
      </p>
      {children && <div className="mt-2 max-w-md text-[0.9375rem] leading-6 text-ink-2">{children}</div>}
    </div>
  );
}

function CameraState({ camera }: { camera: CameraTracking }) {
  switch (camera.status) {
    case "requesting":
      return (
        <StateBody icon={<Loader2 className="animate-spin" />} title="Waiting for camera permission">
          Your browser is asking whether Parlance may use the camera. Choose Allow to continue.
        </StateBody>
      );
    case "denied":
      return (
        <StateBody icon={<ShieldAlert />} title="Camera access is blocked" tone="danger">
          <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-left">
            <li>Open the site settings icon in your browser&rsquo;s address bar.</li>
            <li>Set Camera to Allow for this site.</li>
            <li>Press Start camera again.</li>
          </ol>
        </StateBody>
      );
    case "unavailable":
      return (
        <StateBody icon={<VideoOff />} title="No camera available" tone="warning">
          {camera.errorDetail ?? "Connect a camera, or check that your system settings allow this browser to use it."}
        </StateBody>
      );
    case "in-use":
      return (
        <StateBody icon={<VideoOff />} title="The camera is in use elsewhere" tone="warning">
          Another app or tab is using the camera. Close it, then press Start camera again.
        </StateBody>
      );
    case "error":
      return (
        <StateBody icon={<VideoOff />} title="The camera couldn't start" tone="danger">
          {camera.errorDetail ?? "Try again, or choose a different camera."}
        </StateBody>
      );
    default:
      if (camera.permission === "denied") {
        return (
          <StateBody icon={<ShieldAlert />} title="Camera access is blocked for this site" tone="danger">
            Allow the camera in your browser&rsquo;s site settings, then press Start camera.
          </StateBody>
        );
      }
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <div className="relative size-40 sm:size-48">
            <Arcs className="absolute inset-0" />
            <svg viewBox="0 0 200 220" className="absolute inset-x-[22%] bottom-[16%] text-brand-200" aria-hidden>
              <ellipse cx="100" cy="64" rx="30" ry="36" fill="currentColor" />
              <path d="M34 220c2-62 28-94 66-94s64 32 66 94z" fill="currentColor" />
            </svg>
          </div>
          <p className="mt-5 text-xl font-semibold tracking-[-0.02em] text-navy sm:text-2xl">Sign to the camera</p>
          <p className="mt-2 max-w-sm text-[0.9375rem] leading-6 text-ink-2">
            Start the camera, stand about an arm&rsquo;s length back, and sign one word at a time.
          </p>
        </div>
      );
  }
}
