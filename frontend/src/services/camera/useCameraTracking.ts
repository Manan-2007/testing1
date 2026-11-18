/**
 * Camera capture on the main thread, MediaPipe hand + pose tracking in a Web
 * Worker, both entirely on this device. Adapted from VOX's useHandTracking.
 *
 * Differences from VOX, all about consent and clarity:
 *   - nothing starts until the user presses Start (VOX opened the camera on load)
 *   - the tracker and its models are only downloaded on first start
 *   - every failure has its own status: denied, no camera, camera busy, error
 *   - frames are forwarded to the recognition service only while `sending`
 *
 * Video frames never leave the browser. Only the 141 landmark numbers per
 * frame are handed to `onVector`, at the 15 fps the recogniser was trained on.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import type { WorkerInMessage, WorkerOutMessage } from "@/engine/workers/mediapipe.worker";

const DETECT_INTERVAL_MS = 1000 / 30;
const SEND_INTERVAL_MS = 1000 / 15;
const QUALITY_PUSH_MS = 200;

export type CameraStatus =
  | "inactive"
  | "requesting"
  | "running"
  | "denied"
  | "unavailable"
  | "in-use"
  | "error";

export type TrackerState = "idle" | "loading" | "ready" | "error";
export type PermissionHint = "granted" | "denied" | "prompt" | "unknown";

export interface FrameQuality {
  hands: number;
  body: boolean;
  /** A hand has been missing for several consecutive frames. */
  losingHand: boolean;
}

const IDLE_QUALITY: FrameQuality = { hands: 0, body: false, losingHand: false };

export interface CameraTracking {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  status: CameraStatus;
  tracker: TrackerState;
  errorDetail: string | null;
  permission: PermissionHint;
  delegate: "GPU" | "CPU" | null;
  fps: number;
  quality: FrameQuality;
  devices: MediaDeviceInfo[];
  start: () => void;
  stop: () => void;
}

interface Options {
  onVector: (vector: Float32Array) => void;
  /** Forward landmark vectors to `onVector`. */
  sending: boolean;
  showLandmarks: boolean;
  cameraId: string | null;
  /** Called when a saved camera is no longer available. */
  onCameraMissing: () => void;
}

const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];
/** Left and right hand, in Parlance royal blue and gold. */
const HAND_COLOURS = ["#0D21A1", "#EEC643"];

