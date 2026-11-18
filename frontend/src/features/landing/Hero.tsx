import { lazy, Suspense, useId, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Camera, Hand, Keyboard } from "lucide-react";
import { Arcs } from "@/components/brand/Arcs";
import { useIntro } from "./intro/introState";

const HeroStage = lazy(() => import("./HeroStage"));

const SUGGESTIONS = ["Where is the pain?", "Do you want water?", "Please wait here."];

function StagePoster() {
  return (
    <div className="relative h-full w-full" role="status" aria-label="Loading the 3D signer">
      <div
        aria-hidden
        data-intro-target
        className="absolute top-[1%] left-1/2 aspect-square h-[80%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,#ffffff_0%,var(--color-stage-2)_55%,var(--color-stage)_88%,transparent_100%)]"
      />
      <Arcs point={false} className="absolute top-[1%] left-1/2 aspect-square h-[80%] -translate-x-1/2" tone="soft" />
      <svg viewBox="0 0 200 220" className="absolute bottom-[22%] left-1/2 h-[54%] -translate-x-1/2 text-sky-300" aria-hidden>
        <ellipse cx="100" cy="58" rx="26" ry="32" fill="currentColor" />
        <path d="M40 220c2-60 26-90 60-90s58 30 60 90z" fill="currentColor" />
      </svg>
    </div>
  );
}

/** A hand-drawn gold underline that writes itself in once the hero appears. */
function Swash() {
  return (
    <svg
      viewBox="0 0 320 24"
      preserveAspectRatio="none"
      aria-hidden
      className="absolute -bottom-[0.14em] left-[-2%] -z-10 h-[0.3em] w-[104%] overflow-visible"
    >
      <path
        d="M6 16C70 7 150 4 220 7c34 1.5 66 4.5 94 9"
        fill="none"
        stroke="#EEC643"
        strokeWidth="9"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        className="animate-draw [--len:1] [animation-delay:650ms] [animation-duration:900ms]"
      />
    </svg>
  );
}

export function Hero() {
  const inputId = useId();
  const [draft, setDraft] = useState("");
  const [request, setRequest] = useState<{ text: string; id: number } | null>(null);
  const welcoming = useIntro((s) => s.phase !== "done");

  const sign = (text: string) => {
    const value = text.trim();
    if (!value) return;
    setRequest({ text: value, id: Date.now() });
  };
  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    sign(draft);
  };

  return (
    <section
      aria-labelledby="hero-title"
      className="intro-hold relative overflow-hidden bg-[linear-gradient(180deg,var(--color-sky-50)_0%,var(--color-sky-25)_78%,#ffffff_100%)]"
    >
      {/* Soft light behind the signer: the conversation's space */}
      <div
        aria-hidden
        className="pointer-events-none absolute top-[6%] right-[-18%] aspect-square w-[min(80rem,120vw)] rounded-full bg-[radial-gradient(closest-side,var(--color-sky-200)_0%,rgb(220_232_255/0.55)_45%,transparent_72%)] lg:right-[-12%] lg:w-[64rem]"
      />
      <div
        className={
          "container-wide relative grid grid-cols-1 items-center gap-x-12 gap-y-8 pt-6 pb-14 sm:pt-10 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_auto] lg:gap-y-0 lg:py-10 " +
          "[grid-template-areas:'text'_'stage'_'try'] lg:[grid-template-areas:'text_stage'_'try_stage']"
        }
      >
        {/* Headline */}
        <div className="min-w-0 [grid-area:text] lg:self-end">
          <p className="inline-flex animate-rise items-center gap-2.5 rounded-full bg-surface/80 py-1.5 pr-4 pl-1.5 text-sm font-medium text-navy shadow-xs ring-1 ring-sky-300/70">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-gold text-navy" aria-hidden>
              <Hand className="size-4" />
            </span>
            <span aria-hidden>Speech ⇄ Indian Sign Language</span>
            <span className="sr-only">Speech and Indian Sign Language, both ways</span>
          </p>
          <h1 id="hero-title" className="text-hero mt-6 sm:mt-7">
            <span className="block animate-rise-lg [animation-delay:60ms]">Two languages.</span>
            <span className="block animate-rise-lg [animation-delay:140ms]">
              <span className="relative isolate inline-block text-royal">
                One conversation.
                <Swash />
              </span>
            </span>
          </h1>
          <p className="mt-7 max-w-[34ch] animate-rise-lg text-[1.125rem] leading-[1.6] text-ink-2 [animation-delay:240ms] sm:text-[1.1875rem]">
            Speak, and a signer answers in Indian Sign Language. Sign back, and Parlance turns it into words you can read
            and hear.
          </p>
        </div>

        {/* The live signer */}
        <div className="relative min-w-0 [grid-area:stage]">
          <div className="relative mx-auto aspect-square w-full max-w-[34rem] animate-fade [animation-delay:200ms] lg:aspect-auto lg:h-[min(78svh,46rem)] lg:max-w-none">
            <Suspense fallback={<StagePoster />}>
              <HeroStage request={request} hold={welcoming} />
            </Suspense>
          </div>
        </div>

        {/* Try it */}
        <div className="min-w-0 [grid-area:try] lg:self-start lg:pt-8">
          <form
            onSubmit={onSubmit}
            className="animate-rise-lg rounded-[1.25rem] bg-surface p-3 shadow-[0_1px_2px_rgb(1_22_56/0.05),0_18px_40px_-22px_rgb(13_33_161/0.35)] ring-1 ring-sky-200 [animation-delay:340ms] sm:p-4"
          >
            <label htmlFor={inputId} className="flex items-center gap-2.5 px-1 text-sm font-medium text-ink-2">
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-sky-100 text-royal" aria-hidden>
                <Keyboard className="size-3.5" />
              </span>
              Try it: type a sentence and watch it signed
            </label>
            <div className="mt-3 flex items-stretch rounded-xl bg-sky-50 ring-1 ring-sky-200 transition-[box-shadow,background-color] focus-within:bg-surface focus-within:ring-2 focus-within:ring-royal">
              <input
                id={inputId}
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 120))}
                placeholder="Where is the pain?"
                autoComplete="off"
                className="h-14 min-w-0 flex-1 bg-transparent px-4 text-[1.0625rem] text-ink outline-none placeholder:text-ink-3 focus-visible:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="m-1.5 inline-flex items-center gap-2 rounded-lg bg-royal px-4 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-700 disabled:bg-sky-400"
              >
                Sign it <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5 px-1 text-sm">
              <span className="mr-1 text-ink-3">Or try</span>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setDraft(s);
                    sign(s);
                  }}
                  className="rounded-full bg-surface px-3 py-1.5 font-medium text-royal ring-1 ring-sky-300 transition-colors hover:bg-sky-50 hover:ring-royal/50"
                >
                  {s}
                </button>
              ))}
            </div>
          </form>

          <div className="mt-6 flex animate-rise-lg flex-col gap-3 [animation-delay:420ms] sm:flex-row sm:items-center sm:gap-5">
            <Link
              to="/app/speech-to-sign"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-navy px-6 text-[0.9375rem] font-medium text-white transition-colors hover:bg-royal"
            >
              Open the translator <ArrowUpRight className="size-4" aria-hidden />
            </Link>
            <Link
              to="/app/sign-to-text"
              className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-navy hover:text-royal"
            >
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-gold-100 text-navy" aria-hidden>
                <Camera className="size-4" />
              </span>
              Or sign to the camera
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
