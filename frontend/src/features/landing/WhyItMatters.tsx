import { ArrowUpRight, Eye, Gauge, LockKeyhole, UserRoundX, type LucideIcon } from "lucide-react";
import { Point, SectionIndex } from "@/components/brand/Arcs";
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

function Line({ side }: { side: { who: string; text?: string; gloss?: string[] } }) {
  return (
    <div>
      <p className="eyebrow">{side.who}</p>
      {side.text ? (
        <p className="mt-1.5 text-lg leading-7 font-medium text-navy">&ldquo;{side.text}&rdquo;</p>
      ) : (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {side.gloss!.map((g, i) => (
            <span key={g} className="inline-flex items-center gap-3">
              <span className="text-lg leading-7 font-semibold tracking-[0.04em] whitespace-nowrap text-navy uppercase">{g}</span>
              {i < side.gloss!.length - 1 && <span className="size-1 rounded-full bg-line-strong" aria-hidden />}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

export function WhyItMatters() {
  return (
    <section id="why-it-matters" aria-labelledby="why-title" className="scroll-mt-20 border-t border-line bg-surface py-24 sm:py-32">
      <div className="container-wide">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
          <Reveal className="lg:col-span-7">
            <SectionIndex index="02" label="Why it matters" />
            <h2 id="why-title" className="text-section mt-5">
              Most of life still runs
              <br className="hidden sm:block" /> on spoken language.
            </h2>
            <p className="mt-7 max-w-[52ch] text-[1.125rem] leading-[1.7] text-ink-2">
              Clinics, classrooms and public counters assume everyone can hear and speak. For ISL users that turns short,
              ordinary moments into notes, gestures and guesswork, and in healthcare a misunderstood question about pain
              or medicine is a safety problem.
            </p>
          </Reveal>

          <Reveal delay={120} className="lg:col-span-4 lg:col-start-9 lg:self-end">
            <dl>
              <div className="border-t border-navy pt-4">
                <dt className="sr-only">Certified ISL interpreters in India</dt>
                <dd className="text-[4rem] leading-none font-semibold tracking-[-0.05em] text-royal tabular-nums sm:text-[5rem]">
                  &lt;300
                </dd>
                <dd className="mt-3 text-[0.9375rem] font-medium text-ink-2">certified ISL interpreters in India</dd>
              </div>
              <div className="mt-10 border-t border-line-strong pt-4">
                <dt className="sr-only">Deaf persons in India</dt>
                <dd className="text-[4rem] leading-none font-semibold tracking-[-0.05em] text-navy sm:text-[5rem]">~50 lakh</dd>
                <dd className="mt-3 text-[0.9375rem] font-medium text-ink-2">deaf persons in India, Census 2011</dd>
              </div>
            </dl>
            <a
              href="https://islrtc.nic.in/?p=6487"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-1 text-xs leading-5 font-medium text-ink-3 hover:text-royal"
            >
              Source: ISLRTC, Government of India <ArrowUpRight className="size-3" aria-hidden />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Reveal>
        </div>

        {/* Moments */}
        <div className="mt-24 sm:mt-32">
          <Reveal>
            <p className="eyebrow">Three ordinary moments</p>
          </Reveal>
          <ol className="mt-6">
            {MOMENTS.map((m, i) => (
              <Reveal
                as="li"
                key={m.place}
                delay={i * 60}
                className="grid gap-6 border-t border-line py-10 lg:grid-cols-12 lg:gap-x-10 lg:py-12"
              >
                <div className="lg:col-span-3">
                  <p className="text-sm font-medium text-royal">{m.domain}</p>
                  <h3 className="mt-1 text-[1.625rem] leading-tight font-semibold tracking-[-0.03em]">{m.place}</h3>
                </div>
                <p className="text-[1.0625rem] leading-[1.7] text-ink-2 lg:col-span-3">{m.story}</p>
                <div className="relative grid gap-5 rounded-lg bg-canvas p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center lg:col-span-6">
                  <Line side={m.from} />
                  <span className="hidden items-center sm:flex" aria-hidden>
                    <span className="h-px w-6 bg-line-strong" />
                    <Point />
                    <span className="h-px w-6 bg-line-strong" />
                  </span>
                  <Line side={m.to} />
                </div>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* Commitments */}
        <div className="mt-20 grid gap-10 border-t border-navy pt-10 lg:mt-28 lg:grid-cols-12 lg:gap-x-10">
          <Reveal className="lg:col-span-4">
            <p className="eyebrow">What we hold ourselves to</p>
            <p className="text-statement mt-4 text-navy">
              Silence over a wrong word.
            </p>
          </Reveal>
          <ol className="lg:col-span-8">
            {COMMITMENTS.map(([title, body], i) => (
              <Reveal
                as="li"
                key={title}
                delay={i * 60}
                className="grid gap-2 border-b border-line py-5 first:pt-0 sm:grid-cols-[3rem_14rem_1fr] sm:gap-6"
              >
                {(() => {
                  const Icon = COMMITMENT_ICONS[i]!;
                  return (
                    <span className="inline-flex size-10 items-center justify-center rounded-md bg-brand-50 text-royal" aria-hidden>
                      <Icon className="size-5" />
                    </span>
                  );
                })()}
                <h3 className="text-lg leading-6 font-semibold tracking-[-0.02em]">{title}</h3>
                <p className="text-[0.9375rem] leading-[1.65] text-ink-2">{body}</p>
              </Reveal>
            ))}
          </ol>
        </div>

        {/* Interpreters */}
        <Reveal className="mt-20 lg:mt-28">
          <blockquote className="border-l-2 border-royal pl-6 sm:pl-10">
            <p className="text-statement max-w-4xl text-navy">
              Parlance supports professional interpreters. It never replaces them.
            </p>
            <footer className="mt-4 max-w-2xl text-[1rem] leading-7 text-ink-2">
              For diagnoses, consent, and any conversation with real consequences, book a qualified ISL interpreter.
              Parlance is for the short, everyday exchanges in between.
            </footer>
          </blockquote>
        </Reveal>
      </div>
    </section>
  );
}
