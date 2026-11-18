import { ArrowUpRight, Eye, Gauge, LockKeyhole, UserRoundX, type LucideIcon } from "lucide-react";
import { SectionIndex } from "@/components/brand/Arcs";
import { FluidSection } from "@/components/layout/FluidSection";
import { Reveal } from "./Reveal";

/**
 * Each exchange is the grammar engine's real output for that sentence
 * (or, for the signed line, the real English reconstruction of those signs).
 */
const MOMENTS = [
  {
    place: "Clinic front desk",
    domain: "Healthcare",
    story:
      "The first question at any clinic is where it hurts. Without an interpreter, it becomes a note passed across the counter, and a guess.",
    from: { who: "Receptionist says", text: "Where is the pain?" },
    to: { who: "Parlance signs", gloss: ["Pain", "Where"] },
  },
  {
    place: "A classroom",
    domain: "Education",
    story:
      "A Deaf student greets a new teacher who doesn't sign. The teacher reads it, hears it, and answers back by voice.",
    from: { who: "Student signs", gloss: ["Hello", "How are you"] },
    to: { who: "Teacher hears", text: "Hello, how are you." },
  },
  {
    place: "Railway ticket counter",
    domain: "Public services",
    story:
      "Short, routine exchanges are where people are most often left out: a counter, a queue, and no time to find help.",
    from: { who: "Clerk says", text: "Your ticket is ready." },
    to: { who: "Parlance signs", gloss: ["You", "Ticket", "Ready"] },
  },
];

const COMMITMENT_ICONS: LucideIcon[] = [Gauge, LockKeyhole, Eye, UserRoundX];

const COMMITMENTS = [
  ["Reliable before broad", "A sign is output only at 85% confidence, held steadily, from signs verified on people the model never trained on."],
  ["Private by design", "Camera frames are processed on the device. Nothing is recorded, and only hand positions are sent for recognition."],
  ["Honest about limits", "The ISL gloss is always visible, words without a sign are flagged, and features in development are labelled as planned."],
  ["No account, no tracking", "Parlance runs in the browser. History stays on your device, for as long as you choose, or not at all."],
];

