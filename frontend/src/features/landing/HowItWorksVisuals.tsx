/**
 * The animated demonstrations for each How it works stage. The example phrases
 * and their ISL order are real outputs of the grammar engine, and the hands are
 * real ISLRTC dictionary motion (see HandTrace).
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BadgeCheck, CircleSlash, Mic, ScanFace, Volume2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { HandTrace } from "./HandTrace";

function Caption({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-[0.8125rem] font-medium text-ink-3">{children}</p>;
}

function GlossChip({ children, active, dim }: { children: React.ReactNode; active?: boolean; dim?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-9 items-center rounded-xs border px-3 text-[0.9375rem] font-bold tracking-[0.03em] uppercase transition-colors duration-300",
        active ? "border-royal bg-royal text-white" : "border-line bg-surface text-navy",
        dim && "opacity-40",
      )}
    >
      {children}
    </span>
  );
}

/* --------------------------------------------------------- speech: 1 -- */
export function SpeakVisual({ active }: { active: boolean }) {
  const text = "Where is the pain?";
  const [shown, setShown] = useState(active ? 0 : text.length);
  useEffect(() => {
    if (!active) {
      setShown(text.length);
      return;
    }
    setShown(0);
    const timer = window.setInterval(() => setShown((n) => (n >= text.length ? n : n + 1)), 70);
    return () => window.clearInterval(timer);
  }, [active]);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6">
      <div className="relative">
        <span className="absolute inset-0 animate-ping rounded-full bg-royal/15" aria-hidden />
        <span className="relative inline-flex size-16 items-center justify-center rounded-full bg-royal text-white shadow-md">
          <Mic className="size-7" aria-hidden />
        </span>
      </div>
      <div className="flex h-10 items-center gap-1" aria-hidden>
        {Array.from({ length: 22 }, (_, i) => (
          <span
            key={i}
            className="w-1 rounded-full bg-brand-300"
            style={{
              height: `${18 + Math.abs(Math.sin(i * 1.7)) * 22}px`,
              animation: active ? `wave 1.1s ${(i % 7) * 0.09}s ease-in-out infinite alternate` : undefined,
            }}
          />
        ))}
      </div>
      <div className="w-full max-w-xs rounded-md border border-line bg-surface px-4 py-3 text-lg font-semibold text-ink shadow-xs">
        {text.slice(0, shown)}
        <span className={cn("ml-0.5 inline-block h-5 w-0.5 translate-y-0.5 bg-royal", shown < text.length && "animate-pulse")} />
      </div>
      <Caption>Speech becomes English text in the browser</Caption>
    </div>
  );
}

/* --------------------------------------------------------- speech: 2 -- */
const ENGLISH = [
  { id: "where", label: "Where" },
  { id: "is", label: "is", drop: true },
  { id: "the", label: "the", drop: true },
  { id: "pain", label: "pain" },
];
const ISL = [
  { id: "pain", label: "PAIN" },
  { id: "where", label: "WHERE" },
];

