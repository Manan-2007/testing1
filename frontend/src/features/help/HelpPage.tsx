import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  AudioLines,
  BookOpen,
  Check,
  CircleDashed,
  Copy,
  Hand,
  Keyboard,
  Lightbulb,
  Lock,
  Play,
  Search,
  Server,
  ShieldCheck,
  Sun,
  UserRound,
  Wallpaper,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Kbd } from "@/components/ui/Kbd";
import { Segmented } from "@/components/ui/Segmented";
import { toast } from "@/components/ui/Toaster";
import { DirectionLabel } from "@/components/layout/DirectionLabel";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { glossLabel, useRecognitionMetrics, useSignLibrary } from "@/services/signs/library";
import { useSettings } from "@/stores/settings";
import { WorkspaceHeader } from "../shared/WorkspaceHeader";

const NAV = [
  { id: "start", label: "Getting started" },
  { id: "camera", label: "Camera tips" },
  { id: "vocabulary", label: "Supported signs" },
  { id: "limits", label: "What it can and can't do" },
  { id: "privacy", label: "Privacy" },
  { id: "service", label: "Recognition service" },
  { id: "keyboard", label: "Keyboard" },
];

function HelpSection({ id, title, children }: { id: string; title: string; icon: ReactNode; children: ReactNode }) {
  const index = String(NAV.findIndex((n) => n.id === id) + 1).padStart(2, "0");
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24 border-t border-line pt-6">
      <div className="mb-5 flex items-baseline gap-3">
        <span className="text-sm font-semibold text-royal tabular-nums">({index})</span>
        <h2 id={`${id}-title`} className="text-[1.625rem] leading-tight font-semibold tracking-[-0.035em]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="mt-3 space-y-2.5">
      {items.map((item, i) => (
        <li key={item} className="flex gap-3 text-[0.9375rem] leading-6 text-ink-2">
          <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-xs bg-brand-50 text-xs font-bold text-royal tabular-nums">
            {i + 1}
          </span>
          {item}
        </li>
      ))}
    </ol>
  );
}