/** One side of an exchange: what was said (a speech bubble) or what was signed (gloss). */
function Bubble({ side, out }: { side: { who: string; text?: string; gloss?: string[] }; out?: boolean }) {
  return (
    <div
      className={
        out
          ? "ml-auto w-fit max-w-full rounded-2xl rounded-br-sm bg-royal px-4 py-3 text-white"
          : "w-fit max-w-full rounded-2xl rounded-bl-sm bg-surface px-4 py-3 ring-1 ring-sky-200"
      }
    >
      <p className={out ? "text-xs font-semibold tracking-[0.08em] text-white/80 uppercase" : "eyebrow"}>{side.who}</p>
      {side.text ? (
        <p className={out ? "mt-1 text-[1.0625rem] leading-6 font-medium" : "mt-1 text-[1.0625rem] leading-6 font-medium text-navy"}>
          &ldquo;{side.text}&rdquo;
        </p>
      ) : (
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          {side.gloss!.map((g, i) => (
            <span key={g} className="inline-flex items-center gap-2.5">
              <span className={out ? "text-base leading-6 font-semibold tracking-[0.05em] whitespace-nowrap uppercase" : "text-base leading-6 font-semibold tracking-[0.05em] whitespace-nowrap text-navy uppercase"}>
                {g}
              </span>
              {i < side.gloss!.length - 1 && <span className="size-1.5 rounded-full bg-gold" aria-hidden />}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

export function WhyItMatters() {
  return (
    <FluidSection id="why-it-matters" aria-labelledby="why-title" from="#ffffff" surface="bg-sky-50" className="scroll-mt-20 py-24 sm:py-32">
      <div className="container-wide">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
          <Reveal className="lg:col-span-7">
            <SectionIndex index="02" label="Why it matters" />
            <h2 id="why-title" className="text-section mt-6">
              Most of life still runs
              <br className="hidden sm:block" /> on <span className="text-royal">spoken language.</span>
            </h2>
            <p className="mt-7 max-w-[52ch] text-[1.125rem] leading-[1.7] text-ink-2">
              Clinics, classrooms and public counters assume everyone can hear and speak. For ISL users that turns short,
              ordinary moments into notes, gestures and guesswork, and in healthcare a misunderstood question about pain
              or medicine is a safety problem.
            </p>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-5 lg:self-end">
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-[1.5rem] bg-surface p-6 ring-1 ring-sky-200">
                <dt className="sr-only">Certified ISL interpreters in India</dt>
                <dd className="relative isolate inline-block text-[3rem] leading-none font-semibold tracking-[-0.05em] text-royal tabular-nums lg:text-[3.5rem]">
                  &lt;300
                  <span aria-hidden className="absolute inset-x-0 bottom-1 -z-10 h-3 rounded-full bg-gold/70" />
                </dd>
                <dd className="mt-4 text-[0.9375rem] leading-6 font-medium text-ink-2">certified ISL interpreters in India</dd>
              </div>
              <div className="rounded-[1.5rem] bg-surface p-6 ring-1 ring-sky-200">
                <dt className="sr-only">Deaf persons in India</dt>
                <dd className="text-[3rem] leading-none font-semibold tracking-[-0.05em] text-navy lg:text-[3.5rem]">~50 lakh</dd>
                <dd className="mt-4 text-[0.9375rem] leading-6 font-medium text-ink-2">deaf persons in India, Census 2011</dd>
              </div>
            </dl>
            <a
              href="https://islrtc.nic.in/?p=6487"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex min-h-6 items-center gap-1 text-xs leading-5 font-medium text-ink-3 hover:text-royal"
            >
              Source: ISLRTC, Government of India <ArrowUpRight className="size-3" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Reveal>
        </div>

        {/* Moments */}
        <div className="mt-20 sm:mt-28">
          <Reveal>
            <h3 className="text-[1.5rem] leading-tight font-semibold tracking-[-0.03em] sm:text-[1.75rem]">Three ordinary moments</h3>
          </Reveal>
          <ol className="mt-8 grid gap-5 lg:grid-cols-3">
            {MOMENTS.map((m, i) => (
              <Reveal as="li" key={m.place} delay={i * 80} className="flex flex-col rounded-[1.75rem] bg-sky-100/70 p-6 ring-1 ring-sky-200 sm:p-7">
                <p className="inline-flex w-fit items-center gap-2 rounded-full bg-surface px-3 py-1 text-[0.8125rem] font-semibold text-royal">
                  <span className="size-1.5 rounded-full bg-gold" aria-hidden />
                  {m.domain}
                </p>
                <h4 className="mt-4 text-[1.5rem] leading-tight font-semibold tracking-[-0.03em] text-navy">{m.place}</h4>
                <p className="mt-3 text-[1rem] leading-[1.65] text-ink-2">{m.story}</p>
                <div className="mt-auto flex flex-col gap-2.5 pt-7">
                  <Bubble side={m.from} />
                  <Bubble side={m.to} out />
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* Commitments */}
        <div className="mt-20 grid gap-10 lg:mt-28 lg:grid-cols-12 lg:gap-x-10">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow">What we hold ourselves to</p>
            <p className="text-statement mt-4 text-navy">
              Silence over a <span className="text-royal">wrong word.</span>
            </p>
          </Reveal>
          <ol className="grid gap-4 sm:grid-cols-2 lg:col-span-8">
            {COMMITMENTS.map(([title, body], i) => {
              const Icon = COMMITMENT_ICONS[i]!;
              return (
                <Reveal as="li" key={title} delay={i * 60} className="rounded-[1.5rem] bg-surface p-6 ring-1 ring-sky-200">
                  <span
                    className={i % 2 === 0 ? "inline-flex size-11 items-center justify-center rounded-2xl bg-sky-100 text-royal" : "inline-flex size-11 items-center justify-center rounded-2xl bg-gold-100 text-navy"}
                    aria-hidden
                  >
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-4 text-lg leading-6 font-semibold tracking-[-0.02em]">{title}</h3>
                  <p className="mt-2 text-[0.9375rem] leading-[1.65] text-ink-2">{body}</p>
                </Reveal>
              );
            })}
          </ol>
        </div>

        {/* Interpreters */}
        <Reveal className="mt-16 lg:mt-24">
          <blockquote className="relative overflow-hidden rounded-[1.75rem] bg-gold-50 p-8 ring-1 ring-gold-200 sm:p-12">
            <span aria-hidden className="block h-10 text-[5.5rem] leading-[0.9] font-semibold text-gold select-none">
              &ldquo;
            </span>
            <p className="text-statement relative mt-2 max-w-4xl text-navy">Parlance supports professional interpreters. It never replaces them.</p>
            <footer className="relative mt-4 max-w-2xl text-[1rem] leading-7 text-ink-2">
              For diagnoses, consent, and any conversation with real consequences, book a qualified ISL interpreter.
              Parlance is for the short, everyday exchanges in between.
            </footer>
          </blockquote>
        </Reveal>
      </div>
    </FluidSection>
  );
}
