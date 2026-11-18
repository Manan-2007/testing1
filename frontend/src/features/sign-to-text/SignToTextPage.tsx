import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LifeBuoy, ShieldCheck } from "lucide-react";
import { announce } from "@/components/ui/Toaster";
import { toEnglish } from "@/engine/isl/grammar";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { createId } from "@/lib/id";
import { useCameraTracking } from "@/services/camera/useCameraTracking";
import { useRecognitionService, type AcceptedSign } from "@/services/recognition/useRecognitionService";
import { glossLabel, useRecognitionMetrics, useSignLibrary } from "@/services/signs/library";
import { useSpeechOutput } from "@/services/speech/useSpeechOutput";
import { useHistory } from "@/stores/history";
import { useSettings } from "@/stores/settings";
import { CameraStage } from "./CameraStage";
import { RecognitionReadout, ServiceStatus } from "./RecognitionReadout";
import { SentencePanel, Transcript, type BuiltWord, type FinishedSentence } from "./SentencePanel";

/** A signed sentence counts as finished after this long without a new sign. */
const SENTENCE_PAUSE_MS = 3500;
/** How long an accepted sign stays in the headline. */
const ACCEPTED_HOLD_MS = 2200;

function hostOf(url: string): string {
  try {
    return new URL(url).host || url;
  } catch {
    return url;
  }
}