function CommandBlock({ lines }: { lines: string[] }) {
  const text = lines.join("\n");
  return (
    <div className="mt-3 flex items-start justify-between gap-3 rounded-md border border-line bg-subtle p-3.5">
      <div className="min-w-0 space-y-1 overflow-x-auto text-sm font-semibold break-words text-navy">
        {lines.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <button
        type="button"
        onClick={() =>
          navigator.clipboard
            .writeText(text)
            .then(() => toast("Commands copied"))
            .catch(() => toast("Copying isn't allowed in this browser", "warning"))
        }
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm border border-line-strong bg-surface text-navy hover:bg-brand-25"
        aria-label="Copy commands"
        title="Copy commands"
      >
        <Copy className="size-4" aria-hidden />
      </button>
    </div>
  );
}

type VocabFilter = "all" | "recognised";

export function HelpPage() {
  useDocumentTitle("Help");
  const library = useSignLibrary();
  const metrics = useRecognitionMetrics();
  const serviceUrl = useSettings((s) => s.serviceUrl);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<VocabFilter>("all");

  const signs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.entries(library.signs)
      .map(([gloss, entry]) => ({ gloss, english: entry.english, pos: entry.pos, recognised: metrics.verified.has(gloss) }))
      .filter((s) => (filter === "all" || s.recognised) && (!q || s.english.toLowerCase().includes(q) || s.gloss.includes(q)))
      .sort((a, b) => a.english.localeCompare(b.english));
  }, [library, metrics, query, filter]);

  return (
    <div className="container-app py-10 sm:py-14">
      <WorkspaceHeader title="Help" description="How to use Parlance well, what it supports today, and how your data is handled." />

      <div className="mt-10 grid gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] xl:grid-cols-[15rem_minmax(0,52rem)]">
        <nav aria-label="Help sections" className="hidden lg:block">
          <ul className="sticky top-24 space-y-0.5">
            {NAV.map((item) => (
              <li key={item.id}>
                <a href={`#${item.id}`} className="block rounded-sm px-3 py-2 text-sm font-medium text-ink-2 hover:bg-surface hover:text-navy">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-14">
          <HelpSection id="start" title="Getting started" icon={<Lightbulb />}>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-5">
                <p className="flex items-center gap-2 text-base font-bold text-navy">
                  <AudioLines className="size-5 text-royal" aria-hidden />
                  <DirectionLabel from="Speech" to="Sign" />
                </p>
                <p className="mt-1 text-sm text-ink-3">For the hearing person</p>
                <Steps
                  items={[
                    "Press Speak and say a short sentence, or type it.",
                    "Parlance shows the ISL gloss: the signs in ISL order.",
                    "The 3D signer performs it. Slow it down, replay it, or tap a sign to repeat it.",
                  ]}
                />
                <ButtonLink to="/app/speech-to-sign" size="sm" className="mt-5">
                  Open speech to sign
                </ButtonLink>
              </Card>
              <Card className="p-5">
                <p className="flex items-center gap-2 text-base font-bold text-navy">
                  <Hand className="size-5 text-royal" aria-hidden />
                  <DirectionLabel from="Sign" to="Text" />
                </p>
                <p className="mt-1 text-sm text-ink-3">For the ISL signer</p>
                <Steps
                  items={[
                    "Start the camera and stand so your head and shoulders are in view.",
                    "Sign one word at a time, with a short pause between signs.",
                    "Recognised signs build a sentence that is shown on screen and can be spoken aloud.",
                  ]}
                />
                <ButtonLink to="/app/sign-to-text" size="sm" variant="secondary" className="mt-5">
                  Open sign to text
                </ButtonLink>
              </Card>
            </div>
          </HelpSection>

          <HelpSection id="camera" title="Camera tips" icon={<UserRound />}>
            <Card className="grid gap-px overflow-hidden bg-line sm:grid-cols-2">
              {[
                { icon: UserRound, title: "Head and shoulders in view", body: "Recognition measures your hands relative to your shoulders. Stand about an arm's length back." },
                { icon: Sun, title: "Even, front-facing light", body: "Avoid a bright window behind you. Light on your hands matters most." },
                { icon: Wallpaper, title: "Plain background", body: "Busy patterns and skin-coloured backgrounds make hands harder to track." },
                { icon: Hand, title: "One sign at a time", body: "Hold each sign briefly, then lower your hands before the next one." },
              ].map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-3 bg-surface p-5">
                  <Icon className="mt-0.5 size-5 shrink-0 text-royal" aria-hidden />
                  <div>
                    <p className="font-bold text-navy">{title}</p>
                    <p className="mt-1 text-sm leading-6 text-ink-2">{body}</p>
                  </div>
                </div>
              ))}
            </Card>
          </HelpSection>

          <HelpSection id="vocabulary" title="Supported signs" icon={<BookOpen />}>
            <p className="max-w-2xl text-[0.9375rem] leading-7 text-ink-2">
              The signer can perform {library.loaded ? Object.keys(library.signs).length : "all"} signs from the ISLRTC
              dictionary. The camera recognises a smaller set: only the {metrics.verified.size || ""} signs verified at 80%
              or more on recordings the model never trained on.
            </p>
            <Card className="mt-4">
              <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="relative block sm:w-72">
                  <span className="sr-only">Search signs</span>
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search, for example: doctor"
                    className="h-10 w-full rounded-sm border border-line-strong bg-surface pr-3 pl-9 text-sm text-ink shadow-xs placeholder:text-ink-3 focus-visible:border-royal"
                  />
                </label>
                <Segmented<VocabFilter>
                  label="Which signs to show"
                  size="sm"
                  value={filter}
                  onChange={setFilter}
                  options={[
                    { value: "all", label: "All signs" },
                    { value: "recognised", label: "Camera recognises" },
                  ]}
                />
              </div>
              <p className="sr-only" role="status" aria-live="polite">
                {signs.length} signs shown
              </p>
              {!library.loaded ? (
                <div className="grid gap-2 p-4 sm:grid-cols-3">
                  {Array.from({ length: 9 }, (_, i) => (
                    <div key={i} className="skeleton h-12 rounded-sm" />
                  ))}
                </div>
              ) : signs.length === 0 ? (
                <EmptyState icon={<Search />} title="No signs match">
                  Words without a sign are captioned rather than signed. Try a related word.
                </EmptyState>
              ) : (
                <ul className="grid max-h-[28rem] grid-cols-1 gap-px overflow-y-auto bg-line sm:grid-cols-2 lg:grid-cols-3">
                  {signs.map((sign) => (
                    <li key={sign.gloss} className="flex items-center justify-between gap-2 bg-surface px-4 py-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold tracking-[0.03em] text-navy uppercase">{glossLabel(sign.gloss, library)}</p>
                        <p className="flex items-center gap-1.5 text-xs text-ink-3">
                          <span className="capitalize">{sign.pos}</span>
                          {sign.recognised && (
                            <span className="inline-flex items-center gap-1 font-semibold text-success">
                              <ShieldCheck className="size-3" aria-hidden /> Camera
                            </span>
                          )}
                        </p>
                      </div>
                      <Link
                        to={`/app/speech-to-sign?text=${encodeURIComponent(sign.english)}`}
                        className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm px-2.5 text-[0.8125rem] font-semibold text-royal hover:bg-brand-50"
                        aria-label={`Watch the sign for ${sign.english}`}
                      >
                        <Play className="size-3.5" aria-hidden /> Watch
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </HelpSection>

          <HelpSection id="limits" title="What Parlance can and can't do" icon={<CircleDashed />}>
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="p-5">
                <p className="font-bold text-navy">Works today</p>
                <ul className="mt-3 space-y-2.5 text-[0.9375rem] leading-6 text-ink-2">
                  {[
                    "English speech or text to ISL gloss, reordered by ISL grammar rules",
                    "A 3D signer performing 239 dictionary signs, with facial grammar for questions and negation",
                    "Camera recognition of single, verified signs, one at a time, through the recognition service",
                    "Recognised signs rebuilt into an English sentence, shown and spoken",
                    "Local history with retention you control",
                  ].map((item) => (
                    <li key={item} className="flex gap-2.5">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </Card>
              <Card className="p-5">
                <p className="font-bold text-navy">Not yet</p>
                <ul className="mt-3 space-y-2.5 text-[0.9375rem] leading-6 text-ink-2">
                  {[
                    ["Continuous signing", "Recognition reads one sign per two-second window. Fluent, connected signing is not recognised."],
                    ["Reading facial grammar", "The signer produces it, but the camera does not read brows or head shakes yet."],
                    ["Fingerspelling", "Names and words outside the library are captioned, not spelled."],
                    ["Hindi and regional languages", "Input is English only for now."],
                  ].map(([title, body]) => (
                    <li key={title} className="flex gap-2.5">
                      <CircleDashed className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
                      <span>
                        <span className="font-semibold text-ink">{title}.</span> {body}
                      </span>
                    </li>
                  ))}
                </ul>
                <Badge tone="neutral" className="mt-4">
                  Planned
                </Badge>
              </Card>
            </div>
            <p className="mt-4 rounded-md border border-line bg-surface p-4 text-[0.9375rem] leading-7 text-ink-2">
              <span className="font-semibold text-navy">Parlance is not an interpreter.</span> It is a tool for short,
              concrete exchanges. For anything consequential, such as a diagnosis, consent or legal matters, use a
              qualified ISL interpreter.
            </p>
          </HelpSection>

          <HelpSection id="privacy" title="Privacy" icon={<Lock />}>
            <Card className="p-5">
              <ul className="space-y-2.5 text-[0.9375rem] leading-6 text-ink-2">
                {[
                  "There is no account and no analytics.",
                  "The camera runs only while you have turned it on. Frames are processed on this device and never recorded or uploaded.",
                  `For recognition, only hand and shoulder positions (141 numbers per frame) are sent to ${serviceUrl}.`,
                  "Voice input is transcribed by your browser's speech service. In Chrome this uses Google's servers.",
                  "History is text only and stays in this browser. You choose how long it is kept, and can delete it at any time.",
                ].map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <ShieldCheck className="mt-0.5 size-4 shrink-0 text-royal" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <ButtonLink to="/app/settings#privacy" size="sm" variant="secondary" className="mt-5">
                Privacy settings
              </ButtonLink>
            </Card>
          </HelpSection>

          <HelpSection id="service" title="Running the recognition service" icon={<Server />}>
            <Card className="p-5">
              <p className="text-[0.9375rem] leading-7 text-ink-2">
                Sign to text needs the Parlance recognition service (the BiLSTM model from the VOX project). Speech to sign
                does not: it runs entirely in the browser. From the VOX project folder:
              </p>
              <CommandBlock lines={["source venv/bin/activate", "uvicorn backend.main:app --port 8000"]} />
              <p className="mt-3 text-sm leading-6 text-ink-3">
                Parlance connects to {serviceUrl}. To use a different address, change it in{" "}
                <Link to="/app/settings#camera" className="font-semibold text-royal hover:underline">
                  Settings
                </Link>
                .
              </p>
            </Card>
          </HelpSection>

          <HelpSection id="keyboard" title="Keyboard" icon={<Keyboard />}>
            <Card>
              <dl className="divide-y divide-line">
                {[
                  [["Enter"], "Sign the message (Shift + Enter adds a new line)"],
                  [["Tab"], "Move between controls"],
                  [["←", "→"], "Move within a set of options, such as playback speed"],
                  [["Space"], "Activate the focused button or switch"],
                  [["Esc"], "Close a dialog or menu"],
                ].map(([keys, label]) => (
                  <div key={label as string} className="flex items-center justify-between gap-4 px-5 py-3">
                    <dt className="text-[0.9375rem] text-ink-2">{label as string}</dt>
                    <dd className="flex shrink-0 gap-1">
                      {(keys as string[]).map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          </HelpSection>
        </div>
      </div>
    </div>
  );
}
