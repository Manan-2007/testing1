import { Fragment, type ComponentType } from "react";
import { ArrowRight, AudioLines, Ear, Hand, Lightbulb, MessageSquareText, Mic } from "lucide-react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/cn";

type Step = { label: string; icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }> };

const FORWARD: Step[] = [
  { label: "Speak", icon: Mic },
  { label: "Sign", icon: Hand },
  { label: "Understand", icon: Lightbulb },
];
const REVERSE: Step[] = [
  { label: "Sign", icon: Hand },
  { label: "Text", icon: MessageSquareText },
  { label: "Voice", icon: Ear },
];

function Sequence({ steps, tone }: { steps: Step[]; tone: "primary" | "secondary" }) {
  return (
    <span className="flex shrink-0 items-center gap-5 pr-5 sm:gap-7 sm:pr-7">
      {steps.map(({ label, icon: Icon }, i) => (
        <Fragment key={label}>
          <span className="flex items-center gap-3">
            <span
              className={cn(
                "inline-flex size-10 items-center justify-center rounded-md border sm:size-12",
                tone === "primary" ? "border-brand-100 bg-brand-50 text-royal" : "border-line bg-surface text-navy",
              )}
            >
              <Icon className="size-5 sm:size-[1.375rem]" aria-hidden />
            </span>
            <span
              className={cn(
                "text-2xl font-semibold tracking-[-0.035em] sm:text-[2rem]",
                tone === "primary" ? "text-navy" : "text-ink-2",
              )}
            >
              {label}
            </span>
          </span>
          {i < steps.length - 1 ? (
            <ArrowRight className="size-5 text-ink-3" aria-hidden />
          ) : (
            <span className="size-2 rounded-full bg-gold" aria-hidden />
          )}
        </Fragment>
      ))}
    </span>
  );
}

function Row({ steps, reverse, tone, still }: { steps: Step[]; reverse?: boolean; tone: "primary" | "secondary"; still: boolean }) {
  if (still) {
    return (
      <div className="container-wide flex justify-center overflow-hidden">
        <Sequence steps={steps} tone={tone} />
      </div>
    );
  }
  return (
    <div className="group flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div className={cn("flex w-max group-hover:[animation-play-state:paused]", reverse ? "animate-marquee-reverse" : "animate-marquee")}>
        {Array.from({ length: 8 }, (_, i) => (
          <Sequence key={i} steps={steps} tone={tone} />
        ))}
      </div>
    </div>
  );
}

/** The wireframe's communication loop, drifting in both directions. */
export function FlowStrip() {
  const reduced = useReducedMotion();
  return (
    <section aria-label="How a conversation flows" className="border-b border-line bg-surface py-9 sm:py-11">
      <p className="sr-only">
        A hearing person speaks, Parlance signs it, and the signer understands. In reverse, a signer signs, Parlance
        shows the text, and the hearing person hears it as voice.
      </p>
      <div aria-hidden className="space-y-5">
        <div className="container-wide flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-ink-3 uppercase">
          <AudioLines className="size-3.5 text-royal" /> Hearing person to signer
        </div>
        <Row steps={FORWARD} tone="primary" still={reduced} />
        <Row steps={REVERSE} tone="secondary" reverse still={reduced} />
        <div className="container-wide flex items-center justify-end gap-2 text-xs font-semibold tracking-[0.08em] text-ink-3 uppercase">
          Signer to hearing person <Hand className="size-3.5 text-royal" />
        </div>
      </div>
    </section>
  );
}
