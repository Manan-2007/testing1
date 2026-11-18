import { useEffect, useId, useState, type ReactNode } from "react";
import { Accessibility, Camera, Languages, Lock, RotateCcw, Sparkles, Trash2, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Field } from "@/components/ui/Field";
import { Segmented } from "@/components/ui/Segmented";
import { Select } from "@/components/ui/Select";
import { StatusPill } from "@/components/ui/Status";
import { SwitchRow } from "@/components/ui/Switch";
import { toast } from "@/components/ui/Toaster";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useSpeechOutput } from "@/services/speech/useSpeechOutput";
import { useHistory } from "@/stores/history";
import {
  DEFAULT_SERVICE_URL,
  RETENTION_LABELS,
  useSettings,
  type AvatarView,
  type MotionPreference,
  type PlaybackSpeed,
  type Retention,
  type SpeechLanguage,
  type TextSize,
} from "@/stores/settings";
import { WorkspaceHeader } from "../shared/WorkspaceHeader";

const SECTIONS = [
  { id: "language", label: "Language", icon: Languages },
  { id: "signer", label: "Signer", icon: Sparkles },
  { id: "audio", label: "Audio", icon: Volume2 },
  { id: "camera", label: "Camera and microphone", icon: Camera },
  { id: "accessibility", label: "Accessibility", icon: Accessibility },
  { id: "privacy", label: "Privacy and data", icon: Lock },
];

function Section({ id, title, description, icon, children }: { id: string; title: string; description: string; icon: ReactNode; children: ReactNode }) {
  return (
    <Card id={id} className="scroll-mt-24">
      <div className="flex items-start gap-3 border-b border-line px-5 py-5">
        <span className="mt-1.5 shrink-0 text-royal [&_svg]:size-4">{icon}</span>
        <div>
          <h2 className="text-xl leading-7 font-semibold tracking-[-0.025em]">{title}</h2>
          <p className="mt-0.5 text-sm text-ink-3">{description}</p>
        </div>
      </div>
      <div className="divide-y divide-line px-5">{children}</div>
    </Card>
  );
}

type PermissionView = "granted" | "denied" | "prompt" | "unknown";

function usePermission(name: "camera" | "microphone"): PermissionView {
  const [state, setState] = useState<PermissionView>("unknown");
  useEffect(() => {
    let status: PermissionStatus | null = null;
    const sync = () => status && setState(status.state as PermissionView);
    navigator.permissions
      ?.query({ name: name as PermissionName })
      .then((result) => {
        status = result;
        sync();
        result.addEventListener("change", sync);
      })
      .catch(() => setState("unknown"));
    return () => status?.removeEventListener("change", sync);
  }, [name]);
  return state;
}

function PermissionRow({ label, state, usage }: { label: string; state: PermissionView; usage: string }) {
  const pill =
    state === "granted"
      ? { tone: "success" as const, text: "Allowed" }
      : state === "denied"
        ? { tone: "danger" as const, text: "Blocked" }
        : state === "prompt"
          ? { tone: "idle" as const, text: "Not asked yet" }
          : { tone: "off" as const, text: "Unknown" };
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <div>
        <p className="text-[0.9375rem] font-semibold text-ink">{label}</p>
        <p className="mt-0.5 text-sm leading-5 text-ink-3">{usage}</p>
        {state === "denied" && (
          <p className="mt-1 text-sm leading-5 text-danger">
            Blocked for this site. Change it from the site settings icon in your browser&rsquo;s address bar.
          </p>
        )}
      </div>
      <StatusPill tone={pill.tone} srPrefix={`${label} permission:`}>
        {pill.text}
      </StatusPill>
    </div>
  );
}

