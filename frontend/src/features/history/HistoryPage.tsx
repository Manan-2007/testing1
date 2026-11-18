import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AudioLines, Download, Hand, History as HistoryIcon, Lock, Play, Search, Trash2, Volume2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { IconButton } from "@/components/ui/IconButton";
import { Segmented } from "@/components/ui/Segmented";
import { toast } from "@/components/ui/Toaster";
import { DirectionLabel } from "@/components/layout/DirectionLabel";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { formatDay, formatTime } from "@/lib/time";
import { useSpeechOutput } from "@/services/speech/useSpeechOutput";
import { useHistory, type Direction, type HistoryEntry } from "@/stores/history";
import { RETENTION_LABELS, useSettings } from "@/stores/settings";
import { WorkspaceHeader } from "../shared/WorkspaceHeader";

type Filter = "all" | Direction;

const INPUT_LABEL: Record<HistoryEntry["input"], string> = {
  voice: "Spoken",
  typed: "Typed",
  phrase: "Common phrase",
  camera: "Signed",
};

function exportHistory(entries: HistoryEntry[]) {
  const lines = entries.map((e) =>
    [
      new Date(e.createdAt).toISOString(),
      e.direction === "speech-to-sign" ? "Speech to sign" : "Sign to text",
      `English: ${e.text}`,
      `ISL gloss: ${e.gloss}`,
      e.missing.length ? `No sign yet for: ${e.missing.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  );
  const blob = new Blob([`Parlance conversation history\n\n${lines.join("\n\n")}\n`], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `parlance-history-${new Date().toISOString().slice(0, 10)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

export function HistoryPage() {
  useDocumentTitle("History");
  const entries = useHistory((s) => s.entries);
  const remove = useHistory((s) => s.remove);
  const clear = useHistory((s) => s.clear);
  const retention = useSettings((s) => s.retention);
  const speech = useSpeechOutput();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [confirming, setConfirming] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (filter === "all" || e.direction === filter) &&
        (!q || e.text.toLowerCase().includes(q) || e.gloss.toLowerCase().includes(q)),
    );
  }, [entries, filter, query]);

  const groups = useMemo(() => {
    const map = new Map<string, HistoryEntry[]>();
    for (const entry of visible) {
      const day = formatDay(entry.createdAt);
      map.set(day, [...(map.get(day) ?? []), entry]);
    }
    return [...map.entries()];
  }, [visible]);

  return (
    <div className="container-app max-w-4xl py-10 sm:py-14">
      <WorkspaceHeader
        title="History"
        description="Completed translations from both directions, stored only in this browser."
        action={
          entries.length > 0 ? (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" leading={<Download aria-hidden />} onClick={() => exportHistory(visible)}>
                Export
              </Button>
              <Button variant="danger" size="sm" leading={<Trash2 aria-hidden />} onClick={() => setConfirming(true)}>
                Clear all
              </Button>
            </div>
          ) : null
        }
      />

      <div className="mt-6 flex items-start gap-3 border-l-2 border-royal py-1 pl-4 text-sm leading-6 text-ink-2">
        <Lock className="mt-0.5 size-4 shrink-0 text-royal" aria-hidden />
        <p>
          <span className="font-semibold text-ink">Retention: {RETENTION_LABELS[retention].toLowerCase()}.</span>{" "}
          {retention === "off"
            ? "New translations are not being saved."
            : "Only text is kept. Camera video and audio are never stored."}{" "}
          <Link to="/app/settings#privacy" className="font-semibold text-royal underline-offset-2 hover:underline">
            Change
          </Link>
        </p>
      </div>

      {entries.length === 0 ? (
        <Card className="mt-5">
          <EmptyState
            icon={<HistoryIcon />}
            title={retention === "off" ? "History is turned off" : "No translations yet"}
            action={
              <>
                <Button variant="primary" size="sm" onClick={() => navigate("/app/speech-to-sign")} leading={<AudioLines aria-hidden />}>
                  Speech to sign
                </Button>
                <Button variant="secondary" size="sm" onClick={() => navigate("/app/sign-to-text")} leading={<Hand aria-hidden />}>
                  Sign to text
                </Button>
              </>
            }
          >
            {retention === "off"
              ? "Turn history on in Settings to keep a record of translations in this browser."
              : "Translations you complete will appear here, newest first."}
          </EmptyState>
        </Card>
      ) : (
        <>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Segmented<Filter>
              label="Filter by direction"
              size="sm"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "all", label: `All (${entries.length})` },
                { value: "speech-to-sign", label: <DirectionLabel from="Speech" to="Sign" /> },
                { value: "sign-to-text", label: <DirectionLabel from="Sign" to="Text" /> },
              ]}
            />
            <label className="relative block sm:w-64">
              <span className="sr-only">Search history</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search text or gloss"
                className="h-9 w-full rounded-sm border border-line-strong bg-surface pr-3 pl-9 text-sm text-ink shadow-xs placeholder:text-ink-3 focus-visible:border-royal"
              />
            </label>
          </div>

          {visible.length === 0 ? (
            <Card className="mt-4">
              <EmptyState icon={<Search />} title="No matches">
                Nothing in your history matches this filter.
              </EmptyState>
            </Card>
          ) : (
            <div className="mt-4 space-y-6">
              {groups.map(([day, items]) => (
                <section key={day} aria-label={day}>
                  <h2 className="eyebrow mb-3">{day}</h2>
                  <Card>
                    <ul className="divide-y divide-line">
                      {items.map((entry) => (
                        <li key={entry.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:gap-4 sm:px-5">
                          <span className="mt-1 inline-flex shrink-0 text-royal" aria-hidden>
                            {entry.direction === "speech-to-sign" ? <AudioLines className="size-[1.125rem]" /> : <Hand className="size-[1.125rem]" />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-3">
                              <span className="text-royal">
                                {entry.direction === "speech-to-sign" ? (
                                  <DirectionLabel from="Speech" to="Sign" />
                                ) : (
                                  <DirectionLabel from="Sign" to="Text" />
                                )}
                              </span>
                              <span aria-hidden>·</span>
                              <span>{INPUT_LABEL[entry.input]}</span>
                              <span aria-hidden>·</span>
                              <time dateTime={new Date(entry.createdAt).toISOString()}>{formatTime(entry.createdAt)}</time>
                            </div>
                            <p className="mt-1 text-[1.0625rem] leading-7 font-semibold text-ink">{entry.text}</p>
                            <p className="mt-0.5 text-sm font-semibold tracking-[0.03em] text-navy/80">{entry.gloss}</p>
                            {entry.missing.length > 0 && (
                              <Badge tone="gold" className="mt-2">
                                No sign yet: {entry.missing.join(", ")}
                              </Badge>
                            )}
                          </div>
                          <div className="flex shrink-0 gap-1.5 self-end sm:self-start">
                            {entry.direction === "speech-to-sign" ? (
                              <Button
                                size="sm"
                                variant="subtle"
                                leading={<Play aria-hidden />}
                                onClick={() => navigate(`/app/speech-to-sign?text=${encodeURIComponent(entry.text)}`)}
                              >
                                Replay signs
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="subtle"
                                leading={<Volume2 aria-hidden />}
                                disabled={!speech.supported}
                                onClick={() => speech.speak(entry.text)}
                              >
                                Speak
                              </Button>
                            )}
                            <IconButton
                              label={`Delete "${entry.text}"`}
                              icon={<Trash2 />}
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                remove(entry.id);
                                toast("Entry deleted");
                              }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirming}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          clear();
          setConfirming(false);
          toast("History cleared");
        }}
        title="Clear all history?"
        description={`This permanently deletes ${entries.length} ${entries.length === 1 ? "entry" : "entries"} from this browser. It can't be undone.`}
        confirmLabel="Clear history"
      />
    </div>
  );
}
