import { lazy, Suspense, useId, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Camera } from "lucide-react";
import { Arcs, Point } from "@/components/brand/Arcs";

const HeroStage = lazy(() => import("./HeroStage"));

const SUGGESTIONS = ["Where is the pain?", "Do you want water?", "Please wait here."];

function StagePoster() {
  return (
    <div className="relative h-full w-full" role="status" aria-label="Loading the 3D signer">
      <div aria-hidden className="absolute top-[1%] left-1/2 aspect-square h-[80%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,#ffffff_0%,var(--color-stage-2)_55%,var(--color-stage)_88%,transparent_100%)]" />
      <Arcs point={false} className="absolute top-[1%] left-1/2 aspect-square h-[80%] -translate-x-1/2" tone="soft" />
      <svg viewBox="0 0 200 220" className="absolute bottom-[22%] left-1/2 h-[54%] -translate-x-1/2 text-brand-100" aria-hidden>
        <ellipse cx="100" cy="58" rx="26" ry="32" fill="currentColor" />
        <path d="M40 220c2-60 26-90 60-90s58 30 60 90z" fill="currentColor" />
      </svg>
    </div>
  );
}

export function Hero() {
  const inputId = useId();
  const [draft, setDraft] = useState("");
  const [request, setRequest] = useState<{ text: string; id: number } | null>(null);

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
    <section aria-labelledby="hero-title" className="relative overflow-hidden border-b border-line">
      <div aria-hidden className="hairline-grid absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_70%_45%,black,transparent)]" />
      <div
        className={
          "container-wide relative grid items-center gap-x-10 gap-y-8 pt-8 pb-12 sm:pt-12 lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-[auto_auto] lg:gap-y-0 lg:py-10 " +
          "[grid-template-areas:'text'_'stage'_'try'] lg:[grid-template-areas:'text_stage'_'try_stage']"
        }
      >
        {/* Headline */}
        <div className="[grid-area:text] lg:self-end">
          <p className="eyebrow flex animate-fade items-center gap-3">
            <span className="h-px w-8 bg-navy/30" aria-hidden />
            Speech and Indian Sign Language
          </p>
          <h1 id="hero-title" className="text-display mt-6">
            <span className="block animate-rise-lg">Every</span>
            <span className="block animate-rise-lg [animation-delay:80ms]">conversation,</span>
            <span className="block animate-rise-lg text-royal [animation-delay:160ms]">understood.</span>
          </h1>
          <p className="mt-7 max-w-[36ch] animate-rise-lg text-[1.125rem] leading-[1.65] text-ink-2 [animation-delay:260ms] sm:text-[1.1875rem]">
            Parlance translates between spoken English and Indian Sign Language, in both directions, on one screen.
            Built for Deaf and hard-of-hearing people and everyone they talk to.
          </p>
        </div>

        {/* The live signer */}
        <div className="relative [grid-area:stage]">
          <div className="relative mx-auto aspect-square w-full max-w-[34rem] animate-fade [animation-delay:200ms] lg:aspect-auto lg:h-[min(78svh,46rem)] lg:max-w-none">
            <Suspense fallback={<StagePoster />}>
              <HeroStage request={request} />
            </Suspense>
          </div>
        </div>

        {/* Try it */}
        <div className="[grid-area:try] lg:self-start lg:pt-9">
          <form onSubmit={onSubmit} className="animate-rise-lg [animation-delay:340ms]">
            <label htmlFor={inputId} className="flex items-center gap-2 text-sm font-medium text-ink-2">
              <Point /> Try it: type a sentence and watch it signed
            </label>
            <div className="mt-3 flex items-stretch rounded-md border border-line-strong bg-surface transition-[border-color,box-shadow] focus-within:border-royal focus-within:shadow-[0_0_0_4px_rgb(13_33_161/0.12)]">
              <input
                id={inputId}
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 120))}
                placeholder="Where is the pain?"
                autoComplete="off"
                className="h-14 min-w-0 flex-1 bg-transparent px-4 text-[1.0625rem] text-ink outline-none placeholder:text-ink-3/70 focus-visible:outline-none"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="m-1.5 inline-flex items-center gap-2 rounded-sm bg-royal px-4 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-700 disabled:bg-brand-300"
              >
                Sign it <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-1 gap-y-1 text-sm">
              <span className="mr-1 text-ink-3">Or try</span>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setDraft(s);
                    sign(s);
                  }}
                  className="rounded-xs px-1.5 py-1 font-medium text-royal underline decoration-royal/30 underline-offset-4 transition-colors hover:decoration-royal"
                >
                  {s}
                </button>
              ))}
            </div>
          </form>

          <div className="mt-8 flex animate-rise-lg flex-col gap-3 border-t border-line pt-6 [animation-delay:420ms] sm:flex-row sm:items-center sm:gap-6">
            <Link
              to="/app/speech-to-sign"
              className="inline-flex h-11 items-center gap-2 rounded-sm bg-navy px-4 text-[0.9375rem] font-medium text-white transition-colors hover:bg-[#0a2450]"
            >
              Open the translator <ArrowUpRight className="size-4" aria-hidden />
            </Link>
            <Link
              to="/app/sign-to-text"
              className="inline-flex min-h-11 items-center gap-2 text-[0.9375rem] font-medium text-navy hover:text-royal"
            >
              <Camera className="size-4" aria-hidden /> Or sign to the camera
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