export function SettingsPage() {
  useDocumentTitle("Settings");
  const s = useSettings();
  const historyCount = useHistory((h) => h.entries.length);
  const clearHistory = useHistory((h) => h.clear);
  const speech = useSpeechOutput();
  const cameraPermission = usePermission("camera");
  const micPermission = usePermission("microphone");
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [serviceDraft, setServiceDraft] = useState(s.serviceUrl);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [pendingRetention, setPendingRetention] = useState<Retention | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const serviceId = useId();

  useEffect(() => {
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((all) => setCameras(all.filter((d) => d.kind === "videoinput")))
      .catch(() => {});
  }, [cameraPermission]);

  const saveService = () => {
    const value = serviceDraft.trim();
    if (!/^wss?:\/\/[^\s]+$/.test(value)) {
      setServiceError("Use a WebSocket address that starts with ws:// or wss://");
      return;
    }
    setServiceError(null);
    s.set("serviceUrl", value);
    toast("Recognition service address saved");
  };

  const chooseRetention = (value: Retention) => {
    if (value === "off" && historyCount > 0) {
      setPendingRetention(value);
      return;
    }
    s.set("retention", value);
    toast(`History: ${RETENTION_LABELS[value].toLowerCase()}`);
  };

  return (
    <div className="container-app py-10 sm:py-14">
      <WorkspaceHeader title="Settings" description="Preferences are saved in this browser. Nothing here is sent anywhere." />

      <div className="mt-10 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,48rem)]">
        <nav aria-label="Settings sections" className="hidden lg:block">
          <ul className="sticky top-24 space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-surface hover:text-navy"
                >
                  <Icon className="size-4 text-royal" aria-hidden />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6">
          <Section id="language" title="Language" description="How spoken input is understood." icon={<Languages />}>
            <Field label="Voice input language" description="Accent model the browser uses to transcribe speech. Translation to ISL works from English.">
              {({ id, describedBy }) => (
                <Select id={id} aria-describedby={describedBy} value={s.speechLanguage} onChange={(e) => s.set("speechLanguage", e.target.value as SpeechLanguage)} className="w-full">
                  <option value="en-IN">English (India)</option>
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                </Select>
              )}
            </Field>
            <Field
              label="Hindi input"
              badge={<Badge tone="neutral">Planned</Badge>}
              description="Hindi and regional languages need their own grammar rules before they can be translated to ISL reliably."
            >
              {({ id }) => (
                <Select id={id} disabled value="" className="w-full" onChange={() => {}}>
                  <option value="">Not available yet</option>
                </Select>
              )}
            </Field>
            <SwitchRow
              label="Translate as soon as I stop speaking"
              description="Off: review the transcribed text first, then press Translate."
              checked={s.autoTranslate}
              onChange={(v) => s.set("autoTranslate", v)}
            />
          </Section>

          <Section id="signer" title="Signer" description="Defaults for the 3D signer. You can also change these beside the signer." icon={<Sparkles />}>
            <Field label="Default view" description="The whole signer shows facial grammar. Hands focus frames the hands more closely.">
              {() => (
                <Segmented<AvatarView>
                  label="Default view"
                  block
                  value={s.avatarView}
                  onChange={(v) => s.set("avatarView", v)}
                  options={[
                    { value: "figure", label: "Whole signer" },
                    { value: "hands", label: "Hands focus" },
                  ]}
                />
              )}
            </Field>
            <Field label="Playback speed" description="Slower speeds keep every handshape readable.">
              {() => (
                <Segmented<PlaybackSpeed>
                  label="Playback speed"
                  block
                  value={s.playbackSpeed}
                  onChange={(v) => s.set("playbackSpeed", v)}
                  options={[
                    { value: 0.5, label: "0.5×" },
                    { value: 0.75, label: "0.75×" },
                    { value: 1, label: "1×" },
                  ]}
                />
              )}
            </Field>
            <SwitchRow label="Mirror the signer" description="Useful when copying a sign: the signer's right hand appears on your right." checked={s.mirror} onChange={(v) => s.set("mirror", v)} />
            <SwitchRow label="Loop phrases" description="Repeat each phrase until you pause it." checked={s.loop} onChange={(v) => s.set("loop", v)} />
            <SwitchRow label="Show captions on the signer" description="The word being signed, shown in large text over the stage." checked={s.showCaptions} onChange={(v) => s.set("showCaptions", v)} />
          </Section>

          <Section id="audio" title="Audio" description="Spoken output for sentences built from signs." icon={<Volume2 />}>
            <SwitchRow
              label="Speak recognised sentences aloud"
              description={speech.supported ? "Sentences are always shown on screen as well." : "This browser has no speech output. Sentences are still shown on screen."}
              checked={s.voiceOutput && speech.supported}
              disabled={!speech.supported}
              onChange={(v) => s.set("voiceOutput", v)}
            />
            <Field label="Voice" description={speech.voices.length ? "Voices installed on this device." : "No voices reported by this browser yet."}>
              {({ id, describedBy }) => (
                <Select
                  id={id}
                  aria-describedby={describedBy}
                  value={s.voiceURI ?? ""}
                  disabled={!speech.supported || speech.voices.length === 0}
                  onChange={(e) => s.set("voiceURI", e.target.value || null)}
                  className="w-full"
                >
                  <option value="">Automatic (English, India where available)</option>
                  {speech.voices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name} ({voice.lang})
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field label="Speaking rate" description={`${s.speechRate.toFixed(1)}× normal speed`}>
              {({ id, describedBy }) => (
                <div className="flex items-center gap-3">
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    type="range"
                    min={0.7}
                    max={1.3}
                    step={0.1}
                    value={s.speechRate}
                    disabled={!speech.supported}
                    onChange={(e) => s.set("speechRate", Number(e.target.value))}
                    className="h-11 flex-1"
                  />
                  <Button size="sm" variant="secondary" disabled={!speech.supported} onClick={() => speech.speak("Hello. This is how Parlance will sound.")}>
                    Test
                  </Button>
                </div>
              )}
            </Field>
          </Section>

          <Section id="camera" title="Camera and microphone" description="Devices are used only while you have turned them on." icon={<Camera />}>
            <PermissionRow label="Camera" state={cameraPermission} usage="Used only while the camera is on in Sign to text. Video stays on this device." />
            <PermissionRow label="Microphone" state={micPermission} usage="Used only while you press Speak in Speech to sign." />
            <Field label="Preferred camera" description={cameras.some((c) => c.label) ? "Used when you start the camera." : "Camera names appear after you allow camera access once."}>
              {({ id, describedBy }) => (
                <Select
                  id={id}
                  aria-describedby={describedBy}
                  value={s.cameraId ?? ""}
                  onChange={(e) => s.set("cameraId", e.target.value || null)}
                  disabled={cameras.length === 0}
                  className="w-full"
                >
                  <option value="">Default camera</option>
                  {cameras.map((camera, index) =>
                    camera.deviceId ? (
                      <option key={camera.deviceId} value={camera.deviceId}>
                        {camera.label || `Camera ${index + 1}`}
                      </option>
                    ) : null,
                  )}
                </Select>
              )}
            </Field>
            <SwitchRow label="Show hand landmarks" description="Draw the tracked hand points over the camera preview." checked={s.showLandmarks} onChange={(v) => s.set("showLandmarks", v)} />
            <SwitchRow label="Show framing guide" description="Outline where your head, shoulders and hands should be." checked={s.showFramingGuide} onChange={(v) => s.set("showFramingGuide", v)} />
            <SwitchRow
              label="Finish a sentence after a pause"
              description="After 3.5 seconds without a new sign, the sentence is completed and saved."
              checked={s.autoFinishSentence}
              onChange={(v) => s.set("autoFinishSentence", v)}
            />
            <Field
              label="Confidence threshold"
              description={`${Math.round(s.confidenceThreshold * 100)}%. Lower values let more signs through, and more mistakes. 85% is recommended.`}
            >
              {({ id, describedBy }) => (
                <div className="flex items-center gap-3">
                  <input
                    id={id}
                    aria-describedby={describedBy}
                    type="range"
                    min={0.8}
                    max={0.95}
                    step={0.01}
                    value={s.confidenceThreshold}
                    onChange={(e) => s.set("confidenceThreshold", Number(e.target.value))}
                    className="h-11 flex-1"
                  />
                  <span className="w-10 text-right text-sm font-semibold tabular-nums text-ink-2">{Math.round(s.confidenceThreshold * 100)}%</span>
                </div>
              )}
            </Field>
            <div className="py-4">
              <label htmlFor={serviceId} className="text-[0.9375rem] font-semibold text-ink">
                Recognition service address
              </label>
              <p id={`${serviceId}-hint`} className="mt-0.5 text-sm leading-5 text-ink-3">
                Where hand-position numbers are sent for sign recognition. Run it on this computer to keep everything local.
              </p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  id={serviceId}
                  value={serviceDraft}
                  onChange={(e) => setServiceDraft(e.target.value)}
                  aria-describedby={`${serviceId}-hint${serviceError ? ` ${serviceId}-error` : ""}`}
                  aria-invalid={serviceError ? true : undefined}
                  spellCheck={false}
                  autoCapitalize="off"
                  className="h-11 flex-1 rounded-sm border border-line-strong bg-surface px-3 text-[0.9375rem] text-ink shadow-xs focus-visible:border-royal aria-invalid:border-danger"
                />
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={saveService} disabled={serviceDraft.trim() === s.serviceUrl}>
                    Save
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setServiceDraft(DEFAULT_SERVICE_URL);
                      setServiceError(null);
                      s.set("serviceUrl", DEFAULT_SERVICE_URL);
                    }}
                    disabled={s.serviceUrl === DEFAULT_SERVICE_URL && serviceDraft === DEFAULT_SERVICE_URL}
                  >
                    Use default
                  </Button>
                </div>
              </div>
              {serviceError && (
                <p id={`${serviceId}-error`} className="mt-1.5 text-sm font-medium text-danger">
                  {serviceError}
                </p>
              )}
            </div>
          </Section>

          <Section id="accessibility" title="Accessibility" description="Applied across Parlance on this device." icon={<Accessibility />}>
            <Field label="Text size" description="Scales all text and controls.">
              {() => (
                <Segmented<TextSize>
                  label="Text size"
                  block
                  value={s.textSize}
                  onChange={(v) => s.set("textSize", v)}
                  options={[
                    { value: "default", label: "Default" },
                    { value: "large", label: "Large" },
                    { value: "larger", label: "Larger" },
                  ]}
                />
              )}
            </Field>
            <Field label="Motion" description="Reduced turns off decorative animation and autoplay. System follows your device setting.">
              {() => (
                <Segmented<MotionPreference>
                  label="Motion"
                  block
                  value={s.motion}
                  onChange={(v) => s.set("motion", v)}
                  options={[
                    { value: "system", label: "System" },
                    { value: "reduce", label: "Reduced" },
                    { value: "full", label: "Full" },
                  ]}
                />
              )}
            </Field>
          </Section>

          <Section id="privacy" title="Privacy and data" description="What Parlance keeps, and for how long." icon={<Lock />}>
            <Field label="Keep translation history" description="Text only. Camera video and audio are never stored.">
              {({ id, describedBy }) => (
                <Select id={id} aria-describedby={describedBy} value={s.retention} onChange={(e) => chooseRetention(e.target.value as Retention)} className="w-full">
                  {(Object.keys(RETENTION_LABELS) as Retention[]).map((key) => (
                    <option key={key} value={key}>
                      {RETENTION_LABELS[key]}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.9375rem] font-semibold text-ink">Delete history now</p>
                <p className="mt-0.5 text-sm text-ink-3">
                  {historyCount === 0 ? "No saved entries." : `${historyCount} ${historyCount === 1 ? "entry" : "entries"} saved in this browser.`}
                </p>
              </div>
              <Button variant="danger" size="sm" disabled={historyCount === 0} onClick={() => setConfirmClear(true)} leading={<Trash2 aria-hidden />}>
                Delete history
              </Button>
            </div>
            <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[0.9375rem] font-semibold text-ink">Reset all settings</p>
                <p className="mt-0.5 text-sm text-ink-3">Restore every preference on this page to its default.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setConfirmReset(true)} leading={<RotateCcw aria-hidden />}>
                Reset settings
              </Button>
            </div>
            <ul className="space-y-1.5 py-4 text-sm leading-6 text-ink-2">
              <li>No account, no sign-in, no analytics.</li>
              <li>Camera frames are processed on this device and never recorded or uploaded.</li>
              <li>Only hand and shoulder positions are sent, to the recognition service address above.</li>
              <li>Voice input is transcribed by your browser&rsquo;s own speech service.</li>
            </ul>
          </Section>
        </div>
      </div>

      <ConfirmDialog
        open={pendingRetention !== null}
        onCancel={() => setPendingRetention(null)}
        onConfirm={() => {
          s.set("retention", "off");
          setPendingRetention(null);
          toast("History turned off and deleted");
        }}
        title="Turn history off?"
        description={`New translations won't be saved, and the ${historyCount} saved ${historyCount === 1 ? "entry" : "entries"} will be deleted now.`}
        confirmLabel="Turn off and delete"
      />
      <ConfirmDialog
        open={confirmClear}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          clearHistory();
          setConfirmClear(false);
          toast("History deleted");
        }}
        title="Delete all history?"
        description="This permanently removes every saved translation from this browser."
        confirmLabel="Delete history"
      />
      <ConfirmDialog
        open={confirmReset}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          s.reset();
          setServiceDraft(DEFAULT_SERVICE_URL);
          setConfirmReset(false);
          toast("Settings restored to defaults");
        }}
        title="Reset all settings?"
        description="Every preference returns to its default. Your history is not affected."
        confirmLabel="Reset settings"
        confirmVariant="primary"
      />
    </div>
  );
}