export function useCameraTracking({ onVector, sending, showLandmarks, cameraId, onCameraMissing }: Options): CameraTracking {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef(false);
  const lastSentRef = useRef(0);

  const onVectorRef = useRef(onVector);
  onVectorRef.current = onVector;
  const sendingRef = useRef(sending);
  sendingRef.current = sending;
  const landmarksRef = useRef(showLandmarks);
  landmarksRef.current = showLandmarks;
  const missingRef = useRef(onCameraMissing);
  missingRef.current = onCameraMissing;

  const [wantOn, setWantOn] = useState(false);
  const [status, setStatus] = useState<CameraStatus>("inactive");
  const [tracker, setTracker] = useState<TrackerState>("idle");
  const trackerReadyRef = useRef(false);
  const [errorDetail, setErrorDetail] = useState<string | null>(null);
  const [permission, setPermission] = useState<PermissionHint>("unknown");
  const [delegate, setDelegate] = useState<"GPU" | "CPU" | null>(null);
  const [fps, setFps] = useState(0);
  const [quality, setQuality] = useState<FrameQuality>(IDLE_QUALITY);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const latestQuality = useRef<FrameQuality>(IDLE_QUALITY);
  const fpsWindow = useRef({ start: 0, count: 0 });

  /* ------------------------------------------- permission, where readable -- */
  useEffect(() => {
    let status: PermissionStatus | null = null;
    const sync = () => status && setPermission(status.state as PermissionHint);
    navigator.permissions
      ?.query({ name: "camera" as PermissionName })
      .then((result) => {
        status = result;
        sync();
        result.addEventListener("change", sync);
      })
      .catch(() => setPermission("unknown"));
    return () => status?.removeEventListener("change", sync);
  }, []);

  /* --------------------------------------------- worker, created lazily -- */
  const ensureWorker = useCallback(() => {
    if (workerRef.current) return;
    setTracker("loading");
    const worker = new Worker(new URL("../../engine/workers/mediapipe.worker.ts", import.meta.url), {
      type: "module",
    });
    workerRef.current = worker;

    worker.onerror = (event) => {
      setTracker("error");
      setErrorDetail(event.message || "The hand tracker failed to start.");
    };

    worker.onmessage = (event: MessageEvent<WorkerOutMessage>) => {
      const msg = event.data;
      if (msg.type === "ready") {
        trackerReadyRef.current = true;
        setDelegate(msg.delegate);
        setTracker("ready");
        return;
      }
      if (msg.type === "error") {
        setTracker("error");
        setErrorDetail(msg.message);
        return;
      }

      pendingRef.current = false;
      const now = performance.now();
      const w = fpsWindow.current;
      w.count += 1;
      if (now - w.start >= 1000) {
        setFps(Math.round((w.count * 1000) / (now - w.start)));
        w.start = now;
        w.count = 0;
      }

      drawOverlay(canvasRef.current, landmarksRef.current ? msg.landmarks : [], msg.blocks);
      latestQuality.current = {
        hands: msg.hands,
        body: msg.body,
        losingHand: msg.hands > 0 && Math.max(...msg.gaps) > 6,
      };

      // Only frames with a body to anchor on, and only at the training rate.
      if (sendingRef.current && msg.body && now - lastSentRef.current >= SEND_INTERVAL_MS) {
        lastSentRef.current = now;
        onVectorRef.current(msg.vector);
      }
    };

    const init: WorkerInMessage = {
      type: "init",
      wasmPath: `${location.origin}/mediapipe/wasm`,
      modelPath: `${location.origin}/models/hand_landmarker.task`,
      poseModelPath: `${location.origin}/models/pose_landmarker_lite.task`,
    };
    worker.postMessage(init);
  }, []);

  useEffect(
    () => () => {
      const worker = workerRef.current;
      if (worker) {
        worker.postMessage({ type: "close" } satisfies WorkerInMessage);
        worker.terminate();
      }
      workerRef.current = null;
    },
    [],
  );

  /* ------------------------------------- throttled quality for the UI -- */
  useEffect(() => {
    if (status !== "running") {
      setQuality(IDLE_QUALITY);
      return;
    }
    const timer = window.setInterval(() => {
      const next = latestQuality.current;
      setQuality((prev) =>
        prev.hands === next.hands && prev.body === next.body && prev.losingHand === next.losingHand ? prev : next,
      );
    }, QUALITY_PUSH_MS);
    return () => window.clearInterval(timer);
  }, [status]);

  /* --------------------------------------------- camera + capture loop -- */
  useEffect(() => {
    if (!wantOn) return;

    let disposed = false;
    let stream: MediaStream | null = null;
    let raf = 0;
    const videoNode = videoRef.current;
    const canvasNode = canvasRef.current;
    workerRef.current?.postMessage({ type: "reset" } satisfies WorkerInMessage);

    const run = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus("unavailable");
        setErrorDetail("This browser does not allow camera access on this page.");
        setWantOn(false);
        return;
      }
      setStatus("requesting");
      setErrorDetail(null);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: cameraId
            ? { deviceId: { exact: cameraId }, width: { ideal: 1280 }, height: { ideal: 720 } }
            : { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
      } catch (error) {
        if (disposed) return;
        const name = error instanceof DOMException ? error.name : "";
        if (cameraId && (name === "OverconstrainedError" || name === "NotFoundError")) {
          // The saved camera is gone; fall back to the default one.
          missingRef.current();
          return;
        }
        setStatus(
          name === "NotAllowedError" || name === "SecurityError"
            ? "denied"
            : name === "NotFoundError" || name === "OverconstrainedError"
              ? "unavailable"
              : name === "NotReadableError" || name === "AbortError"
                ? "in-use"
                : "error",
        );
        setErrorDetail(error instanceof Error ? error.message : String(error));
        setWantOn(false);
        return;
      }
      if (disposed) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      setPermission("granted");
      navigator.mediaDevices
        .enumerateDevices()
        .then((all) => !disposed && setDevices(all.filter((d) => d.kind === "videoinput")))
        .catch(() => {});

      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      try {
        await video.play();
      } catch {
        /* autoplay of a muted inline video should not fail; keep going */
      }
      if (disposed) return;
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
      }
      setStatus("running");
      fpsWindow.current = { start: performance.now(), count: 0 };

      let lastFrame = 0;
      let lastTimestamp = -1;
      const tick = () => {
        raf = requestAnimationFrame(tick);
        if (disposed || !trackerReadyRef.current) return;
        const now = performance.now();
        if (now - lastFrame < DETECT_INTERVAL_MS || pendingRef.current) return;
        const v = videoRef.current;
        if (!v || v.readyState < 2) return;
        lastFrame = now;
        let ts = Math.round(now);
        if (ts <= lastTimestamp) ts = lastTimestamp + 1;
        lastTimestamp = ts;
        pendingRef.current = true;
        createImageBitmap(v)
          .then((bitmap) => {
            const worker = workerRef.current;
            if (disposed || !worker) {
              bitmap.close();
              pendingRef.current = false;
              return;
            }
            worker.postMessage({ type: "frame", bitmap, timestamp: ts } satisfies WorkerInMessage, [bitmap]);
          })
          .catch(() => {
            pendingRef.current = false;
          });
      };
      tick();
    };

    void run();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      pendingRef.current = false;
      stream?.getTracks().forEach((track) => track.stop());
      if (videoNode) videoNode.srcObject = null;
      drawOverlay(canvasNode, [], []);
      setFps(0);
    };
  }, [wantOn, cameraId]);

  const start = useCallback(() => {
    ensureWorker();
    setErrorDetail(null);
    setWantOn(true);
  }, [ensureWorker]);

  const stop = useCallback(() => {
    setWantOn(false);
    setStatus("inactive");
  }, []);

  return {
    videoRef,
    canvasRef,
    status,
    tracker,
    errorDetail,
    permission,
    delegate,
    fps,
    quality,
    devices,
    start,
    stop,
  };
}

function drawOverlay(canvas: HTMLCanvasElement | null, hands: { x: number; y: number }[][], blocks: number[]): void {
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  hands.forEach((points, i) => {
    const colour = HAND_COLOURS[blocks[i] ?? 0] ?? "#0D21A1";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(3, width / 300);
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.beginPath();
    for (const [from, to] of HAND_CONNECTIONS) {
      const a = points[from];
      const b = points[to];
      if (!a || !b) continue;
      ctx.moveTo(a.x * width, a.y * height);
      ctx.lineTo(b.x * width, b.y * height);
    }
    ctx.stroke();
    ctx.lineWidth = Math.max(2, width / 480);
    ctx.strokeStyle = colour;
    ctx.stroke();
    const radius = Math.max(2.5, width / 360);
    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x * width, point.y * height, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = colour;
      ctx.stroke();
    }
  });
}