export function ReorderVisual({ active }: { active: boolean }) {
  const [isl, setIsl] = useState(true);
  useEffect(() => {
    if (!active) {
      setIsl(true);
      return;
    }
    setIsl(false);
    const timer = window.setInterval(() => setIsl((v) => !v), 2200);
    return () => window.clearInterval(timer);
  }, [active]);

  const items = isl ? ISL : ENGLISH;
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <p className="text-xs font-semibold tracking-[0.06em] text-ink-3 uppercase">{isl ? "ISL order" : "English order"}</p>
      </div>
      <motion.ul layout className="flex min-h-12 flex-wrap items-center justify-center gap-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {items.map((item) => (
            <motion.li
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              {"drop" in item && item.drop ? (
                <span className="inline-flex h-9 items-center rounded-xs border border-dashed border-line-strong px-3 text-[0.9375rem] font-semibold text-ink-3 line-through decoration-2">
                  {item.label}
                </span>
              ) : (
                <GlossChip active={isl}>{item.label}</GlossChip>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      <div className="grid w-full max-w-sm gap-2 text-sm">
        <div className="flex items-center gap-2.5 rounded-sm bg-brand-25 px-3 py-2 text-ink-2">
          <span className="size-1.5 rounded-full bg-royal" aria-hidden />
          The question word moves to the end
        </div>
        <div className="flex items-center gap-2.5 rounded-sm bg-brand-25 px-3 py-2 text-ink-2">
          <span className="size-1.5 rounded-full bg-royal" aria-hidden />
          &ldquo;is&rdquo; and &ldquo;the&rdquo; have no sign and drop away
        </div>
        <div className="flex items-center gap-2.5 rounded-sm bg-gold-50 px-3 py-2 text-ink-2">
          <ScanFace className="size-4 text-gold-800" aria-hidden />
          Brows furrow across the question
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- speech: 3 -- */
export function SignVisual({ active }: { active: boolean }) {
  const glosses = ["pain", "where"];
  const [index, setIndex] = useState(0);
  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1 bg-gradient-to-b from-brand-25 to-brand-50">
        <HandTrace glosses={glosses} playing={active} onSign={setIndex} />
      </div>
      <div className="flex items-center justify-center gap-2 border-t border-line bg-surface py-3">
        {glosses.map((g, i) => (
          <GlossChip key={g} active={active && i === index}>
            {g}
          </GlossChip>
        ))}
      </div>
      <div className="bg-surface pb-3">
        <Caption>Real motion from the ISLRTC dictionary, shown as hand landmarks</Caption>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- sign: 1 -- */
export function CameraVisual({ active }: { active: boolean }) {
  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1 bg-[#eef1f8]">
        <HandTrace glosses={["hello"]} playing={active} variant="camera" />
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="rounded-xs bg-surface/95 px-2 py-1 text-xs font-semibold text-royal shadow-xs">Tracked on this device</span>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-line border-t border-line bg-surface text-center">
        {[
          ["30", "frames per second"],
          ["141", "numbers per frame"],
          ["0", "video uploaded"],
        ].map(([value, label]) => (
          <div key={label} className="px-2 py-3">
            <p className="text-lg font-bold text-navy tabular-nums">{value}</p>
            <p className="text-xs text-ink-3">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- sign: 2 -- */
function Bar({ label, value, accepted, active, delay }: { label: string; value: number; accepted: boolean; active: boolean; delay: number }) {
  return (
    <div className="rounded-md border border-line bg-surface p-3.5 shadow-xs">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.9375rem] font-bold tracking-[0.03em] text-navy">{label}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 text-[0.8125rem] font-semibold",
            accepted ? "text-success" : "text-ink-3",
          )}
        >
          {accepted ? <BadgeCheck className="size-4" aria-hidden /> : <CircleSlash className="size-4" aria-hidden />}
          {accepted ? "Accepted" : "Stays silent"}
        </span>
      </div>
      <div className="relative mt-3 h-2 rounded-full bg-subtle ring-1 ring-line">
        <div
          className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-1000 ease-out", accepted ? "bg-success" : "bg-ink-3/50")}
          style={{ width: active ? `${value}%` : "0%", transitionDelay: `${delay}ms` }}
        />
        <div className="absolute -top-1.5 -bottom-1.5 left-[85%] w-0.5 rounded-full bg-navy" aria-hidden />
      </div>
      <div className="mt-1.5 flex justify-between text-xs text-ink-3">
        <span className="tabular-nums">{value}% confident</span>
        <span>85% threshold</span>
      </div>
    </div>
  );
}

export function ConfidenceVisual({ active }: { active: boolean }) {
  return (
    <div className="flex h-full flex-col justify-center gap-3 px-6">
      <Bar label="HELLO" value={94} accepted active={active} delay={0} />
      <Bar label="Unclear movement" value={58} accepted={false} active={active} delay={250} />
      <Caption>Illustrative values. A sign must also be held steadily across three predictions.</Caption>
    </div>
  );
}

/* ----------------------------------------------------------- sign: 3 -- */
export function SentenceVisual({ active }: { active: boolean }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 px-6">
      <div className="flex gap-2">
        <GlossChip>Hello</GlossChip>
        <GlossChip>Thank you</GlossChip>
      </div>
      <svg viewBox="0 0 24 40" className="h-8 w-4 text-brand-300" aria-hidden>
        <path d="M12 2v32m0 0-7-7m7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="w-full max-w-xs rounded-lg border border-line bg-surface p-4 shadow-md">
        <p className="text-xl font-bold text-navy">Hello, thank you.</p>
        <div className="mt-3 flex items-center gap-2.5 text-sm font-medium text-ink-3">
          <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-50 text-royal">
            <Volume2 className="size-4" aria-hidden />
          </span>
          <span className="flex h-5 items-end gap-0.5" aria-hidden>
            {[8, 14, 10, 18, 12, 16, 9, 13].map((h, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-royal/60"
                style={{ height: h, animation: active ? `wave 0.9s ${i * 0.08}s ease-in-out infinite alternate` : undefined }}
              />
            ))}
          </span>
          Spoken aloud
        </div>
      </div>
      <Caption>Always on screen, so audio is never the only channel</Caption>
    </div>
  );
}