export function SignToTextPage() {
  useDocumentTitle("Sign to text");
  const library = useSignLibrary();
  const metrics = useRecognitionMetrics();
  const speech = useSpeechOutput();
  const addHistory = useHistory((s) => s.add);

  const settings = useSettings();
  const { set } = settings;

  const [recognising, setRecognising] = useState(true);
  const [words, setWords] = useState<BuiltWord[]>([]);
  const [log, setLog] = useState<FinishedSentence[]>([]);
  const [accepted, setAccepted] = useState<AcceptedSign | null>(null);

  const wordsRef = useRef(words);
  wordsRef.current = words;
  const pauseTimer = useRef<number | undefined>(undefined);
  const acceptedTimer = useRef<number | undefined>(undefined);
  const voiceRef = useRef(settings.voiceOutput);
  voiceRef.current = settings.voiceOutput;

  const english = useMemo(() => (words.length ? toEnglish(words.map((w) => w.word)) : ""), [words]);

  const finishSentence = useCallback(() => {
    window.clearTimeout(pauseTimer.current);
    const current = wordsRef.current;
    if (current.length === 0) return;
    const glosses = current.map((w) => w.word);
    const text = toEnglish(glosses) || glosses.join(" ");
    const gloss = glosses.map((g) => glossLabel(g, library)).join(" ");
    setLog((prev) => [{ id: createId(), text, gloss, at: Date.now() }, ...prev]);
    addHistory({
      direction: "sign-to-text",
      text,
      gloss,
      missing: [],
      input: "camera",
      words: current.map(({ word, confidence }) => ({ word, confidence })),
    });
    setWords([]);
    announce(`Sentence finished: ${text}`);
    if (voiceRef.current) speech.speak(text);
  }, [addHistory, library, speech]);

  const finishRef = useRef(finishSentence);
  finishRef.current = finishSentence;
  const autoFinishRef = useRef(settings.autoFinishSentence);
  autoFinishRef.current = settings.autoFinishSentence;

  const onAccepted = useCallback(
    (sign: AcceptedSign) => {
      setAccepted(sign);
      window.clearTimeout(acceptedTimer.current);
      acceptedTimer.current = window.setTimeout(() => setAccepted(null), ACCEPTED_HOLD_MS);
      setWords((prev) => [...prev, { id: createId(), word: sign.word, confidence: sign.confidence }]);
      announce(`Recognised ${glossLabel(sign.word, library)}`);
      window.clearTimeout(pauseTimer.current);
      if (autoFinishRef.current) {
        pauseTimer.current = window.setTimeout(() => finishRef.current(), SENTENCE_PAUSE_MS);
      }
    },
    [library],
  );

  useEffect(
    () => () => {
      window.clearTimeout(pauseTimer.current);
      window.clearTimeout(acceptedTimer.current);
    },
    [],
  );

  const service = useRecognitionService({
    url: settings.serviceUrl,
    enabled: true,
    threshold: settings.confidenceThreshold,
    onAccepted,
  });

  const camera = useCameraTracking({
    onVector: service.send,
    sending: recognising && service.connection === "open",
    showLandmarks: settings.showLandmarks,
    cameraId: settings.cameraId,
    onCameraMissing: () => set("cameraId", null),
  });

  useEffect(() => {
    if (!recognising) service.resetLive();
    // resetLive is stable
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognising]);

  const verifiedWords = useMemo(
    () => [...metrics.verified].map((g) => glossLabel(g, library)).sort((a, b) => a.localeCompare(b)),
    [metrics, library],
  );

  const subtitles = words.map((w) => glossLabel(w.word, library));

  return (
    <div className="grid lg:h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(22rem,27rem)]">
      <h1 className="sr-only">Sign to text</h1>
      <div className="min-h-0">
        <CameraStage
          camera={camera}
          recognising={recognising}
          onRecognising={setRecognising}
          recognitionAvailable={service.connection === "open"}
          cameraId={settings.cameraId}
          onCameraId={(id) => set("cameraId", id)}
          showLandmarks={settings.showLandmarks}
          onShowLandmarks={(on) => set("showLandmarks", on)}
          showGuide={settings.showFramingGuide}
          onShowGuide={(on) => set("showFramingGuide", on)}
          serviceHost={hostOf(settings.serviceUrl)}
          subtitles={subtitles}
          flash={accepted ? accepted.word : null}
        />
      </div>

      <aside aria-label="Recognition and transcript" className="flex min-h-0 flex-col border-t border-line bg-surface lg:border-t-0 lg:border-l">
        <div className="border-b border-line px-5 py-3.5">
          <ServiceStatus service={service} />
        </div>
        <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-5 py-6">
          <section aria-label="Recognised sign" aria-live="off">
            <RecognitionReadout
              camera={camera}
              service={service}
              recognising={recognising}
              accepted={accepted}
              threshold={settings.confidenceThreshold}
              metrics={metrics}
              library={library}
            />
          </section>
          <div className="border-t border-line pt-6">
            <SentencePanel
              words={words}
              english={english}
              onFinish={finishSentence}
              onUndo={() => setWords((prev) => prev.slice(0, -1))}
              onClear={() => {
                window.clearTimeout(pauseTimer.current);
                setWords([]);
              }}
              onSpeak={(text) => speech.speak(text)}
              speechSupported={speech.supported}
              voiceOutput={settings.voiceOutput}
              onVoiceOutput={(on) => set("voiceOutput", on)}
              autoFinish={settings.autoFinishSentence}
              library={library}
            />
          </div>
          <div className="border-t border-line pt-6">
            <Transcript log={log} onSpeak={(text) => speech.speak(text)} speaking={speech.speaking} speechSupported={speech.supported} />
          </div>
        </div>
        <details className="group border-t border-line">
          <summary className="flex min-h-14 list-none items-center justify-between gap-3 px-5 py-3 [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2.5 text-[0.875rem] font-medium text-navy">
              <ShieldCheck className="size-4 text-royal" aria-hidden />
              Signs Parlance can recognise{metrics.loaded ? ` (${verifiedWords.length})` : ""}
            </span>
            <ChevronDown className="size-4 shrink-0 text-ink-3 transition-transform group-open:rotate-180" aria-hidden />
          </summary>
          <div className="max-h-56 overflow-y-auto px-5 pb-5">
            <p className="text-xs leading-5 text-ink-3">
              Verified at 80% or more on recordings the model never trained on. Other signs are never output.
            </p>
            <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[0.8125rem] font-semibold tracking-[0.04em] text-navy uppercase">
              {verifiedWords.map((word) => (
                <span key={word}>{word}</span>
              ))}
            </p>
            <Link to="/app/help#camera" className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-[0.8125rem] font-medium text-royal hover:underline">
              <LifeBuoy className="size-3.5" aria-hidden /> Camera tips
            </Link>
          </div>
        </details>
      </aside>
    </div>
  );
}
